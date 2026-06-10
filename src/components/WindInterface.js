import React, { useState, useEffect, useCallback } from 'react';
import useAudio from '../hooks/useAudio';

const WindInterface = ({ instrument }) => {
  const { playNote, stopNote } = useAudio();
  const [activeNotes, setActiveNotes] = useState(new Set());
  const isMobile = window.innerWidth < 768;

  const handleNoteOn = useCallback((note) => {
    setActiveNotes(prev => new Set([...prev, note.label]));
    playNote(note.freq, instrument.waveform, instrument.envelope, note.label, instrument.name);
  }, [playNote, instrument]);

  const handleNoteOff = useCallback((note) => {
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note.label);
      return next;
    });
    stopNote(note.label, instrument.envelope?.release || 0.3);
  }, [stopNote, instrument]);

  useEffect(() => {
    const keyMap = {};
    instrument.notes.forEach(note => { keyMap[note.key] = note; });
    const onDown = (e) => {
      if (e.repeat) return;
      const n = keyMap[e.key.toLowerCase()];
      if (n) handleNoteOn(n);
    };
    const onUp = (e) => {
      const n = keyMap[e.key.toLowerCase()];
      if (n) handleNoteOff(n);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [instrument, handleNoteOn, handleNoteOff]);

  const whiteNotes = instrument.notes.filter(n => n.color === 'white');
  const blackNotes = instrument.notes.filter(n => n.color === 'black');
  const holeSize = isMobile ? 52 : 64;
  const smallHoleSize = isMobile ? 40 : 50;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontSize: '0.78rem' }}>
        {isMobile ? '👆 Tap tone holes to play' : '🖱 Click holes or use keyboard shortcuts'}
      </p>

      {/* Instrument emoji */}
      <div style={{ fontSize: '56px', marginBottom: '20px' }}>{instrument.emoji}</div>

      {/* Main tone holes */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          color: instrument.color,
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '0 0 12px'
        }}>
          Main Tone Holes
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '8px' : '12px',
          flexWrap: 'wrap'
        }}>
          {whiteNotes.map((note) => {
            const isActive = activeNotes.has(note.label);
            return (
              <div
                key={note.label}
                onMouseDown={() => handleNoteOn(note)}
                onMouseUp={() => handleNoteOff(note)}
                onMouseLeave={() => isActive && handleNoteOff(note)}
                onTouchStart={(e) => { e.preventDefault(); handleNoteOn(note); }}
                onTouchEnd={(e) => { e.preventDefault(); handleNoteOff(note); }}
                style={{
                  width: `${holeSize}px`,
                  height: `${holeSize}px`,
                  borderRadius: '50%',
                  background: isActive
                    ? `radial-gradient(circle at 35% 35%, ${instrument.color}ee, ${instrument.color})`
                    : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), rgba(0,0,0,0.75))',
                  border: `3px solid ${isActive ? instrument.color : 'rgba(255,255,255,0.2)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  boxShadow: isActive
                    ? `0 0 22px ${instrument.color}, inset 0 2px 4px rgba(255,255,255,0.2)`
                    : 'inset 0 3px 10px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.4)',
                  transform: isActive ? 'scale(0.91)' : 'scale(1)',
                  transition: 'all 0.06s ease',
                  touchAction: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                }}
              >
                <span style={{
                  fontSize: `${holeSize * 0.18}px`,
                  fontWeight: '800',
                  color: isActive ? 'white' : instrument.color
                }}>
                  {note.label.replace(/\d/, '')}
                </span>
                {!isMobile && (
                  <span style={{
                    fontSize: '9px',
                    color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'
                  }}>
                    {note.key.toUpperCase()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Half-tone holes */}
      {blackNotes.length > 0 && (
        <div>
          <p style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '0 0 10px'
          }}>
            Half-Tone Keys
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '7px' : '10px',
            flexWrap: 'wrap'
          }}>
            {blackNotes.map((note) => {
              const isActive = activeNotes.has(note.label);
              return (
                <div
                  key={note.label}
                  onMouseDown={() => handleNoteOn(note)}
                  onMouseUp={() => handleNoteOff(note)}
                  onMouseLeave={() => isActive && handleNoteOff(note)}
                  onTouchStart={(e) => { e.preventDefault(); handleNoteOn(note); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleNoteOff(note); }}
                  style={{
                    width: `${smallHoleSize}px`,
                    height: `${smallHoleSize}px`,
                    borderRadius: '50%',
                    background: isActive
                      ? instrument.color
                      : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.85))',
                    border: `2px solid ${isActive ? instrument.color : 'rgba(255,255,255,0.15)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    boxShadow: isActive
                      ? `0 0 16px ${instrument.color}`
                      : 'inset 0 2px 8px rgba(0,0,0,0.95)',
                    transform: isActive ? 'scale(0.91)' : 'scale(1)',
                    transition: 'all 0.06s ease',
                    touchAction: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                  }}
                >
                  <span style={{
                    fontSize: `${smallHoleSize * 0.18}px`,
                    fontWeight: '700',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)'
                  }}>
                    {note.label.replace(/\d/, '')}
                  </span>
                  {!isMobile && (
                    <span style={{
                      fontSize: '8px',
                      color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'
                    }}>
                      {note.key.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WindInterface;