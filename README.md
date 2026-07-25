<div align="center">

# 🛍️ Rai

### Shop with confidence, not with 5,000 tabs open.

**🤖 An AI Shopping Concierge for Bharat**

Built for **Myntra HackerRamp 2026** · Theme: *Build What's Next — Myntra for Bharat*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rai--orpin.vercel.app-FF4D5E?style=for-the-badge&logo=vercel&logoColor=white)](https://rai-orpin.vercel.app)

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini%20API-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

</div>

---

### 🎯 The one-line pitch

> The next 100 million online shoppers don't need more choices. They need confidence.
> Rai turns a natural-language shopping request into a small, explainable, personalized shortlist — instead of 5,000 products ranked by popularity.

<br/>

## 🎥 Demo

<div align="center">

![Rai demo](./docs/demo.gif)

*(Drop a screen recording at `docs/demo.gif` — this is the single highest-leverage thing you can add before judging.)*

**👉 Try it live: [rai-orpin.vercel.app](https://rai-orpin.vercel.app)**

</div>

<br/>

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Why Rai?](#-why-rai)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#️-architecture)
- [ValueIQ Engine](#-valueiq-engine)
- [What Makes Rai Different](#-what-makes-rai-different)
- [Impact](#-impact)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Future Roadmap](#-future-roadmap)

<br/>

## 🚨 The Problem

Today's online shopping journey for a first-time or occasional buyer looks like this:

```
🔍 Search hundreds of products
        ↓
📱 Browse endlessly
        ↓
⭐ Read conflicting reviews
        ↓
📞 Ask friends or family
        ↓
😕 Still unsure
```

For **Tier-2 and Tier-3 shoppers** especially, the barrier to purchase was never catalog size — it's **uncertainty**. More listings don't solve that. They make it worse.

<br/>

## 💡 Our Solution

```
💬 Describe what you need
        ↓
🧠 AI understands intent
        ↓
📊 Personalized ranking
        ↓
💡 Explainable recommendations
        ↓
🛍️ Buy confidently
```

Type a request the way you'd text a friend — *"Need something for Rakhi under ₹1500"* — and Rai hands back a handful of picks, each with a plain-English reason it made the cut.

<br/>

## 🚀 Why Rai?

| Traditional Shopping | Rai |
|---|---|
| Endless scrolling | Intent-first experience |
| Popularity ranking | ValueIQ ranking |
| Generic recommendations | Personalized recommendations |
| Black-box algorithms | Explainable AI |
| English-first | Multilingual |
| Browse thousands | Curated shortlist of 6 |

<br/>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 AI Intent Understanding
Understands natural language like *"Need something for Rakhi under ₹1500"* and extracts occasion, budget, product type, priority, state, and language — no filter forms.

</td>
<td width="50%" valign="top">

### 💬 Adaptive Conversation
Rai only asks what it couldn't confidently infer — usually just budget, priority, or state. No 12-field filter panel.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📊 ValueIQ Recommendation Engine
Scores every product on value, quality, reviews, seller trust, occasion match, and regional relevance — not clicks or sponsorship.

</td>
<td width="50%" valign="top">

### 🎯 Context-Aware Personalization
Budget filtering, occasion-aware ranking, product type matching, and diversity selection replace generic popularity sorting.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🇮🇳 Regional Personalization
Adapts to state, festivals, traditional styles, regional colors, and preferred fabrics — Bharat isn't one shopper.

</td>
<td width="50%" valign="top">

### 🌐 Multilingual Experience
Detects query language, understands multilingual input, and localizes the entire interface.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 💡 Explainable AI
Every pick comes with why-it-was-chosen, review highlights, a full ValueIQ breakdown, and regional reasoning. No black boxes.

</td>
<td width="50%" valign="top">

### ❤️ Similar Products
Every product page suggests close alternatives, making exploration easy without re-overwhelming the shopper.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤝 Ask Someone
Shopping is social. Share a recommendation with family or friends before buying, right inside the app.

</td>
<td width="50%" valign="top">

### ⚡ Six, Not Five Thousand
No infinite scroll. A capped, ranked shortlist every time — decision fatigue by design isn't a feature.

</td>
</tr>
</table>

<br/>

## 📸 Screenshots

| Landing Page | Recommendation Shelf |
|---|---|
| ![Landing](./docs/screenshots/landing.png) | ![Shelf](./docs/screenshots/shelf.png) |

| Product Details | ValueIQ Breakdown |
|---|---|
| ![Product Details](./docs/screenshots/product-detail.png) | ![Breakdown](./docs/screenshots/valueiq-breakdown.png) |

| Ask Someone |
|---|
| ![Ask Someone](./docs/screenshots/ask-someone.png) |

*(Add PNGs at the paths above — `docs/screenshots/`. Real screenshots here matter as much as the demo GIF for judging.)*

<br/>

## 🏗️ Architecture

```
                    User Query
                        │
                        ▼
              Intent Extraction (Gemini)
                        │
                        ▼
                Adaptive Questions
                        │
                        ▼
                  ValueIQ Engine
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  Budget Filter   Occasion Engine   Regional Engine
        │               │               │
        └───────────────┼───────────────┘
                        ▼
                Diversity Selection
                        │
                        ▼
                 Explainable AI
                        │
                        ▼
        Top 6 Personalized Recommendations
```

<br/>

## 📈 ValueIQ Engine

ValueIQ is Rai's recommendation engine — a trained logistic regression model that combines six signals into one transparent score:

```
                    Worth It Score
                         │
        ┌───────┬────────┼────────┬───────┬────────┐
        ▼       ▼        ▼        ▼       ▼        ▼
     💰 Value  ⭐ Quality 📝 Reviews 🏪 Seller 🎯 Occasion 📍 Region
```

No single signal decides the score, and every one of them is shown to the shopper — not just the final number.

<br/>

## 🧠 What Makes Rai Different?

Unlike traditional shopping assistants, Rai deliberately separates:

- ✔️ **AI** — for understanding intent (Gemini)
- ✔️ **Deterministic scoring** — for the actual recommendation (ValueIQ)

That split means every recommendation is **explainable, reproducible, and trustworthy** — the model doesn't hallucinate a ranking, it computes one, and shows its work.

<br/>

## 📈 Impact

<table>
<tr>
<td width="50%" valign="top">

### For Shoppers
- ✅ Less decision fatigue
- ✅ Better confidence before purchase
- ✅ Genuinely personalized shopping
- ✅ Regional relevance, not one-size-fits-India

</td>
<td width="50%" valign="top">

### For Myntra
- ✅ Higher conversion
- ✅ Lower cart/decision abandonment
- ✅ Stronger shopper trust
- ✅ A real on-ramp for Bharat adoption

</td>
</tr>
</table>

<br/>

## 🛠 Tech Stack

| Frontend | Backend | AI | ML / Personalization |
|---|---|---|---|
| React | Node.js | Gemini API | Logistic Regression (ValueIQ) |
| TypeScript | Express | LLM Intent Extraction | Occasion Engine |
| TanStack Router | REST API | | Regional Engine |
| Tailwind CSS | | | Budget Filtering |
| Vite | | | Diversity Selection |

<br/>

## 📂 Project Structure

```
backend/
 ├── ml/          # ValueIQ logistic regression model
 ├── services/    # Intent extraction, scoring, personalization
 ├── routes/      # /intent, /shortlist, /ask-someone, /health
 └── data/

frontend/
 ├── routes/      # Pages (landing, shelf, product detail)
 ├── components/  # ProductCard, ValueIQ breakdown, etc.
 ├── lib/         # API client
 └── styles/
```

<br/>

## 🚀 Getting Started

**Live demo:** [rai-orpin.vercel.app](https://rai-orpin.vercel.app) — no setup needed to try it.

To run locally:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

<br/>

## 🔮 Future Roadmap

- 🎙️ Voice-first shopping
- 📦 Delivery confidence prediction
- 📏 Size & fit recommendations
- 🧠 Fashion memory across sessions
- 👗 Creator-driven recommendations
- 💬 WhatsApp integration
- 📈 Seller insights dashboard

<br/>

---

<div align="center">

### ❤️ Built for Myntra HackerRamp 2026

**Theme:** Build What's Next — Myntra for Bharat

Rai helps Bharat's next 100 million shoppers buy with confidence — through AI-powered, personalized, and explainable recommendations, instead of endless choice.

**[rai-orpin.vercel.app](https://rai-orpin.vercel.app)**

</div>