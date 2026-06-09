import { instruments, instrumentKeywords } from '../data/instruments';

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ⚠️ PASTE YOUR GEMINI API KEY HERE
// Get it FREE from: https://aistudio.google.com → Get API Key → Create API Key
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_KEY || '';

export const identifyInstrumentWithAI = async (base64Image, mediaType = 'image/jpeg') => {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key in src/utils/identifyInstrument.js');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64Image } },
            {
              text: `You are a musical instrument recognition expert. Identify the musical instrument in this image.

Respond ONLY with valid JSON — no markdown, no backticks, nothing else before or after:
{"identified":true,"instrumentId":"piano","instrumentName":"Piano","confidence":0.95,"description":"A grand piano"}

instrumentId MUST be exactly one of: piano, guitar, drums, violin, flute, trumpet, tabla, saxophone, sitar, harp

If no instrument visible: {"identified":false,"instrumentId":null,"instrumentName":null,"confidence":0,"description":"No instrument"}`
            }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 150 }
      })
    });
  } catch (netErr) {
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (!response.ok) {
    let msg = `API error ${response.status}`;
    try { const e = await response.json(); msg = e.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not understand AI response. Try a clearer photo.');

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('Could not parse AI response. Please try again.');
  }
};

export const identifyByKeywords = (text) => {
  const lower = text.toLowerCase();
  for (const [id, keywords] of Object.entries(instrumentKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return id;
  }
  return null;
};

// Attach id to the instrument object so components can check it
export const getInstrumentData = (id) => {
  const data = instruments[id];
  if (!data) return null;
  return { ...data, id };
};

export const getAllInstruments = () =>
  Object.entries(instruments).map(([id, data]) => ({ id, ...data }));