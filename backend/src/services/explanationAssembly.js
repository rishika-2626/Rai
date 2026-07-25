/**
 * Explanation Assembly
 * ---------------------
 * Turns the Worth It Engine's actual contributions (from valueIQModel.js)
 * into plain-language bullets a Bharat shopper can trust at a glance.
 * Bullets are generated from *thresholds* on each signal's normalized
 * value, not templated off feature names — so the copy reads like a
 * person explaining the product, not a debug dump. Deterministic: the
 * same score always produces the same bullets.
 */

/**
 * Each entry maps a signal key to a function (rawValue, rawFeatures) that
 * returns a human sentence. rawValue is the signal's normalized 0-100
 * score; rawFeatures carries a few true raw values (e.g. actual return
 * rate %) for the signals where the natural-language threshold reads
 * better off the original units.
 */
const BULLET_RULES = {
  valueForMoney: (v) =>
    v >= 90
      ? "Outstanding value for the price."
      : v >= 75
      ? "Great value for the price."
      : v >= 50
      ? "Fair value for the price."
      : "Priced higher than the value it offers.",

  priceCompetitiveness: (v) =>
    v >= 70
      ? "Priced better than similar products."
      : v >= 50
      ? "Competitively priced against similar products."
      : "Priced above similar products.",

  quality: (v) =>
    v >= 85
      ? "Outstanding quality according to buyers."
      : v >= 70
      ? "High quality according to buyers."
      : v >= 50
      ? "Decent quality."
      : "Quality feedback is mixed.",

  comfort: (v) =>
    v >= 85
      ? "Excellent comfort according to buyers."
      : v >= 70
      ? "Comfortable for most buyers."
      : v >= 50
      ? "Comfort feedback is average."
      : "Comfort feedback is mixed.",

  fitConfidence: (v) =>
    v >= 85
      ? "High confidence in sizing."
      : v >= 70
      ? "Reasonably true to size."
      : v >= 50
      ? "Fit feedback is mixed."
      : "Fit can vary — check the size chart.",

  durability: (v) =>
    v >= 85
      ? "Built to last."
      : v >= 70
      ? "Reasonably durable."
      : v >= 50
      ? "Durability info is limited."
      : "Durability feedback is mixed.",

  sellerRating: (v) =>
    v >= 85
      ? "Highly trusted seller."
      : v >= 70
      ? "Trusted seller."
      : v >= 50
      ? "Decent seller rating."
      : "Limited seller track record.",

  deliveryReliability: (v) =>
    v >= 85
      ? "Reliable delivery performance."
      : v >= 70
      ? "Generally on-time delivery."
      : v >= 50
      ? "Delivery reliability varies."
      : "Delivery reliability is inconsistent.",

  verifiedBuyers: (v) =>
    v >= 75
      ? "Large number of verified buyers."
      : v >= 50
      ? "Some verified buyer reviews."
      : "Limited verified buyer data.",

  // Read off the true raw return-rate percent, not the inverted score —
  // "very low return rate" reads more naturally than a 0-100 score would.
  returnRate: (v, rawFeatures) => {
    // Default to a conservative (unflattering) value if the raw percent is
    // missing, so absent data never accidentally reads as a great signal.
    const pct = rawFeatures.returnRatePercent ?? 100;
    if (pct <= 3) return "Very low return rate.";
    if (pct <= 8) return "Low return rate.";
    if (pct <= 15) return "Average return rate.";
    return "Higher than average returns.";
  },

  budgetMatch: (v) =>
    v >= 95
      ? "Fits perfectly within your budget."
      : v >= 80
      ? "Comfortably within your budget."
      : v >= 50
      ? "Slightly outside your stated budget."
      : "Outside your stated budget.",

  occasionMatch: (v, rawFeatures) => {
    if (v >= OCCASION_MATCH_FULL) {
      return rawFeatures.occasion ? "Perfect for your intended occasion." : "Versatile enough for most occasions.";
    }
    return "Not a strong occasion match.";
  },
};

const OCCASION_MATCH_FULL = 100;

const PRIORITY_LABELS = {
  VALUE: "value for money",
  COMFORT: "comfort",
  PREMIUM: "premium quality",
  DELIVERY: "delivery reliability",
  DURABILITY: "durability",
};

/** The one always-included, priority-aware line. */
function buildPriorityExplanation(matchedPriority) {
  if (!matchedPriority || matchedPriority === "DEFAULT") {
    return "Recommended using a balanced view across value, quality, and comfort.";
  }
  const label = PRIORITY_LABELS[matchedPriority] || matchedPriority.toLowerCase();
  return `Recommended because ${label} was your highest priority.`;
}

/**
 * @param {object} product
 * @param {Array<[string, {contribution:number, rawValue:number, weight:number}]>} topContributions
 *        - from valueIQModel.topContributions
 * @param {object} rawFeatures - normalized + a few true-raw values used to score
 * @param {string} reviewNote - cached review synthesis sentence
 * @param {string} matchedPriority - which weight preset was used (e.g. "COMFORT", "DEFAULT")
 */
function buildExplanation(product, topContributions, rawFeatures, reviewNote, matchedPriority) {
  // Defensive: a malformed or partially-scored product shouldn't crash
  // bullet generation — just fall back to sensible empty defaults.
  const safeContributions = Array.isArray(topContributions) ? topContributions : [];
  const safeRawFeatures = rawFeatures ?? {};

  const bullets = safeContributions
    .map(([signal, entry]) => {
      const rule = BULLET_RULES[signal];
      if (!rule) return null;
      const rawValue = entry?.rawValue ?? 0;
      return rule(rawValue, safeRawFeatures);
    })
    .filter(Boolean);

  bullets.push(buildPriorityExplanation(matchedPriority));

  return { bullets, reviewNote };
}

module.exports = { buildExplanation };