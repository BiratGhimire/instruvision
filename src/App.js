import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import InstrumentInfo from './components/InstrumentInfo';
import KeyboardInterface from './components/KeyboardInterface';
import StringsInterface from './components/StringsInterface';
import PadsInterface from './components/PadsInterface';
import WindInterface from './components/WindInterface';
import BrowseInstruments from './components/BrowseInstruments';
import { fileToBase64, identifyInstrumentWithAI, getInstrumentData } from './utils/identifyInstrument';

const VIEWS = { HOME: 'home', RESULT: 'result' };

// Instruments that use the wind (tone-hole) interface
const WIND_INSTRUMENTS = ['flute', 'trumpet', 'saxophone'];

// Unlock audio on iOS/Android — must be called from a user gesture
const unlockAudio = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.resume();
  } catch (_) {}
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
        setError('No musical instrument detected. Try a clearer, well-lit photo of a single instrument.');
        setIsLoading(false);
        return;
      }
      const data = getInstrumentData(result.instrumentId);
      if (!data) {
        setError(`Identified "${result.instrumentName}" but it is not in our library yet.`);
        setIsLoading(false);
        return;
      }
      setInstrument(data);
      setConfidence(Math.round(result.confidence * 100));
      setView(VIEWS.RESULT);
      setActivePlayTab('play');
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please check your connection and try again.');
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
      setActivePlayTab('play');
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
  const id = instrument.id || '';
  
  if (id === 'flute' || id === 'trumpet' || id === 'saxophone') {
    return <WindInterface instrument={instrument} />;
  }
  if (id === 'guitar' || id === 'violin' || id === 'sitar' || id === 'harp') {
    return <StringsInterface instrument={instrument} />;
  }
  if (id === 'drums' || id === 'tabla') {
    return <PadsInterface instrument={instrument} />;
  }
  if (id === 'piano') {
    return <KeyboardInterface instrument={instrument} />;
  }
  // fallback based on interfaceType
  switch (instrument.interfaceType) {
    case 'strings': return <StringsInterface instrument={instrument} />;
    case 'pads':    return <PadsInterface instrument={instrument} />;
    default:        return <KeyboardInterface instrument={instrument} />;
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
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            background: `radial-gradient(circle, ${['#7C6BF8','#A855F7','#6366F1','#8B5CF6'][i]}18, transparent)`,
            width: `${[400,300,500,250][i]}px`, height: `${[400,300,500,250][i]}px`,
            top: `${[10,60,30,80][i]}%`, left: `${[5,70,40,10][i]}%`,
            transform: 'translate(-50%,-50%)',
            animation: `float ${[8,10,12,9][i]}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(0,0,0,0.25)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: view === VIEWS.RESULT ? 'pointer' : 'default' }}
            onClick={view === VIEWS.RESULT ? handleBack : undefined}
          >
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: 'linear-gradient(135deg, #7C6BF8, #A855F7)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>🎵</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.3px' }}>InstruVision</h1>
              <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI Instrument Explorer
              </p>
            </div>
          </div>
          {view === VIEWS.RESULT && (
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '7px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
            }}>← Back</button>
          )}
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 14px' }}>

          {/* ═══ HOME ═══ */}
          {view === VIEWS.HOME && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 6vw, 3.2rem)', fontWeight: '900', margin: '0 0 10px',
                  background: 'linear-gradient(135deg, #fff 0%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2,
                }}>Identify Any Instrument</h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(0.82rem, 3vw, 1rem)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Upload a photo of any musical instrument and instantly explore its sounds, history, and interactive player.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '18px', padding: '22px 14px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} />
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '11px 14px', marginTop: '14px', color: '#FCA5A5', fontSize: '0.85rem', textAlign: 'center' }}>
                    ⚠️ {error}
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '18px', padding: '18px 14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '20px' }}>
                <BrowseInstruments onSelect={handleBrowseSelect} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {[
                  { icon: '🤖', title: 'AI Recognition', desc: 'Gemini AI identifies instruments from your photos' },
                  { icon: '📚', title: 'Rich Knowledge', desc: 'History, technique, culture & notable musicians' },
                  { icon: '🎵', title: 'Play in Browser', desc: 'Interactive interfaces with real audio synthesis' },
                ].map(f => (
                  <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
                    <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.85rem' }}>{f.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ RESULT ═══ */}
          {view === VIEWS.RESULT && instrument && (
            <div>
              {confidence && (
                <div style={{ background: 'rgba(124,107,248,0.15)', border: '1px solid rgba(124,107,248,0.3)', borderRadius: '11px', padding: '9px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <span style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.8)' }}>
                    AI identified this as a <strong style={{ color: 'white' }}>{instrument.name}</strong> with <strong style={{ color: '#A855F7' }}>{confidence}% confidence</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <InstrumentInfo instrument={instrument} />
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', border: `1px solid ${instrument.color}30`, padding: '14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <h3 style={{ margin: '0 0 4px', color: instrument.color, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Stats</h3>
                  {[
                    { label: '🎼 Family', value: instrument.family },
                    { label: '🌍 Origin', value: instrument.origin },
                    { label: '📅 Period', value: instrument.year },
                    { label: '🎵 Range', value: instrument.range },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '7px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                      <span style={{ fontWeight: '600' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: `1px solid ${instrument.color}30`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  {['play', 'info'].map(tab => (
                    <button key={tab} onClick={() => setActivePlayTab(tab)} style={{
                      flex: 1, padding: '11px 8px',
                      background: activePlayTab === tab ? `${instrument.color}20` : 'transparent',
                      border: 'none',
                      borderBottom: activePlayTab === tab ? `2px solid ${instrument.color}` : '2px solid transparent',
                      color: activePlayTab === tab ? instrument.color : 'rgba(255,255,255,0.38)',
                      cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {tab === 'play' ? '🎵 Play' : '📖 How to Play'}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '18px 14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {activePlayTab === 'play' && renderInterface()}
                  {activePlayTab === 'info' && (
                    <div style={{ maxWidth: '560px' }}>
                      <h3 style={{ color: instrument.color, marginTop: 0, fontSize: '0.95rem' }}>Playing the {instrument.name}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, fontSize: '0.87rem' }}>{instrument.technique}</p>
                      <div style={{ background: `${instrument.color}15`, border: `1px solid ${instrument.color}40`, borderRadius: '10px', padding: '13px 15px', marginTop: '14px' }}>
                        <strong style={{ color: instrument.color, fontSize: '0.87rem' }}>In this app:</strong>
                        <ul style={{ margin: '7px 0 0', paddingLeft: '17px', color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, fontSize: '0.82rem' }}>
                          <li>Tap any note / pad / string / hole with your finger</li>
                          <li>On desktop, use keyboard shortcuts shown</li>
                          {instrument.interfaceType === 'strings' && <li>Use "Strum Down / Strum Up" buttons or drag across strings</li>}
                          <li>Hold notes for sustained sound</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ textAlign: 'center', padding: '22px 14px', color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '36px' }}>
          InstruVision — Nepal College of Information Technology, Pokhara University · 2026
        </footer>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; -webkit-tap-highlight-color: transparent; }
        @keyframes float {
          0%   { transform: translate(-50%,-50%) scale(1); }
          100% { transform: translate(-50%,-50%) scale(1.12) rotate(4deg); }
        }
      `}</style>
    </div>
  );
}

export default App;