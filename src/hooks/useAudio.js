import { useRef, useCallback } from 'react';

const useAudio = () => {
  const audioCtxRef = useRef(null);
  const activeNodesRef = useRef({});

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

  const playNote = useCallback((freq, waveform = 'sine', envelope = {}, noteId = null) => {
    const ctx = getCtx();
    const { attack = 0.05, decay = 0.2, sustain = 0.5 } = envelope;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = ['sine','sawtooth','triangle','square'].includes(waveform) ? waveform : 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.7, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustain * 0.7, ctx.currentTime + attack + decay);

    oscillator.start(ctx.currentTime);

    const id = noteId || freq;
    activeNodesRef.current[id] = { oscillator, gainNode, ctx };

    return id;
  }, [getCtx]);

  const stopNote = useCallback((noteId, release = 0.5) => {
    const node = activeNodesRef.current[noteId];
    if (!node) return;
    const { oscillator, gainNode, ctx } = node;
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + release);
    oscillator.stop(ctx.currentTime + release + 0.1);
    delete activeNodesRef.current[noteId];
  }, []);

  const playPercussion = useCallback((freq, type = 'kick') => {
    const ctx = getCtx();

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.1, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

    } else if (type === 'snare') {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      noise.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.3);

    } else if (type === 'hihat') {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.1);

    } else if (type === 'crash') {
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5000;
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 1.5);

    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  }, [getCtx]);

  return { playNote, stopNote, playPercussion };
};

export default useAudio;