const test = require("node:test");
const assert = require("node:assert");

let express;
try {
  express = require("express");
} catch {
  express = require("../backend/node_modules/express");
}

const apiRoutes = require("../backend/src/routes/api");

function setupServer() {
  const app = express();
  app.use(express.json());
  app.use("/api", apiRoutes);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const baseUrl = `http://localhost:${port}`;
      resolve({ server, baseUrl });
    });
  });
}

test("GET /api/health returns health status", async (t) => {
  const { server, baseUrl } = await setupServer();
  t.after(() => server.close());

  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.ok, true);
  assert.ok(typeof data.llmConfigured === "boolean");
  assert.ok(data.model);
});

test("GET /api/model-info returns ValueIQ model metadata", async (t) => {
  const { server, baseUrl } = await setupServer();
  t.after(() => server.close());

  const res = await fetch(`${baseUrl}/api/model-info`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.defaultWeights);
  assert.ok(data.priorityPresets);
});

test("POST /api/intent validates request and extracts intent", async (t) => {
  const { server, baseUrl } = await setupServer();
  t.after(() => server.close());

  // Missing message
  const badRes = await fetch(`${baseUrl}/api/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.strictEqual(badRes.status, 400);

  // Valid message
  const res = await fetch(`${baseUrl}/api/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Looking for a kurti for Rakhi under 1500" }),
  });
  assert.strictEqual(res.status, 200);
  const intent = await res.json();
  assert.ok(intent);
});

test("POST /api/shortlist returns top personalized recommendations", async (t) => {
  const { server, baseUrl } = await setupServer();
  t.after(() => server.close());

  const res = await fetch(`${baseUrl}/api/shortlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      occasion: "wedding",
      budget: 3000,
      priority: "quality",
      productType: "Kurta",
      state: "Rajasthan",
    }),
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.results));
  assert.ok(data.results.length <= 6);
  assert.ok(typeof data.scanned === "number");
  assert.ok(typeof data.candidatesScored === "number");

  if (data.results.length > 0) {
    const item = data.results[0];
    assert.ok(item.id);
    assert.ok(item.name);
    assert.ok(typeof item.score === "number");
    assert.ok(Array.isArray(item.bullets));
    assert.ok(item.breakdown);
  }
});

test("POST & GET /api/ask-someone handles social share workflow", async (t) => {
  const { server, baseUrl } = await setupServer();
  t.after(() => server.close());

  // Missing productId
  const badRes = await fetch(`${baseUrl}/api/ask-someone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.strictEqual(badRes.status, 400);

  // Create share
  const createRes = await fetch(`${baseUrl}/api/ask-someone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "prod_test", recipient: "Mummy" }),
  });
  assert.strictEqual(createRes.status, 200);
  const share = await createRes.json();
  assert.ok(share.id);
  assert.strictEqual(share.productId, "prod_test");
  assert.strictEqual(share.recipient, "Mummy");

  // Fetch share
  const fetchRes = await fetch(`${baseUrl}/api/ask-someone/${share.id}`);
  assert.strictEqual(fetchRes.status, 200);
  const fetched = await fetchRes.json();
  assert.strictEqual(fetched.id, share.id);

  // Invalid share ID
  const invalidRes = await fetch(`${baseUrl}/api/ask-someone/invalid_id_9999`);
  assert.strictEqual(invalidRes.status, 404);
});
