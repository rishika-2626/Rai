require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes/api");
const { hasApiKey } = require("./src/services/llm");

const app = express();

app.use(cors());
app.use(express.json());

// Health check for uptime monitors / platform probes.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

// JSON 404 for unmatched routes, consistent with the rest of the API.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Rai backend listening on http://localhost:${PORT}`);

  console.log(
    hasApiKey()
      ? "✅ GEMINI_API_KEY detected — using Gemini."
      : "⚠️ No GEMINI_API_KEY set — running on deterministic fallback logic."
  );
});