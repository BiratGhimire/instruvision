import React, { useState, useEffect, useCallback } from 'react';
import useAudio from '../hooks/useAudio';

const StringsInterface = ({ instrument }) => {
  const { playNote, stopNote } = useAudio();
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [ripples, setRipples] = useState({});

  const handleNoteOn = useCallback((note) => {
    setActiveNotes(prev => new Set([...prev, note.label]));
    setRipples(prev => ({ ...prev, [note.label]: Date.now() }));
    playNote(note.freq, instrument.waveform, instrument.envelope, note.label);
    setTimeout(() => {
      setRipples(prev => {
        const next = { ...prev };
        delete next[note.label];
        return next;
      });
    }, 600);
  }, [playNote, instrument]);

  const handleNoteOff = useCallback((note) => {
    setActiveNotes(prev => {
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

  const strings = [...new Set(instrument.notes.map(n => n.string))].sort((a, b) => b - a);

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '0.85rem' }}>
        Click strings or use keyboard shortcuts
      </p>

      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '16px',
        padding: '24px 32px',
        display: 'inline-block',
        minWidth: '500px',
        border: `1px solid ${instrument.color}30`
      }}>
        {strings.map((strNum) => {
          const stringNotes = instrument.notes.filter(n => n.string === strNum);

          return (
            <div key={strNum} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', width: '20px' }}>
                {strNum}
              </span>

              {/* String line */}
              <div style={{
                flex: 1,
                height: '2px',
                background: `linear-gradient(90deg, ${instrument.color}40, ${instrument.color}, ${instrument.color}40)`,
                position: 'relative'
              }} />

              {/* Notes on this string */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {stringNotes.map((note) => {
                  const isActive = activeNotes.has(note.label);
                  const hasRipple = !!ripples[note.label];
                  return (
                    <div key={note.label} style={{ position: 'relative' }}>
                      {hasRipple && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: `2px solid ${instrument.color}`,
                          animation: 'ripple 0.6s ease-out forwards',
                          pointerEvents: 'none',
                          zIndex: 10
                        }} />
                      )}
                      <div
                        onMouseDown={() => handleNoteOn(note)}
                        onMouseUp={() => handleNoteOff(note)}
                        onMouseLeave={() => isActive && handleNoteOff(note)}
                        onTouchStart={(e) => { e.preventDefault(); handleNoteOn(note); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleNoteOff(note); }}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: isActive
                            ? `radial-gradient(circle, ${instrument.color}, ${instrument.color}cc)`
                            : `radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
                          border: `2px solid ${isActive ? instrument.color : instrument.color + '60'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.1s ease',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: isActive ? `0 0 20px ${instrument.color}80` : 'none',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: '700', color: isActive ? 'white' : instrument.color }}>
                          {note.label}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '3px',
                          padding: '0 3px'
                        }}>
                          [{note.key.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StringsInterface;
