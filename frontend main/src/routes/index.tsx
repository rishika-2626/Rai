import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { api, type Intent, type Product } from "@/lib/api";
import { getText } from "@/lib/i18n";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rai — Shop with confidence, not with 5,000 tabs open" },
      {
        name: "description",
        content:
          "Rai is a considered shopping companion. Six best-value picks, scored by ValueIQ — not five thousand products ranked by popularity.",
      },
      { property: "og:title", content: "Rai — Shop with confidence" },
      {
        property: "og:description",
        content:
          "Six best-value picks, scored by ValueIQ. Ask someone you trust before you buy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "intent" | "questions" | "loading" | "shelf" | "error";
type AskableField = "priority" | "budget" | "state";

const BUDGET_PRESETS = [500, 1000, 2000, 5000];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

// Stable, language-independent identifiers. Display labels are looked up
// from lang.categories[key] at render time — only the emoji stays hardcoded.
type CategoryKey = keyof ReturnType<typeof getText>["categories"];

const CATEGORIES: { emoji: string; key: CategoryKey }[] = [
  { emoji: "💼", key: "work" },
  { emoji: "🎉", key: "festivals" },
  { emoji: "🎓", key: "college" },
  { emoji: "💍", key: "weddings" },
  { emoji: "✈️", key: "travel" },
  { emoji: "🏋️", key: "fitness" },
  { emoji: "🎁", key: "gifting" },
];

// Only these two fields are ever asked about — they're the only ones the
// backend's shortlist endpoint actually consumes beyond occasion/productType,
// which the intent extractor already fills in from the free-text query.
function getQuestionSet(intent: Intent | null, lang: ReturnType<typeof getText>) {
  if (!intent) return lang.questions.sets.default;

  const occasion = intent.occasion?.toLowerCase() ?? "";
  const product = intent.productType?.toLowerCase() ?? "";

  if (occasion.includes("office") || occasion.includes("work")) {
    return lang.questions.sets.office;
  }

  if (
    occasion.includes("rakhi") ||
    occasion.includes("festival") ||
    occasion.includes("diwali") ||
    occasion.includes("wedding")
  ) {
    return lang.questions.sets.festive;
  }

  if (
    product.includes("shoe") ||
    product.includes("sneaker") ||
    product.includes("footwear")
  ) {
    return lang.questions.sets.footwear;
  }

  if (occasion.includes("gift")) {
    return lang.questions.sets.gifting;
  }

  return lang.questions.sets.default;
}

function getBudgetQuestion(intent: Intent | null, lang: ReturnType<typeof getText>) {
  const occasion = intent?.occasion?.toLowerCase() ?? "";

  if (occasion.includes("office")) return lang.questions.budgetQuestions.office;
  if (occasion.includes("rakhi")) return lang.questions.budgetQuestions.rakhi;
  if (occasion.includes("wedding")) return lang.questions.budgetQuestions.wedding;
  if (occasion.includes("gift")) return lang.questions.budgetQuestions.gift;

  return lang.questions.budgetQuestions.default;
}

const TILE_TINTS = [
  "bg-[oklch(0.92_0.06_22)]",
  "bg-[oklch(0.93_0.05_75)]",
  "bg-[oklch(0.93_0.05_150)]",
  "bg-[oklch(0.92_0.05_300)]",
  "bg-[oklch(0.94_0.04_45)]",
  "bg-[oklch(0.93_0.05_200)]",
];

function ConfidenceRing({ value, size = 52 }: { value: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono-tight font-bold text-white"
        style={{ fontSize: size * 0.28 }}
      >
        {value}
      </div>
    </div>
  );
}
function badgeForBullet(text: string, lang: ReturnType<typeof getText>) {
  const t = text.toLowerCase();

  if (t.includes("value"))
    return {
      emoji: "💰",
      label: lang.badges.greatValue,
      color: "bg-green-100 text-green-700",
    };

  if (t.includes("quality"))
    return {
      emoji: "⭐",
      label: lang.badges.premium,
      color: "bg-yellow-100 text-yellow-700",
    };

  if (t.includes("comfort"))
    return {
      emoji: "☁️",
      label: lang.badges.comfort,
      color: "bg-blue-100 text-blue-700",
    };

  if (t.includes("seller"))
    return {
      emoji: "🤝",
      label: lang.badges.trustedSeller,
      color: "bg-purple-100 text-purple-700",
    };

  if (t.includes("delivery"))
    return {
      emoji: "🚚",
      label: lang.badges.fastDelivery,
      color: "bg-orange-100 text-orange-700",
    };

  if (t.includes("return"))
    return {
      emoji: "🔁",
      label: lang.badges.lowReturns,
      color: "bg-emerald-100 text-emerald-700",
    };

  if (t.includes("durable"))
    return {
      emoji: "🛡️",
      label: lang.badges.durable,
      color: "bg-slate-100 text-slate-700",
    };

  if (t.includes("fit"))
    return {
      emoji: "👌",
      label: lang.badges.greatFit,
      color: "bg-cyan-100 text-cyan-700",
    };

  return {
    emoji: "✨",
    label: lang.badges.recommended,
    color: "bg-primary-soft text-primary",
  };
}
function ProductCard({ item, onOpen, index, lang }: { item: Product; onOpen: (p: Product) => void; index: number; lang: ReturnType<typeof getText> }) {
  const tint = TILE_TINTS[index % TILE_TINTS.length];
  return (
    <button
      onClick={() => onOpen(item)}
      className="group fade-up card-hover flex flex-col text-left"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className={`relative overflow-hidden rounded-[1.75rem] ${tint} aspect-[4/5] flex items-center justify-center shadow-sm ring-1 ring-black/[0.04] transition-all duration-500 group-hover:shadow-xl group-hover:ring-primary/20`}>
        <div className="text-[110px] leading-none transition-transform duration-700 ease-out group-hover:scale-110">
          {item.img}
        </div>
        {index === 0 && (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
            {lang.product.topPick}
          </span>
        )}
        <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-md backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-white hover:shadow-lg">
          <Heart size={15} />
        </span>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-ink/85 px-3 py-1.5 text-white shadow-xl backdrop-blur-sm">
          <ConfidenceRing value={item.score} size={32} />
          <div className="pr-2">
            <div className="text-[9px] uppercase tracking-widest opacity-75">ValueIQ</div>
            <div className="text-[11px] font-bold">{item.worthItLabel ?? lang.product.excellentBuy}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-primary">
              {item.name}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.bullets.slice(0, 2).map((bullet) => {
                const badge = badgeForBullet(bullet, lang);
                return (
                  <span key={bullet} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.color}`}>
                    {badge.emoji} {badge.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono-tight text-xl font-bold text-primary">₹{item.price}</div>
            {!!item.comparableAvg && item.comparableAvg > item.price && (
              <>
                <div className="text-xs line-through text-ink-soft">₹{item.comparableAvg}</div>
                <div className="mt-1 inline-flex rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest">
                  {lang.product.save} ₹{item.comparableAvg - item.price}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// Selects up to 3 similar products from the existing shortlist results —
// no new API call. Prefers same productType (falling back to category),
// excluding the current item, prioritizing prices within ±25%, and filling
// any remaining slots with the closest-priced products from the shortlist.
type ProductWithTypeInfo = Product & { productType?: string; category?: string };

function getSimilarProducts(current: Product, allResults: Product[]): Product[] {
  const currentTyped = current as ProductWithTypeInfo;
  const others = (allResults as ProductWithTypeInfo[]).filter((p) => p.id !== current.id);

  const sameGroup = others.filter((p) => {
    if (currentTyped.productType) return p.productType === currentTyped.productType;
    if (currentTyped.category) return p.category === currentTyped.category;
    return false;
  });

  const withinBudget = sameGroup.filter(
    (p) => Math.abs(p.price - current.price) <= current.price * 0.25
  );
  const withinBudgetIds = new Set(withinBudget.map((p) => p.id));
  const restOfGroup = sameGroup.filter((p) => !withinBudgetIds.has(p.id));

  const ranked = [...withinBudget, ...restOfGroup];
  const rankedIds = new Set(ranked.map((p) => p.id));

  const closestOverall = others
    .filter((p) => !rankedIds.has(p.id))
    .sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price));

  return [...ranked, ...closestOverall].slice(0, 3);
}
function BreakdownBar({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-ink-muted">
          {icon} {label}
        </span>
        <span className="font-mono-tight font-semibold text-ink">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary to-[oklch(0.58_0.26_12)] transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LoadingScreen({ lang }: { lang: ReturnType<typeof getText> }) {
  const steps = lang.loading.steps;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fade-in mx-auto mt-28 flex max-w-md flex-col items-center gap-8 text-center">
      <div className="relative grid h-20 w-20 place-items-center">
        <div className="absolute inset-0 rounded-full bg-primary-soft pulse-soft" />
        <Loader2 size={28} className="spin relative text-primary" />
      </div>
      <div>
        <div className="font-display text-xl text-ink">{steps[step]}</div>
        <p className="mt-2 text-[13.5px] text-ink-muted">{lang.loading.caption}</p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= step ? "w-8 bg-primary" : "w-3 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StageBadge({ stage, lang }: { stage: Stage; lang: ReturnType<typeof getText> }) {
  const labels: Record<Stage, string | null> = {
    intent: null,
    questions: lang.stageBadges.personalizing,
    loading: lang.stageBadges.findingPicks,
    shelf: lang.stageBadges.yourShortlist,
    error: null,
  };
  const label = labels[stage];
  if (!label) return null;
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono-tight text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:inline-flex">
      <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-soft" />
      {label}
    </span>
  );
}

function ProductDetail({
    item,
    onBack,
    onAskSomeone,
    lang,
    results,
    onOpen,
    state,
}: {
    item: Product;
    onBack: () => void;
    onAskSomeone: (p: Product) => void;
    lang: ReturnType<typeof getText>;
    results: Product[];
    onOpen: (p: Product) => void;
    state?: string;
}) {
  const similarProducts = getSimilarProducts(item, results);
  return (
    <div className="mx-auto max-w-4xl fade-up">
      <button
        onClick={onBack}
        className="group mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-all hover:border-primary hover:bg-primary-soft/40 hover:text-primary"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> {lang.product.back}
      </button>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-soft via-blush to-surface-muted shadow-lg ring-1 ring-line flex items-center justify-center">
          <div className="text-[220px] leading-none float">{item.img}</div>
          <span className="absolute left-5 top-5 rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
            {lang.product.valueIQPick}
          </span>
        </div>

        <div className="flex flex-col">
          <h2 className="font-display text-3xl font-medium leading-tight text-ink md:text-4xl">{item.name}</h2>

          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14} className="fill-accent text-accent" />
            ))}
            <span className="ml-1 font-mono-tight text-[12px] text-ink-muted">
              {item.score} ValueIQ · {item.worthItLabel || lang.product.worthItFallback}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-mono-tight text-4xl font-bold text-primary">₹{item.price}</span>
            {!!item.comparableAvg && item.comparableAvg > item.price && (
              <>
                <span className="font-mono-tight text-sm text-ink-soft line-through">₹{item.comparableAvg}</span>
                <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-forest">
                  {lang.product.save} ₹{item.comparableAvg - item.price}
                </span>
              </>
            )}
          </div>

          {item.reviewNote && (
            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary-soft/50 p-5">
              <div className="font-mono-tight text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">
                {lang.product.whyWorthIt}
              </div>
              <p className="mt-2 font-display text-lg italic leading-snug text-ink">&ldquo;{item.reviewNote}&rdquo;</p>
            </div>
          )}

          {item.regionalBoost > 0 && state && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
              <div className="font-semibold text-orange-700">🇮🇳 {lang.product.regionalMatch}</div>
              <p className="mt-1 text-sm text-ink-muted">
                {lang.product.regionalMatchBody.replace("{state}", state)}
              </p>
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {item.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-soft">
                  <Check size={12} className="text-forest" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          {item.breakdown && (
            <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm">
              <h3 className="font-display text-xl">{lang.breakdown.heading}</h3>
              <p className="mb-5 mt-1 text-sm text-ink-muted">{lang.breakdown.subheading}</p>
              <div className="space-y-4">
                <BreakdownBar icon="💰" label={lang.breakdown.value} value={item.breakdown.value} />
                <BreakdownBar icon="⭐" label={lang.breakdown.quality} value={item.breakdown.quality} />
                <BreakdownBar icon="📝" label={lang.breakdown.reviews} value={item.breakdown.reviews} />
                <BreakdownBar icon="🏪" label={lang.breakdown.sellerTrust} value={item.breakdown.seller} />
                <BreakdownBar icon="🎯" label={lang.breakdown.occasionMatch} value={item.breakdown.occasion} />
                {item.breakdown.regional > 0 && (
                  <BreakdownBar icon="📍" label={lang.breakdown.regionalMatch} value={item.breakdown.regional} />
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold">
              <ShoppingBag size={16} />
              {lang.product.addToBag}
            </button>
            <button
              onClick={() => onAskSomeone(item)}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-transparent px-6 py-3.5 text-sm font-bold text-ink transition-all hover:bg-ink hover:text-background hover:shadow-lg"
            >
              <Users size={16} /> {lang.product.askSomeone}
            </button>
          </div>

          <div className="mt-5 text-[11.5px] leading-relaxed text-ink-soft">
            {lang.product.scoreDisclaimer}
          </div>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-medium text-ink">
            {lang.explanations.similarProducts}
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-muted">
            {lang.explanations.youMayAlsoLike}
          </p>

          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {similarProducts.map((p, i) => (
              <ProductCard key={p.id} item={p} index={i + 1} onOpen={onOpen} lang={lang} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AskSomeoneModal({
  item,
  onClose,
  lang,
}: {
  item: Product;
  onClose: () => void;
  lang: ReturnType<typeof getText>;
}) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "pending" | "replied">("idle");
  const [reply, setReply] = useState<{ name: string; text: string } | null>(null);

  const send = async () => {
    setStatus("sending");
    try {
      const share = await api.askSomeone(item.id, "Didi");
      setShareId(share.id);
      setStatus("pending");
    } catch {
      setStatus("idle");
    }
  };

  useEffect(() => {
    if (status !== "pending" || !shareId) return;
    const interval = setInterval(async () => {
      const share = await api.getShare(shareId);
      if (share.status === "replied" && share.reply) {
        setReply(share.reply);
        setStatus("replied");
        clearInterval(interval);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [status, shareId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-md sm:items-center sm:p-5 fade-in"
      onClick={onClose}
    >
      <div
        className="scale-in w-full max-w-sm rounded-t-[2rem] border border-line bg-surface p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
              <MessageCircle size={16} className="text-primary" />
            </div>
            <div className="font-display text-lg font-medium text-ink">{lang.askSomeone.title}</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition hover:bg-surface-muted hover:text-ink"
            aria-label={lang.askSomeone.close}
          >
            <X size={18} />
          </button>
        </div>

        {status === "idle" && (
          <>
            <p className="mb-4 text-[13.5px] leading-relaxed text-ink-muted">
              {lang.askSomeone.description}
            </p>
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-primary-soft/40 p-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface text-2xl shadow-sm">{item.img}</div>
              <div className="text-[13px] font-medium leading-snug text-ink">{item.name}</div>
            </div>
            <button
              onClick={send}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold"
            >
              <Share2 size={15} /> {lang.askSomeone.sendTo.replace("{name}", "Didi")}
            </button>
          </>
        )}

        {status === "sending" && (
          <div className="flex items-center justify-center gap-3 py-8 text-[13.5px] text-ink-muted">
            <Loader2 size={18} className="spin text-primary" /> {lang.askSomeone.sending}
          </div>
        )}

        {(status === "pending" || status === "replied") && (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-full bg-surface-muted px-3 py-2 text-[12.5px] text-ink-soft">
              <MessageCircle size={13} className="text-primary" /> {lang.askSomeone.sentTo.replace("{name}", "Didi")}
            </div>
            {status === "pending" ? (
              <div className="flex items-center gap-2 py-4 text-[13.5px] italic text-ink-soft">
                <span className="flex gap-1">
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="loading-dot h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {lang.askSomeone.waitingForReply}
              </div>
            ) : reply ? (
              <div className="rounded-2xl border border-primary/10 bg-primary-soft/50 p-4 text-[14px] leading-relaxed text-ink">
                <div className="mb-1 font-mono-tight text-[11px] font-bold uppercase tracking-wider text-primary">
                  {reply.name}
                </div>
                {reply.text}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Index() {
  const [stage, setStage] = useState<Stage>("intent");
  const [inputValue, setInputValue] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [missingFields, setMissingFields] = useState<AskableField[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [scanned, setScanned] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<Product | null>(null);
  const [askModal, setAskModal] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [health, setHealth] = useState<Awaited<ReturnType<typeof api.health>> | null>(null);
  const [activeCat, setActiveCat] = useState("All");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lang = getText(intent?.language);
  const currentQuestionSet = getQuestionSet(intent, lang);
  const filteredStates = INDIAN_STATES.filter((state) =>
  state.toLowerCase().includes(stateSearch.toLowerCase())
);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  useEffect(() => {
    if (stage === "intent") inputRef.current?.focus();
  }, [stage]);

  const fetchShortlist = async (finalIntent: Intent) => {
    setStage("loading");
    try {
      const { results, scanned, totalScanned, productsScanned } = await api.getShortlist({
        occasion: finalIntent.occasion,
    budget: finalIntent.budget,
    priority: finalIntent.priority,
    productType: finalIntent.productType,
    state: finalIntent.state,
      });
      setResults(results);
      setScanned(scanned ?? totalScanned ?? productsScanned ?? null);
      setStage("shelf");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStage("error");
    }
  };

  const submitIntent = async (text: string) => {
    setStage("questions");
    setQIndex(0);
    setBudgetInput("");
    try {
      const extracted = await api.extractIntent(text);
      setIntent(extracted);
      const missing: AskableField[] = [];

if (!extracted.priority)
    missing.push("priority");

if (!extracted.budget)
    missing.push("budget");

// Ask only if Rai couldn't confidently infer it.
if (!extracted.state || (extracted.confidence ?? 0) < 0.85) {
    missing.push("state");
}
      setMissingFields(missing);
      if (missing.length === 0) fetchShortlist(extracted);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStage("error");
    }
  };

  const answer = (field: AskableField, value: string | number) => {
    const updated: Intent = { ...(intent as Intent), [field]: value };
    setIntent(updated);
    if (qIndex < missingFields.length - 1) {
      setQIndex(qIndex + 1);
      return;
    }
    fetchShortlist(updated);
  };

  const reset = () => {
    setStage("intent");
    setInputValue("");
    setIntent(null);
    setMissingFields([]);
    setQIndex(0);
    setBudgetInput("");
    setResults([]);
    setScanned(null);
    setOpenItem(null);
    setErrorMsg("");
    setStateSearch("");
  };

  return (
    <div className="min-h-screen page-bg bg-background">
      <header className="glass sticky top-0 z-30 border-b border-line/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
          <button onClick={reset} className="group flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              R
            </div>
            <div className="text-left leading-tight">
              <div className="font-display text-[18px] font-semibold text-ink">Rai</div>
              <div className="font-mono-tight text-[9.5px] uppercase tracking-[0.22em] text-ink-soft">
                {lang.nav.tagline}
              </div>
            </div>
          </button>

          <nav className="hidden md:flex">
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-primary-soft/60 hover:text-primary"
            >
              {lang.nav.howItWorks}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <StageBadge stage={stage} lang={lang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        {stage === "intent" && (
          <>
            <section className="fade-up overflow-hidden rounded-[2.5rem] hero-gradient p-8 text-primary-foreground shadow-2xl shadow-primary/20 sm:p-12">
              <div className="grid items-center gap-8 md:grid-cols-[1.15fr_1fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-mono-tight text-[10.5px] font-semibold uppercase tracking-[0.22em] backdrop-blur">
                    <Sparkles size={12} /> {lang.hero.badge}
                  </div>
                  <h1 className="mt-5 font-display text-[40px] font-medium leading-[1.02] tracking-tight sm:text-[58px]">
                    {lang.hero.titleLine1} <em className="not-italic text-accent">{lang.hero.titleEmphasis}</em>{" "}
                    {lang.hero.titleLine2}
                  </h1>
                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/90">
                    {lang.hero.subtitle}
                  </p>

                  <div className="mt-8 flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-ink shadow-2xl ring-1 ring-white/50 transition-shadow focus-within:shadow-primary/25 focus-within:ring-primary/30">
                    <Search size={16} className="shrink-0 text-ink-soft" />
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inputValue.trim()) submitIntent(inputValue.trim());
                      }}
                      placeholder={lang.hero.searchPlaceholder}
                      className="flex-1 bg-transparent py-2.5 text-[14.5px] text-ink placeholder:text-ink-soft focus:outline-none"
                    />
                    <button
                      onClick={() => inputValue.trim() && submitIntent(inputValue.trim())}
                      className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold"
                    >
                      {lang.hero.shopNow} <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {lang.hero.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => submitIntent(s)}
                        className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[12px] text-white/90 backdrop-blur transition hover:border-white/25 hover:bg-white/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center gap-4 border-t border-white/15 pt-6">
                    <div className="flex -space-x-2.5">
                      {["🧕", "👩🏽", "👩🏻"].map((e, i) => (
                        <div
                          key={i}
                          className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-lg ring-2 ring-primary shadow-sm"
                        >
                          {e}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-0.5 text-[11px] leading-relaxed text-white/80">
                      <div>✓ {lang.hero.trust1}</div>
                      <div>✓ {lang.hero.trust2}</div>
                      <div>✓ {lang.hero.trust3}</div>
                    </div>
                  </div>
                </div>

                <div className="relative hidden md:block">
                  <div className="absolute inset-0 -m-12 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative mx-auto flex aspect-square max-w-lg items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/20">
                    <div className="float text-[260px] leading-none">🛍️</div>

                    <div className="absolute -bottom-3 left-3 rounded-2xl border border-white/20 bg-white p-4 text-ink shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-forest-soft text-forest">
                          <Check size={20} />
                        </div>
                        <div className="leading-tight">
                          <div className="font-mono-tight text-[12px] font-bold uppercase tracking-wider text-forest">
                            {lang.product.worthIt} · 92
                          </div>
                          <div className="text-[13px] text-ink-muted">{lang.hero.floatingCaption}</div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -right-3 top-8 rounded-2xl bg-accent px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-accent-foreground shadow-xl">
                      {lang.hero.floatingBadge}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-14 fade-up" style={{ animationDelay: "120ms" }}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-display text-2xl font-medium text-ink">{lang.categoriesSection.heading}</h2>
                <span className="font-mono-tight text-[10.5px] uppercase tracking-[0.22em] text-ink-soft">
                  {lang.categoriesSection.subheading}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
                {CATEGORIES.map((c) => {
                  const active = activeCat === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveCat(c.key)}
                      className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-300 sm:rounded-full sm:px-6 ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "border-line bg-surface text-ink hover:border-primary/40 hover:bg-primary-soft/30 hover:shadow-md"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110 ${
                          active ? "bg-white/20" : "bg-primary-soft"
                        }`}
                      >
                        {c.emoji}
                      </span>
                      {lang.categories[c.key]}
                    </button>
                  );
                })}
              </div>
            </section>

            <section id="how-it-works" className="mt-14 grid gap-4 sm:grid-cols-3 fade-up" style={{ animationDelay: "200ms" }}>
              {[
                {
                  title: lang.features.confidenceEngineTitle,
                  body: lang.features.confidenceEngineBody,
                  emoji: "🧠",
                },
                {
                  title: lang.features.contextAwareTitle,
                  body: lang.features.contextAwareBody,
                  emoji: "🎯",
                },
                {
                  title: lang.features.askSomeoneTitle,
                  body: lang.features.askSomeoneBody,
                  emoji: "💬",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="card-hover rounded-3xl border border-line bg-surface p-6 shadow-sm"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary-soft to-blush text-xl">
                    {f.emoji}
                  </div>
                  <div className="mt-4 font-display text-lg font-medium text-ink">{f.title}</div>
                  <div className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{f.body}</div>
                </div>
              ))}
            </section>
          </>
        )}

        {stage === "questions" && (
          <section className="mx-auto mt-6 max-w-xl fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 font-mono-tight text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">
              {lang.questions.intro}
            </div>
            {missingFields.length > 0 && (
              <div className="mt-6 flex gap-2">
                {missingFields.map((field, i) => (
                  <div key={field} className="flex flex-1 flex-col gap-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ background: i <= qIndex ? "var(--color-primary)" : "var(--color-line)" }}
                    />
                    <span
                      className={`font-mono-tight text-[9px] uppercase tracking-wider ${
                        i <= qIndex ? "text-primary" : "text-ink-soft"
                      }`}
                    >
                      {field}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!intent ? (
              <div className="mt-16 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-[13.5px] text-ink-soft shadow-sm">
                <Loader2 size={18} className="spin text-primary" /> {lang.questions.understanding}
              </div>
            ) : missingFields[qIndex] === "budget" ? (
              <>
                <h2 className="mt-8 font-display text-[30px] font-medium leading-tight text-ink sm:text-[32px]">
                  {getBudgetQuestion(intent, lang)}
                </h2>
                <p className="mt-2 text-[13.5px] text-ink-muted">
                  {lang.questions.budgetHelper}
                </p>

                <div className="mt-6 flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 shadow-sm ring-1 ring-transparent transition focus-within:border-primary focus-within:ring-primary/20">
                  <span className="font-mono-tight text-[15px] text-ink-soft">₹</span>
                  <input
                    autoFocus
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9]/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && budgetInput) answer("budget", Number(budgetInput));
                    }}
                    placeholder={lang.questions.budgetPlaceholder}
                    className="flex-1 bg-transparent py-2.5 text-[14.5px] text-ink placeholder:text-ink-soft focus:outline-none"
                  />
                  <button
                    onClick={() => budgetInput && answer("budget", Number(budgetInput))}
                    disabled={!budgetInput}
                    className="btn-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold disabled:opacity-40 disabled:shadow-none"
                  >
                    {lang.questions.next} <ArrowRight size={14} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => answer("budget", b)}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink transition hover:border-primary hover:bg-primary-soft/40 hover:text-primary"
                    >
                      {lang.questions.under.replace("{amount}", String(b))}
                    </button>
                  ))}
                </div>
              </>
            ) : missingFields[qIndex] === "state" ? (
              <>
                <h2 className="mt-8 font-display text-[30px] font-medium leading-tight text-ink sm:text-[32px]">
                  {lang.questions.stateHeading}
                </h2>
                <p className="mt-2 text-[13.5px] text-ink-muted">
                  {lang.questions.stateSubheading}
                </p>

                <div className="relative mt-6">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    autoFocus
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder={lang.questions.stateSearchPlaceholder}
                    className="w-full rounded-2xl border border-line bg-surface py-4 pl-11 pr-5 text-[15px] shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {filteredStates.slice(0, 8).map((state) => (
                    <button
                      key={state}
                      onClick={() => answer("state", state)}
                      className="group flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 text-left font-semibold transition hover:border-primary hover:bg-primary-soft/40 hover:shadow-sm"
                    >
                      {state}
                      <ArrowRight
                        size={15}
                        className="text-ink-soft opacity-0 transition group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100"
                      />
                    </button>
                  ))}
                </div>

                {filteredStates.length === 0 && (
                  <p className="mt-4 text-sm text-ink-soft">{lang.questions.noStateFound}</p>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-8 font-display text-[30px] font-medium leading-tight text-ink sm:text-[32px]">
                  {currentQuestionSet.title}
                </h2>
                <p className="mt-2 text-[13.5px] text-ink-muted">{currentQuestionSet.subtitle}</p>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {currentQuestionSet.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => answer("priority", opt.value)}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/40 hover:shadow-md"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-soft to-blush text-xl">
                        {opt.emoji}
                      </span>
                      <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
                      <ArrowRight
                        size={15}
                        className="ml-auto text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {stage === "loading" && <LoadingScreen lang={lang} />}

        {stage === "error" && (
          <div className="mx-auto mt-24 max-w-md text-center fade-up">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-3xl">😔</div>
            <div className="font-display text-xl text-primary">{lang.errors.title}</div>
            <p className="mt-2 text-[13.5px] text-ink-muted">{errorMsg}</p>
            <button onClick={reset} className="btn-primary mt-6 rounded-full px-6 py-2.5 text-sm font-bold">
              {lang.errors.tryAgain}
            </button>
          </div>
        )}

        {stage === "shelf" && !openItem && (
          <section className="fade-up">
            {intent?.state && (
              <div className="mb-6 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-soft/80 to-blush p-5 shadow-sm">
                <div className="text-sm font-bold text-primary">
                  🇮🇳 {lang.shelf.personalizedFor.replace("{state}", intent.state)}
                </div>
                <p className="mt-2 text-sm text-ink-muted">{lang.shelf.personalizedBody}</p>
              </div>
            )}
            <div className="mb-10">
              <div className="inline-flex items-center rounded-full bg-primary-soft px-4 py-2 font-mono-tight text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                {lang.shelf.curated}
              </div>

              <h1 className="mt-5 max-w-3xl font-display text-[38px] leading-tight text-ink sm:text-[46px]">
                {lang.shelf.compared}{" "}
                <span className="text-primary">
                  {scanned?.toLocaleString("en-IN") ?? "802"} {lang.shelf.products}
                </span>
                <br />
                {lang.shelf.theseAreThe} <span className="text-primary">{results.length}</span>{" "}
                {lang.shelf.actuallyRecommend}
              </h1>

              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                {lang.shelf.everyRecommendation}
              </p>
            </div>

            <div className="mb-10 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 shadow-sm">
                <span>🧠</span>
                <span className="text-sm font-semibold">
                  {lang.shelf.comparedProductsChip.replace(
                    "{count}",
                    scanned?.toLocaleString("en-IN") ?? "802"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2">
                <span>⭐</span>
                <span className="text-sm font-semibold">{lang.shelf.popularityIgnored}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2">
                <span>✔</span>
                <span className="text-sm font-semibold">{lang.shelf.explainableRanking}</span>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item, i) => (
                <ProductCard key={item.id} item={item} index={i} onOpen={setOpenItem} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {stage === "shelf" && openItem && (
  <ProductDetail
    item={openItem}
    onBack={() => setOpenItem(null)}
    onAskSomeone={setAskModal}
    lang={lang}
    results={results}
    onOpen={setOpenItem}
    state={intent?.state}

  />
)}
      </main>

      <footer className="mt-auto border-t border-line bg-surface/50">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
          <div>
            <div className="font-mono-tight text-[11px] uppercase tracking-[0.22em] text-ink-soft">
              {lang.footer.tagline}
            </div>
            <p className="mt-1 text-[12px] text-ink-muted">{lang.footer.madeFor}</p>
          </div>
          {health?.ok && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1 text-[11px] font-semibold text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-forest" /> {lang.footer.live}
            </span>
          )}
        </div>
      </footer>

      {askModal && <AskSomeoneModal item={askModal} onClose={() => setAskModal(null)} lang={lang} />}
    </div>
  );
}