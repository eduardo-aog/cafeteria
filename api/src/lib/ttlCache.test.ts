import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TtlCache } from './ttlCache.js'

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('no vuelve a cargar mientras el valor está vigente', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockResolvedValue(7)
    expect(await cache.getOrLoad('a', loader)).toBe(7)
    expect(await cache.getOrLoad('a', loader)).toBe(7)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('vuelve a cargar cuando vence', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)
    expect(await cache.getOrLoad('a', loader)).toBe(1)
    vi.advanceTimersByTime(1001)
    expect(await cache.getOrLoad('a', loader)).toBe(2)
  })

  it('las cargas simultáneas comparten una sola consulta', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockResolvedValue(5)
    const results = await Promise.all([1, 2, 3].map(() => cache.getOrLoad('a', loader)))
    expect(results).toEqual([5, 5, 5])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('delete fuerza una nueva carga', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)
    await cache.getOrLoad('a', loader)
    cache.delete('a')
    expect(await cache.getOrLoad('a', loader)).toBe(2)
  })

  it('no guarda null: un perfil que aún no existe se vuelve a buscar', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(9)
    expect(await cache.getOrLoad('a', loader)).toBeNull()
    expect(await cache.getOrLoad('a', loader)).toBe(9)
  })

  it('no guarda los errores', async () => {
    const cache = new TtlCache<string, number>(1000)
    const loader = vi.fn().mockRejectedValueOnce(new Error('falló')).mockResolvedValueOnce(3)
    await expect(cache.getOrLoad('a', loader)).rejects.toThrow('falló')
    expect(await cache.getOrLoad('a', loader)).toBe(3)
  })

  it('respeta el máximo de entradas', async () => {
    const cache = new TtlCache<number, number>(1000, 2)
    for (const key of [1, 2, 3]) await cache.getOrLoad(key, async () => key)
    const loader = vi.fn().mockResolvedValue(99)
    await cache.getOrLoad(1, loader)
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
