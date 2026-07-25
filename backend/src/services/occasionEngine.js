const occasionMap = require("../data/occasionMapping.json");

const CATEGORY_MATCH = 12;
const FABRIC_MATCH = 4;
const COLOR_MATCH = 3;
const MISMATCH = -3;

function searchable(product) {
  return [
    product.name,
    product.category,
    product.productType,
    product.fabric,
    product.color,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function applyOccasionBoost(products, intent) {
  if (!intent?.occasion) return products;

  const rule = occasionMap[intent.occasion];

  if (!rule) return products;

  return products.map((item) => {
    const product = item.product;

    let boost = 0;

    const bag = searchable(product);

    // Category
    if (
      rule.categories.some((cat) =>
        bag.includes(cat.toLowerCase())
      )
    ) {
      boost += CATEGORY_MATCH;
    } else {
      boost += MISMATCH;
    }

    // Fabric
    if (
  rule.preferredFabrics &&
  rule.preferredFabrics.some((fabric) =>
    bag.includes(fabric.toLowerCase())
  )
) {
  boost += FABRIC_MATCH;
}

    // Color
    if (
  rule.preferredColors &&
  rule.preferredColors.some((color) =>
    bag.includes(color.toLowerCase())
  )
) {
  boost += COLOR_MATCH;
}

    return {
      ...item,
      score: Math.max(0, Math.min(100, item.score + boost)),
      occasionBoost: boost,
    };
  });
}

module.exports = {
  applyOccasionBoost,
};