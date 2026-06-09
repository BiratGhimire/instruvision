import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import InstrumentInfo from './components/InstrumentInfo';
import KeyboardInterface from './components/KeyboardInterface';
import StringsInterface from './components/StringsInterface';
import PadsInterface from './components/PadsInterface';
import BrowseInstruments from './components/BrowseInstruments';
import { fileToBase64, identifyInstrumentWithAI, getInstrumentData } from './utils/identifyInstrument';

const VIEWS = { HOME: 'home', RESULT: 'result' };

// Unlocks audio on mobile browsers (required by iOS/Android)
const unlockAudio = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume();
  } catch (e) {}
};

function App() {
  const [view, setView] = useState(VIEWS.HOME);
  const [instrument, setInstrument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [activePlayTab, setActivePlayTab] = useState('play');

  const handleImageSelected = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await identifyInstrumentWithAI(base64, file.type);
      if (!result.identified || !result.instrumentId) {
        setError('No musical instrument detected. Please try a clearer photo of an instrument.');
        setIsLoading(false);
        return;
      }
      const data = getInstrumentData(result.instrumentId);
      if (!data) {
        setError(`Identified "${result.instrumentName}" but it's not in our library yet.`);
        setIsLoading(false);
        return;
      }
      setInstrument(data);
      setConfidence(Math.round(result.confidence * 100));
      setView(VIEWS.RESULT);
    } catch (err) {
      setError('Failed to analyze image. Please check your connection and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBrowseSelect = useCallback((id) => {
    const data = getInstrumentData(id);
    if (data) {
      setInstrument(data);
      setConfidence(null);
      setView(VIEWS.RESULT);
      setError(null);
    }
  }, []);

  const handleBack = () => {
    setView(VIEWS.HOME);
    setInstrument(null);
    setError(null);
    setConfidence(null);
  };

  const renderInterface = () => {
    if (!instrument) return null;
    switch (instrument.interfaceType) {
      case 'keyboard': return <KeyboardInterface instrument={instrument} />;
      case 'strings': return <StringsInterface instrument={instrument} />;
      case 'pads': return <PadsInterface instrument={instrument} />;
      default: return <KeyboardInterface instrument={instrument} />;
    }
  };

  return (
    <div
      onClick={unlockAudio}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #1a0a2e 100%)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: 'white',
        overflowX: 'hidden',
      }}
    >
      {/* Animated background blobs — hidden on mobile for performance */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${['#7C6BF8','#A855F7','#6366F1','#8B5CF6','#7C3AED','#4F46E5'][i]}20, transparent)`,
            width: `${[400,300,500,250,350,300][i]}px`,
            height: `${[400,300,500,250,350,300][i]}px`,
            top: `${[10,60,30,80,20,70][i]}%`,
            left: `${[5,70,40,10,80,50][i]}%`,
            transform: 'translate(-50%, -50%)',
            animation: `float ${[8,10,12,9,11,7][i]}s ease-in-out infinite alternate`
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <header style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(0,0,0,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={view === VIEWS.RESULT ? handleBack : undefined}
          >
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: 'linear-gradient(135deg, #7C6BF8, #A855F7)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>🎵</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                InstruVision
              </h1>
              <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI Instrument Explorer
              </p>
            </div>
          </div>

          {view === VIEWS.RESULT && (
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}>
              ← Back
            </button>
          )}
        </header>

        {/* ── Main ── */}
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>

          {/* ═══════════ HOME VIEW ═══════════ */}
          {view === VIEWS.HOME && (
            <div>
              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: 'clamp(1.6rem, 6vw, 3.5rem)',
                  fontWeight: '900',
                  margin: '0 0 12px',
                  background: 'linear-gradient(135deg, #fff 0%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}>
                  Identify Any Instrument
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.85rem, 3vw, 1.05rem)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Upload a photo of any musical instrument and instantly explore its sounds, history, and interactive player.
                </p>
              </div>

              {/* Upload card */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                padding: '24px 16px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '24px',
              }}>
                <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} />
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginTop: '16px',
                    color: '#FCA5A5',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                  }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Browse section */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <BrowseInstruments onSelect={handleBrowseSelect} />
              </div>

              {/* Features strip — stacks to 1 col on mobile */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginTop: '24px',
              }}>
                {[
                  { icon: '🤖', title: 'AI Recognition', desc: 'Gemini AI identifies instruments from your photos instantly' },
                  { icon: '📚', title: 'Rich Knowledge', desc: 'History, technique, culture, and notable musicians' },
                  { icon: '🎹', title: 'Play in Browser', desc: 'Interactive instrument interfaces with real audio synthesis' },
                ].map(f => (
                  <div key={f.title} style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{f.icon}</div>
                    <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.9rem' }}>{f.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ RESULT VIEW ═══════════ */}
          {view === VIEWS.RESULT && instrument && (
            <div>
              {/* AI confidence badge */}
              {confidence && (
                <div style={{
                  background: 'rgba(124,107,248,0.15)',
                  border: '1px solid rgba(124,107,248,0.3)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                    AI identified this as a <strong style={{ color: 'white' }}>{instrument.name}</strong> with{' '}
                    <strong style={{ color: '#A855F7' }}>{confidence}% confidence</strong>
                  </span>
                </div>
              )}

              {/* Info + Stats — stacks on mobile */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}>
                <InstrumentInfo instrument={instrument} />

                {/* Quick stats */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  border: `1px solid ${instrument.color}30`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <h3 style={{ margin: '0 0 4px', color: instrument.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Quick Stats
                  </h3>
                  {[
                    { label: '🎼 Family', value: instrument.family },
                    { label: '🌍 Origin', value: instrument.origin },
                    { label: '📅 Period', value: instrument.year },
                    { label: '🎵 Range', value: instrument.range },
                    { label: '🎹 Interface', value: `${instrument.interfaceType} (${instrument.notes.length} notes)` },
                    { label: '🔊 Sound type', value: instrument.waveform },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '4px',
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ fontWeight: '600' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Player */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                border: `1px solid ${instrument.color}30`,
                overflow: 'hidden',
              }}>
                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  {['play', 'info'].map(tab => (
                    <button key={tab} onClick={() => setActivePlayTab(tab)} style={{
                      flex: 1,
                      padding: '12px 8px',
                      background: activePlayTab === tab ? `${instrument.color}20` : 'transparent',
                      border: 'none',
                      borderBottom: activePlayTab === tab ? `2px solid ${instrument.color}` : '2px solid transparent',
                      color: activePlayTab === tab ? instrument.color : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {tab === 'play' ? '🎵 Play' : '📖 How to Play'}
                    </button>
                  ))}
                </div>

                {/* Tab content — scrollable on mobile */}
                <div style={{ padding: '20px 16px', overflowX: 'auto' }}>
                  {activePlayTab === 'play' && renderInterface()}
                  {activePlayTab === 'info' && (
                    <div style={{ maxWidth: '600px' }}>
                      <h3 style={{ color: instrument.color, marginTop: 0, fontSize: '1rem' }}>
                        Playing the {instrument.name}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                        {instrument.technique}
                      </p>
                      <div style={{
                        background: `${instrument.color}15`,
                        border: `1px solid ${instrument.color}40`,
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginTop: '16px',
                      }}>
                        <strong style={{ color: instrument.color, fontSize: '0.9rem' }}>In this app:</strong>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: '0.85rem' }}>
                          <li>Tap any note / pad / string with your finger</li>
                          <li>On desktop, use the keyboard shortcuts shown in [ ]</li>
                          <li>Hold notes down for sustained sound</li>
                          <li>Try combining multiple notes!</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '24px 16px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: '40px',
        }}>
          InstruVision — Nepal College of Information Technology, Pokhara University · 2026
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        @keyframes float {
          0%   { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.15) rotate(5deg); }
        }
        /* Make instrument player area horizontally scrollable on small screens */
        .instrument-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        /* Prevent text from overflowing on very small phones */
        h1, h2, h3, p { word-break: break-word; }
      `}</style>
    </div>
  );
}

export default App;