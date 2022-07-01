# async-cache-fn

[![NPM version](https://img.shields.io/npm/v/async-cache-fn?color=a1b858&label=)](https://www.npmjs.com/package/async-cache-fn)

## Usage

```ts
import { asyncCacheFn } from 'async-cache-fn'

export const getData = asyncCacheFn(async (url) => {
  const data = await fetch(url)
  return await data.json()
})
```

```ts
const users = await getData('/users')
const posts = await getData('/posts')

// in other place, `/users` will only be requested once and the result will be cached.
const users2 = await getData('/users')
```

### Caching

By default, we use [`lru-cache`](https://www.npmjs.com/package/lru-cache) with 1,000 capacity. To customize LRU cache, you can pass `lru` option

```ts
export const fn = asyncCacheFn(
  async (url) => {
  // do something...
  },
  {
    lru: { /* full lru-cache options */ }
  }
)
```

Or you can set `false` to completely disable LRU cache, which will use Map instead (be cautious with potential memory leak, you need to clear the cache manually).

```ts
export const fn = asyncCacheFn(
  async (url) => {
    // do something...
  },
  {
    lru: false // disable
  }
)
```

### Custom Argument Serialization

By default, we apply [`safe-stable-stringify`](https://www.npmjs.com/package/safe-stable-stringify) to the arguments as the key for caching.

You may provide a custom function to how the get been generated:

```ts
import { asyncCacheFn, stableStringify } from 'async-cache-fn'

export const multiply = asyncCacheFn(
  async (n, m) => {
    return n * m
  },
  {
    // since the order of multiply is interchangeable,
    // we sort it to improve the cache matching
    getKey(args) {
      return stableStringify(args.sort())
    }
  }
)
```

> `stringify()` from `safe-stable-stringify` is re-exported as `stableStringify()`

### Cache Management

You can have fine-grain control of the caching accessing utils on the cached function:

```ts
export const multiply = asyncCacheFn(async (n, m) => {
  return n * m
})

multiply(2, 3)

multiply.has(2, 3) // true
multiply.has(4, 5) // false

await multiply.get(2, 3) // 6

// clear all cache
multiply.clear()
```

You can check the type definition for all utilities available.

### Cache Mode

> TODO

Please check the check the type definition for now.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2022 [Anthony Fu](https://github.com/antfu)
