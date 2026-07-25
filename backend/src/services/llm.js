/**
 * LLM service — thin wrapper around the Anthropic Messages API.
 *
 * Real calls are used when ANTHROPIC_API_KEY is set. If it is not set
 * (e.g. a judge clones the repo without configuring a key), every function
 * falls back to a deterministic, keyword/heuristic-based implementation so
 * the app still runs end-to-end. This keeps the MVP demoable without
 * requiring judges to have their own API credentials, while the real path
 * is fully wired for the actual submission/demo environment.
 */
const { GoogleGenAI } = require("@google/genai");
const { inferStateFromQuery } = require("./stateInference");
const MODEL = "gemini-3.1-flash-lite";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


function hasApiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}


async function callClaude(systemPrompt, userPrompt) {
  const prompt = `${systemPrompt}

User:
${userPrompt}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model response");
  return JSON.parse(match[0]);
}

// ---------- Intent extraction ----------

const OCCASION_KEYWORDS = {
  rakhi: "rakhi",
  raksha: "rakhi",
  festival: "festival",
  diwali: "festival",
  onam: "festival",
  pongal: "festival",
  wedding: "wedding",
  shaadi: "wedding",
  office: "office",
  work: "office",
  college: "college",
  daily: "daily",
  everyday: "daily",
  casual: "daily",
};

function fallbackExtractIntent(message) {
  const lower = message.toLowerCase();
  let occasion = null;
  for (const key in OCCASION_KEYWORDS) {
    if (lower.includes(key)) {
      occasion = OCCASION_KEYWORDS[key];
      break;
    }
  }
  const budgetMatch = lower.match(/(\d{3,5})/);
  const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;
  const stateGuess = inferStateFromQuery(message);

return {
    occasion,
    budget,
    priority: null,
    productType: null,

    language: "English",
    translatedQuery: message,

    state: stateGuess.state,
    confidence: stateGuess.confidence,
    source: "fallback-heuristic",
};
}

async function extractIntent(message) {
  if (!hasApiKey()) return fallbackExtractIntent(message);

  const system = `
You extract shopping intent for an Indian fashion shopping assistant.

Return ONLY valid JSON.

Schema:

{
  "occasion": string or null,
  "budget": integer or null,
  "priority": string or null,
  "productType": string or null,

  "language": string,

  "translatedQuery": string,

  "state": string or null
   "confidence": number | null
}

Rules:

1. Detect the language.
Return it as one of:

English
Hindi
Telugu
Tamil
Kannada
Malayalam
Marathi
Gujarati
Punjabi
Bengali
Odia
Urdu
Mixed

If multiple languages appear,
return "Mixed".

2. If the input is NOT English,
translate it naturally into English.

Return that translation as "translatedQuery".

3. If the input is already English,
translatedQuery should equal the original message.

4. Extract

- occasion
- budget
- priority
- productType

5. Never infer the user's state from their language.

6. Only infer state when the message explicitly contains

- a city
- a state
- a regional festival
- a regional clothing style

Examples:

"Need Kasavu saree"
-> Kerala

"Shopping in Kochi"
-> Kerala

"Need outfit for Onam"
-> Kerala

"Bathukamma dress"
-> Telangana

Otherwise return

"state": null

Do not guess.
Translate the entire shopping request into natural English while preserving the exact shopping intent, budget and product names.
Return ONLY JSON.
`;
  try {
    const raw = await callClaude(system, message);
    const parsed = extractJson(raw);
    const stateGuess = inferStateFromQuery(message);

return {
    occasion: parsed.occasion ?? null,
    budget: parsed.budget ?? null,
    priority: parsed.priority ?? null,
    productType: parsed.productType ?? null,

    language: parsed.language ?? "English",
    translatedQuery: parsed.translatedQuery ?? message,

    state: parsed.state ?? (stateGuess.confidence >= 0.85 ? stateGuess.state : null),
    confidence:
    stateGuess.confidence,
    source: "llm"
};
  } catch (err) {
    console.error("extractIntent LLM call failed, falling back:", err.message);
    return fallbackExtractIntent(message);
  }
}

// Note: review-quality scoring and explanation generation now live in
// reviewFeatures.js (cached, decoupled from the request path) and
// explanationAssembly.js (templated from the model's real feature
// attributions) rather than here — see valueIQModel.js for how they're
// combined at scoring time.

module.exports = { extractIntent, hasApiKey, callClaude, extractJson };
