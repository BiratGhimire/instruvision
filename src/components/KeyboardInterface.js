import React, { useState, useEffect, useCallback } from 'react';
import useAudio from '../hooks/useAudio';

const KeyboardInterface = ({ instrument }) => {
  const { playNote, stopNote } = useAudio();
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [isMobile] = useState(() => window.innerWidth < 600);

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
    const onKeyDown = (e) => { if (e.repeat) return; const note = keyMap[e.key.toLowerCase()]; if (note) handleNoteOn(note); };
    const onKeyUp = (e) => { const note = keyMap[e.key.toLowerCase()]; if (note) handleNoteOff(note); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [instrument, handleNoteOn, handleNoteOff]);

  const blackKeyPositions = {
    'C#4': 0.7, 'D#4': 1.7, 'F#4': 3.7, 'G#4': 4.7, 'A#4': 5.7, 'C#5': 7.7
  };

  // Responsive sizes
  const keyW = isMobile ? 36 : 52;
  const keyH = isMobile ? 110 : 160;
  const blackW = isMobile ? 24 : 36;
  const blackH = isMobile ? 68 : 100;
  const gap = isMobile ? 2 : 3;
  const fontSize = isMobile ? 8 : 10;
  const shortcutSize = isMobile ? 9 : 11;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontSize: '0.8rem' }}>
        {isMobile ? 'Tap keys to play' : 'Click keys or use keyboard shortcuts shown below each key'}
      </p>

      {/* Scrollable wrapper for small screens */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
        <div style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
          {/* White keys */}
          <div style={{ display: 'flex', gap: `${gap}px` }}>
            {whiteNotes.map((note) => {
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
                    width: `${keyW}px`,
                    height: `${keyH}px`,
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
                    paddingBottom: '8px',
                    boxShadow: isActive
                      ? `0 0 20px ${instrument.color}60, inset 0 -3px 0 rgba(0,0,0,0.2)`
                      : '0 4px 8px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.1)',
                    transition: 'all 0.05s ease',
                    transform: isActive ? 'translateY(2px)' : 'none',
                    position: 'relative',
                    zIndex: 1,
                    touchAction: 'none',
                  }}
                >
                  <span style={{ fontSize: `${fontSize}px`, color: isActive ? 'white' : '#333', fontWeight: '600' }}>
                    {note.label.replace(/\d/, '')}
                  </span>
                  {!isMobile && (
                    <span style={{
                      fontSize: `${shortcutSize}px`,
                      color: isActive ? 'rgba(255,255,255,0.8)' : '#888',
                      background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                      borderRadius: '3px',
                      padding: '1px 4px',
                      marginTop: '3px',
                    }}>
                      [{note.key.toUpperCase()}]
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Black keys */}
          <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%' }}>
            {blackNotes.map((note) => {
              const pos = blackKeyPositions[note.label] ?? 0;
              const isActive = activeKeys.has(note.label);
              const leftPx = pos * (keyW + gap) + (keyW / 2) - (blackW / 2);
              return (
                <div
                  key={note.label}
                  onMouseDown={(e) => { e.stopPropagation(); handleNoteOn(note); }}
                  onMouseUp={(e) => { e.stopPropagation(); handleNoteOff(note); }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteOn(note); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteOff(note); }}
                  style={{
                    position: 'absolute',
                    left: `${leftPx}px`,
                    top: 0,
                    width: `${blackW}px`,
                    height: `${blackH}px`,
                    background: isActive
                      ? `linear-gradient(180deg, ${instrument.color}, ${instrument.color}cc)`
                      : 'linear-gradient(180deg, #1a1a1a, #000)',
                    border: `1px solid ${isActive ? instrument.color : '#000'}`,
                    borderRadius: '0 0 5px 5px',
                    cursor: 'pointer',
                    pointerEvents: 'all',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: '6px',
                    boxShadow: isActive ? `0 0 15px ${instrument.color}80` : '2px 4px 8px rgba(0,0,0,0.5)',
                    transition: 'all 0.05s ease',
                    transform: isActive ? 'translateY(2px)' : 'none',
                    touchAction: 'none',
                  }}
                >
                  {!isMobile && (
                    <span style={{ fontSize: '9px', color: isActive ? 'white' : '#888' }}>
                      [{note.key.toUpperCase()}]
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isMobile && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '10px' }}>
          ← Scroll sideways for more keys →
        </p>
      )}
    </div>
  );
};

export default KeyboardInterface;