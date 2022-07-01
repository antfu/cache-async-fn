import { stringify as stableStringify } from 'safe-stable-stringify'
import LRU from 'lru-cache'
import type { AsyncCacheFn, AsyncCacheOptions } from './types'
export * from './types'

export { stableStringify }

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
    needUpdateCache = () => false,
  } = options

  const cache = lruOptions
    ? new LRU<K, Promise<R>>(lruOptions)
    : new Map<K, Promise<R>>()

  const pending = new Set<Promise<R>>()

  const wrapper = ((...args: A) => {
    const key = getKey(args)
    const useCache = shouldCache ? shouldCache(args) : true

    if (useCache && cache.has(key) && !needUpdateCache())
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
