import { instruments, instrumentKeywords } from '../data/instruments';

// Convert image file to base64 string
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Local keyword-based identification fallback
export const identifyByKeywords = (text) => {
  const lower = text.toLowerCase();
  for (const [id, keywords] of Object.entries(instrumentKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return id;
    }
  }
  return null;
};

// Identify instrument using Claude API (vision)
export const identifyInstrumentWithAI = async (base64Image, mediaType = 'image/jpeg') => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            {
              type: 'text',
              text: `You are a musical instrument recognition expert. Look at this image and identify the musical instrument shown.

Respond ONLY with a JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "identified": true,
  "instrumentId": "piano",
  "instrumentName": "Piano",
  "confidence": 0.95,
  "description": "Brief one-sentence description of what you see"
}

The instrumentId MUST be one of these exact values: piano, guitar, drums, violin, flute, trumpet, tabla, saxophone, sitar, harp

If no musical instrument is visible, respond with:
{"identified": false, "instrumentId": null, "instrumentName": null, "confidence": 0, "description": "No musical instrument detected"}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content.map(b => b.text || '').join('');

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error('Could not parse AI response');
  }
};

// Get instrument data by ID
export const getInstrumentData = (id) => {
  return instruments[id] || null;
};

// Get all instruments list
export const getAllInstruments = () => {
  return Object.entries(instruments).map(([id, data]) => ({ id, ...data }));
};
