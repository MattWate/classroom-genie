// The code for our secure backend function
// This version includes enhanced error logging to pinpoint API issues.

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { requestType, prompt, isJson } = JSON.parse(event.body);
  const apiKey = process.env.GOOGLE_API_KEY; 

  if (!apiKey) {
    console.error("CRITICAL: GOOGLE_API_KEY environment variable is not set.");
    return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
  }

  // --- Handle Image Generation Request ---
  if (requestType === 'image') {
    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const imagePayload = {
      instances: [{ prompt: prompt }],
      parameters: { "sampleCount": 1 }
    };

    try {
      const response = await fetch(imageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imagePayload),
      });
      const responseBody = await response.json();
      if (!response.ok) {
        // Log the detailed error from Google's API
        console.error("Image Generation API Error:", JSON.stringify(responseBody, null, 2));
        throw new Error(`Image API request failed: ${responseBody.error?.message || 'Unknown error'}`);
      }
      return { statusCode: 200, body: JSON.stringify(responseBody) };
    } catch (error) {
      console.error("Caught Image Generation Exception:", error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  // --- Handle Text Generation Request (Default) ---
  const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const textPayload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(isJson && { generationConfig: { responseMimeType: 'application/json' } }),
  };

  try {
    const response = await fetch(textUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload),
    });
    const responseBody = await response.json();
    if (!response.ok) {
        // Log the detailed error from Google's API
        console.error("Text Generation API Error:", JSON.stringify(responseBody, null, 2));
        throw new Error(`Text API request failed: ${responseBody.error?.message || 'Unknown error'}`);
    }
    return { statusCode: 200, body: JSON.stringify(responseBody) };
  } catch (error) {
    console.error("Caught Text Generation Exception:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
