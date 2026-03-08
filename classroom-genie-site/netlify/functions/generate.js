// Complete replacement for netlify/functions/generate.js
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { requestType, prompt, isJson, imageData } = JSON.parse(event.body);
  const apiKey = process.env.GOOGLE_API_KEY; 

  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key is not set.' }) };
  }

  if (requestType === 'image') {
    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    try {
      const response = await fetch(imageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { "sampleCount": 1 } }),
      });
      const responseBody = await response.json();
      return { statusCode: 200, body: JSON.stringify(responseBody) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const parts = [{ text: prompt }];
  if (imageData) {
    parts.push({ inlineData: { mimeType: 'image/png', data: imageData } });
  }

  // UPDATED: Added "tools" for Python Code Execution
  const textPayload = {
    contents: [{ role: 'user', parts: parts }],
    tools: [{ code_execution: {} }], 
    generationConfig: {
      ...(isJson && { responseMimeType: 'application/json' })
    }
  };

  try {
    const response = await fetch(textUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload),
    });
    const responseBody = await response.json();
    if (!response.ok) throw new Error(responseBody.error?.message || 'API Error');
    return { statusCode: 200, body: JSON.stringify(responseBody) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
