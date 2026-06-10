import { useRef, useCallback } from 'react';

// Real instrument sample URLs from Tonejs GitHub (free, open source)
// These are actual recordings of real instruments
const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/';
const VERSILIAN_BASE = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/';

// Note frequency map
const NOTE_FREQS = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
};

const useAudio = () => {
  const audioCtxRef = useRef(null);
  const activeNodesRef = useRef({});
  const samplerCacheRef = useRef({});

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended' ||
        audioCtxRef.current.state === 'interrupted') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Load and cache an audio buffer from URL
  const loadSample = useCallback(async (url) => {
    if (samplerCacheRef.current[url]) return samplerCacheRef.current[url];
    try {
      const ctx = getCtx();
      const response = await fetch(url);
      if (!response.ok) throw new Error('Sample not found');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      samplerCacheRef.current[url] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      return null;
    }
  }, [getCtx]);

  // Play a loaded audio buffer at a given playback rate (for pitch shifting)
  const playSample = useCallback((buffer, playbackRate = 1.0, volume = 0.8, noteId = null) => {
    const ctx = getCtx();
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(ctx.currentTime);

    const id = noteId || Math.random();
    activeNodesRef.current[id] = { source, gainNode, ctx };
    return id;
  }, [getCtx]);

  // Synthesize realistic instrument sounds using advanced Web Audio techniques
  const synthesizeInstrument = useCallback((freq, instrumentName, noteId) => {
    const ctx = getCtx();
    const name = (instrumentName || '').toLowerCase();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    if (name.includes('piano')) {
      // Piano: multiple detuned oscillators + rapid decay
      const freqs = [freq, freq * 2, freq * 3, freq * 4, freq * 6];
      const gains = [1.0, 0.5, 0.25, 0.1, 0.05];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = f + (Math.random() - 0.5) * 0.5;
        g.gain.value = gains[i];
        osc.connect(g); g.connect(masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 4);
      });
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.005);
      masterGain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);

    } else if (name.includes('guitar') || name.includes('sitar')) {
      // Karplus-Strong string synthesis — most realistic guitar algorithm
      const ctx2 = ctx;
      const sampleRate = ctx2.sampleRate;
      const N = Math.round(sampleRate / freq);
      const bufferSize = sampleRate * 3;
      const buffer = ctx2.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Fill delay line with noise
      const delayLine = new Float32Array(N);
      for (let i = 0; i < N; i++) delayLine[i] = Math.random() * 2 - 1;

      // Generate Karplus-Strong output
      let prev = 0;
      for (let i = 0; i < bufferSize; i++) {
        const idx = i % N;
        const curr = delayLine[idx];
        // Low-pass filter + feedback
        const filtered = 0.498 * (curr + prev);
        delayLine[idx] = filtered;
        data[i] = curr;
        prev = curr;
      }

      const src = ctx2.createBufferSource();
      src.buffer = buffer;
      const gain = ctx2.createGain();
      gain.gain.setValueAtTime(0.9, ctx2.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 3);
      src.connect(gain); gain.connect(ctx2.destination);
      src.start(ctx2.currentTime);

      activeNodesRef.current[noteId] = { source: src, gainNode: gain, ctx: ctx2 };
      return;

    } else if (name.includes('violin')) {
      // Bowed string: sawtooth + vibrato + body resonance
      const osc = ctx.createOscillator();
      const vibLFO = ctx.createOscillator();
      const vibGain = ctx.createGain();
      const bodyFilter = ctx.createBiquadFilter();
      const bodyFilter2 = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      vibLFO.frequency.value = 5.8;
      vibGain.gain.setValueAtTime(0, ctx.currentTime);
      vibGain.gain.linearRampToValueAtTime(freq * 0.015, ctx.currentTime + 0.5);

      bodyFilter.type = 'peaking';
      bodyFilter.frequency.value = freq * 2.5;
      bodyFilter.gain.value = 6;
      bodyFilter.Q.value = 2;

      bodyFilter2.type = 'peaking';
      bodyFilter2.frequency.value = freq * 4;
      bodyFilter2.gain.value = 3;

      vibLFO.connect(vibGain);
      vibGain.connect(osc.frequency);
      osc.connect(bodyFilter);
      bodyFilter.connect(bodyFilter2);
      bodyFilter2.connect(masterGain);

      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.2);

      vibLFO.start(ctx.currentTime);
      osc.start(ctx.currentTime);
      vibLFO.stop(ctx.currentTime + 5);
      osc.stop(ctx.currentTime + 5);

    } else if (name.includes('flute')) {
      // Flute: sine + breath noise + embouchure
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noiseBuffer.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.value = freq * 1.2;
      breathFilter.Q.value = 8;

      const breathGain = ctx.createGain();
      breathGain.gain.value = 0.06;

      const vibLFO = ctx.createOscillator();
      const vibGain = ctx.createGain();
      vibLFO.frequency.value = 5.2;
      vibGain.gain.value = freq * 0.008;

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.08;

      vibLFO.connect(vibGain);
      vibGain.connect(osc.frequency);
      noise.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(masterGain);
      osc.connect(masterGain);
      osc2.connect(osc2Gain);
      osc2Gain.connect(masterGain);

      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);

      vibLFO.start(ctx.currentTime);
      osc.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      noise.start(ctx.currentTime);
      vibLFO.stop(ctx.currentTime + 5);
      osc.stop(ctx.currentTime + 5);
      osc2.stop(ctx.currentTime + 5);
      noise.stop(ctx.currentTime + 5);

    } else if (name.includes('trumpet')) {
      // Trumpet: buzzy sawtooth + mute filter sweep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const distortion = ctx.createWaveShaper();

      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 100) * x / (Math.PI + 100 * Math.abs(x));
      }
      distortion.curve = curve;

      osc1.type = 'sawtooth'; osc1.frequency.value = freq;
      osc2.type = 'sawtooth'; osc2.frequency.value = freq * 1.003;
      osc3.type = 'square';  osc3.frequency.value = freq * 0.5;

      const g1 = ctx.createGain(); g1.gain.value = 0.5;
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      const g3 = ctx.createGain(); g3.gain.value = 0.15;

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(freq * 5, ctx.currentTime + 0.08);
      filter.Q.value = 1.5;

      osc1.connect(g1); g1.connect(distortion);
      osc2.connect(g2); g2.connect(distortion);
      osc3.connect(g3); g3.connect(distortion);
      distortion.connect(filter);
      filter.connect(masterGain);

      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.04);

      [osc1, osc2, osc3].forEach(o => { o.start(ctx.currentTime); o.stop(ctx.currentTime + 5); });

    } else if (name.includes('saxophone')) {
      // Sax: clarinet-like odd harmonics + reed buzz
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth'; osc1.frequency.value = freq;
      osc2.type = 'square';   osc2.frequency.value = freq * 1.002;
      osc3.type = 'sine';     osc3.frequency.value = freq * 3;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(freq * 3, ctx.currentTime + 0.3);
      filter.Q.value = 2;

      const g1 = ctx.createGain(); g1.gain.value = 0.5;
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      const g3 = ctx.createGain(); g3.gain.value = 0.1;

      osc1.connect(g1); g1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      filter.connect(masterGain);

      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.06);

      [osc1, osc2, osc3].forEach(o => { o.start(ctx.currentTime); o.stop(ctx.currentTime + 5); });

    } else if (name.includes('harp')) {
      // Harp: Karplus-Strong + high-pass (brighter than guitar)
      const sampleRate = ctx.sampleRate;
      const N = Math.round(sampleRate / freq);
      const bufferSize = sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      const delayLine = new Float32Array(N);
      for (let i = 0; i < N; i++) delayLine[i] = Math.random() * 2 - 1;
      let prev = 0;
      for (let i = 0; i < bufferSize; i++) {
        const idx = i % N;
        const curr = delayLine[idx];
        const filtered = 0.495 * (curr + prev); // slightly less damping = brighter
        delayLine[idx] = filtered;
        data[i] = curr;
        prev = curr;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      src.connect(hpFilter); hpFilter.connect(gain); gain.connect(ctx.destination);
      src.start(ctx.currentTime);
      activeNodesRef.current[noteId] = { source: src, gainNode: gain, ctx };
      return;

    } else if (name.includes('tabla') || name.includes('drums')) {
      // Handled by playPercussion
      masterGain.disconnect();
      return;

    } else {
      // Generic fallback
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(masterGain);
      masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    }

    activeNodesRef.current[noteId] = { masterGain, ctx };
  }, [getCtx]);

  const playNote = useCallback((freq, waveform = 'sine', envelope = {}, noteId = null, instrumentName = '') => {
    const id = noteId || `${freq}_${Date.now()}`;
    synthesizeInstrument(freq, instrumentName, id);
    return id;
  }, [synthesizeInstrument]);

  const stopNote = useCallback((noteId, release = 0.4) => {
    const node = activeNodesRef.current[noteId];
    if (!node) return;
    const { masterGain, gainNode, ctx } = node;
    const g = masterGain || gainNode;
    if (g) {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + release);
      } catch (_) {}
    }
    delete activeNodesRef.current[noteId];
  }, []);

  const playPercussion = useCallback((freq, type = 'kick') => {
    const ctx = getCtx();

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = x * 2; }
      dist.curve = curve;
      osc.connect(dist); dist.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(1.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.55);

    } else if (type === 'snare') {
      // Noise burst
      const bSize = ctx.sampleRate * 0.3;
      const buf = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 2000;
      const ng = ctx.createGain();
      noise.connect(hpf); hpf.connect(ng); ng.connect(ctx.destination);
      ng.gain.setValueAtTime(1.0, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 0.2);
      // Tone crack
      const osc = ctx.createOscillator(); const og = ctx.createGain();
      osc.frequency.value = 200; osc.type = 'triangle';
      osc.connect(og); og.connect(ctx.destination);
      og.gain.setValueAtTime(0.6, ctx.currentTime);
      og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);

    } else if (type === 'hihat') {
      const oscs = [240, 340, 480, 620, 830, 1020].map(f => {
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; return o;
      });
      const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 8000;
      const gain = ctx.createGain();
      oscs.forEach(o => { o.connect(filter); });
      filter.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      oscs.forEach(o => { o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1); });

    } else if (type === 'crash') {
      const bSize = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 5000; bpf.Q.value = 0.3;
      const gain = ctx.createGain();
      noise.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      noise.start(ctx.currentTime); noise.stop(ctx.currentTime + 2.5);

    } else if (type === 'ride') {
      const oscs = [250, 400, 550, 800].map(f => {
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; return o;
      });
      const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 3500;
      const gain = ctx.createGain();
      oscs.forEach(o => o.connect(bpf));
      bpf.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      oscs.forEach(o => { o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.9); });

    } else {
      // Tom
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.6, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    }
  }, [getCtx]);

  return { playNote, stopNote, playPercussion };
};

export default useAudio;