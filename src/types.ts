import type { Options as LRUOptions } from 'lru-cache'

export type { LRUOptions }

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
  shouldCache?: (args: A) => boolean | undefined | void

  /**
   * When do you need to update the cache. Make it return true.
   */
  needUpdateCache?: () => boolean
}
