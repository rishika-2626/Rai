const express = require("express");
const { getCatalog } = require("../services/catalogAdapter");

const catalog = getCatalog();
const { extractIntent, hasApiKey } = require("../services/llm");
const { rankCatalog, selectDiverseTop, topContributions, modelMetadata } = require("../services/valueIQModel");
const { getReviewFeatures } = require("../services/reviewFeatures");
const { buildExplanation } = require("../services/explanationAssembly");
const { createShare, getShare } = require("../services/askSomeone");

const router = express.Router();
const regionalStyles = require("../data/regionalStyles.json");
const { applyRegionalBoost } = require("../services/regionalEngine");

router.get("/health", (req, res) => {
  res.json({ ok: true, llmConfigured: hasApiKey(), model: modelMetadata.defaultWeights });
});

router.get("/model-info", (req, res) => {
  res.json(modelMetadata);
});

// POST /api/intent  { message }
// Gemini extracts structured intent — budget, occasion, and (optionally)
// priority — from free-text. It never ranks products; scoring is 100%
// deterministic and happens in the Worth It Engine below.
router.post("/intent", async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message (string) is required" });
  }
  try {
    const intent = await extractIntent(message);
    res.json(intent);
  } catch (err) {
    res.status(500).json({ error: "Failed to extract intent", detail: err.message });
  }
});

// POST /api/shortlist  { occasion, budget, priority }
// Returns the top 6 purchasable variants ranked by the Worth It Score,
// then diversified. `priority` (e.g. "comfort", "value", "premium",
// "delivery", "durability") selects which weight preset the Worth It
// Engine uses; any missing or unrecognized priority falls back to the
// balanced DEFAULT preset. Review notes come from a precomputed cache
// (see reviewFeatures.js); bullets are generated deterministically from
// the score's own contributions (see explanationAssembly.js) — no
// per-request LLM call in the ranking path.
//
// Ranking and diversity are deliberately separate steps: rankCatalog()
// produces a pure, explainable score-and-tie-break order over the WHOLE
// catalog; selectDiverseTop() then walks that full order (not just a
// pre-sliced top 6) to cap same-family/same-brand repeats, backfilling
// from lower-ranked items only if the catalog isn't diverse enough to
// fill 6 slots otherwise. Never mixed into scoreProduct() itself.
router.post("/shortlist", async (req, res) => {
  const {
    occasion = null,
    budget = null,
    priority = null,
    productType = null,
    state = null,
} = req.body || {};

const intent = {
    occasion,
    budget,
    priority,
    productType,
    state,
};
console.log("Intent:", intent);
  try {
    const reviewFeaturesById = getReviewFeatures();
   const ranked = rankCatalog(catalog, intent, reviewFeaturesById);
   // Total catalog size vs. how many candidates survived intent filtering
   // (product type / occasion / budget) and were actually scored — this is
   // what the frontend's "Compared N Products" line should reflect, not a
   // hardcoded guess.
   const scanned = catalog.length;
   const candidatesScored = ranked.length;

// Apply regional preference boost before diversity selection
const regionBoosted = applyRegionalBoost(
  ranked,
  intent,
  regionalStyles
);

// Re-sort because some scores changed
regionBoosted.sort((a, b) => b.score - a.score);

const diverseTop6 = selectDiverseTop(regionBoosted, { limit: 6 });

    const top6 = diverseTop6.map(
      ({     product,
    score,
    regionalBoost,
    worthItLabel,
    confidence,
    matchedPriority,
    contributions,
    rawFeatures,
    reviewNote,
    
 }) => {
        const top4 = topContributions(contributions, 4);
        const { bullets } = buildExplanation(product, top4, rawFeatures, reviewNote, matchedPriority);
        const breakdown = {
  value: Math.round(
    (rawFeatures.valueForMoney + rawFeatures.priceCompetitiveness) / 2
  ),

  quality: Math.round(
    (rawFeatures.quality +
      rawFeatures.durability +
      rawFeatures.fitConfidence) / 3
  ),

  reviews: Math.round(
    (rawFeatures.verifiedBuyers +
      rawFeatures.returnRate) / 2
  ),

  seller: Math.round(
    (rawFeatures.sellerRating +
      rawFeatures.deliveryReliability) / 2
  ),

  occasion: Math.round(rawFeatures.occasionMatch),

  regional: regionalBoost
    ? Math.min(100, Math.round(regionalBoost * 20))
    : 0,
};
        return {
          id: product.id,
  name: product.name,
  brand: product.brand,
  productType: product.productType,
  category: product.category,
  color: product.color,
  image: product.image,
  img: product.img,
  price: product.price,
  comparableAvg: product.rankingSignals?.comparableAvgPrice ?? null,
  rating: product.rating,
  reviewCount: product.reviewCount,

  score,
  regionalBoost,

  worthItLabel,
  confidence,
  matchedPriority,

  rankingSignals: product.rankingSignals,
  bullets,
  reviewNote,
  breakdown,
        };
      }
    );

    res.json({ intent, results: top6, scanned, candidatesScored });
  } catch (err) {
    res.status(500).json({ error: "Failed to build shortlist", detail: err.message });
  }
});

// POST /api/ask-someone  { productId, recipient }
router.post("/ask-someone", (req, res) => {
  const { productId, recipient } = req.body || {};
  if (!productId) return res.status(400).json({ error: "productId is required" });
  const share = createShare(productId, recipient);
  res.json(share);
});

// GET /api/ask-someone/:id
router.get("/ask-someone/:id", (req, res) => {
  const share = getShare(req.params.id);
  if (!share) return res.status(404).json({ error: "share not found" });
  res.json(share);
});

module.exports = router;