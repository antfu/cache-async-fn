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

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2022 [Anthony Fu](https://github.com/antfu)
