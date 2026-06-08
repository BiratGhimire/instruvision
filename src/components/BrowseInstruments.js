import React from 'react';
import { getAllInstruments } from '../utils/identifyInstrument';

const BrowseInstruments = ({ onSelect }) => {
  const allInstruments = getAllInstruments();

  return (
    <div>
      <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>
        Or browse our instrument library directly:
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '12px'
      }}>
        {allInstruments.map((inst) => (
          <button
            key={inst.id}
            onClick={() => onSelect(inst.id)}
            style={{
              background: `${inst.color}15`,
              border: `1px solid ${inst.color}40`,
              borderRadius: '14px',
              padding: '16px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${inst.color}30`;
              e.currentTarget.style.borderColor = inst.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${inst.color}15`;
              e.currentTarget.style.borderColor = `${inst.color}40`;
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: '36px' }}>{inst.emoji}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', textAlign: 'center' }}>{inst.name}</span>
            <span style={{
              fontSize: '0.7rem',
              color: inst.color,
              background: `${inst.color}20`,
              borderRadius: '8px',
              padding: '2px 8px'
            }}>
              {inst.family}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrowseInstruments;
