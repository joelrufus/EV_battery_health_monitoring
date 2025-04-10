const axios = require("axios");

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "";

async function callGeminiAPI(prompt) {
  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // 🧠 Print full response to debug structure
    console.log("✅ FULL GEMINI RESPONSE:");
    console.dir(response.data, { depth: null });

    // ✅ Try to safely extract content
    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      return "⚠️ Gemini didn't return any candidates.";
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return "⚠️ Gemini returned a candidate, but with no content.";
    }

    return parts[0].text || "⚠️ Gemini returned content with no text.";
  } catch (error) {
    console.error("❌ Gemini API Error:", error.response?.data || error.message);
    return "❌ Gemini failed to respond. Please try again.";
  }
}

module.exports = { callGeminiAPI };
