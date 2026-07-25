/**
 * Review Feature Extraction (decoupled from scoring)
 * ----------------------------------------------------
 * Mines each product's review corpus into structured features:
 *   { sentiment: 0..1, durability_flag: 0|1, fit_flag: 0|1 }
 *
 * This runs ONCE per product and is cached to disk
 * (src/data/review_features_cache.json), not on every /shortlist request.
 * That decoupling is deliberate: it's what makes scoring fast and
 * deterministic (see valueIQModel.js), instead of firing a fresh LLM call
 * per product on every user query.
 *
 * Regenerate the cache after editing the catalog:
 *   node src/services/reviewFeatures.js
 */

const fs = require("fs");
const path = require("path");
const { getCatalog } = require("./catalogAdapter");
const { callClaude, extractJson, hasApiKey } = require("./llm");

// Pulled through catalogAdapter (not the raw catalog_new.json) so the keys
// this cache is built on (variant.variantId, via product.id) are guaranteed
// to match what /api/shortlist actually looks products up by. catalog_new.json
// itself is { sellers, families } with nested variants -- reading it directly
// here previously meant this cache was keyed on the OLD flat catalog's ids,
// which silently never matched a family/variant id and made reviewNote null
// for every product.
const catalog = getCatalog();

const CACHE_PATH = path.join(__dirname, "../data/review_features_cache.json");

const POSITIVE_WORDS = ["good", "great", "breathable", "expensive", "true to size", "comfortable", "compliments", "fast", "held up", "value", "premium", "nicely", "accurate", "reliable"];
const DURABILITY_WORDS = ["durab", "held up", "wash", "longevity", "months", "years", "survived"];
const FIT_WORDS = ["true to size", "fits", "fit was accurate", "size chart", "runs large", "runs small"];

function heuristicFeatures(product) {
  const corpus = product.reviewCorpus.join(" ").toLowerCase();
  const posHits = POSITIVE_WORDS.filter((w) => corpus.includes(w)).length;
  const sentiment = Math.min(1, 0.5 + posHits * 0.06);
  const durability_flag = DURABILITY_WORDS.some((w) => corpus.includes(w)) ? 1 : 0;
  const fit_flag = FIT_WORDS.some((w) => corpus.includes(w)) ? 1 : 0;
  return { sentiment, durability_flag, fit_flag, reviewNote: product.reviewCorpus[0], source: "fallback-heuristic" };
}

async function llmFeatures(product) {
  const system = `You mine buyer review snippets for a fashion e-commerce product and extract structured signal.
Return ONLY a JSON object, no prose, no markdown fences:
{"sentiment": number between 0 and 1, "durability_flag": 0 or 1, "fit_flag": 0 or 1, "reviewNote": "one sentence synthesizing the reviews, under 25 words"}
sentiment: overall positivity/quality signal from the reviews.
durability_flag: 1 if reviews positively mention durability/longevity/washing well, else 0.
fit_flag: 1 if reviews positively mention true-to-size or accurate fit, else 0.`;

  const user = `Product: ${product.name}\nReviews:\n${product.reviewCorpus.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;

  try {
    const raw = await callClaude(system, user);
    const parsed = extractJson(raw);
    return {
      sentiment: Math.min(1, Math.max(0, parsed.sentiment)),
      durability_flag: parsed.durability_flag ? 1 : 0,
      fit_flag: parsed.fit_flag ? 1 : 0,
      reviewNote: parsed.reviewNote,
      source: "llm",
    };
  } catch (err) {
    console.error(`llmFeatures failed for ${product.id}, falling back:`, err.message);
    return heuristicFeatures(product);
  }
}

async function buildCache() {
  const cache = {};
  for (const product of catalog) {
    cache[product.id] = hasApiKey() ? await llmFeatures(product) : heuristicFeatures(product);
    console.log(`  ${product.id}: sentiment=${cache[product.id].sentiment.toFixed(2)} durability=${cache[product.id].durability_flag} fit=${cache[product.id].fit_flag} (${cache[product.id].source})`);
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  return cache;
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return null;
  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
}

/**
 * Get review features for all products, using disk cache if present.
 * Call buildCache() explicitly (or run this file directly) to regenerate
 * after catalog/review changes.
 */
function getReviewFeatures() {
  const cached = loadCache();
  if (cached) return cached;
  // No cache yet: synchronous fallback so the server never fails to boot.
  const fallback = {};
  for (const product of catalog) fallback[product.id] = heuristicFeatures(product);
  return fallback;
}

if (require.main === module) {
  require("dotenv").config();
  console.log(hasApiKey() ? "Building review feature cache with live LLM calls..." : "Building review feature cache with heuristic fallback (no GEMINI_API_KEY set)...");
  buildCache().then(() => console.log(`Cache written to ${CACHE_PATH}`));
}

module.exports = { getReviewFeatures, buildCache, loadCache };