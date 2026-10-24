import { describe, expect, it } from 'vitest'
import { nextRejectionState } from './verification.js'

const now = new Date('2026-10-23T20:00:00Z')

describe('nextRejectionState', () => {
  it('los primeros rechazos solo suman al contador', () => {
    expect(nextRejectionState(0, 3, 15, now)).toEqual({ rejectionStreak: 1, blockedUntil: null })
    expect(nextRejectionState(1, 3, 15, now)).toEqual({ rejectionStreak: 2, blockedUntil: null })
  })

  it('el tercero bloquea 15 minutos y reinicia el contador', () => {
    expect(nextRejectionState(2, 3, 15, now)).toEqual({
      rejectionStreak: 0,
      blockedUntil: new Date('2026-10-23T20:15:00Z'),
    })
  })
})
