import React, { useState, useEffect, useCallback } from 'react';
import useAudio from '../hooks/useAudio';

const PadsInterface = ({ instrument }) => {
  const { playPercussion } = useAudio();
  const [activePads, setActivePads] = useState(new Set());
  const [hitCounts, setHitCounts] = useState({});

  const handlePadHit = useCallback((note) => {
    setActivePads(prev => new Set([...prev, note.label]));
    setHitCounts(prev => ({ ...prev, [note.label]: (prev[note.label] || 0) + 1 }));
    playPercussion(note.freq, note.type);
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(note.label);
        return next;
      });
    }, 150);
  }, [playPercussion]);

  useEffect(() => {
    const keyMap = {};
    instrument.notes.forEach(note => { keyMap[note.key] = note; });

    const onKeyDown = (e) => {
      if (e.repeat) return;
      const note = keyMap[e.key.toLowerCase()];
      if (note) handlePadHit(note);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [instrument, handlePadHit]);

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '0.85rem' }}>
        Click pads or use keyboard shortcuts
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        {instrument.notes.map((note) => {
          const isActive = activePads.has(note.label);
          const hits = hitCounts[note.label] || 0;

          return (
            <div
              key={note.label}
              onMouseDown={() => handlePadHit(note)}
              onTouchStart={(e) => { e.preventDefault(); handlePadHit(note); }}
              style={{
                aspectRatio: '1',
                background: isActive
                  ? note.color
                  : `${note.color}25`,
                border: `2px solid ${isActive ? note.color : note.color + '60'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.08s ease',
                transform: isActive ? 'scale(0.93)' : 'scale(1)',
                boxShadow: isActive
                  ? `0 0 24px ${note.color}90, inset 0 0 12px rgba(255,255,255,0.2)`
                  : `0 4px 12px rgba(0,0,0,0.4)`,
                userSelect: 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)',
                  animation: 'flash 0.15s ease-out',
                }} />
              )}
              <span style={{
                fontSize: '24px',
                lineHeight: 1,
                filter: isActive ? 'brightness(1.5)' : 'brightness(1)'
              }}>
                {instrument.emoji}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: isActive ? 'white' : note.color,
                letterSpacing: '0.5px'
              }}>
                {note.label}
              </span>
              <span style={{
                fontSize: '10px',
                color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '3px',
                padding: '1px 5px'
              }}>
                [{note.key.toUpperCase()}]
              </span>
              {hits > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '8px',
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  ×{hits}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PadsInterface;
