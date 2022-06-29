import { stringify } from 'safe-stable-stringify'
import type { Options as LRUOptions } from 'lru-cache'
import LRU from 'lru-cache'

export type { LRUOptions }

export interface AsyncCacheFn<R, A extends []> {
  (...args: A): Promise<R>
  /**
   * Call the function of get the async cache.
   */
  invoke(...args: A): Promise<R>
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
}

export interface AsyncCacheOptions<R, A extends [], K = string> {
  /**
   * The mode of caching
   *
   * - `singlteon`: calls with same arguments will only be executed ONCE, unless the cache is cleared
   * - `single-instance`: calls with same arguments will only have one instance at a time, the cache will be cleared once the promise is resolved
   */
  mode?: 'singlteon' | 'single-instance'

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
}

export function cacheFn<R, A extends [], K = string>(
  fn: (...args: A) => Promise<R>,
  options: AsyncCacheOptions<R, A, K> = {},
) {
  const {
    mode = 'singlteon',
    allowFailures = false,
    getKey = (args: A) => stringify(args) as unknown as K,
    lru: lruOptions = { max: 1000 },
  } = options

  const cache = lruOptions
    ? new LRU<K, Promise<R>>(lruOptions)
    : new Map<K, Promise<R>>()

  const wrapper = ((...args: A) => {
    const key = getKey(args)
    if (!cache.has(key)) {
      let promise = Promise.resolve(fn(...args))
      if (mode === 'single-instance')
        promise.finally(() => cache.delete(key))

      if (!allowFailures) {
        promise = promise
          .catch((e) => {
            cache.delete(key)
            throw e
          })
      }

      return cache.set(key, promise)
    }
    return cache.get(key)!
  }) as AsyncCacheFn<R, A>

  wrapper.invoke = (...args) => wrapper(...args)
  wrapper.clear = () => cache.clear()
  wrapper.get = (...args) => cache.get(getKey(args))
  wrapper.has = (...args) => cache.has(getKey(args))
  wrapper.set = (args, v) => cache.set(getKey(args), v)
  wrapper.delete = (...args) => cache.delete(getKey(args))

  return wrapper
}
