const catalog = require("../data/catalog_new.json");

/**
 * Converts hierarchical catalog
 * (Families → Variants)
 * into a flat array of purchasable products.
 */

// The frontend renders a giant emoji per product tile in place of real
// product photography (there's no actual image asset behind `variant.image`
// -- it's a placeholder path that was never populated with real files).
// Mapped by productType so it stays accurate as the catalog grows; falls
// back to a generic shopping-bag emoji for any type not listed here.
const PRODUCT_EMOJI = {
  // Women
  Kurti: "👗",
  Dress: "👗",
  Top: "👚",
  Shirt: "👔",
  Jeans: "👖",
  Trousers: "👖",
  Saree: "🥻",
  "Ethnic Set": "🥻",
  Skirt: "👗",
  // Men
  "T-Shirt": "👕",
  "Cargo Pants": "👖",
  Hoodie: "🧥",
  Sweatshirt: "🧥",
  Kurta: "🥻",
  // Footwear
  Sneakers: "👟",
  "Running Shoes": "👟",
  Sandals: "🩴",
  Flats: "🥿",
  Heels: "👠",
  // Accessories
  Watches: "⌚",
  Bags: "👜",
  Backpacks: "🎒",
  Belts: "🪢",
  Wallets: "👛",
};
const DEFAULT_EMOJI = "🛍️";

function emojiFor(productType) {
  return PRODUCT_EMOJI[productType] || DEFAULT_EMOJI;
}

function getCatalog() {
  const products = [];

  for (const family of catalog.families) {
    for (const variant of family.variants) {
      products.push({
        // ---------- Identity ----------
        id: variant.variantId,
        familyId: family.familyId,

        // ---------- Basic ----------
        name: family.name,
        brand: family.brand,
        productType: family.productType,
        category: family.category,
        gender: family.gender,
        fabric: family.fabric,

        // ---------- Tags ----------
        occasion: family.occasion,
        styleTags: family.styleTags,

        // ---------- Variant ----------
        color: variant.color,
        image: variant.image,
        img: emojiFor(family.productType),
        price: variant.price,

        rating: variant.rating,
        reviewCount: variant.reviewCount,
        reviewCorpus: variant.reviewCorpus,

        inventory: variant.sizeInventory,

        // ---------- AI Signals ----------
        rankingSignals: family.rankingSignals,
      });
    }
  }

  return products;
}

module.exports = { getCatalog };