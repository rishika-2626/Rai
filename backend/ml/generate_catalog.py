"""
Synthetic Myntra-style fashion catalog generator -- ranking-engine edition.

Generates a realistic, internally-consistent catalog of PRODUCT FAMILIES.
Each family is one product concept (brand + product type + fabric + style)
sold as multiple color variants, each variant carrying its own per-size
inventory. Category/brand/fabric/price relationships are configured in
CATALOG_CONFIG, so invalid combinations (e.g. "Denim Saree", "Silk Hoodie")
remain structurally impossible.

Beyond storefront fields, every family carries a `rankingSignals` block
meant to power a ranking/recommendation model (e.g. a "ValueIQ"-style
value-for-money ranker):
    - qualityScoreLatent      hidden driver behind rating/return/verified%
    - avgRating / totalReviewCount   variant-weighted rollups
    - returnRatePercent, verifiedBuyerPercent
    - deliveryDays, codAvailable
    - totalInventory, colorCount, popularityScore, sellThroughRate
    - sellerId/Name/Tier/Rating/DeliveryReliability/ReturnPolicyDays (flattened seller snapshot)
    - comparableAvgPrice, comparableSetSize, priceCompetitivenessPercent,
      priceRankPercentile   (computed cross-catalog, after generation)
    - fitConfidence, comfortScore, durabilityScore, valueForMoneyScore (0-100)
      "Worth It"-style sub-scores, each grounded in signals already computed
      above (return rate, fabric, quality, price competitiveness) rather than
      sampled independently -- so a ranking engine can cite them directly
      ("low return rate and high fit confidence") instead of inferring them
      from free-text reviews.

Reviews are drawn from positive/neutral/negative pools weighted by the
family's latent quality score, so a family's review corpus, rating, and
return rate are mutually consistent instead of independently randomized.

Deterministic: seeded with random.seed(42).

Usage:
    python3 generate_catalog.py
    # writes catalog.json in the current directory
"""

import json
import random
from collections import defaultdict

SEED = 42
NUM_FAMILIES = 320
NUM_SELLERS = 60
OUTPUT_PATH = "catalog.json"


# ---------------------------------------------------------------------------
# Shared pools
# ---------------------------------------------------------------------------

COLOR_POOL = [
    "Black", "White", "Navy", "Olive", "Maroon", "Mustard", "Pink",
    "Lavender", "Beige", "Cream", "Grey", "Bottle Green", "Wine", "Rust", "Teal",
]

CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
FOOTWEAR_SIZES = ["6", "7", "8", "9", "10", "11"]
BELT_SIZES = ["28", "30", "32", "34", "36"]
FREE_SIZE = ["Free Size"]


# ---------------------------------------------------------------------------
# Product configuration (unchanged relationships, family-oriented usage)
# ---------------------------------------------------------------------------

CATALOG_CONFIG = {
    "Women": {
        "weight": 0.45,
        "gender": "Women",
        "product_types": {
            "Kurti":       {"price": (599, 2499),  "fabrics": ["Cotton", "Rayon", "Viscose", "Linen Blend"],
                             "brands": ["Libas", "Biba", "W", "Anouk", "HERE&NOW"],
                             "occasions": ["daily", "office", "festival", "casual"],
                             "styles": ["ethnic", "minimal", "trendy", "budget", "premium"], "sizes": CLOTHING_SIZES},
            "Dress":       {"price": (799, 3499),  "fabrics": ["Rayon", "Viscose", "Crepe", "Cotton"],
                             "brands": ["Mast & Harbour", "Tokyo Talkies", "DressBerry", "Roadster"],
                             "occasions": ["party", "college", "casual", "wedding"],
                             "styles": ["western", "trendy", "oversized", "smart casual"], "sizes": CLOTHING_SIZES},
            "Top":         {"price": (399, 1799),  "fabrics": ["Cotton", "Rayon", "Viscose"],
                             "brands": ["Roadster", "H&M", "Tokyo Talkies", "DressBerry"],
                             "occasions": ["daily", "college", "casual", "party"],
                             "styles": ["western", "trendy", "minimal", "oversized"], "sizes": CLOTHING_SIZES},
            "Shirt":       {"price": (599, 1999),  "fabrics": ["Cotton", "Linen Blend"],
                             "brands": ["Van Heusen", "Allen Solly", "H&M", "Roadster"],
                             "occasions": ["office", "formal", "daily"],
                             "styles": ["smart casual", "minimal", "slim fit"], "sizes": CLOTHING_SIZES},
            "Jeans":       {"price": (999, 2999),  "fabrics": ["Denim"],
                             "brands": ["Levis", "Roadster", "H&M", "USPolo"],
                             "occasions": ["daily", "casual", "college", "travel"],
                             "styles": ["slim fit", "relaxed fit", "western"], "sizes": CLOTHING_SIZES},
            "Trousers":    {"price": (899, 2499),  "fabrics": ["Cotton", "Linen Blend", "Polyester Blend"],
                             "brands": ["Van Heusen", "Allen Solly", "Roadster"],
                             "occasions": ["office", "formal", "daily"],
                             "styles": ["slim fit", "smart casual", "minimal"], "sizes": CLOTHING_SIZES},
            "Saree":       {"price": (999, 4999),  "fabrics": ["Cotton", "Silk Blend", "Georgette", "Chiffon"],
                             "brands": ["Biba", "W", "Libas", "HERE&NOW"],
                             "occasions": ["wedding", "festival", "formal"],
                             "styles": ["ethnic", "luxury look", "premium"], "sizes": FREE_SIZE},
            "Ethnic Set":  {"price": (1199, 4499), "fabrics": ["Cotton", "Silk Blend", "Rayon"],
                             "brands": ["Biba", "Libas", "W", "Anouk"],
                             "occasions": ["wedding", "festival", "party"],
                             "styles": ["ethnic", "premium", "luxury look"], "sizes": CLOTHING_SIZES},
            "Skirt":       {"price": (599, 1999),  "fabrics": ["Cotton", "Rayon", "Denim"],
                             "brands": ["Roadster", "Tokyo Talkies", "DressBerry", "H&M"],
                             "occasions": ["college", "party", "casual"],
                             "styles": ["western", "trendy", "minimal"], "sizes": CLOTHING_SIZES},
        },
    },
    "Men": {
        "weight": 0.40,
        "gender": "Men",
        "product_types": {
            "T-Shirt":     {"price": (399, 1499),  "fabrics": ["Cotton", "Cotton Blend"],
                             "brands": ["Roadster", "HRX", "H&M", "Highlander", "Campus Sutra"],
                             "occasions": ["daily", "casual", "gym", "travel"],
                             "styles": ["oversized", "slim fit", "streetwear", "minimal"], "sizes": CLOTHING_SIZES},
            "Shirt":       {"price": (699, 2299),  "fabrics": ["Cotton", "Linen Blend"],
                             "brands": ["Van Heusen", "Allen Solly", "USPolo", "Highlander"],
                             "occasions": ["office", "formal", "daily"],
                             "styles": ["slim fit", "smart casual", "minimal"], "sizes": CLOTHING_SIZES},
            "Jeans":       {"price": (999, 2999),  "fabrics": ["Denim"],
                             "brands": ["Levis", "Roadster", "USPolo", "H&M"],
                             "occasions": ["daily", "casual", "college", "travel"],
                             "styles": ["slim fit", "relaxed fit", "streetwear"], "sizes": CLOTHING_SIZES},
            "Trousers":    {"price": (899, 2499),  "fabrics": ["Cotton", "Polyester Blend", "Linen Blend"],
                             "brands": ["Van Heusen", "Allen Solly", "USPolo"],
                             "occasions": ["office", "formal", "daily"],
                             "styles": ["slim fit", "smart casual"], "sizes": CLOTHING_SIZES},
            "Cargo Pants": {"price": (999, 2799),  "fabrics": ["Cotton", "Cotton Blend"],
                             "brands": ["HRX", "Roadster", "Highlander", "Campus Sutra"],
                             "occasions": ["casual", "travel", "streetwear"],
                             "styles": ["relaxed fit", "streetwear", "oversized"], "sizes": CLOTHING_SIZES},
            "Hoodie":      {"price": (999, 2999),  "fabrics": ["Fleece", "Cotton Blend"],
                             "brands": ["HRX", "Roadster", "Highlander", "Campus Sutra", "H&M"],
                             "occasions": ["casual", "gym", "travel", "daily"],
                             "styles": ["oversized", "streetwear", "relaxed fit"], "sizes": CLOTHING_SIZES},
            "Sweatshirt":  {"price": (899, 2499),  "fabrics": ["Fleece", "Cotton Blend"],
                             "brands": ["Roadster", "HRX", "Highlander", "H&M"],
                             "occasions": ["casual", "daily", "travel"],
                             "styles": ["relaxed fit", "streetwear", "minimal"], "sizes": CLOTHING_SIZES},
            "Kurta":       {"price": (799, 2999),  "fabrics": ["Cotton", "Linen Blend", "Silk Blend"],
                             "brands": ["Highlander", "HERE&NOW", "Roadster"],
                             "occasions": ["festival", "wedding", "formal"],
                             "styles": ["ethnic", "premium", "smart casual"], "sizes": CLOTHING_SIZES},
        },
    },
    "Footwear": {
        "weight": 0.10,
        "gender": None,  # resolved per product type below
        "product_types": {
            "Sneakers":      {"price": (1499, 6999), "fabrics": ["Mesh", "Synthetic", "Leather"],
                               "brands": ["Nike", "Adidas", "Puma", "Skechers", "Campus Sutra"],
                               "occasions": ["daily", "casual", "travel", "gym"],
                               "styles": ["streetwear", "trendy", "minimal"], "sizes": FOOTWEAR_SIZES,
                               "genders": ["Unisex", "Men", "Women"]},
            "Running Shoes": {"price": (1799, 6999), "fabrics": ["Mesh", "Synthetic"],
                               "brands": ["Nike", "Adidas", "Puma", "Skechers"],
                               "occasions": ["gym", "daily", "travel"],
                               "styles": ["minimal", "trendy"], "sizes": FOOTWEAR_SIZES,
                               "genders": ["Unisex", "Men", "Women"]},
            "Sandals":       {"price": (699, 2499),  "fabrics": ["Synthetic", "Leather"],
                               "brands": ["Skechers", "Puma", "Adidas"],
                               "occasions": ["daily", "casual", "travel"],
                               "styles": ["minimal", "budget", "relaxed fit"], "sizes": FOOTWEAR_SIZES,
                               "genders": ["Men", "Unisex"]},
            "Flats":         {"price": (599, 1999),  "fabrics": ["Synthetic", "Leather"],
                               "brands": ["Skechers", "W", "HERE&NOW"],
                               "occasions": ["daily", "office", "casual"],
                               "styles": ["minimal", "smart casual", "budget"], "sizes": FOOTWEAR_SIZES,
                               "genders": ["Women"]},
            "Heels":         {"price": (999, 3499),  "fabrics": ["Synthetic", "Leather"],
                               "brands": ["W", "HERE&NOW", "Tokyo Talkies"],
                               "occasions": ["party", "wedding", "formal"],
                               "styles": ["luxury look", "trendy", "premium"], "sizes": FOOTWEAR_SIZES,
                               "genders": ["Women"]},
        },
    },
    "Accessories": {
        "weight": 0.05,
        "gender": None,
        "product_types": {
            "Watches":   {"price": (999, 5999),  "fabrics": ["Leather Strap", "Metal Strap", "Silicone Strap"],
                           "brands": ["USPolo", "HRX", "Roadster", "Highlander"],
                           "occasions": ["formal", "casual", "office"],
                           "styles": ["premium", "minimal", "luxury look"], "sizes": FREE_SIZE,
                           "genders": ["Men", "Women", "Unisex"]},
            "Bags":      {"price": (799, 3499),   "fabrics": ["Synthetic", "Canvas", "Leather"],
                           "brands": ["Roadster", "HERE&NOW", "USPolo", "Highlander"],
                           "occasions": ["daily", "college", "office", "travel"],
                           "styles": ["trendy", "minimal", "budget"], "sizes": FREE_SIZE,
                           "genders": ["Women", "Unisex"]},
            "Backpacks": {"price": (699, 2999),   "fabrics": ["Nylon", "Canvas", "Synthetic"],
                           "brands": ["HRX", "Roadster", "Highlander", "USPolo"],
                           "occasions": ["college", "travel", "daily"],
                           "styles": ["streetwear", "budget", "relaxed fit"], "sizes": FREE_SIZE,
                           "genders": ["Unisex", "Men"]},
            "Belts":     {"price": (399, 1499),   "fabrics": ["Leather", "Synthetic Leather"],
                           "brands": ["USPolo", "Van Heusen", "Allen Solly", "Highlander"],
                           "occasions": ["office", "formal", "casual"],
                           "styles": ["minimal", "smart casual", "premium"], "sizes": BELT_SIZES,
                           "genders": ["Men", "Women"]},
            "Wallets":   {"price": (399, 1999),   "fabrics": ["Leather", "Synthetic Leather"],
                           "brands": ["USPolo", "Highlander", "Van Heusen", "Roadster"],
                           "occasions": ["daily", "office", "formal"],
                           "styles": ["minimal", "budget", "premium"], "sizes": FREE_SIZE,
                           "genders": ["Men", "Women"]},
        },
    },
}


# ---------------------------------------------------------------------------
# Review pools -- split by sentiment so review corpus, rating, and return
# rate can all be driven consistently off one latent quality score.
# ---------------------------------------------------------------------------

POSITIVE_REVIEWS = [
    "The {fabric} fabric feels premium for this price.",
    "Looks expensive for what I paid -- really happy with the {color} shade.",
    "After multiple washes the colour is still intact, no fading at all.",
    "True to size, fits exactly as expected.",
    "Stitching quality is solid, no loose threads even after regular use.",
    "Great value for money at this price point.",
    "Comfortable enough to wear the whole day without any irritation.",
    "The {brand} quality is consistent with their other pieces I own.",
    "Durable -- this has survived a lot of washing without losing shape.",
    "Would definitely recommend for {occasion} wear.",
    "Exactly as described, no surprises -- happy with this purchase.",
    "Perfect for {occasion}, wore it recently and got a lot of compliments.",
]

NEUTRAL_REVIEWS = [
    "Delivery was faster than expected, arrived well packed.",
    "Runs slightly large, would suggest ordering one size down.",
    "Runs slightly small, sizing up would be better.",
    "Colour is slightly different from the photos but still looks nice.",
    "Exchanged for a different size and the process was smooth.",
    "Good quality {fabric}, doesn't feel cheap at all.",
    "Decent for the price, does the job for {occasion}.",
]

NEGATIVE_REVIEWS = [
    "Fabric is a bit thinner than I expected for {occasion} wear.",
    "A bit overpriced for the quality, though the {color} colour is lovely.",
    "Sizing felt off compared to other {brand} pieces I've bought before.",
    "Started showing wear after just a few washes.",
    "Stitching came loose near the seams within a couple of weeks.",
    "Not quite what the photos showed -- expected better {fabric} quality.",
]


# ---------------------------------------------------------------------------
# Seller layer
# ---------------------------------------------------------------------------

SELLER_NAME_PREFIXES = [
    "Urban", "Metro", "Trend", "Style", "Vogue", "Prime", "Zenith", "Nova",
    "Aster", "Crest", "Bright", "Pure", "Elevate", "Craft", "North Star",
    "Silver Leaf", "Blue Horizon", "Golden Thread", "Everline", "Lucent",
]
SELLER_NAME_SUFFIXES = [
    "Retail", "Trading Co.", "Commerce", "Fashion House", "Apparel Hub",
    "Enterprises", "Mercantile", "Emporium", "Marketplace", "Textiles",
    "Lifestyle Co.", "Garments", "Wholesale",
]

# Each tier defines the distribution seller attributes are sampled from.
# Weight controls how common a tier is; higher tiers are rarer and stronger
# across every signal (rating, reliability, verified buyers, order volume).
SELLER_TIERS = {
    "Premium Partner":  {"weight": 10, "rating": (4.4, 4.9), "reliability": (96.0, 99.5),
                          "verified_baseline": (75, 92), "return_days": (15, 30), "cod_prob": 0.90,
                          "delivery_days": (1, 3), "years": (3.0, 9.0), "orders": (200000, 900000)},
    "Preferred Seller": {"weight": 30, "rating": (4.0, 4.6), "reliability": (90.0, 97.0),
                          "verified_baseline": (60, 80), "return_days": (10, 20), "cod_prob": 0.85,
                          "delivery_days": (2, 4), "years": (2.0, 6.0), "orders": (50000, 250000)},
    "Standard Seller":  {"weight": 45, "rating": (3.5, 4.2), "reliability": (80.0, 92.0),
                          "verified_baseline": (45, 68), "return_days": (7, 14), "cod_prob": 0.75,
                          "delivery_days": (3, 6), "years": (1.0, 4.0), "orders": (5000, 60000)},
    "New Seller":       {"weight": 15, "rating": (3.0, 4.0), "reliability": (70.0, 88.0),
                          "verified_baseline": (30, 55), "return_days": (5, 10), "cod_prob": 0.60,
                          "delivery_days": (4, 7), "years": (0.1, 1.0), "orders": (200, 6000)},
}


# Rough 0-10 comfort/durability priors per fabric, used to ground
# comfortScore and durabilityScore in the material itself rather than
# leaving them as pure noise. Unlisted fabrics fall back to a neutral (5, 5).
FABRIC_PROFILES = {
    "Cotton": {"comfort": 8, "durability": 6},
    "Cotton Blend": {"comfort": 7, "durability": 6},
    "Rayon": {"comfort": 6, "durability": 4},
    "Viscose": {"comfort": 6, "durability": 4},
    "Linen Blend": {"comfort": 7, "durability": 5},
    "Crepe": {"comfort": 5, "durability": 4},
    "Denim": {"comfort": 4, "durability": 9},
    "Fleece": {"comfort": 9, "durability": 5},
    "Silk Blend": {"comfort": 6, "durability": 4},
    "Georgette": {"comfort": 5, "durability": 3},
    "Chiffon": {"comfort": 4, "durability": 3},
    "Polyester Blend": {"comfort": 5, "durability": 7},
    "Mesh": {"comfort": 7, "durability": 5},
    "Synthetic": {"comfort": 5, "durability": 6},
    "Leather": {"comfort": 4, "durability": 9},
    "Leather Strap": {"comfort": 5, "durability": 8},
    "Metal Strap": {"comfort": 3, "durability": 9},
    "Silicone Strap": {"comfort": 7, "durability": 7},
    "Canvas": {"comfort": 5, "durability": 8},
    "Nylon": {"comfort": 5, "durability": 7},
    "Synthetic Leather": {"comfort": 4, "durability": 6},
}
DEFAULT_FABRIC_PROFILE = {"comfort": 5, "durability": 5}


def clamp(value, lo, hi):
    return max(lo, min(hi, value))


def generate_seller_name(used_names):
    for _ in range(50):
        name = f"{random.choice(SELLER_NAME_PREFIXES)} {random.choice(SELLER_NAME_SUFFIXES)}"
        if name not in used_names:
            used_names.add(name)
            return name
    # Extremely unlikely fallback if we exhaust unique combinations.
    name = f"{random.choice(SELLER_NAME_PREFIXES)} {random.choice(SELLER_NAME_SUFFIXES)} {len(used_names)}"
    used_names.add(name)
    return name


def generate_sellers(n=NUM_SELLERS):
    tier_names = list(SELLER_TIERS.keys())
    tier_weights = [SELLER_TIERS[t]["weight"] for t in tier_names]
    used_names = set()
    sellers = []
    for i in range(n):
        tier = random.choices(tier_names, weights=tier_weights)[0]
        cfg = SELLER_TIERS[tier]
        sellers.append({
            "sellerId": f"s{i + 1:03d}",
            "sellerName": generate_seller_name(used_names),
            "sellerTier": tier,
            "sellerRating": round(random.uniform(*cfg["rating"]), 2),
            "deliveryReliability": round(random.uniform(*cfg["reliability"]), 1),
            "verifiedBuyerBaseline": round(random.uniform(*cfg["verified_baseline"]), 1),
            "returnPolicyDays": random.randint(*cfg["return_days"]),
            "codAvailable": random.random() < cfg["cod_prob"],
            "yearsOnPlatform": round(random.uniform(*cfg["years"]), 1),
            "typicalDeliveryDaysRange": list(cfg["delivery_days"]),
            "totalOrdersFulfilled": random.randint(*cfg["orders"]),
        })
    return sellers


def pick_seller(sellers, style_tags):
    """Bias seller assignment so premium/luxury-tagged families tend to be
    sold by stronger sellers, and budget-tagged families by weaker ones --
    mirroring how higher-end listings cluster with established sellers."""
    if any(tag in ("premium", "luxury look") for tag in style_tags):
        pool = [s for s in sellers if s["sellerTier"] in ("Premium Partner", "Preferred Seller")]
    elif "budget" in style_tags:
        pool = [s for s in sellers if s["sellerTier"] in ("Standard Seller", "New Seller")]
    else:
        pool = sellers
    return random.choice(pool if pool else sellers)


# ---------------------------------------------------------------------------
# Pricing helpers
# ---------------------------------------------------------------------------

def snap_to_charm_price(value):
    """Round a price to a realistic Myntra-style ending (e.g. ...99, ...49)."""
    base = round(value / 50) * 50
    return max(base - 1, 49)


def build_price_fields(price_range):
    price = snap_to_charm_price(random.randint(*price_range))
    discount_fraction = random.uniform(0.05, 0.45)
    mrp = round(price / (1 - discount_fraction))
    mrp = snap_to_charm_price(mrp) if mrp > price else price + 100
    discount_percent = round((mrp - price) / mrp * 100, 1)
    return price, mrp, discount_percent


# ---------------------------------------------------------------------------
# Attribute helpers
# ---------------------------------------------------------------------------

def choose_gender(segment_key, segment_cfg, type_cfg):
    if segment_cfg["gender"] is not None:
        return segment_cfg["gender"]
    return random.choice(type_cfg["genders"])


def choose_occasions(type_cfg):
    n = random.randint(1, 3)
    return random.sample(type_cfg["occasions"], k=min(n, len(type_cfg["occasions"])))


def choose_style_tags(type_cfg):
    n = random.randint(1, 2)
    return random.sample(type_cfg["styles"], k=min(n, len(type_cfg["styles"])))


def build_name(brand, style_tags, product_type):
    flavor = style_tags[0].title() if style_tags else ""
    parts = [brand, flavor, product_type]
    return " ".join(p for p in parts if p).strip()


def generate_reviews(quality_score, fabric, color, brand, occasions, k=5):
    """Sample a review corpus whose sentiment mix tracks the family's latent
    quality score, so a 4.8-rated family doesn't end up with mostly
    lukewarm-to-negative reviews (and vice versa)."""
    occasion = random.choice(occasions) if occasions else "daily"

    pos_n = round(k * clamp(quality_score, 0.1, 0.9))
    remaining = k - pos_n
    neg_n = round(remaining * clamp(1 - quality_score, 0.15, 0.85))
    neu_n = max(0, remaining - neg_n)

    chosen = (
        random.sample(POSITIVE_REVIEWS, k=min(pos_n, len(POSITIVE_REVIEWS)))
        + random.sample(NEUTRAL_REVIEWS, k=min(neu_n, len(NEUTRAL_REVIEWS)))
        + random.sample(NEGATIVE_REVIEWS, k=min(neg_n, len(NEGATIVE_REVIEWS)))
    )
    # Top up if rounding left us short (small pools / small k edge cases).
    all_pools = POSITIVE_REVIEWS + NEUTRAL_REVIEWS + NEGATIVE_REVIEWS
    while len(chosen) < k:
        candidate = random.choice(all_pools)
        if candidate not in chosen:
            chosen.append(candidate)
    random.shuffle(chosen)

    return [
        t.format(fabric=fabric.lower(), color=color.lower(), brand=brand, occasion=occasion)
        for t in chosen
    ]


def build_size_inventory(sizes):
    """Per-size stock with a realistic distribution: most sizes well
    stocked, some low, a handful out of stock (the ones that drive urgency
    signals like 'only 2 left')."""
    entries = []
    total = 0
    for size in sizes:
        roll = random.random()
        if roll < 0.08:
            inv = 0
        elif roll < 0.22:
            inv = random.randint(1, 4)
        else:
            inv = random.randint(5, 45)
        total += inv
        status = "out_of_stock" if inv == 0 else ("low_stock" if inv < 5 else "in_stock")
        entries.append({"size": size, "inventory": inv, "stockStatus": status})
    return entries, total


# ---------------------------------------------------------------------------
# Family (product) builder
# ---------------------------------------------------------------------------

def build_family(family_id, segment_key, sellers):
    segment_cfg = CATALOG_CONFIG[segment_key]
    product_type = random.choice(list(segment_cfg["product_types"].keys()))
    type_cfg = segment_cfg["product_types"][product_type]

    brand = random.choice(type_cfg["brands"])
    fabric = random.choice(type_cfg["fabrics"])
    gender = choose_gender(segment_key, segment_cfg, type_cfg)
    occasions = choose_occasions(type_cfg)
    style_tags = choose_style_tags(type_cfg)
    sizes = type_cfg["sizes"]

    base_price, mrp, discount_percent = build_price_fields(type_cfg["price"])

    # Latent quality score anchors rating / return rate / verified-buyer% /
    # review sentiment so those signals move together instead of each being
    # independently randomized (which would let a 4.9-star product also
    # have a 15% return rate and mostly negative reviews).
    quality_score = round(random.betavariate(6, 2), 3)
    # Popularity is separate from quality -- a fine but unremarkable product
    # can still be a low-volume seller, and a middling one can be a bestseller.
    popularity_score = round(random.betavariate(2, 5) * 3500, 1)

    seller = pick_seller(sellers, style_tags)

    rating_baseline = clamp(3.3 + quality_score * 1.6 + random.uniform(-0.1, 0.1), 3.0, 5.0)
    return_rate = clamp(
        (1 - quality_score) * 11 + (100 - seller["deliveryReliability"]) * 0.12 + random.uniform(-1, 1),
        1.5, 20.0,
    )
    verified_buyer_percent = clamp(
        seller["verifiedBuyerBaseline"] + quality_score * 12 + random.uniform(-4, 4), 15, 99,
    )

    # Explicit "Worth It" sub-scores (0-100), each grounded in a signal
    # that's already been computed rather than sampled independently --
    # so they can be quoted directly in a ranking explanation without
    # the model having to re-derive them from free-text reviews.
    fabric_profile = FABRIC_PROFILES.get(fabric, DEFAULT_FABRIC_PROFILE)

    # Fit issues are the single biggest driver of apparel returns, so low
    # return rate + a healthy pool of verified reviews imply buyers are
    # consistently getting the size/fit they expected.
    fit_confidence = clamp(
        round(96 - return_rate * 2.2 + (verified_buyer_percent - 50) * 0.15 + random.uniform(-3, 3)),
        40, 99,
    )
    comfort_score = clamp(
        round(48 + fabric_profile["comfort"] * 3.2 + quality_score * 22 + random.uniform(-4, 4)),
        40, 99,
    )
    durability_score = clamp(
        round(45 + fabric_profile["durability"] * 3.2 + quality_score * 18 - return_rate * 0.8 + random.uniform(-4, 4)),
        35, 99,
    )

    num_colors = random.choices([1, 2, 3, 4], weights=[15, 35, 35, 15])[0]
    colors = random.sample(COLOR_POOL, k=min(num_colors, len(COLOR_POOL)))

    total_review_count = int(popularity_score) + random.randint(15, 60)
    review_weights = [random.random() + 0.3 for _ in colors]
    weight_sum = sum(review_weights)

    variants = []
    total_inventory = 0
    for idx, color in enumerate(colors):
        variant_id = f"{family_id}-v{idx + 1}"
        price_jitter = random.choice([0, 0, 0, 0, -50, 50])
        variant_price = snap_to_charm_price(max(base_price + price_jitter, 99))
        variant_review_count = max(3, round(total_review_count * (review_weights[idx] / weight_sum)))
        variant_rating = round(clamp(rating_baseline + random.uniform(-0.15, 0.15), 3.0, 5.0), 1)

        size_entries, color_inventory = build_size_inventory(sizes)
        total_inventory += color_inventory

        variants.append({
            "variantId": variant_id,
            "color": color,
            "price": variant_price,
            "rating": variant_rating,
            "reviewCount": variant_review_count,
            "image": f"/images/products/{variant_id}.jpg",
            "sizeInventory": size_entries,
            "totalColorInventory": color_inventory,
            "reviewCorpus": generate_reviews(quality_score, fabric, color, brand, occasions),
        })

    total_review_count_actual = sum(v["reviewCount"] for v in variants)
    weighted_rating = sum(v["rating"] * v["reviewCount"] for v in variants) / max(total_review_count_actual, 1)
    sell_through_rate = round(min(0.97, popularity_score / (popularity_score + total_inventory + 5)), 3)

    return {
        "familyId": family_id,
        "name": build_name(brand, style_tags, product_type),
        "productType": product_type,
        "brand": brand,
        "category": segment_key,
        "gender": gender,
        "fabric": fabric,
        "occasion": occasions,
        "styleTags": style_tags,
        "basePrice": base_price,
        "mrp": mrp,
        "discountPercent": discount_percent,
        "sizeOptions": sizes,
        "variants": variants,
        "rankingSignals": {
            "qualityScoreLatent": quality_score,
            "popularityScore": popularity_score,
            "avgRating": round(weighted_rating, 2),
            "totalReviewCount": total_review_count_actual,
            "returnRatePercent": round(return_rate, 1),
            "verifiedBuyerPercent": round(verified_buyer_percent, 1),
            "deliveryDays": random.randint(*seller["typicalDeliveryDaysRange"]),
            "codAvailable": seller["codAvailable"],
            "totalInventory": total_inventory,
            "colorCount": len(colors),
            "sellThroughRate": sell_through_rate,
            "fitConfidence": fit_confidence,
            "comfortScore": comfort_score,
            "durabilityScore": durability_score,
            # valueForMoneyScore is filled in by add_market_comparables() once
            # comparableAvgPrice / priceCompetitivenessPercent are known.
            # Flattened seller snapshot -- convenient for feature vectors
            # without a join, while `sellers` in the top-level output still
            # holds the full seller record for lookup/debugging.
            "sellerId": seller["sellerId"],
            "sellerName": seller["sellerName"],
            "sellerTier": seller["sellerTier"],
            "sellerRating": seller["sellerRating"],
            "sellerDeliveryReliability": seller["deliveryReliability"],
            "sellerReturnPolicyDays": seller["returnPolicyDays"],
            "sellerYearsOnPlatform": seller["yearsOnPlatform"],
            # comparableAvgPrice / priceCompetitivenessPercent / priceRankPercentile
            # are filled in by add_market_comparables() once the full catalog exists.
        },
    }


# ---------------------------------------------------------------------------
# Cross-catalog market comparables (needs the full family list to exist)
# ---------------------------------------------------------------------------

def add_market_comparables(families):
    """For each family, compute how its price compares to other families of
    the same category + product type -- a core 'is this a good deal'
    ranking feature that can't be derived from a single row in isolation."""
    groups = defaultdict(list)
    for fam in families:
        groups[(fam["category"], fam["productType"])].append(fam)

    for group in groups.values():
        prices = [fam["basePrice"] for fam in group]
        for i, fam in enumerate(group):
            others = prices[:i] + prices[i + 1:]
            comparable_avg = sum(others) / len(others) if others else prices[i]
            cheaper_count = sum(1 for p in prices if p < fam["basePrice"])

            fam["rankingSignals"]["comparableAvgPrice"] = round(comparable_avg, 2)
            fam["rankingSignals"]["comparableSetSize"] = len(group)
            fam["rankingSignals"]["priceCompetitivenessPercent"] = round(
                (fam["basePrice"] - comparable_avg) / comparable_avg * 100, 1
            ) if comparable_avg else 0.0
            fam["rankingSignals"]["priceRankPercentile"] = round(cheaper_count / len(prices) * 100, 1)

            # Value-for-money rewards a real discount, a price that beats
            # the comparable set, and underlying quality -- so a cheap but
            # low-quality item doesn't automatically score as "great value".
            price_competitiveness = fam["rankingSignals"]["priceCompetitivenessPercent"]
            quality_score = fam["rankingSignals"]["qualityScoreLatent"]
            value_for_money = clamp(
                round(
                    50
                    + fam["discountPercent"] * 0.3
                    - price_competitiveness * 0.4
                    + quality_score * 22
                    + random.uniform(-3, 3)
                ),
                30, 99,
            )
            fam["rankingSignals"]["valueForMoneyScore"] = value_for_money


# ---------------------------------------------------------------------------
# Segment allocation + top-level generation
# ---------------------------------------------------------------------------

def allocate_segment_counts(n):
    """Exact family counts per segment matching configured weights, rather
    than relying on random sampling variance to approximate them."""
    segments = list(CATALOG_CONFIG.keys())
    raw = {s: CATALOG_CONFIG[s]["weight"] * n for s in segments}
    counts = {s: int(raw[s]) for s in segments}
    remainder = n - sum(counts.values())
    fractional_order = sorted(segments, key=lambda s: raw[s] - counts[s], reverse=True)
    for s in fractional_order[:remainder]:
        counts[s] += 1
    return counts


def generate_catalog(n_families=NUM_FAMILIES, n_sellers=NUM_SELLERS):
    sellers = generate_sellers(n_sellers)

    segment_counts = allocate_segment_counts(n_families)
    segment_sequence = []
    for segment_key, count in segment_counts.items():
        segment_sequence.extend([segment_key] * count)
    random.shuffle(segment_sequence)  # interleave segments rather than blocks

    families = [
        build_family(f"f{idx:04d}", segment_key, sellers)
        for idx, segment_key in enumerate(segment_sequence, start=1)
    ]
    add_market_comparables(families)

    return sellers, families


def main():
    random.seed(SEED)
    sellers, families = generate_catalog(NUM_FAMILIES, NUM_SELLERS)

    catalog = {"sellers": sellers, "families": families}
    with open(OUTPUT_PATH, "w") as f:
        json.dump(catalog, f, indent=2)

    total_variants = sum(len(fam["variants"]) for fam in families)
    total_skus_sizes = sum(len(v["sizeInventory"]) for fam in families for v in fam["variants"])
    total_inventory_units = sum(fam["rankingSignals"]["totalInventory"] for fam in families)

    category_counts = defaultdict(int)
    for fam in families:
        category_counts[fam["category"]] += 1

    print(f"Generated {len(families)} product families, {len(sellers)} sellers -> {OUTPUT_PATH}")
    print(f"Total color variants: {total_variants}")
    print(f"Total (variant x size) rows: {total_skus_sizes}")
    print(f"Total inventory units: {total_inventory_units}")
    print("Category distribution (families):")
    for category, count in category_counts.items():
        print(f"  {category:14s} {count:4d}  ({count / len(families) * 100:.1f}%)")


if __name__ == "__main__":
    main()