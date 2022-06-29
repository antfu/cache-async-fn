import { describe, expect, it } from 'vitest'
import { asyncCacheFn } from '../src'

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

    expect(await Promise.all([a, b, c])).toEqual([24, 12, 24])

    expect(calls).toEqual(2)
  })
})
