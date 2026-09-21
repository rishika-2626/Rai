require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const apiRoutes = require("./src/routes/api");
const { hasApiKey } = require("./src/services/llm");

const app = express();

// Rate-limit the API so the server-side Gemini key can't be drained by an
// open proxy. Tunable via env; defaults to 30 requests/minute per IP.
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(cors());
app.use(express.json());
app.use("/api", apiLimiter, apiRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Rai backend listening on http://localhost:${PORT}`);

  console.log(
    hasApiKey()
      ? "✅ GEMINI_API_KEY detected — using Gemini."
      : "⚠️ No GEMINI_API_KEY set — running on deterministic fallback logic."
  );
});