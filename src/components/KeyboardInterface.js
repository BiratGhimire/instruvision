import React, { useState, useEffect, useCallback } from 'react';
import useAudio from '../hooks/useAudio';

const KeyboardInterface = ({ instrument }) => {
  const { playNote, stopNote } = useAudio();
  const [activeKeys, setActiveKeys] = useState(new Set());

  const whiteNotes = instrument.notes.filter(n => n.color === 'white');
  const blackNotes = instrument.notes.filter(n => n.color === 'black');

  const handleNoteOn = useCallback((note) => {
    setActiveKeys(prev => new Set([...prev, note.label]));
    playNote(note.freq, instrument.waveform, instrument.envelope, note.label);
  }, [playNote, instrument]);

  const handleNoteOff = useCallback((note) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(note.label);
      return next;
    });
    stopNote(note.label, instrument.envelope.release);
  }, [stopNote, instrument]);

  useEffect(() => {
    const keyMap = {};
    instrument.notes.forEach(note => { keyMap[note.key] = note; });

    const onKeyDown = (e) => {
      if (e.repeat) return;
      const note = keyMap[e.key.toLowerCase()];
      if (note) handleNoteOn(note);
    };
    const onKeyUp = (e) => {
      const note = keyMap[e.key.toLowerCase()];
      if (note) handleNoteOff(note);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [instrument, handleNoteOn, handleNoteOff]);

  // Black key position mapping (based on white key index)
  const blackKeyPositions = {
    'C#4': 0.7, 'D#4': 1.7, 'F#4': 3.7, 'G#4': 4.7, 'A#4': 5.7,
    'C#5': 7.7
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px', fontSize: '0.85rem' }}>
        Click keys or use keyboard shortcuts shown below each key
      </p>
      <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
        {/* White keys */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {whiteNotes.map((note, i) => {
            const isActive = activeKeys.has(note.label);
            return (
              <div
                key={note.label}
                onMouseDown={() => handleNoteOn(note)}
                onMouseUp={() => handleNoteOff(note)}
                onMouseLeave={() => activeKeys.has(note.label) && handleNoteOff(note)}
                onTouchStart={(e) => { e.preventDefault(); handleNoteOn(note); }}
                onTouchEnd={(e) => { e.preventDefault(); handleNoteOff(note); }}
                style={{
                  width: '52px',
                  height: '160px',
                  background: isActive
                    ? `linear-gradient(180deg, ${instrument.color}80, ${instrument.color})`
                    : 'linear-gradient(180deg, #f0f0f0, #ffffff)',
                  border: `2px solid ${isActive ? instrument.color : '#ccc'}`,
                  borderRadius: '0 0 8px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '10px',
                  boxShadow: isActive
                    ? `0 0 20px ${instrument.color}60, inset 0 -3px 0 rgba(0,0,0,0.2)`
                    : '0 4px 8px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.1)',
                  transition: 'all 0.05s ease',
                  transform: isActive ? 'translateY(2px)' : 'none',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <span style={{ fontSize: '10px', color: isActive ? 'white' : '#333', fontWeight: '600' }}>
                  {note.label.replace(/\d/, '')}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: isActive ? 'rgba(255,255,255,0.8)' : '#888',
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  marginTop: '3px'
                }}>
                  [{note.key.toUpperCase()}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Black keys overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%' }}>
          {blackNotes.map((note) => {
            const pos = blackKeyPositions[note.label] ?? 0;
            const isActive = activeKeys.has(note.label);
            return (
              <div
                key={note.label}
                onMouseDown={(e) => { e.stopPropagation(); handleNoteOn(note); }}
                onMouseUp={(e) => { e.stopPropagation(); handleNoteOff(note); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteOn(note); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteOff(note); }}
                style={{
                  position: 'absolute',
                  left: `${pos * 55 + 35}px`,
                  top: 0,
                  width: '36px',
                  height: '100px',
                  background: isActive
                    ? `linear-gradient(180deg, ${instrument.color}, ${instrument.color}cc)`
                    : 'linear-gradient(180deg, #1a1a1a, #000)',
                  border: `1px solid ${isActive ? instrument.color : '#000'}`,
                  borderRadius: '0 0 6px 6px',
                  cursor: 'pointer',
                  pointerEvents: 'all',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '8px',
                  boxShadow: isActive
                    ? `0 0 15px ${instrument.color}80`
                    : '2px 4px 8px rgba(0,0,0,0.5)',
                  transition: 'all 0.05s ease',
                  transform: isActive ? 'translateY(2px)' : 'none',
                }}
              >
                <span style={{ fontSize: '9px', color: isActive ? 'white' : '#888' }}>
                  [{note.key.toUpperCase()}]
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KeyboardInterface;
