const express = require("express");
const router = express.Router();
const Vehicle = require("../../backend/models/Vehicle");
const Session = require("../../backend/models/Session");
const { callGeminiAPI } = require("./geminiService");
const protect = require("../../backend/middleware/authMiddleware");

// ==============================
// GET /api/chatbot/vehicles
// ==============================
router.get("/vehicles", protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id }).sort({ createdAt: -1 });

    const vehicleOptions = vehicles.map((v) => ({
      id: v._id,
      model: v.vehicleModel
    }));

    res.json(vehicleOptions);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: "Failed to fetch vehicles." });
  }
});

// ==============================
// POST /api/chatbot/ask
// ==============================
router.post("/ask", protect, async (req, res) => {
  try {
    const { question, vehicleId } = req.body;
    console.log("📥 Received chatbot request:");
    console.log("Question:", question);
    console.log("Vehicle ID:", vehicleId);

    if (!question || question.trim() === "") {
      return res.status(400).json({ answer: "❌ Question cannot be empty." });
    }

    // ========================
    // GENERAL QUESTION
    // ========================
    if (!vehicleId) {
      const generalPrompt = `You are a helpful EV assistant. Answer this user question: "${question}" in simple and clear bullet points if needed.`;
      console.log("🧠 Calling Gemini with general prompt...");
      const generalAnswer = await callGeminiAPI(generalPrompt);
      console.log("✅ Gemini general response:", generalAnswer);
      return res.json({ answer: generalAnswer });
    }

    // ========================
    // PERSONALIZED QUESTION
    // ========================
    console.log("🔍 Fetching vehicle from DB...");
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user.id });
    if (!vehicle) {
      return res.status(403).json({ answer: "❌ Vehicle not found or not owned by user." });
    }

    console.log("📊 Fetching sessions...");
    const sessions = await Session.find({ vehicleId }).sort({ sessionDate: -1 }).limit(5);

    if (!sessions.length) {
      const fallbackPrompt = `The user asked: "${question}" but no usage data is available. The vehicle is a ${vehicle.vehicleModel} (${vehicle.batteryCapacity} kWh). Provide smart battery care tips.`;
      const fallbackAnswer = await callGeminiAPI(fallbackPrompt);
      return res.json({ answer: fallbackAnswer });
    }

    // Average calculations
    const total = sessions.length;
    const avgEndSoC = sessions.reduce((sum, s) => sum + (s.endSoC || 0), 0) / total;
    const avgTemp = sessions.reduce((sum, s) => sum + (s.temperature || 0), 0) / total;
    const fastCount = sessions.filter((s) => s.chargerType === "fast").length;
    const avgDistance = sessions.reduce((sum, s) => sum + (s.distanceDriven || 0), 0) / total;
    const avgChargeRate = sessions.reduce((sum, s) => sum + (s.chargingRate || 0), 0) / total;
    const usageType = vehicle.userType || "Not specified";

    const context = `
Vehicle Model: ${vehicle.vehicleModel}
Battery Capacity: ${vehicle.batteryCapacity} kWh
Usage Type: ${usageType}
Sessions Analyzed: ${total}
Average End SoC: ${avgEndSoC.toFixed(2)}%
Average Temperature: ${avgTemp.toFixed(2)} °C
Fast-Charging Sessions: ${fastCount}
Average Distance Driven: ${avgDistance.toFixed(2)} km
Average Charging Rate: ${avgChargeRate.toFixed(2)} kW
    `;

    const personalPrompt = `
You are a smart EV assistant. The user owns a vehicle with the following stats:

${context}

The user asked: "${question}"

Provide personalized insights and recommendations to extend battery life, optimize charging habits, and suggest improvements. Be concise and helpful. Use bullet points if needed.
    `;

    console.log("🤖 Calling Gemini with personalized prompt...");
    const personalizedAnswer = await callGeminiAPI(personalPrompt);
    console.log("✅ Gemini personalized response:", personalizedAnswer);
    res.json({ answer: personalizedAnswer });

  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ answer: "❌ Something went wrong in the chatbot." });
  }
});

module.exports = router;
