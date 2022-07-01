import { describe, expect, it, test } from 'vitest'
import { asyncCacheFn, stableStringify } from '../src'

describe('should', () => {
  it('works', async () => {
    let calls = 0
    const mul = asyncCacheFn(async (n: number, m: number) => {
      await Promise.resolve()
      calls += 1
      return n * m
    })

    const a = mul(12, 2)
    const b = mul(3, 4)
    const c = mul(12, 2)

    expect(a === c).toBeTruthy()
    expect(a === b).toBeFalsy()

    expect(mul.has(12, 2)).toBe(true)
    expect(!mul.has(12, 3)).toBe(true)

    expect(mul.pending.size).toBe(2)

    expect(await Promise.all([a, b, c])).toEqual([24, 12, 24])

    expect(calls).toEqual(2)
    expect(mul.pending.size).toBe(0)
  })

  it('custom getKey', async () => {
    let calls = 0
    const mul = asyncCacheFn(async (n: number, m: number) => {
      await Promise.resolve()
      calls += 1
      return n * m
    }, {
      // since the order is interchangeable, we sort it to improve the cache matching
      getKey: args => stableStringify(args.sort()),
    })

    const a = mul(3, 4)
    const b = mul(4, 3)

    expect(a === b).toBeTruthy()

    expect(await Promise.all([a, b])).toEqual([12, 12])

    expect(calls).toEqual(1)
  })

  test('cyclical update cache', async () => {
    let time = Date.now()
    let count = -1
    const threshold = 100
    const quota = 3
    const metc = 10 // asyncCacheFn's max execution time consumption
    const needUpdateCache = () => {
      const newTime = Date.now()
      const result = newTime - time > threshold
      if (count % (quota + 1) === quota)
        time = newTime
      count++
      return result
    }
    const sleep = () => new Promise((resolve) => {
      setTimeout(() => resolve(true), Math.ceil(threshold / quota))
    })
    const useTime = asyncCacheFn(async () => {
      await Promise.resolve()
      return Date.now()
    }, { needUpdateCache })
    let newTime = await useTime()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of new Array(quota)) {
      expect(time + metc >= newTime).toBeTruthy()
      await sleep()
      newTime = await useTime()
    }
    expect(time + metc >= newTime).toBeFalsy()
  })
})
