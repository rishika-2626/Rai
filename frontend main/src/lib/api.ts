// Same-origin "/api" by default (works with the dev proxy below, or when the
// frontend is served behind the same reverse proxy as the backend in prod).
// Override with VITE_API_BASE_URL if the backend lives on a different origin.
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

// Mirrors the /api/intent contract: occasion + budget always come back
// (possibly null if not detected), priority/productType only when the
// extractor was confident enough to infer them from the message.
export type Intent = {
  occasion: string | null;
  budget: number | null;
  priority?: string | null;
  productType?: string | null;
  state?: string | null;
  language?: string ;
  confidence?: number | null;
 
  translatedQuery?: string| null;
};

export type Product = {
  id: string;
  name: string;
  img: string; // emoji placeholder tile, not a photo URL -- see catalogAdapter.js
  price: number;
  comparableAvg?: number | null;
  score: number;
  worthItLabel?: string | null;
  bullets: string[];
  reviewNote?: string | null;
  regionalBoost?: number;
  breakdown?: {
    value:number;
    quality:number;
    reviews:number;
    seller:number;
    occasion:number;
    regional:number;
};
};

export const api = {
  extractIntent: (message: string): Promise<Intent> => post("/intent", { message }),
  getShortlist: (
    intent: Intent,
  ): Promise<{ results: Product[]; scanned?: number; totalScanned?: number; productsScanned?: number }> =>
    post("/shortlist", intent),
  askSomeone: (productId: string, recipient: string): Promise<{ id: string }> =>
    post("/ask-someone", { productId, recipient }),
  getShare: (id: string): Promise<{ status: string; reply?: { name: string; text: string } }> =>
    get(`/ask-someone/${id}`),
  health: (): Promise<{ ok: boolean; llmConfigured?: boolean; model?: { auc?: number } }> =>
    get("/health"),
};