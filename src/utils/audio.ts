/**
 * Web Audio Synthesizer (TimeFlow Canvas Audio Spec)
 *
 * Implements tactile micro-interaction sounds without external MP3 files:
 * 1. Start Session: Triangle Wave (440Hz -> 554Hz, 250ms)
 * 2. Pause Session: Sine Wave (440Hz -> 330Hz, 200ms)
 * 3. Complete Session: Bell dual chord (C5 -> G5, 600ms)
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    try {
      const stored = localStorage.getItem('timeflow_sound_enabled')
      if (stored !== null) {
        this.enabled = stored === 'true'
      }
    } catch {
      this.enabled = true
    }
  }

  public isSoundEnabled(): boolean {
    return this.enabled
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled
    try {
      localStorage.setItem('timeflow_sound_enabled', String(this.enabled))
    } catch {}
    return this.enabled
  }

  public setSoundEnabled(enabled: boolean) {
    this.enabled = enabled
    try {
      localStorage.setItem('timeflow_sound_enabled', String(this.enabled))
    } catch {}
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  /**
   * Start session sound: Triangle wave ramping up from 440Hz (A4) to 554Hz (C#5)
   */
  public playStart() {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      const now = ctx.currentTime

      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(554, now + 0.25)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    } catch (e) {
      console.warn('Failed to play start sound:', e)
    }
  }

  /**
   * Pause sound: Sine wave descending from 440Hz (A4) to 330Hz (E4)
   */
  public playPause() {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const now = ctx.currentTime

      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.2)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.2)
    } catch (e) {
      console.warn('Failed to play pause sound:', e)
    }
  }

  /**
   * Complete sound: Harmonious bell chord (C5 523.25Hz -> G5 783.99Hz, 600ms)
   */
  public playComplete() {
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const notes = [
        { freq: 523.25, time: 0, duration: 0.5 },    // C5
        { freq: 783.99, time: 0.12, duration: 0.48 }  // G5
      ]

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + time)

        gain.gain.setValueAtTime(0.001, now + time)
        gain.gain.linearRampToValueAtTime(0.2, now + time + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + time)
        osc.stop(now + time + duration)
      })
    } catch (e) {
      console.warn('Failed to play complete sound:', e)
    }
  }
}

export const soundSynth = new SoundSynthesizer()
