const cityMappings = require("../data/cityMappings.json");

const FESTIVAL_STATE_SIGNALS = [
  { keyword: "onam", state: "Kerala", confidence: 0.95 },
  { keyword: "bathukamma", state: "Telangana", confidence: 0.95 },
  { keyword: "bihu", state: "Assam", confidence: 0.93 },
  { keyword: "durga puja", state: "West Bengal", confidence: 0.93 },
  { keyword: "pongal", state: "Tamil Nadu", confidence: 0.93 },
  { keyword: "kasavu", state: "Kerala", confidence: 0.9 },
  { keyword: "phulkari", state: "Punjab", confidence: 0.9 },
  { keyword: "navratri", state: "Gujarat", confidence: 0.87 },
  { keyword: "baisakhi", state: "Punjab", confidence: 0.88 },
  { keyword: "lohri", state: "Punjab", confidence: 0.88 },
  { keyword: "gudi padwa", state: "Maharashtra", confidence: 0.87 },
  { keyword: "bandhani", state: "Gujarat", confidence: 0.85 },
  { keyword: "sambalpuri", state: "Odisha", confidence: 0.9 },
  { keyword: "chikankari", state: "Uttar Pradesh", confidence: 0.85 },
  { keyword: "madhubani", state: "Bihar", confidence: 0.85 },
  { keyword: "ganesh chaturthi", state: "Maharashtra", confidence: 0.7 },
  { keyword: "ugadi", state: "Karnataka", confidence: 0.55 },
  { keyword: "teej", state: "Rajasthan", confidence: 0.65 },
];

function inferStateFromQuery(query) {
  const q = query.toLowerCase();

  for (const [city, state] of Object.entries(cityMappings)) {
    if (q.includes(city.toLowerCase())) {
      return {
        state,
        confidence: 0.95,
        source: "city",
      };
    }
  }

  let best = {
    state: null,
    confidence: 0,
    source: "none",
  };

  for (const signal of FESTIVAL_STATE_SIGNALS) {
    if (q.includes(signal.keyword) && signal.confidence > best.confidence) {
      best = {
        state: signal.state,
        confidence: signal.confidence,
        source: "festival",
      };
    }
  }

  return best;
}

module.exports = {
  inferStateFromQuery,
};