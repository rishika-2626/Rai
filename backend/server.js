require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes/api");
const { hasApiKey } = require("./src/services/llm");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Rai backend listening on http://localhost:${PORT}`);

  console.log(
    hasApiKey()
      ? "✅ GEMINI_API_KEY detected — using Gemini."
      : "⚠️ No GEMINI_API_KEY set — running on deterministic fallback logic."
  );
});