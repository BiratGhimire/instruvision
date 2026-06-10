import * as tf from '@tensorflow/tfjs';
import { instruments, instrumentKeywords } from '../data/instruments';

let model = null;
let appMapping = null;
let modelLoading = false;

const loadModel = async () => {
  if (model) return model;
  if (modelLoading) return null;
  modelLoading = true;
  try {
    console.log('Loading instrument recognition model...');
    model = await tf.loadGraphModel('/tfjs_model/model.json');
    const response = await fetch('/tfjs_model/app_mapping.json');
    appMapping = await response.json();
    console.log('✅ Model loaded!');
    return model;
  } catch (e) {
    console.warn('⚠️ Graph model failed, trying layers model...', e.message);
    try {
      model = await tf.loadLayersModel('/tfjs_model/model.json');
      const response = await fetch('/tfjs_model/app_mapping.json');
      appMapping = await response.json();
      console.log('✅ Layers model loaded!');
      return model;
    } catch (e2) {
      console.warn('⚠️ Both model formats failed:', e2.message);
      modelLoading = false;
      return null;
    }
  }
};

// Start loading immediately
loadModel();

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const identifyByKeywords = (text) => {
  const lower = text.toLowerCase();
  for (const [id, keywords] of Object.entries(instrumentKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return id;
  }
  return null;
};

const runModelInference = async (base64Image) => {
  const m = await loadModel();
  if (!m || !appMapping) {
    throw new Error('Model not loaded yet. Please wait a moment and try again.');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const tensor = tf.tidy(() => {
          return tf.browser.fromPixels(img)
            .resizeBilinear([224, 224])
            .toFloat()
            // Raw 0-255 values — no normalization needed
            .expandDims(0);
        });

        // Handle both graph and layers model output formats
        let predictions;
        try {
          const output = model.predict(tensor);
          if (Array.isArray(output)) {
            predictions = await output[0].data();
          } else {
            predictions = await output.data();
          }
        } catch(e) {
          // Try execute for graph models
          const outputTensor = model.execute(tensor);
          if (Array.isArray(outputTensor)) {
            predictions = await outputTensor[0].data();
          } else {
            predictions = await outputTensor.data();
          }
        }
        tensor.dispose();

        // Log ALL predictions for debugging
        const allResults = Array.from(predictions)
          .map((confidence, idx) => ({
            idx: String(idx),
            confidence,
            appId: appMapping[String(idx)]
          }))
          .sort((a, b) => b.confidence - a.confidence);

        console.log('Top 5 raw predictions:');
        allResults.slice(0, 5).forEach(r => {
          console.log(`  [${r.idx}] appId=${r.appId} confidence=${(r.confidence*100).toFixed(1)}%`);
        });

        // Get best prediction that maps to our app
        const mappedResults = allResults.filter(r => r.appId !== null && r.appId !== undefined);

        if (mappedResults.length === 0) {
          resolve({ instrumentId: null, confidence: 0 });
          return;
        }

        const top = mappedResults[0];
        console.log(`Best mapped result: ${top.appId} (${(top.confidence*100).toFixed(1)}%)`);

        // Lower threshold to 0.1 to catch more instruments
        if (top.confidence > 0.1) {
          resolve({ instrumentId: top.appId, confidence: top.confidence });
        } else {
          resolve({ instrumentId: null, confidence: top.confidence });
        }

      } catch (e) {
        console.error('Inference error:', e);
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = `data:image/jpeg;base64,${base64Image}`;
  });
};

export const identifyInstrumentWithAI = async (base64Image, mediaType = 'image/jpeg', fileName = '') => {
  // Step 1: filename keyword matching
  if (fileName) {
    const fromName = identifyByKeywords(fileName);
    if (fromName) {
      return {
        identified: true,
        instrumentId: fromName,
        instrumentName: instruments[fromName]?.name,
        confidence: 0.90,
        description: 'Identified from filename',
      };
    }
  }

  // Step 2: Run model
  try {
    const result = await runModelInference(base64Image);

    if (result.instrumentId) {
      return {
        identified: true,
        instrumentId: result.instrumentId,
        instrumentName: instruments[result.instrumentId]?.name,
        confidence: Math.min(0.99, result.confidence),
        description: `Identified by EfficientNetB3 CNN model`,
      };
    }

    return {
      identified: false,
      instrumentId: null,
      instrumentName: null,
      confidence: 0,
      description: `Could not identify the instrument. Try a clearer photo or use Browse below.`,
    };

  } catch (e) {
    throw new Error(e.message || 'Recognition failed. Try again.');
  }
};

export const getInstrumentData = (id) => {
  const data = instruments[id];
  if (!data) return null;
  return { ...data, id };
};

export const getAllInstruments = () =>
  Object.entries(instruments).map(([id, data]) => ({ id, ...data }));