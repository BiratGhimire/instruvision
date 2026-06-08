import React, { useState, useRef } from 'react';

const ImageUploader = ({ onImageSelected, isLoading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  return (
    <div style={{ textAlign: 'center' }}>
      {preview ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            position: 'relative',
            display: 'inline-block',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '300px', maxHeight: '300px', display: 'block', objectFit: 'cover' }}
            />
            {isLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(255,255,255,0.2)',
                  borderTop: '3px solid #7C6BF8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ color: 'white', fontSize: '0.85rem' }}>Analyzing image...</span>
              </div>
            )}
          </div>
          {!isLoading && (
            <button
              onClick={() => { setPreview(null); }}
              style={{
                display: 'block',
                margin: '12px auto 0',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              ↩ Try Another Image
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${dragOver ? '#7C6BF8' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '20px',
              padding: '48px 32px',
              cursor: 'pointer',
              background: dragOver ? 'rgba(124,107,248,0.1)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s ease',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
            <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: '0 0 8px' }}>
              Drop an instrument photo here
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
              or click to browse files
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #7C6BF8, #A855F7)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📁 Upload Photo
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📷 Take Photo
            </button>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;
