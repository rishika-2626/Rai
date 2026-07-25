/**
 * Regional Preference Engine
 * Adds small score boosts based on regional preferences.
 */

const FABRIC_MATCH_POINTS = 3;
const COLOR_MATCH_POINTS = 2;
const TRADITIONAL_WEAR_MATCH_POINTS = 4;
const FESTIVAL_MATCH_POINTS = 3;

const RANKING_BOOST_SCALE = 20;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function searchableText(item) {
  const p = item.product || item;

  return [
    p.name,
    p.fabric,
    p.category,
    p.productType,
    p.color,
    ...(p.styleTags || []),
    ...(p.occasion || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function applyRegionalBoost(products, intent, regionalKnowledge) {
  if (!intent?.state) return products;

  const entry = regionalKnowledge[intent.state];

  if (!entry) return products;

  return products.map((product) => {
    const p = product.product || product;

    let regionalBoost = 0;

    const bag = searchableText(product);

    if (
  p.fabric &&
  entry.preferredFabrics.some((f) =>
    p.fabric.toLowerCase().includes(f.toLowerCase())
  )
) {
  regionalBoost += FABRIC_MATCH_POINTS;
}

    if (
      entry.traditionalWear.some((wear) =>
        bag.includes(wear.toLowerCase())
      )
    ) {
      regionalBoost += TRADITIONAL_WEAR_MATCH_POINTS;
    }

    if (
  p.color &&
  entry.preferredColors.some(
    (pc) => pc.toLowerCase() === p.color.toLowerCase()
  )
) {
  regionalBoost += COLOR_MATCH_POINTS;
}

    if (
      intent.occasion &&
      entry.majorFestivals.some((fest) =>
        intent.occasion.toLowerCase().includes(fest.toLowerCase())
      )
    ) {
      regionalBoost += FESTIVAL_MATCH_POINTS;
    }

    for (const [keyword, weight] of Object.entries(entry.rankingBoosts || {})) {
      if (bag.includes(keyword.toLowerCase())) {
        regionalBoost += weight * RANKING_BOOST_SCALE;
      }
    }

    if (regionalBoost === 0) {
      return product;
    }

    return {
      ...product,
      score: clamp(product.score + regionalBoost, 0, 100),
      regionalBoost: Math.round(regionalBoost * 100) / 100,
    };
  });
}

module.exports = {
  applyRegionalBoost,
};