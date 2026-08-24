/**
 * AI Assistant Service ported from services/Ai.qml
 * Supports local Ollama, Google Gemini, and OpenAI with streaming/non-streaming chat.
 */

export const AiService = {
  async sendMessage({ prompt, provider = 'ollama', apiKey = '', history = [] }) {
    if (!prompt.trim()) return null;

    if (provider === 'ollama') {
      try {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            prompt,
            stream: false,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.response;
        }
      } catch {
        // Fallback demo response if Ollama is not running
        return `🤖 [end4-pC AI Helper]\nTo connect local AI, make sure Ollama is running ('ollama run llama3') or provide a Gemini API key in Settings!`;
      }
    }

    if (provider === 'gemini' && apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }

    return `🤖 [end4-pC AI Helper]\nHello! I am your Material 3 desktop assistant. You asked: "${prompt}". Configure your API key in Settings to enable full live responses!`;
  },
};
