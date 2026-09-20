const test = require("node:test");
const assert = require("node:assert");

const { getCatalog } = require("../backend/src/services/catalogAdapter");
const { inferStateFromQuery } = require("../backend/src/services/stateInference");
const { applyOccasionBoost } = require("../backend/src/services/occasionEngine");
const { applyRegionalBoost } = require("../backend/src/services/regionalEngine");
const { rankCatalog, selectDiverseTop, topContributions, modelMetadata } = require("../backend/src/services/valueIQModel");
const { getReviewFeatures } = require("../backend/src/services/reviewFeatures");
const { buildExplanation } = require("../backend/src/services/explanationAssembly");
const { createShare, getShare } = require("../backend/src/services/askSomeone");
const regionalStyles = require("../backend/src/data/regionalStyles.json");

test("catalogAdapter: flattens catalog into purchasable variants with metadata", () => {
  const catalog = getCatalog();
  assert.ok(Array.isArray(catalog), "catalog should be an array");
  assert.ok(catalog.length > 0, "catalog should not be empty");

  const sample = catalog[0];
  assert.ok(sample.id, "product should have an id");
  assert.ok(sample.name, "product should have a name");
  assert.ok(sample.img, "product should have an emoji icon");
  assert.ok(typeof sample.price === "number", "price should be numeric");
});

test("stateInference: infers state from city names and festival keywords", () => {
  const jaipurResult = inferStateFromQuery("Looking for kurtis in Jaipur under 2000");
  assert.strictEqual(jaipurResult.state, "Rajasthan");
  assert.strictEqual(jaipurResult.source, "city");
  assert.strictEqual(jaipurResult.confidence, 0.95);

  const onamResult = inferStateFromQuery("Need something traditional for Onam");
  assert.strictEqual(onamResult.state, "Kerala");
  assert.strictEqual(onamResult.source, "festival");

  const unknownResult = inferStateFromQuery("Casual outfit for daily wear");
  assert.strictEqual(unknownResult.state, null);
  assert.strictEqual(unknownResult.source, "none");
});

test("occasionEngine: applies boost to matching occasion rules", () => {
  const catalog = getCatalog();
  const sampleItems = catalog.slice(0, 5).map(product => ({ product, score: 70 }));
  const intent = { occasion: "wedding" };

  const boosted = applyOccasionBoost(sampleItems, intent);
  assert.strictEqual(boosted.length, sampleItems.length);
  boosted.forEach(item => {
    assert.ok(typeof item.score === "number");
    assert.ok(typeof item.occasionBoost === "number");
  });
});

test("regionalEngine: applies regional preference boosts", () => {
  const catalog = getCatalog();
  const sampleItems = catalog.slice(0, 5).map(product => ({ product, score: 70 }));
  const intent = { state: "Punjab" };

  const boosted = applyRegionalBoost(sampleItems, intent, regionalStyles);
  assert.strictEqual(boosted.length, sampleItems.length);
  boosted.forEach(item => {
    assert.ok(typeof item.score === "number");
    assert.ok(item.regionalBoost === undefined || typeof item.regionalBoost === "number");
  });
});

test("valueIQModel: ranks catalog and returns top contributions & metadata", () => {
  const catalog = getCatalog();
  const reviewFeatures = getReviewFeatures();
  const intent = { occasion: "wedding", budget: 3000, priority: "quality" };

  const ranked = rankCatalog(catalog, intent, reviewFeatures);
  assert.ok(Array.isArray(ranked), "ranked catalog should be an array");
  assert.ok(ranked.length > 0, "ranked items should exist");

  const top1 = ranked[0];
  assert.ok(top1.product, "ranked item should contain product reference");
  assert.ok(typeof top1.score === "number", "score should be numeric");

  const top4 = topContributions(top1.contributions, 4);
  assert.ok(Array.isArray(top4));
  assert.ok(top4.length <= 4);

  const diverseTop = selectDiverseTop(ranked, { limit: 6 });
  assert.ok(diverseTop.length <= 6, "diverse selection should be capped at limit");

  assert.ok(modelMetadata.defaultWeights, "model metadata should contain default weights");
  assert.ok(modelMetadata.priorityPresets, "model metadata should contain priority presets");
});

test("explanationAssembly: constructs bullets and explanation text", () => {
  const catalog = getCatalog();
  const product = catalog[0];
  const contributions = [
    ["quality", { contribution: 20, rawValue: 85, weight: 0.25 }],
    ["valueForMoney", { contribution: 18, rawValue: 90, weight: 0.2 }]
  ];

  const explanation = buildExplanation(product, contributions, {}, "Great choice!", "QUALITY");
  assert.ok(explanation, "explanation object should be returned");
  assert.ok(Array.isArray(explanation.bullets), "explanation should contain bullets array");
  assert.ok(explanation.bullets.length > 0, "bullets array should not be empty");
});

test("askSomeone: manages social share creation and retrieval", () => {
  const share = createShare("prod_123", "Didi");
  assert.ok(share.id, "share should have an ID");
  assert.strictEqual(share.productId, "prod_123");
  assert.strictEqual(share.recipient, "Didi");
  assert.strictEqual(share.status, "pending");

  const retrieved = getShare(share.id);
  assert.ok(retrieved, "retrieved share should exist");
  assert.strictEqual(retrieved.id, share.id);

  const nonExistent = getShare("invalid_share_id");
  assert.strictEqual(nonExistent, null);
});
