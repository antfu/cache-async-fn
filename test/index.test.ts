import { describe, expect, it } from 'vitest'
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
      getKey: args => stableStringify(args.sort()),
    })

    const a = mul(3, 4)
    const b = mul(4, 3)

    expect(a === b).toBeTruthy()

    expect(await Promise.all([a, b])).toEqual([12, 12])

    expect(calls).toEqual(1)
  })
})
