// The code for our secure backend function
exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt, isJson } = JSON.parse(event.body);
  const apiKey = process.env.GOOGLE_API_KEY; // Get the secret key from Netlify's environment

  if (!apiKey) {
    return { statusCode: 500, body: 'API key is not set.' };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(isJson && { generationConfig: { responseMimeType: 'application/json' } }),
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { statusCode: response.status, body: `API Error: ${errorBody}` };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};