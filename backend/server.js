require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes/api");
const { hasApiKey } = require("./src/services/llm");

const app = express();

// Restrict CORS to the known frontend origin(s). Configure via CORS_ORIGINS
// (comma-separated); defaults to the deployed frontend plus local dev.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "https://rai-orpin.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header) and allow-listed origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
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