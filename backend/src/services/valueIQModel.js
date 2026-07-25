/**
 * Worth It Engine — Rai's core recommendation engine.
 * ----------------------------------------------------
 * Rai is an AI shopping concierge for Bharat's next 100M shoppers. The
 * product bet is that people don't need more choices — they need
 * confidence that what they're about to buy is *worth it*. This module is
 * the deterministic decision engine behind that: it takes a catalog
 * variant's precomputed `rankingSignals`, normalizes them onto a common
 * 0-100 scale, applies a fixed and fully disclosed weighting (chosen by
 * the shopper's stated priority), and produces a Worth It Score plus the
 * exact signal-by-signal math behind it.
 *
 * Gemini (see services/llm.js) is only ever responsible for turning a
 * shopper's message into structured intent — { budget, occasion, priority }.
 * It never ranks products. Ranking here is 100% deterministic: same
 * product + same intent always produces the same score, so it can be
 * explained, audited, and demoed with total confidence.
 */

// ---------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------
// rankingSignals arrive on different native scales. Everything is
// normalized to 0-100 *before* any weighting happens, so weights always
// mean "share of 100 points" regardless of a signal's raw representation.
//
// Field units, straight from the catalog (source of truth — check here
// before touching any normalize* function):
//
//   valueForMoneyScore          0-100  already normalized
//   qualityScoreLatent          0-1    latent quality probability/score
//   comfortScore                0-100  already normalized
//   fitConfidence                0-100  already normalized
//   durabilityScore             0-100  already normalized
//   sellerRating                0-5    star rating
//   sellerDeliveryReliability   0-100  already normalized
//   verifiedBuyerPercent        0-100  percentage of reviews from verified buyers
//   returnRatePercent           0-100  percentage of orders returned (lower = better)
//   priceCompetitivenessPercent signed %, e.g. -20..+20 (negative = cheaper than peers)

/** Clamp any number into the [0, 100] range. Guards against bad/missing data. */
function clamp0to100(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

// qualityScoreLatent ships as a 0-1 probability-like score from the
// catalog pipeline; scale it up to the common 0-100 range.
const QUALITY_SOURCE_SCALE = 1;
function normalizeQuality(qualityScoreLatent) {
  const value = (qualityScoreLatent || 0) / QUALITY_SOURCE_SCALE;
  return clamp0to100(value * 100);
}

// sellerRating ships as a 0-5 star rating; scale it up to 0-100.
const SELLER_RATING_SOURCE_SCALE = 5;
function normalizeSellerRating(sellerRating) {
  const value = (sellerRating || 0) / SELLER_RATING_SOURCE_SCALE;
  return clamp0to100(value * 100);
}

// returnRatePercent is "% of orders returned" — lower is strictly better,
// so we invert it into a score where higher is better, like every other
// signal.
//
// Defensive note: unlike other signals, defaulting a *missing* value to 0
// here would mean "0% returned" — the BEST possible outcome — which
// silently rewards missing data instead of staying conservative. So a
// missing/invalid returnRatePercent is treated as an average return rate
// instead of a perfect one.
const NEUTRAL_RETURN_RATE_PERCENT = 50;
function normalizeReturnRate(returnRatePercent) {
  const hasValue = typeof returnRatePercent === "number" && !Number.isNaN(returnRatePercent);
  const raw = hasValue ? clamp0to100(returnRatePercent) : NEUTRAL_RETURN_RATE_PERCENT;
  return clamp0to100(100 - raw);
}

// priceCompetitivenessPercent is a signed percentage vs. comparable
// products. By catalog convention, NEGATIVE means the product is priced
// BELOW comparable items (cheaper — a good thing for the shopper) and
// POSITIVE means priced above. We reward cheaper prices by subtracting
// the percentage from a neutral 50-point midpoint, so a lower (more
// negative) percent always produces a higher score:
//   -20%  (20% cheaper than peers) -> 70
//     0%  (priced at the peer average) -> 50
//   +20%  (20% pricier than peers) -> 30
// Clamped to [0, 100] in case of extreme outliers.
const PRICE_COMPETITIVENESS_MIDPOINT = 50;
const PRICE_COMPETITIVENESS_SLOPE = 1; // 1 point of score lost per 1% pricier than peers
function normalizePriceCompetitiveness(priceCompetitivenessPercent) {
  const percent = priceCompetitivenessPercent || 0;
  const score = PRICE_COMPETITIVENESS_MIDPOINT - percent * PRICE_COMPETITIVENESS_SLOPE;
  return clamp0to100(score);
}

/**
 * Normalize every static (catalog-level) rankingSignal onto 0-100.
 * Keys here match the weight keys used throughout the engine.
 */
function normalizeSignals(rankingSignals = {}) {
  return {
    valueForMoney: clamp0to100(rankingSignals.valueForMoneyScore),
    priceCompetitiveness: normalizePriceCompetitiveness(rankingSignals.priceCompetitivenessPercent),
    quality: normalizeQuality(rankingSignals.qualityScoreLatent),
    comfort: clamp0to100(rankingSignals.comfortScore),
    fitConfidence: clamp0to100(rankingSignals.fitConfidence),
    durability: clamp0to100(rankingSignals.durabilityScore),
    sellerRating: normalizeSellerRating(rankingSignals.sellerRating),
    deliveryReliability: clamp0to100(rankingSignals.sellerDeliveryReliability),
    verifiedBuyers: clamp0to100(rankingSignals.verifiedBuyerPercent),
    returnRate: normalizeReturnRate(rankingSignals.returnRatePercent),
  };
}

// ---------------------------------------------------------------------
// User-context signals (computed per-request from shopper intent)
// ---------------------------------------------------------------------

/**
 * Budget Match — no stated budget means no penalty (100). Otherwise
 * score falls off linearly with the % distance from the stated budget.
 */
function computeBudgetMatch(product, budget) {
  if (!budget) return 100;
  const price = product?.price ?? 0;
  const percentOff = Math.abs(price - budget) / budget;
  return clamp0to100(100 - percentOff * 100);
}

/**
 * Occasion Match — no stated occasion means no penalty (100). Otherwise
 * full credit if the product is tagged for that occasion, partial credit
 * (not zero — a decent product is still shown) if not.
 */
const OCCASION_MATCH_HIT = 100;
const OCCASION_MATCH_MISS = 40;
function computeOccasionMatch(product, occasion) {
  if (!occasion) return 100;
  const tags = Array.isArray(product?.occasion) ? product.occasion : [];
  return tags.includes(occasion) ? OCCASION_MATCH_HIT : OCCASION_MATCH_MISS;
}

function computeUserContextSignals(product, intent = {}) {
  return {
    budgetMatch: computeBudgetMatch(product, intent.budget),
    occasionMatch: computeOccasionMatch(product, intent.occasion),
  };
}

// ---------------------------------------------------------------------
// Weight presets
// ---------------------------------------------------------------------
// Every preset is a full, disclosed allocation of exactly 100 points
// across every signal. Swapping presets is the *only* thing a priority
// changes — the underlying normalized signals and the scoring math are
// identical, which is what keeps the engine deterministic and easy to
// explain. Adding a new priority is just adding a new 100-point map here.

/** Balanced default — no single signal dominates. */
const DEFAULT_WEIGHTS = {
  valueForMoney: 18,
  priceCompetitiveness: 7,
  quality: 15,
  comfort: 10,
  fitConfidence: 10,
  durability: 10,
  sellerRating: 10,
  deliveryReliability: 8,
  verifiedBuyers: 5,
  returnRate: 4,
  budgetMatch: 2,
  occasionMatch: 1,
};

/** Shopper cares most about price/value: bump value, price, budget. */
const VALUE_WEIGHTS = {
  valueForMoney: 30,
  priceCompetitiveness: 15,
  quality: 10,
  comfort: 6,
  fitConfidence: 6,
  durability: 6,
  sellerRating: 6,
  deliveryReliability: 5,
  verifiedBuyers: 3,
  returnRate: 2,
  budgetMatch: 10,
  occasionMatch: 1,
};

/** Shopper cares most about how it feels/fits: bump comfort, fit. */
const COMFORT_WEIGHTS = {
  valueForMoney: 12,
  priceCompetitiveness: 4,
  quality: 10,
  comfort: 25,
  fitConfidence: 20,
  durability: 8,
  sellerRating: 8,
  deliveryReliability: 6,
  verifiedBuyers: 3,
  returnRate: 2,
  budgetMatch: 1,
  occasionMatch: 1,
};

/** Shopper wants the best overall product: bump quality, seller, comfort. */
const PREMIUM_WEIGHTS = {
  valueForMoney: 6,
  priceCompetitiveness: 2,
  quality: 25,
  comfort: 15,
  fitConfidence: 8,
  durability: 10,
  sellerRating: 18,
  deliveryReliability: 8,
  verifiedBuyers: 5,
  returnRate: 2,
  budgetMatch: 0,
  occasionMatch: 1,
};

/** Shopper cares about a smooth, on-time purchase: bump delivery, seller. */
const DELIVERY_WEIGHTS = {
  valueForMoney: 12,
  priceCompetitiveness: 4,
  quality: 10,
  comfort: 8,
  fitConfidence: 6,
  durability: 6,
  sellerRating: 20,
  deliveryReliability: 25,
  verifiedBuyers: 4,
  returnRate: 3,
  budgetMatch: 1,
  occasionMatch: 1,
};

/** Shopper wants it to last: bump durability, quality. */
const DURABILITY_WEIGHTS = {
  valueForMoney: 12,
  priceCompetitiveness: 4,
  quality: 22,
  comfort: 8,
  fitConfidence: 8,
  durability: 25,
  sellerRating: 8,
  deliveryReliability: 6,
  verifiedBuyers: 4,
  returnRate: 2,
  budgetMatch: 0,
  occasionMatch: 1,
};

const PRIORITY_PRESETS = {
  VALUE: VALUE_WEIGHTS,
  COMFORT: COMFORT_WEIGHTS,
  PREMIUM: PREMIUM_WEIGHTS,
  DELIVERY: DELIVERY_WEIGHTS,
  DURABILITY: DURABILITY_WEIGHTS,
};

/**
 * Resolve a shopper's stated priority (e.g. "comfort", from Gemini's
 * intent extraction) to a weight preset. Falls back to DEFAULT for any
 * missing or unrecognized priority — adding a new priority later is just
 * adding a new entry to PRIORITY_PRESETS, no call-site changes needed.
 */
function resolvePriorityWeights(priority) {
  if (!priority) return { matchedPriority: "DEFAULT", weights: DEFAULT_WEIGHTS };
  const key = String(priority).trim().toUpperCase();
  if (PRIORITY_PRESETS[key]) return { matchedPriority: key, weights: PRIORITY_PRESETS[key] };
  return { matchedPriority: "DEFAULT", weights: DEFAULT_WEIGHTS };
}

// ---------------------------------------------------------------------
// Score interpretation
// ---------------------------------------------------------------------

const WORTH_IT_LABEL_THRESHOLDS = [
  { min: 95, label: "Exceptional Buy" },
  { min: 90, label: "Excellent Buy" },
  { min: 80, label: "Worth It" },
  { min: 70, label: "Good Choice" },
  { min: 0, label: "Consider Alternatives" },
];
function worthItLabel(score) {
  return WORTH_IT_LABEL_THRESHOLDS.find((t) => score >= t.min).label;
}

// Confidence reflects how decisively the signals point to a verdict, not
// a separate statistical measure — it's derived directly from the score.
const CONFIDENCE_THRESHOLDS = [
  { min: 85, level: "High" },
  { min: 65, level: "Medium" },
  { min: 0, level: "Low" },
];
function confidenceLevel(score) {
  return CONFIDENCE_THRESHOLDS.find((t) => score >= t.min).level;
}

// ---------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------

/**
 * Score one product against the current request's intent.
 *
 * @param {object} product - flattened catalog variant, must carry `rankingSignals`.
 * @param {object} intent - { budget, occasion, priority } from Gemini's intent extraction.
 *
 * @returns {{
 *   score: number,
 *   worthItLabel: string,
 *   matchedPriority: string,
 *   confidence: string,
 *   contributions: Record<string, { contribution: number, rawValue: number, weight: number }>,
 *   rawFeatures: object
 * }}
 */
function scoreProduct(product, intent = {}) {
  // Defensive: a malformed catalog entry (missing rankingSignals, or even
  // a null product slipping through) should degrade to a 0-signal score
  // rather than throw and take down the whole shortlist request.
  const safeProduct = product ?? {};
  const rankingSignals = safeProduct.rankingSignals ?? {};

  const normalizedSignals = normalizeSignals(rankingSignals);
  const contextSignals = computeUserContextSignals(safeProduct, intent);
  const values = { ...normalizedSignals, ...contextSignals };

  const { matchedPriority, weights } = resolvePriorityWeights(intent.priority);

  let score = 0;
  const contributions = {};
  Object.keys(weights).forEach((signal) => {
    const weight = weights[signal];
    const rawValue = values[signal];
    const contribution = (weight * rawValue) / 100;
    contributions[signal] = {
      contribution: Math.round(contribution * 100) / 100,
      rawValue: Math.round(rawValue * 100) / 100,
      weight,
    };
    score += contribution;
  });

  score = Math.round(score);

  const rawFeatures = {
    ...values,
    // Keep true raw source values around too — the explanation engine
    // needs the *actual* return-rate percent / price-delta percent for
    // some thresholds, not just the normalized 0-100 score.
    returnRatePercent:
      typeof rankingSignals.returnRatePercent === "number" && !Number.isNaN(rankingSignals.returnRatePercent)
        ? clamp0to100(rankingSignals.returnRatePercent)
        : NEUTRAL_RETURN_RATE_PERCENT,
    priceCompetitivenessPercent: rankingSignals.priceCompetitivenessPercent ?? 0,
    occasion: intent.occasion || (Array.isArray(safeProduct.occasion) ? safeProduct.occasion[0] : null) || null,
  };

  return {
    score,
    worthItLabel: worthItLabel(score),
    matchedPriority,
    confidence: confidenceLevel(score),
    contributions,
    rawFeatures,
  };
}

/**
 * Tie-break equal Worth It Scores deterministically, so ordering never
 * depends on catalog/array insertion order:
 *   1. Higher rating
 *   2. Higher review count
 *   3. Higher seller delivery reliability
 */
function compareRankedResults(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  const ratingA = a.product?.rating ?? 0;
  const ratingB = b.product?.rating ?? 0;
  if (ratingB !== ratingA) return ratingB - ratingA;

  const reviewCountA = a.product?.reviewCount ?? 0;
  const reviewCountB = b.product?.reviewCount ?? 0;
  if (reviewCountB !== reviewCountA) return reviewCountB - reviewCountA;

  const deliveryA = a.product?.rankingSignals?.sellerDeliveryReliability ?? 0;
  const deliveryB = b.product?.rankingSignals?.sellerDeliveryReliability ?? 0;
  return deliveryB - deliveryA;
}

// ---------------------------------------------------------------------
// Candidate filtering (pre-scoring)
// ---------------------------------------------------------------------
// Runs BEFORE scoreProduct(), so the engine only scores products that are
// actually relevant to the shopper's query instead of the entire catalog
// on every request. This is purely a candidate-selection concern —
// scoring, weighting, tie-breaking, and diversity selection downstream
// are completely untouched.
//
// Every stage narrows the previous stage's output and follows the same
// fallback contract: if narrowing would leave too few (or, for product
// type, zero) products, revert to the candidates from before that stage.
// This guarantees filtering can never produce an empty shortlist.

const MIN_CANDIDATES_AFTER_FILTER = 3;

/**
 * Highest-priority filter. Tries an exact case-insensitive match against
 * product.productType first (e.g. "shirt" -> only shirts). If that
 * matches nothing, falls back to product.category. If that also matches
 * nothing, reverts to the incoming candidate list untouched.
 */
function filterByProductType(candidates, productType) {
  if (!productType) return candidates;

  const target = productType.trim().toLowerCase();

  const matched = candidates.filter((product) => {
    const searchableText = [
      product.productType,
      product.category,
      product.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(target);
  });

  return matched.length ? matched : candidates;
}

/**
 * Keeps products whose product.occasion tags contain the requested
 * occasion (case-insensitive). Reverts to the incoming candidate list if
 * fewer than MIN_CANDIDATES_AFTER_FILTER products would remain.
 */
function filterByOccasion(candidates, occasion) {
  if (!occasion) return candidates;
  const target = String(occasion).trim().toLowerCase();
  if (!target) return candidates;

  const matched = candidates.filter((product) => {
    const tags = Array.isArray(product?.occasion) ? product.occasion : [];
    return tags.some((tag) => String(tag).toLowerCase().includes(target));
  });

  return matched.length >= MIN_CANDIDATES_AFTER_FILTER ? matched : candidates;
}

// Budget is meant to narrow, not eliminate — accept anything within
// ±40% of the stated budget before falling back.
const BUDGET_FILTER_TOLERANCE = 0.4;
function filterByBudget(candidates, budget) {
  if (!budget) return candidates;
  const min = 0;
const max = budget * (1 + BUDGET_FILTER_TOLERANCE);

  const matched = candidates.filter((product) => {
    const price = product?.price;
    return typeof price === "number" && !Number.isNaN(price) && price >= min && price <= max;
  });

  return matched.length >= MIN_CANDIDATES_AFTER_FILTER ? matched : candidates;
}

/**
 * Narrows the catalog to candidates actually relevant to the shopper's
 * intent, before any scoring happens. Order: product type (highest
 * priority) -> occasion -> budget, each operating on the previous
 * stage's output.
 *
 * State and priority are deliberately NOT filtered here — regional
 * preference scoring and the ValueIQ priority weight presets already
 * handle those downstream, untouched by this module.
 */
function filterCandidates(catalog, intent = {}) {
  let candidates = catalog.filter(Boolean);

  candidates = filterByProductType(candidates, intent.productType);
  candidates = filterByOccasion(candidates, intent.occasion);
  candidates = filterByBudget(candidates, intent.budget);

  return candidates;
}

function rankCatalog(catalog, intent, reviewFeaturesById = {}) {
  // Defensive: a missing/malformed catalog shouldn't crash the request —
  // just return an empty shortlist.
  if (!Array.isArray(catalog)) return [];

  const candidates = filterCandidates(catalog, intent);

  return candidates
    .map((product) => {
      const result = scoreProduct(product, intent);
      const reviewNote = reviewFeaturesById?.[product.id]?.reviewNote ?? null;
      return { product, ...result, reviewNote };
    })
    .sort(compareRankedResults);
}

// ---------------------------------------------------------------------
// Diversity pass (post-ranking, NOT part of scoring)
// ---------------------------------------------------------------------
// Worth It Scores alone can produce a shortlist that's dominated by one
// product family (e.g. every color/size variant of the same kurta) or one
// brand. That's technically "correct" by score but feels repetitive and
// low-trust to a shopper — the Myntra-style fix is a diversity cap applied
// *after* ranking is final, never mixed into the score itself, so the
// score always stays a pure, explainable answer to "is this worth it,"
// independent of what else made the shortlist.

const DEFAULT_DIVERSITY_OPTIONS = {
  limit: 6,
  maxPerFamily: 2,
  maxPerBrand: 3,
};

/**
 * Greedily walk the already-ranked (score, then tie-break) results and
 * keep the best-ranked item that doesn't blow a family/brand cap. Items
 * skipped for diversity aren't dropped — they're kept as fallback filler
 * in case there aren't enough diverse candidates to reach `limit`, so we
 * never return fewer than the best-effort possible results just for the
 * sake of diversity.
 *
 * Family grouping uses `product.familyId` (falls back to `product.family`
 * if that's the field name catalogAdapter actually uses) — a product with
 * neither is treated as its own singleton family and never capped on that
 * axis.
 */
function selectDiverseTop(rankedResults, options = {}) {
  if (!Array.isArray(rankedResults)) return [];
  const { limit, maxPerFamily, maxPerBrand } = { ...DEFAULT_DIVERSITY_OPTIONS, ...options };

  const familyCounts = {};
  const brandCounts = {};
  const selected = [];
  const skipped = [];

  for (const result of rankedResults) {
    if (selected.length >= limit) break;

    const product = result.product ?? {};
    const familyId = product.familyId ?? product.family ?? null;
    const brand = product.brand ?? null;

    const familyCount = familyId != null ? familyCounts[familyId] ?? 0 : 0;
    const brandCount = brand != null ? brandCounts[brand] ?? 0 : 0;

    const withinFamilyCap = familyId == null || familyCount < maxPerFamily;
    const withinBrandCap = brand == null || brandCount < maxPerBrand;

    if (withinFamilyCap && withinBrandCap) {
      selected.push(result);
      if (familyId != null) familyCounts[familyId] = familyCount + 1;
      if (brand != null) brandCounts[brand] = brandCount + 1;
    } else {
      skipped.push(result);
    }
  }

  // Best-effort backfill: if the diversity caps left us short of `limit`
  // (e.g. a small or low-diversity catalog), fill remaining slots from
  // the skipped items in their original rank order, ignoring caps, so the
  // shortlist is never artificially shorter than the catalog allows.
  for (const result of skipped) {
    if (selected.length >= limit) break;
    selected.push(result);
  }

  return selected;
}

/** Top N signals by contribution size, for building explanation bullets. */
function topContributions(contributions, n = 4) {
  return Object.entries(contributions)
    .sort((a, b) => b[1].contribution - a[1].contribution)
    .slice(0, n);
}

const modelMetadata = {
  methodology:
    "Worth It Engine: a deterministic, fully disclosed weighted score over " +
    "catalog rankingSignals (normalized to 0-100) plus two request-time " +
    "context signals (budget match, occasion match). The shopper's stated " +
    "priority selects one of several fixed weight presets — no signal " +
    "weighting is learned or hidden. Gemini only extracts intent " +
    "(budget/occasion/priority); it never ranks products.",
  defaultWeights: DEFAULT_WEIGHTS,
  priorityPresets: PRIORITY_PRESETS,
  worthItLabelThresholds: WORTH_IT_LABEL_THRESHOLDS,
  confidenceThresholds: CONFIDENCE_THRESHOLDS,
  diversityDefaults: DEFAULT_DIVERSITY_OPTIONS,
};

module.exports = {
  scoreProduct,
  rankCatalog,
  selectDiverseTop,
  topContributions,
  modelMetadata,
};