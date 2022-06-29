import { stringify as stableStringify } from 'safe-stable-stringify'
import type { Options as LRUOptions } from 'lru-cache'
import LRU from 'lru-cache'

export type { LRUOptions }
export { stableStringify }

export interface AsyncCacheFn<R, A extends any[]> {
  (...args: A): Promise<R>
  /**
   * Call the function or get the async cache.
   */
  invoke(...args: A): Promise<R>
  /**
   * Call the function without cache.
   */
  noCache(...args: A): Promise<R>
  /**
   * Get the cache for the given arguments.
   */
  get(...args: A): Promise<R> | undefined
  /**
   * Remove the cache for the given arguments.
   */
  delete(...args: A): void
  /**
   * Check if the cache exists for the given arguments.
   */
  has(...args: A): boolean
  /**
   * Set cache manually.
   */
  set(args: A, v: Promise<R>): void
  /**
   * Clear all cache
   */
  clear(): void
  /**
   * A set of pending promises
   */
  pending: Set<Promise<R>>
}

export interface AsyncCacheOptions<R, A extends any[], K = string> {
  /**
   * The mode of caching
   *
   * - `singleton`: calls with same arguments will only be executed ONCE, unless the cache is cleared
   * - `single-instance`: calls with same arguments will only have one instance at a time, the cache will be cleared once the promise is resolved
   * @default 'singleton'
   */
  mode?: 'singleton' | 'single-instance'

  /**
   * Custom function to get the key for caching from arguments.
   *
   * @default `safe-stable-stringify`
   */
  getKey?: (args: A) => K

  /**
   * LRU Options, set false to disable LRU and use Map instead
   *
   * @default { max: 1000 }
   */
  lru?: LRUOptions<K, Promise<R>> | false

  /**
   * Allow failed promise to be cached.
   *
   * @default false
   */
  allowFailures?: boolean

  /**
   * A custom filter to check whether a call should be cached.
   */
  shouldCache?: (args: A) => boolean
}

export function asyncCacheFn<R, A extends any[], K = string>(
  fn: (...args: A) => Promise<R>,
  options: AsyncCacheOptions<R, A, K> = {},
) {
  const {
    mode = 'singleton',
    allowFailures = false,
    getKey = (args: A) => stableStringify(args) as unknown as K,
    lru: lruOptions = { max: 1000 },
    shouldCache,
  } = options

  const cache = lruOptions
    ? new LRU<K, Promise<R>>(lruOptions)
    : new Map<K, Promise<R>>()

  const pending = new Set<Promise<R>>()

  const wrapper = ((...args: A) => {
    const key = getKey(args)
    const useCache = shouldCache ? shouldCache(args) : true

    if (useCache && cache.has(key))
      return cache.get(key)!

    let promise = Promise.resolve(fn(...args))
    if (!useCache)
      return promise

    if (!allowFailures) {
      promise = promise
        .catch((e) => {
          cache.delete(key)
          throw e
        })
    }

    promise = promise.finally(() => {
      pending.delete(promise)
      if (mode === 'single-instance')
        cache.delete(key)
    })

    cache.set(key, promise)
    pending.add(promise)
    return promise
  }) as AsyncCacheFn<R, A>

  wrapper.invoke = (...args) => wrapper(...args)
  wrapper.clear = () => cache.clear()
  wrapper.get = (...args) => cache.get(getKey(args))
  wrapper.has = (...args) => cache.has(getKey(args))
  wrapper.set = (args, v) => cache.set(getKey(args), v)
  wrapper.delete = (...args) => cache.delete(getKey(args))
  wrapper.noCache = (...args) => fn(...args)
  wrapper.pending = pending

  return wrapper
}
