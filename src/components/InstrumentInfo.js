import React, { useState } from 'react';

const tabs = ['Overview', 'History', 'Technique', 'Musicians'];

const InstrumentInfo = ({ instrument }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabContent = {
    Overview: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Family', value: instrument.family },
            { label: 'Origin', value: instrument.origin },
            { label: 'Period', value: instrument.year },
            { label: 'Range', value: instrument.range },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '12px',
              border: `1px solid ${instrument.color}30`
            }}>
              <div style={{ fontSize: '0.7rem', color: instrument.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>{value}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.9rem' }}>
          {instrument.description}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '0.85rem', marginTop: '12px' }}>
          <strong style={{ color: instrument.color }}>Cultural Significance:</strong> {instrument.culturalSignificance}
        </p>
      </div>
    ),
    History: (
      <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.9rem' }}>
        {instrument.history}
      </p>
    ),
    Technique: (
      <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.9rem' }}>
        {instrument.technique}
      </p>
    ),
    Musicians: (
      <div>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px', fontSize: '0.85rem' }}>
          Notable performers of the {instrument.name}:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {instrument.notableMusicians.map((name) => (
            <div key={name} style={{
              background: `${instrument.color}25`,
              border: `1px solid ${instrument.color}50`,
              borderRadius: '20px',
              padding: '6px 16px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}>
              🎵 {name}
            </div>
          ))}
        </div>
      </div>
    )
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: `1px solid ${instrument.color}30`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: `linear-gradient(135deg, ${instrument.color}30, transparent)`,
        borderBottom: `1px solid ${instrument.color}20`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span style={{ fontSize: '48px' }}>{instrument.emoji}</span>
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: '700' }}>
            {instrument.name}
          </h2>
          <span style={{
            display: 'inline-block',
            background: `${instrument.color}40`,
            color: instrument.color,
            borderRadius: '12px',
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: '600',
            marginTop: '4px'
          }}>
            {instrument.family} Instrument
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === tab ? `${instrument.color}20` : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${instrument.color}` : '2px solid transparent',
              color: activeTab === tab ? instrument.color : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 24px' }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default InstrumentInfo;
