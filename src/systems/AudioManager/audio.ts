"use client";

import type { WorldId } from "@/data/story/types";

/**
 * AUDIO
 * ------------------------------------------------------------------
 * Everything is synthesised with Web Audio — no music, no samples, no
 * copyrighted material. Off by default; the visitor turns it on.
 *
 *   room tone   filtered brown noise + a low drone, tuned per world
 *   footsteps   short filtered noise bursts on each heel strike
 *   projector   a soft 24 fps flutter in the film worlds
 *   transitions air whooshes, door rumble, soft choice tones
 */

type WorldTone = { cutoff: number; drone: number; droneGain: number; noiseGain: number; flutter: number; murmur: number };

const TONES: Record<WorldId, WorldTone> = {
  studio: { cutoff: 260, drone: 55, droneGain: 0.05, noiseGain: 0.11, flutter: 0, murmur: 0 },
  filmset: { cutoff: 320, drone: 49, droneGain: 0.045, noiseGain: 0.1, flutter: 0.022, murmur: 0 },
  project: { cutoff: 420, drone: 44, droneGain: 0.04, noiseGain: 0.12, flutter: 0.012, murmur: 0 },
  production: { cutoff: 380, drone: 62, droneGain: 0.04, noiseGain: 0.1, flutter: 0, murmur: 0 },
  events: { cutoff: 520, drone: 58, droneGain: 0.03, noiseGain: 0.08, flutter: 0, murmur: 0.05 },
  finance: { cutoff: 700, drone: 73, droneGain: 0.03, noiseGain: 0.07, flutter: 0, murmur: 0 },
  business: { cutoff: 240, drone: 41, droneGain: 0.06, noiseGain: 0.09, flutter: 0, murmur: 0 },
  career: { cutoff: 300, drone: 52, droneGain: 0.04, noiseGain: 0.09, flutter: 0, murmur: 0 },
  about: { cutoff: 200, drone: 65, droneGain: 0.025, noiseGain: 0.06, flutter: 0, murmur: 0 },
  final: { cutoff: 900, drone: 82, droneGain: 0.03, noiseGain: 0.1, flutter: 0, murmur: 0 },
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private roomFilter!: BiquadFilterNode;
  private roomGain!: GainNode;
  private drone!: OscillatorNode;
  private drone2!: OscillatorNode;
  private droneGain!: GainNode;
  private flutterGain!: GainNode;
  private murmurGain!: GainNode;
  private noise!: AudioBuffer;
  private enabled = false;
  private world: WorldId = "studio";

  /** Must be called from a user gesture. */
  init() {
    if (this.ctx || typeof window === "undefined") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);

    // brown noise buffer
    const len = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    // room tone
    const room = ctx.createBufferSource();
    room.buffer = this.noise;
    room.loop = true;
    this.roomFilter = ctx.createBiquadFilter();
    this.roomFilter.type = "lowpass";
    this.roomFilter.frequency.value = 260;
    this.roomGain = ctx.createGain();
    this.roomGain.gain.value = 0.1;
    room.connect(this.roomFilter).connect(this.roomGain).connect(this.master);
    room.start();

    // drone: two detuned sines with a slow swell
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.04;
    this.drone = ctx.createOscillator();
    this.drone.frequency.value = 55;
    this.drone2 = ctx.createOscillator();
    this.drone2.frequency.value = 55 * 1.501;
    const d2g = ctx.createGain();
    d2g.gain.value = 0.35;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(this.droneGain.gain);
    this.drone.connect(this.droneGain);
    this.drone2.connect(d2g).connect(this.droneGain);
    this.droneGain.connect(this.master);
    this.drone.start();
    this.drone2.start();
    lfo.start();

    // projector flutter: band-passed noise amplitude-modulated at 24 Hz
    const flut = ctx.createBufferSource();
    flut.buffer = this.noise;
    flut.loop = true;
    const fBand = ctx.createBiquadFilter();
    fBand.type = "bandpass";
    fBand.frequency.value = 1800;
    fBand.Q.value = 0.8;
    const fAm = ctx.createGain();
    fAm.gain.value = 0.5;
    const fOsc = ctx.createOscillator();
    fOsc.type = "square";
    fOsc.frequency.value = 24;
    const fOscGain = ctx.createGain();
    fOscGain.gain.value = 0.5;
    fOsc.connect(fOscGain).connect(fAm.gain);
    this.flutterGain = ctx.createGain();
    this.flutterGain.gain.value = 0;
    flut.connect(fBand).connect(fAm).connect(this.flutterGain).connect(this.master);
    flut.start();
    fOsc.start();

    // distant murmur for the events venue
    const mur = ctx.createBufferSource();
    mur.buffer = this.noise;
    mur.loop = true;
    mur.playbackRate.value = 1.7;
    const mBand = ctx.createBiquadFilter();
    mBand.type = "bandpass";
    mBand.frequency.value = 520;
    mBand.Q.value = 1.4;
    this.murmurGain = ctx.createGain();
    this.murmurGain.gain.value = 0;
    mur.connect(mBand).connect(this.murmurGain).connect(this.master);
    mur.start();

    this.applyWorld(0.01);
  }

  get isEnabled() {
    return this.enabled;
  }

  setEnabled(on: boolean) {
    if (on) this.init();
    this.enabled = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (on && this.ctx.state === "suspended") void this.ctx.resume();
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.8 : 0, t, on ? 0.6 : 0.15);
  }

  setWorld(world: WorldId) {
    this.world = world;
    this.applyWorld(1.5);
  }

  private applyWorld(time: number) {
    if (!this.ctx) return;
    const tone = TONES[this.world];
    const t = this.ctx.currentTime;
    this.roomFilter.frequency.setTargetAtTime(tone.cutoff, t, time);
    this.roomGain.gain.setTargetAtTime(tone.noiseGain, t, time);
    this.drone.frequency.setTargetAtTime(tone.drone, t, time);
    this.drone2.frequency.setTargetAtTime(tone.drone * 1.501, t, time);
    this.droneGain.gain.setTargetAtTime(tone.droneGain, t, time);
    this.flutterGain.gain.setTargetAtTime(tone.flutter, t, time);
    this.murmurGain.gain.setTargetAtTime(tone.murmur, t, time);
  }

  private burst(opts: { freq: number; q?: number; duration: number; gain: number; type?: BiquadFilterType; sweepTo?: number; rate?: number }) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = opts.rate ?? 1;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? "bandpass";
    f.frequency.setValueAtTime(opts.freq, t);
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + opts.duration);
    f.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + Math.min(0.02, opts.duration * 0.2) + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 3);
    src.stop(t + opts.duration + 0.05);
  }

  footstep(intensity = 1) {
    const pitch = 0.85 + Math.random() * 0.3;
    this.burst({ freq: 900 * pitch, q: 1.2, duration: 0.11, gain: 0.32 * intensity, rate: 2.2 });
    this.burst({ freq: 140, q: 0.8, duration: 0.09, gain: 0.25 * intensity, type: "lowpass" });
  }

  whoosh() {
    this.burst({ freq: 220, sweepTo: 2400, q: 0.9, duration: 1.6, gain: 0.22 });
  }

  door() {
    this.burst({ freq: 90, sweepTo: 60, q: 0.7, duration: 2.6, gain: 0.5, type: "lowpass" });
    this.burst({ freq: 600, sweepTo: 300, q: 2, duration: 2.2, gain: 0.06 });
  }

  tick() {
    this.tone(1320, 0.06, 0.035);
  }

  choice() {
    this.tone(392, 1.6, 0.06);
    this.tone(587.33, 1.8, 0.04);
  }

  reveal() {
    this.tone(196, 2.4, 0.05);
    this.tone(293.66, 2.6, 0.035);
    this.burst({ freq: 300, sweepTo: 1600, duration: 2.2, gain: 0.08 });
  }

  private tone(freq: number, duration: number, gain: number) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + duration + 0.05);
  }
}

export const audio = new AudioManager();
