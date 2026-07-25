# Rai — AI Shopping Concierge for Value-Conscious Shopping

> "The next 100 million shoppers don't need more choices. They need confidence that every rupee they spend is worth it."

Rai is a working MVP built for [Myntra HackerRamp]. It replaces an infinite product grid with a
short, explained, confidence-ranked shortlist, and adds a lightweight social-confirmation step
("Ask Someone") that lets a first-time shopper check with a trusted person before buying —
without leaving the app.

This repo is a **real, runnable full-stack app**, not a static mockup: a Node/Express backend
with a live LLM-backed scoring/explanation pipeline, and a React frontend that calls it over
HTTP.

---

## Problem this solves

Bharat (Tier-2/Tier-3) shoppers are underserved on both ends of the funnel: many never open
Myntra in the first place, and those who do are met with a shelf tuned for metro browsing
habits — thousands of results ranked by popularity, with no help translating a vague need
("something for Rakhi") into a confident purchase decision. Decision fatigue and a lack of
first-purchase trust (fit, returns, delivery reliability) are bigger blockers here than pure
product relevance.

## What Rai does differently

1. **Intent-first entry** — the user describes their need in plain language ("Need something
   for Rakhi under ₹1200"), not product-catalog vocabulary.
2. **Two adaptive follow-up questions** instead of a filter panel.
3. **ValueIQ Engine** — a transparent, explainable scoring formula that ranks products by
   *likely purchase satisfaction* (price competitiveness, review-derived quality, occasion
   match, return/COD trust, budget fit), not by clicks or popularity.
4. **Confidence Shelf** — six ranked picks, each with a plain-language "why this is worth it"
   explanation grounded in real signal (price delta, return rate, delivery time, review
   synthesis).
5. **Ask Someone** — a first-time buyer can share the shortlist with a trusted person and get a
   reply inside the app, standing in for the household/friend-group decision-making that
   first-time online shoppers often rely on in place of platform trust they haven't built up
   yet.

## Architecture

```
frontend (React + Vite)              backend (Node + Express)
──────────────────────               ──────────────────────────
Intent input                 ──POST /api/intent──►  extractIntent()
                                                      → Claude (Anthropic API) or
                                                        keyword-heuristic fallback

Adaptive questions

Confidence Shelf             ──POST /api/shortlist─►  1. getReviewFeatures() — reads a
                                                          precomputed, CACHED per-product
                                                          feature set (sentiment, durability,
                                                          fit) mined by Claude (or heuristic
                                                          fallback) ONCE, not per request
                                                       2. rankCatalog() — scores every product
                                                          with the TRAINED ValueIQ model
                                                          (logistic regression, see below):
                                                          fast, deterministic, no network call
                                                       3. buildExplanation() — templates the
                                                          model's own feature attributions
                                                          into readable bullets (no LLM call)

Ask Someone modal            ──POST /api/ask-someone► createShare() (in-memory store,
                              ──GET  /api/ask-someone/:id  simulated reply after a short delay)
```

### The ValueIQ model — trained, not hand-set

Ranking is a **logistic regression model trained offline** (`backend/ml/train_model.py`), not a
hand-picked weighted formula. Inference happens in pure JS at request time
(`backend/src/services/valueIQModel.js`): `sigmoid(w · standardize(x) + b)`, where `w` and `b`
are the actual coefficients learned during training (see `backend/src/data/valueiq_weights.json`).

**Features the model uses:** `price_ratio`, `sentiment` (from review mining), `durability_flag`,
`fit_flag`, `trust_score` (return rate + COD), `occasion_match`, `budget_fit`.

**Training data — disclosed methodology:** we do not have access to real Myntra purchase-
satisfaction labels. `train_model.py` generates a synthetic dataset (6,000 samples) with a
deliberately nonlinear, noisy ground-truth relationship between these features and a "worth it"
outcome, then trains a standard `sklearn` `LogisticRegression` on it. This is disclosed
explicitly rather than presented as real-data performance — it stands in for the return/review/
repurchase signals Myntra has at scale but that weren't available for this MVP. Current model
performance on a held-out synthetic test set: **AUC 0.77, accuracy 71%, Brier score 0.20** (see
`backend/ml/valueiq_weights.json` → `metrics`, also exposed live at `GET /api/model-info`).

**Why this design, not a bigger black-box model:** logistic regression keeps every prediction
linearly decomposable into per-feature contributions, which is what directly powers the "why
this scored X" explanation panel (`backend/src/services/explanationAssembly.js`) — the
explanation is guaranteed to match what the model actually computed, with no separate
LLM call (and no hallucination risk) needed at explanation time.

**Why the LLM is decoupled from scoring:** review mining (`backend/src/services/reviewFeatures.js`)
runs once per product and is cached to disk (`review_features_cache.json`), not once per
request. This is what makes `/api/shortlist` fast and fully deterministic — repeated calls with
the same intent return identical rankings, and scoring 40 products costs a handful of JS dot
products, not 40 sequential LLM calls. Regenerate the cache after editing the catalog:
```bash
node src/services/reviewFeatures.js
```

### Fallback mode

If `ANTHROPIC_API_KEY` is not set, `backend/src/services/llm.js` and
`backend/src/services/reviewFeatures.js` fall back to deterministic keyword/heuristic logic, so
the app — including the trained ValueIQ model, which never depends on a live LLM call — runs
end-to-end for anyone cloning the repo without credentials. The frontend shows a small
"● Live LLM" / "● Heuristic review-mining" indicator alongside the model's AUC.

## Tech stack & third-party dependencies

| Layer | Choice | License |
|---|---|---|
| Backend runtime | Node.js 18+, Express 4 | MIT |
| HTTP/CORS | `cors` | MIT |
| Env config | `dotenv` | BSD-2-Clause |
| Frontend | React 18, Vite 5 | MIT |
| Icons | `lucide-react` | ISC |
| LLM | Anthropic Messages API (`claude-sonnet-4-6`), called directly via `fetch` — no SDK dependency | Anthropic API Terms apply to usage, not to this codebase |

No other third-party services, scrapers, or proprietary datasets are used. Product data in
`backend/src/data/catalog.json` is a small hand-authored seed set (6 items) for demo purposes,
not scraped from Myntra or any live platform.

All first-party code in this repository is released under the MIT License — see [`LICENSE`](./LICENSE).

## Setup

### Prerequisites
- Node.js 18+
- (Optional) an Anthropic API key for live LLM calls — https://console.anthropic.com

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Optionally add your ANTHROPIC_API_KEY to .env — the app runs without one, in fallback mode
npm run dev
```
Backend runs on `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies `/api/*` to the backend.

Open `http://localhost:5173` in a browser.

## Demo flow

1. Type "Need something for Rakhi under ₹1200" (or tap a suggestion chip).
2. Answer two quick questions (priority, timing).
3. View the 6-item Confidence Shelf, ranked by ValueIQ score.
4. Open a product to see the full score breakdown and the "why this is worth it" explanation.
5. Tap "Ask someone" → "Send to Didi" → watch the simulated reply arrive.

## What's intentionally out of scope for this MVP

- Real product catalog / live Myntra inventory integration
- Real messaging provider for "Ask Someone" (currently simulated server-side)
- User accounts, persistent order history, payments
- Vernacular/regional-language input parsing beyond what the LLM handles natively

These are natural next steps, not required to demonstrate the core thesis end-to-end.

## Project structure

```
rai-mvp/
├── backend/
│   ├── server.js
│   ├── ml/
│   │   ├── train_model.py            # trains the ValueIQ logistic regression model
│   │   ├── generate_catalog.py       # expands the seed catalog for demo variety
│   │   └── valueiq_weights.json      # training output (copied into src/data/)
│   ├── src/
│   │   ├── routes/api.js
│   │   ├── services/valueIQModel.js       # trained-model inference (JS, deterministic)
│   │   ├── services/reviewFeatures.js     # cached, decoupled review mining
│   │   ├── services/explanationAssembly.js # templates model attributions into bullets
│   │   ├── services/llm.js                # Anthropic API wrapper + intent extraction
│   │   ├── services/askSomeone.js         # share/reply simulation
│   │   └── data/
│   │       ├── catalog.json               # 40-product seed catalog
│   │       ├── valueiq_weights.json       # trained model coefficients
│   │       └── review_features_cache.json # cached per-product review features
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── api.js
└── README.md
```

## Retraining the model

```bash
cd backend/ml
python3 train_model.py            # retrains on synthetic data, writes valueiq_weights.json
cp valueiq_weights.json ../src/data/valueiq_weights.json
cd ..
node src/services/reviewFeatures.js   # rebuild the review-feature cache if the catalog changed
```
Requires `scikit-learn`, `numpy`, and `pandas` (`pip install scikit-learn numpy pandas`).
