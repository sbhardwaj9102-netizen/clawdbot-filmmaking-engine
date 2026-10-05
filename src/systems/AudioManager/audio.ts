"use client";

/**
 * AUDIO DIRECTOR
 * ------------------------------------------------------------------
 * The only place sound is made. Everything is synthesised with Web Audio —
 * no samples, no licensed music — and nothing plays until the visitor turns
 * sound on (a click, so browsers allow it).
 *
 *   score       one slow ambient theme (pads, a low root, a few bell notes)
 *               that brightens and gains a soft pulse in the strategist's room
 *   atmosphere  a quiet room tone under the score
 *   cues        a soft swell on reveals, a riser for the shift, a resolve at the end
 *   voice       PA-1 speaks through the browser's speech synthesis, with a small
 *               chirp first; the score ducks under it. Captions always carry
 *               the words, so nothing depends on hearing them.
 */

export type Room = "landing" | "producer" | "strategist";
export type Cue = "start" | "reveal" | "shift" | "end";

// D major, slow. Voicings as MIDI notes.
const PROGRESSION = [
  [50, 57, 61, 64, 66], // Dmaj9
  [47, 54, 57, 61, 62], // Bm9
  [43, 50, 54, 59, 61], // Gmaj7#11
  [45, 52, 57, 59, 64], // Asus2
];
const BELLS = [74, 76, 78, 81, 83, 86];
const BEAT = 60 / 64;
const CHORD = BEAT * 8;

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type RoomTone = { cutoff: number; pulse: number; bells: number; air: number };
const ROOMS: Record<Room, RoomTone> = {
  landing: { cutoff: 700, pulse: 0, bells: 0.6, air: 0.03 },
  producer: { cutoff: 1100, pulse: 0, bells: 1, air: 0.035 },
  strategist: { cutoff: 2400, pulse: 1, bells: 0.8, air: 0.025 },
};

class AudioDirector {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private duck!: GainNode;
  private sfx!: GainNode;
  private padFilter!: BiquadFilterNode;
  private reverb!: ConvolverNode;
  private delay!: DelayNode;
  private pulseGain!: GainNode;
  private air!: GainNode;
  private noise!: AudioBuffer;
  private timer = 0;
  private nextChord = 0;
  private chordIndex = 0;
  private room: Room = "landing";
  private enabled = false;
  private voice: SpeechSynthesisVoice | null = null;
  private speakTimeout = 0;
  private paused = false;

  get isEnabled() {
    return this.enabled;
  }

  /** Must be first called from a user gesture. */
  private init() {
    if (this.ctx || typeof window === "undefined") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);

    this.duck = ctx.createGain();
    this.duck.connect(this.master);
    this.music = ctx.createGain();
    this.music.gain.value = 0.55;
    this.music.connect(this.duck);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.7;
    this.sfx.connect(this.master);

    // a generated hall: decaying stereo noise
    this.reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3.2);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    this.reverb.connect(wet).connect(this.duck);

    // a soft dotted-eighth echo for the bells and the pulse
    this.delay = ctx.createDelay(2);
    this.delay.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.35;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(delayOut).connect(this.music);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = ROOMS.landing.cutoff;
    this.padFilter.Q.value = 0.4;
    this.padFilter.connect(this.music);
    this.padFilter.connect(this.reverb);

    this.pulseGain = ctx.createGain();
    this.pulseGain.gain.value = 0;
    this.pulseGain.connect(this.music);
    this.pulseGain.connect(this.delay);

    // brown noise, shared by the room tone and the cues
    const nlen = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nlen; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const room = ctx.createBufferSource();
    room.buffer = this.noise;
    room.loop = true;
    const roomLp = ctx.createBiquadFilter();
    roomLp.type = "lowpass";
    roomLp.frequency.value = 380;
    this.air = ctx.createGain();
    this.air.gain.value = 0;
    room.connect(roomLp).connect(this.air).connect(this.master);
    room.start();

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.enabled) void this.ctx.resume();
    });

    if ("speechSynthesis" in window) {
      const pick = () => (this.voice = pickVoice(window.speechSynthesis.getVoices()));
      pick();
      window.speechSynthesis.addEventListener?.("voiceschanged", pick);
    }
  }

  setEnabled(on: boolean) {
    if (on) this.init();
    this.enabled = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (on) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0.85, t, 0.8);
      this.applyRoom(0.5);
      this.startScore();
    } else {
      this.stopVoice();
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.2);
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }

  setRoom(room: Room) {
    if (room === this.room) return;
    this.room = room;
    this.applyRoom(2.5);
  }

  /** While the tour is paused or a document is open, the score sits lower. */
  setPaused(paused: boolean) {
    this.paused = paused;
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(paused ? 0.28 : 0.55, this.ctx.currentTime, 0.6);
  }

  private applyRoom(time: number) {
    if (!this.ctx) return;
    const r = ROOMS[this.room];
    const t = this.ctx.currentTime;
    this.padFilter.frequency.setTargetAtTime(r.cutoff, t, time);
    this.pulseGain.gain.setTargetAtTime(r.pulse * 0.05, t, time);
    this.air.gain.setTargetAtTime(this.enabled ? r.air : 0, t, time);
  }

  // ── the score ───────────────────────────────────────────────

  private startScore() {
    if (!this.ctx || this.timer) return;
    this.nextChord = this.ctx.currentTime + 0.1;
    const schedule = () => {
      const ctx = this.ctx;
      if (!ctx || !this.enabled) return;
      while (this.nextChord < ctx.currentTime + 1.2) {
        this.playChord(this.nextChord, PROGRESSION[this.chordIndex % PROGRESSION.length]);
        this.chordIndex++;
        this.nextChord += CHORD;
      }
    };
    schedule();
    this.timer = window.setInterval(schedule, 400);
  }

  private playChord(at: number, notes: number[]) {
    const ctx = this.ctx!;
    const r = ROOMS[this.room];
    const end = at + CHORD + 3.5;
    // pad: two slightly detuned oscillators per note, slow in, slow out
    notes.forEach((n, i) => {
      const g = ctx.createGain();
      const level = (i === 0 ? 0.05 : 0.032) * (this.paused ? 0.7 : 1);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(level, at + 2.8);
      g.gain.setValueAtTime(level, at + CHORD - 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      g.connect(this.padFilter);
      for (const [type, detune] of [
        ["sawtooth", -7],
        ["triangle", 6],
      ] as [OscillatorType, number][]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = hz(n);
        o.detune.value = detune;
        o.connect(g);
        o.start(at);
        o.stop(end + 0.1);
      }
    });
    // a low root
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.value = hz(notes[0] - 12);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, at);
    bg.gain.exponentialRampToValueAtTime(0.09, at + 1.5);
    bg.gain.setValueAtTime(0.09, at + CHORD - 0.5);
    bg.gain.exponentialRampToValueAtTime(0.0001, at + CHORD + 1.5);
    bass.connect(bg).connect(this.music);
    bass.start(at);
    bass.stop(at + CHORD + 1.6);

    // a few bell notes, placed on beats
    const count = Math.random() < r.bells ? 1 + Math.floor(Math.random() * 2) : 0;
    for (let k = 0; k < count; k++) {
      const beat = 1 + Math.floor(Math.random() * 6);
      this.bell(at + beat * BEAT, BELLS[Math.floor(Math.random() * BELLS.length)], 0.035);
    }
    // the strategist's pulse: a soft arpeggio of the chord in eighths
    if (r.pulse > 0) {
      for (let s = 0; s < 16; s++) {
        const n = notes[1 + (s % 4)] + 12;
        this.pluck(at + s * (BEAT / 2), n, s % 4 === 0 ? 0.6 : 0.4);
      }
    }
  }

  private bell(at: number, note: number, level: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(note);
    const mod = ctx.createOscillator();
    mod.frequency.value = hz(note) * 2.01;
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(hz(note) * 0.6, at);
    mg.gain.exponentialRampToValueAtTime(1, at + 1.2);
    mod.connect(mg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.8);
    o.connect(g);
    g.connect(this.music);
    g.connect(this.delay);
    g.connect(this.reverb);
    o.start(at);
    mod.start(at);
    o.stop(at + 3);
    mod.stop(at + 3);
  }

  private pluck(at: number, note: number, level: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = hz(note);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(2600, at);
    f.frequency.exponentialRampToValueAtTime(500, at + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
    o.connect(f).connect(g).connect(this.pulseGain);
    o.start(at);
    o.stop(at + 0.5);
  }

  // ── cues ────────────────────────────────────────────────────

  cue(name: Cue) {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.02;
    if (name === "reveal" || name === "start") {
      this.bell(t, 81, 0.045);
      this.bell(t + 0.18, 88, 0.03);
    } else if (name === "end") {
      this.bell(t, 74, 0.05);
      this.bell(t + 0.3, 78, 0.04);
      this.bell(t + 0.6, 81, 0.035);
    } else if (name === "shift") {
      // a filtered-noise riser that opens and falls away
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 1.1;
      f.frequency.setValueAtTime(260, t);
      f.frequency.exponentialRampToValueAtTime(3400, t + 5.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 4.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7);
      src.connect(f).connect(g);
      g.connect(this.sfx);
      g.connect(this.reverb);
      src.start(t, Math.random() * 2);
      src.stop(t + 7.2);
    }
  }

  // ── PA-1's voice ────────────────────────────────────────────

  /** Speaks a line; calls `onEnd` when finished (or at once if there is no voice). */
  speak(text: string, onEnd: () => void) {
    this.stopVoice();
    if (!this.enabled || typeof window === "undefined") {
      onEnd();
      return;
    }
    this.chirp();
    const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
    if (!synth) {
      onEnd();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.lang = this.voice?.lang ?? "en-GB";
    u.rate = 1.02;
    u.pitch = 0.82;
    u.volume = 0.95;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(this.speakTimeout);
      this.setDucked(false);
      onEnd();
    };
    u.onend = finish;
    u.onerror = finish;
    // some engines never fire onend; never wait longer than the words could take
    this.speakTimeout = window.setTimeout(finish, 1500 + text.split(/\s+/).length * 420);
    this.setDucked(true);
    window.setTimeout(() => synth.speak(u), 140);
  }

  stopVoice() {
    window.clearTimeout(this.speakTimeout);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    this.setDucked(false);
  }

  private setDucked(on: boolean) {
    if (!this.ctx) return;
    this.duck.gain.setTargetAtTime(on ? 0.45 : 1, this.ctx.currentTime, on ? 0.15 : 0.6);
  }

  private chirp() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    [1046.5, 1568].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      const s = t + i * 0.07;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.03, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.09);
      o.connect(g).connect(this.sfx);
      o.start(s);
      o.stop(s + 0.1);
    });
  }
}

/** A clear English voice, preferring ones that sound measured rather than chirpy. */
function pickVoice(voices: SpeechSynthesisVoice[]) {
  if (!voices.length) return null;
  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const prefer = [/Daniel/i, /Google UK English Male/i, /Ryan/i, /Arthur/i, /Oliver/i, /George/i, /en-GB/i, /Alex/i, /Google US English/i];
  for (const p of prefer) {
    const v = en.find((x) => p.test(x.name) || p.test(x.lang));
    if (v) return v;
  }
  return en[0] ?? voices[0];
}

export const audio = new AudioDirector();
