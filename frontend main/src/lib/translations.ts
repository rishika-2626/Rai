// -----------------------------------------------------------------------------
// Translation shape
// -----------------------------------------------------------------------------
// This interface is the single source of truth for what a "complete"
// translation looks like. `translations` below is typed against it, so if a
// language object is missing a key, or has an extra/misspelled one, it's a
// TypeScript compile error — not a blank string a user discovers in prod.
// (That's exactly the class of bug we had before: Hindi silently missing 17
// keys because nothing enforced the three languages stay in sync.)
// -----------------------------------------------------------------------------

export interface QuestionOption {
  label: string;
  value: string;
  emoji: string;
}

export interface QuestionSet {
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

export interface Translation {
  hero: {
    badge: string;
    titleLine1: string;
    titleEmphasis: string;
    titleLine2: string;
    subtitle: string;
    searchPlaceholder: string;
    shopNow: string;
    trust1: string;
    trust2: string;
    trust3: string;
    floatingCaption: string;
    floatingBadge: string;
    suggestions: string[];
  };

  nav: {
    tagline: string;
    howItWorks: string;
  };

  categoriesSection: {
    heading: string;
    subheading: string;
  };

  categories: {
    work: string;
    festivals: string;
    college: string;
    weddings: string;
    travel: string;
    fitness: string;
    gifting: string;
  };

  features: {
    confidenceEngineTitle: string;
    confidenceEngineBody: string;
    contextAwareTitle: string;
    contextAwareBody: string;
    askSomeoneTitle: string;
    askSomeoneBody: string;
  };

  stageBadges: {
    personalizing: string;
    findingPicks: string;
    yourShortlist: string;
  };

  questions: {
    intro: string;
    understanding: string;
    budgetHelper: string;
    budgetPlaceholder: string;
    next: string;
    under: string; // "Under ₹{amount}"
    stateHeading: string;
    stateSubheading: string;
    stateSearchPlaceholder: string;
    noStateFound: string;
    budgetQuestions: {
      office: string;
      rakhi: string;
      wedding: string;
      gift: string;
      default: string;
    };
    sets: {
      office: QuestionSet;
      festive: QuestionSet;
      footwear: QuestionSet;
      gifting: QuestionSet;
      default: QuestionSet;
    };
  };

  loading: {
    steps: string[];
    caption: string;
  };

  errors: {
    title: string;
    tryAgain: string;
  };

  shelf: {
    personalizedFor: string; // "Personalized for {state}"
    personalizedBody: string;
    curated: string;
    compared: string;
    products: string;
    theseAreThe: string;
    actuallyRecommend: string;
    everyRecommendation: string;
    comparedProductsChip: string; // "Compared {count} Products"
    popularityIgnored: string;
    explainableRanking: string;
  };

  product: {
    topPick: string;
    excellentBuy: string;
    save: string;
    worthIt: string;
    worthItFallback: string;
    addToBag: string;
    askSomeone: string;
    valueIQPick: string;
    back: string;
    whyWorthIt: string;
    regionalMatch: string;
    regionalMatchBody: string; // "...seen in {state}."
    scoreDisclaimer: string;
  };

  breakdown: {
    heading: string;
    subheading: string;
    value: string;
    quality: string;
    reviews: string;
    sellerTrust: string;
    occasionMatch: string;
    regionalMatch: string;
  };

  badges: {
    greatValue: string;
    premium: string;
    comfort: string;
    trustedSeller: string;
    fastDelivery: string;
    lowReturns: string;
    durable: string;
    greatFit: string;
    recommended: string;
  };

  explanations: {
    similarProducts: string;
    youMayAlsoLike: string;
  };

  askSomeone: {
    title: string;
    description: string;
    sendTo: string; // "Send to {name}"
    sending: string;
    sentTo: string; // "Sent to {name}"
    waitingForReply: string;
    close: string;
  };

  footer: {
    tagline: string;
    madeFor: string;
    live: string;
  };
}

// -----------------------------------------------------------------------------
// English (base)
// -----------------------------------------------------------------------------

const English: Translation = {
  hero: {
    badge: "AI Shopping Concierge",
    titleLine1: "Six worth-it picks.",
    titleEmphasis: "Not five thousand",
    titleLine2: "tabs.",
    subtitle:
      "Describe what you need like you're texting a friend. Rai compares hundreds of products across value, quality, trust and fit — then recommends only the few actually worth buying.",
    searchPlaceholder: "e.g. Something for Rakhi under ₹1200",
    shopNow: "Shop now",
    trust1: "AI-powered recommendations",
    trust2: "Explainable Worth It Score",
    trust3: "Ask someone before you buy",
    floatingCaption: "Trained on real reviews",
    floatingBadge: "6 picks · not 5,000",
    suggestions: [
      "Rakhi gift under ₹1500",
      "Office outfit for my first day",
      "Running shoes under ₹3000",
      "College backpack",
      "Wedding guest outfit",
    ],
  },

  nav: {
    tagline: "Shop with confidence",
    howItWorks: "How Rai Works",
  },

  categoriesSection: {
    heading: "Shop by Occasion",
    subheading: "Explore common shopping moments",
  },

  categories: {
    work: "Work",
    festivals: "Festivals",
    college: "College",
    weddings: "Weddings",
    travel: "Travel",
    fitness: "Fitness",
    gifting: "Gifting",
  },

  features: {
    confidenceEngineTitle: "Confidence Engine",
    confidenceEngineBody:
      "Instead of showing hundreds of products, Rai compares value, quality, trust, reviews and fit to recommend only the few worth buying.",
    contextAwareTitle: "Context Aware",
    contextAwareBody:
      "Shopping for Rakhi isn't the same as shopping for your first office day. Rai understands that before recommending.",
    askSomeoneTitle: "Ask someone",
    askSomeoneBody:
      "Share your recommendation with someone you trust before buying, just like millions of Indian shoppers already do.",
  },

  stageBadges: {
    personalizing: "Personalizing",
    findingPicks: "Finding picks",
    yourShortlist: "Your shortlist",
  },

  questions: {
    intro: "Just a couple quick things",
    understanding: "Understanding what you need…",
    budgetHelper: "This helps Rai recommend products you'll actually consider buying.",
    budgetPlaceholder: "e.g. 2000",
    next: "Next",
    under: "Under ₹{amount}",
    stateHeading: "Where are you shopping from?",
    stateSubheading: "We'll personalize fabrics, styles and festive recommendations for your region.",
    stateSearchPlaceholder: "Search your state...",
    noStateFound: "No matching state found.",
    budgetQuestions: {
      office: "What's a comfortable budget for workwear?",
      rakhi: "How much are you planning to spend?",
      wedding: "What's your budget for the occasion?",
      gift: "How much would you like to spend on the gift?",
      default: "What's a comfortable budget?",
    },
    sets: {
      office: {
        title: "What matters most at work?",
        subtitle: "We'll personalize your shortlist around this.",
        options: [
          { label: "Professional look", value: "premium", emoji: "👔" },
          { label: "Comfort all day", value: "comfort", emoji: "☁️" },
          { label: "Best value", value: "value", emoji: "💰" },
          { label: "Premium quality", value: "premium", emoji: "✨" },
        ],
      },
      festive: {
        title: "What's most important for this occasion?",
        subtitle: "Everyone shops differently for festivals.",
        options: [
          { label: "Elegant look", value: "premium", emoji: "🌸" },
          { label: "Best value", value: "value", emoji: "💰" },
          { label: "Comfort", value: "comfort", emoji: "☁️" },
          { label: "Premium quality", value: "premium", emoji: "✨" },
        ],
      },
      footwear: {
        title: "What matters most in your footwear?",
        subtitle: "We'll rank products around your priority.",
        options: [
          { label: "Comfort", value: "comfort", emoji: "☁️" },
          { label: "Durability", value: "durability", emoji: "🛡️" },
          { label: "Performance", value: "delivery", emoji: "🏃" },
          { label: "Best value", value: "value", emoji: "💰" },
        ],
      },
      gifting: {
        title: "What matters most for your gift?",
        subtitle: "Let's narrow it down.",
        options: [
          { label: "Looks premium", value: "premium", emoji: "🎁" },
          { label: "Best value", value: "value", emoji: "💰" },
          { label: "Unique choice", value: "premium", emoji: "✨" },
          { label: "Fast delivery", value: "delivery", emoji: "🚚" },
        ],
      },
      default: {
        title: "If you had to pick one...",
        subtitle: "What matters the most today?",
        options: [
          { label: "Best value", value: "value", emoji: "💰" },
          { label: "Premium quality", value: "premium", emoji: "✨" },
          { label: "Comfort", value: "comfort", emoji: "☁️" },
          { label: "Fast delivery", value: "delivery", emoji: "🚚" },
        ],
      },
    },
  },

  loading: {
    steps: ["Scanning catalog", "Scoring with ValueIQ", "Curating your shortlist"],
    caption: "Finding the few actually worth buying…",
  },

  errors: {
    title: "Something went wrong",
    tryAgain: "Try again",
  },

  shelf: {
    personalizedFor: "Personalized for {state}",
    personalizedBody:
      "Rai is slightly prioritizing regional styles and shopping preferences while still optimizing for ValueIQ.",
    curated: "Curated for You",
    compared: "We compared",
    products: "products.",
    theseAreThe: "These are the",
    actuallyRecommend: "we'd actually recommend.",
    everyRecommendation:
      "Every recommendation is ranked using ValueIQ — combining value, reviews, quality, trust and occasion fit, instead of popularity.",
    comparedProductsChip: "Compared {count} Products",
    popularityIgnored: "Popularity Ignored",
    explainableRanking: "Explainable AI Ranking",
  },

  product: {
    topPick: "Top Pick",
    excellentBuy: "Excellent Buy",
    save: "Save",
    worthIt: "Worth It",
    worthItFallback: "Worth it",
    addToBag: "Add to Bag",
    askSomeone: "Ask Someone",
    valueIQPick: "ValueIQ Pick",
    back: "Back",
    whyWorthIt: "Why this is worth it",
    regionalMatch: "Regional Match",
    regionalMatchBody: "This product matches shopping preferences commonly seen in {state}.",
    scoreDisclaimer: "Score computed by a trained logistic regression model — not a hand-set formula.",
  },

  breakdown: {
    heading: "ValueIQ Breakdown",
    subheading: "Here's how Rai evaluated this recommendation.",
    value: "Value",
    quality: "Quality",
    reviews: "Reviews",
    sellerTrust: "Seller Trust",
    occasionMatch: "Occasion Match",
    regionalMatch: "Regional Match",
  },

  badges: {
    greatValue: "Great Value",
    premium: "Premium",
    comfort: "Comfort",
    trustedSeller: "Trusted Seller",
    fastDelivery: "Fast Delivery",
    lowReturns: "Low Returns",
    durable: "Durable",
    greatFit: "Great Fit",
    recommended: "Recommended",
  },

  explanations: {
    similarProducts: "Similar Products",
    youMayAlsoLike: "You may also like these.",
  },

  askSomeone: {
    title: "Ask someone",
    description: "Share this pick with someone you trust before you buy. We'll keep the conversation right here.",
    sendTo: "Send to {name}",
    sending: "Sending…",
    sentTo: "Sent to {name}",
    waitingForReply: "Waiting for reply…",
    close: "Close",
  },

  footer: {
    tagline: "Rai · ValueIQ v0.4",
    madeFor: "Made for shoppers who like fewer, better choices.",
    live: "Live",
  },
};

// -----------------------------------------------------------------------------
// Hindi
// -----------------------------------------------------------------------------

const Hindi: Translation = {
  hero: {
    badge: "AI शॉपिंग कॉन्सियर्ज",
    titleLine1: "छह सही खरीद वाले विकल्प।",
    titleEmphasis: "पांच हज़ार नहीं",
    titleLine2: "टैब्स।",
    subtitle:
      "बताइए आपको क्या चाहिए, जैसे किसी दोस्त को मैसेज कर रहे हों। Rai सैकड़ों उत्पादों की तुलना वैल्यू, क्वालिटी, भरोसे और फिट के आधार पर करता है — और सिर्फ वही सुझाता है जो वाकई खरीदने लायक हैं।",
    searchPlaceholder: "जैसे: राखी के लिए ₹1200 में कुछ",
    shopNow: "अभी खरीदें",
    trust1: "AI आधारित सिफारिशें",
    trust2: "स्पष्ट वर्थ इट स्कोर",
    trust3: "खरीदने से पहले किसी से पूछें",
    floatingCaption: "असली रिव्यूज़ पर आधारित",
    floatingBadge: "6 विकल्प · 5,000 नहीं",
    suggestions: [
      "₹1500 में राखी का तोहफ़ा",
      "पहले ऑफिस दिन के लिए आउटफिट",
      "₹3000 में रनिंग शूज़",
      "कॉलेज बैकपैक",
      "शादी में पहनने के लिए आउटफिट",
    ],
  },

  nav: {
    tagline: "भरोसे के साथ शॉपिंग",
    howItWorks: "Rai कैसे काम करता है",
  },

  categoriesSection: {
    heading: "मौके के हिसाब से खरीदारी",
    subheading: "आम शॉपिंग मौकों को देखें",
  },

  categories: {
    work: "ऑफिस",
    festivals: "त्योहार",
    college: "कॉलेज",
    weddings: "शादियां",
    travel: "यात्रा",
    fitness: "फिटनेस",
    gifting: "उपहार",
  },

  features: {
    confidenceEngineTitle: "कॉन्फिडेंस इंजन",
    confidenceEngineBody:
      "सैकड़ों उत्पाद दिखाने के बजाय, Rai वैल्यू, क्वालिटी, भरोसे, रिव्यूज़ और फिट की तुलना करके सिर्फ वही सुझाता है जो खरीदने लायक हों।",
    contextAwareTitle: "संदर्भ के अनुसार",
    contextAwareBody: "राखी की शॉपिंग ऑफिस के पहले दिन जैसी नहीं होती। Rai सुझाव देने से पहले यह समझता है।",
    askSomeoneTitle: "किसी से पूछें",
    askSomeoneBody:
      "खरीदने से पहले अपनी पसंद किसी भरोसेमंद व्यक्ति के साथ साझा करें, ठीक वैसे ही जैसे लाखों भारतीय शॉपर्स पहले से करते हैं।",
  },

  stageBadges: {
    personalizing: "पर्सनलाइज़ हो रहा है",
    findingPicks: "विकल्प खोजे जा रहे हैं",
    yourShortlist: "आपकी शॉर्टलिस्ट",
  },

  questions: {
    intro: "बस कुछ छोटी बातें",
    understanding: "समझा जा रहा है कि आपको क्या चाहिए…",
    budgetHelper: "इससे Rai को ऐसे उत्पाद सुझाने में मदद मिलती है जिन्हें आप वाकई खरीदना चाहेंगे।",
    budgetPlaceholder: "जैसे: 2000",
    next: "अगला",
    under: "₹{amount} तक",
    stateHeading: "आप किस राज्य से खरीदारी कर रहे हैं?",
    stateSubheading: "हम आपके क्षेत्र के अनुसार कपड़े, शैली और त्योहारी सुझाव पर्सनलाइज़ करेंगे।",
    stateSearchPlaceholder: "अपना राज्य खोजें...",
    noStateFound: "कोई मिलता-जुलता राज्य नहीं मिला।",
    budgetQuestions: {
      office: "ऑफिस के कपड़ों के लिए आपका बजट कितना है?",
      rakhi: "आप कितना खर्च करने की सोच रहे हैं?",
      wedding: "इस मौके के लिए आपका बजट क्या है?",
      gift: "गिफ्ट के लिए आप कितना खर्च करना चाहेंगे?",
      default: "आपका बजट क्या है?",
    },
    sets: {
      office: {
        title: "ऑफिस में आपके लिए सबसे ज़रूरी क्या है?",
        subtitle: "हम आपकी शॉर्टलिस्ट को इसी आधार पर पर्सनलाइज़ करेंगे।",
        options: [
          { label: "प्रोफेशनल लुक", value: "premium", emoji: "👔" },
          { label: "पूरे दिन आराम", value: "comfort", emoji: "☁️" },
          { label: "बेहतरीन वैल्यू", value: "value", emoji: "💰" },
          { label: "प्रीमियम क्वालिटी", value: "premium", emoji: "✨" },
        ],
      },
      festive: {
        title: "इस मौके के लिए सबसे ज़रूरी क्या है?",
        subtitle: "त्योहारों के लिए हर किसी की पसंद अलग होती है।",
        options: [
          { label: "शानदार लुक", value: "premium", emoji: "🌸" },
          { label: "बेहतरीन वैल्यू", value: "value", emoji: "💰" },
          { label: "आराम", value: "comfort", emoji: "☁️" },
          { label: "प्रीमियम क्वालिटी", value: "premium", emoji: "✨" },
        ],
      },
      footwear: {
        title: "आपके फुटवियर में सबसे ज़रूरी क्या है?",
        subtitle: "हम आपकी प्राथमिकता के अनुसार उत्पादों को रैंक करेंगे।",
        options: [
          { label: "आराम", value: "comfort", emoji: "☁️" },
          { label: "मज़बूती", value: "durability", emoji: "🛡️" },
          { label: "परफॉर्मेंस", value: "delivery", emoji: "🏃" },
          { label: "बेहतरीन वैल्यू", value: "value", emoji: "💰" },
        ],
      },
      gifting: {
        title: "आपके गिफ्ट में सबसे ज़रूरी क्या है?",
        subtitle: "आइए इसे थोड़ा और स्पष्ट करें।",
        options: [
          { label: "प्रीमियम दिखे", value: "premium", emoji: "🎁" },
          { label: "बेहतरीन वैल्यू", value: "value", emoji: "💰" },
          { label: "अलग सा चुनाव", value: "premium", emoji: "✨" },
          { label: "तेज़ डिलीवरी", value: "delivery", emoji: "🚚" },
        ],
      },
      default: {
        title: "अगर एक ही चुनना हो...",
        subtitle: "आज आपके लिए सबसे ज़रूरी क्या है?",
        options: [
          { label: "बेहतरीन वैल्यू", value: "value", emoji: "💰" },
          { label: "प्रीमियम क्वालिटी", value: "premium", emoji: "✨" },
          { label: "आराम", value: "comfort", emoji: "☁️" },
          { label: "तेज़ डिलीवरी", value: "delivery", emoji: "🚚" },
        ],
      },
    },
  },

  loading: {
    steps: ["कैटलॉग स्कैन हो रहा है", "ValueIQ से स्कोरिंग हो रही है", "आपकी शॉर्टलिस्ट तैयार हो रही है"],
    caption: "जो वाकई खरीदने लायक हैं, वो खोजे जा रहे हैं…",
  },

  errors: {
    title: "कुछ गड़बड़ हो गई",
    tryAgain: "फिर कोशिश करें",
  },

  shelf: {
    personalizedFor: "{state} के लिए पर्सनलाइज़्ड",
    personalizedBody:
      "Rai ValueIQ के लिए ऑप्टिमाइज़ करते हुए क्षेत्रीय शैलियों और शॉपिंग पसंद को थोड़ी प्राथमिकता दे रहा है।",
    curated: "आपके लिए चुने गए",
    compared: "हमने तुलना की",
    products: "उत्पादों की।",
    theseAreThe: "ये वो",
    actuallyRecommend: "हैं जिनकी हम वाकई सिफारिश करेंगे।",
    everyRecommendation:
      "हर सिफारिश ValueIQ का उपयोग करके रैंक की जाती है — लोकप्रियता के बजाय वैल्यू, रिव्यूज़, क्वालिटी, भरोसे और मौके के अनुसार उपयुक्तता को मिलाकर।",
    comparedProductsChip: "{count} उत्पादों की तुलना की गई",
    popularityIgnored: "लोकप्रियता को नज़रअंदाज़ किया गया",
    explainableRanking: "AI आधारित रैंकिंग",
  },

  product: {
    topPick: "सर्वश्रेष्ठ विकल्प",
    excellentBuy: "बेहतरीन खरीद",
    save: "बचत",
    worthIt: "सही खरीद",
    worthItFallback: "सही खरीद",
    addToBag: "बैग में जोड़ें",
    askSomeone: "किसी से पूछें",
    valueIQPick: "ValueIQ चयन",
    back: "वापस",
    whyWorthIt: "यह क्यों सही खरीद है",
    regionalMatch: "क्षेत्रीय मेल",
    regionalMatchBody: "यह उत्पाद {state} में आमतौर पर देखी जाने वाली शॉपिंग पसंद से मेल खाता है।",
    scoreDisclaimer: "स्कोर एक प्रशिक्षित लॉजिस्टिक रिग्रेशन मॉडल से निकाला गया है — किसी तय किए गए फॉर्मूले से नहीं।",
  },

  breakdown: {
    heading: "ValueIQ ब्रेकडाउन",
    subheading: "यहां बताया गया है कि Rai ने इस सिफारिश का मूल्यांकन कैसे किया।",
    value: "वैल्यू",
    quality: "क्वालिटी",
    reviews: "रिव्यूज़",
    sellerTrust: "विक्रेता भरोसा",
    occasionMatch: "मौके से मेल",
    regionalMatch: "क्षेत्रीय मेल",
  },

  badges: {
    greatValue: "बेहतरीन वैल्यू",
    premium: "प्रीमियम",
    comfort: "आराम",
    trustedSeller: "भरोसेमंद विक्रेता",
    fastDelivery: "तेज़ डिलीवरी",
    lowReturns: "कम रिटर्न",
    durable: "टिकाऊ",
    greatFit: "बेहतरीन फिट",
    recommended: "अनुशंसित",
  },

  explanations: {
    similarProducts: "मिलती-जुलती वस्तुएं",
    youMayAlsoLike: "आपको ये भी पसंद आ सकते हैं",
  },

  askSomeone: {
    title: "किसी से पूछें",
    description: "खरीदने से पहले यह पसंद किसी भरोसेमंद व्यक्ति के साथ साझा करें। बातचीत यहीं होगी।",
    sendTo: "{name} को भेजें",
    sending: "भेजा जा रहा है…",
    sentTo: "{name} को भेजा गया",
    waitingForReply: "जवाब का इंतज़ार है…",
    close: "बंद करें",
  },

  footer: {
    tagline: "Rai · ValueIQ v0.4",
    madeFor: "उन शॉपर्स के लिए बनाया गया है जिन्हें कम लेकिन बेहतर विकल्प पसंद हैं।",
    live: "लाइव",
  },
};

// -----------------------------------------------------------------------------
// Telugu
// -----------------------------------------------------------------------------

const Telugu: Translation = {
  hero: {
    badge: "AI షాపింగ్ కన్సియర్జ్",
    titleLine1: "ఆరు సరైన ఎంపికలు.",
    titleEmphasis: "ఐదు వేలు కాదు",
    titleLine2: "ట్యాబ్‌లు.",
    subtitle:
      "మీకు ఏమి కావాలో ఒక స్నేహితుడికి మెసేజ్ చేస్తున్నట్టు చెప్పండి. Rai వందలాది ఉత్పత్తులను విలువ, నాణ్యత, నమ్మకం మరియు ఫిట్ ఆధారంగా పోల్చి, నిజంగా కొనదగినవి మాత్రమే సూచిస్తుంది.",
    searchPlaceholder: "ఉదా: రాఖీ కోసం ₹1200లోపు ఏదైనా",
    shopNow: "ఇప్పుడే షాపింగ్ చేయండి",
    trust1: "AI ఆధారిత సిఫార్సులు",
    trust2: "స్పష్టమైన Worth It స్కోర్",
    trust3: "కొనే ముందు ఎవరినైనా అడగండి",
    floatingCaption: "నిజమైన రివ్యూల ఆధారంగా శిక్షణ పొందింది",
    floatingBadge: "6 ఎంపికలు · 5,000 కాదు",
    suggestions: [
      "₹1500లోపు రాఖీ గిఫ్ట్",
      "మొదటి ఆఫీస్ రోజు కోసం అవుట్‌ఫిట్",
      "₹3000లోపు రన్నింగ్ షూస్",
      "కాలేజ్ బ్యాక్‌ప్యాక్",
      "పెళ్లికి వెళ్లేందుకు అవుట్‌ఫిట్",
    ],
  },

  nav: {
    tagline: "నమ్మకంతో షాపింగ్",
    howItWorks: "Rai ఎలా పనిచేస్తుంది",
  },

  categoriesSection: {
    heading: "సందర్భాన్ని బట్టి షాపింగ్",
    subheading: "సాధారణ షాపింగ్ సందర్భాలను చూడండి",
  },

  categories: {
    work: "ఆఫీస్",
    festivals: "పండుగలు",
    college: "కాలేజ్",
    weddings: "పెళ్లిళ్లు",
    travel: "ప్రయాణం",
    fitness: "ఫిట్‌నెస్",
    gifting: "గిఫ్టింగ్",
  },

  features: {
    confidenceEngineTitle: "కాన్ఫిడెన్స్ ఇంజన్",
    confidenceEngineBody:
      "వందలాది ఉత్పత్తులను చూపించే బదులు, Rai విలువ, నాణ్యత, నమ్మకం, రివ్యూలు మరియు ఫిట్‌ను పోల్చి కొనదగినవి మాత్రమే సూచిస్తుంది.",
    contextAwareTitle: "సందర్భానుసారం",
    contextAwareBody:
      "రాఖీ కోసం షాపింగ్ చేయడం మీ మొదటి ఆఫీస్ రోజు కోసం చేయడం లాంటిది కాదు. సిఫార్సు చేసే ముందు Rai దీన్ని అర్థం చేసుకుంటుంది.",
    askSomeoneTitle: "ఎవరినైనా అడగండి",
    askSomeoneBody: "కొనే ముందు మీ ఎంపికను నమ్మకమైన వ్యక్తితో పంచుకోండి, లక్షలాది భారతీయ షాపర్లు ఇప్పటికే చేస్తున్నట్టు.",
  },

  stageBadges: {
    personalizing: "పర్సనలైజ్ అవుతోంది",
    findingPicks: "ఎంపికలు వెతుకుతోంది",
    yourShortlist: "మీ షార్ట్‌లిస్ట్",
  },

  questions: {
    intro: "కొన్ని చిన్న విషయాలు మాత్రమే",
    understanding: "మీకు ఏమి కావాలో అర్థం చేసుకుంటోంది…",
    budgetHelper: "దీనివల్ల మీరు నిజంగా కొనాలనుకునే ఉత్పత్తులను Rai సూచించగలదు.",
    budgetPlaceholder: "ఉదా: 2000",
    next: "తదుపరి",
    under: "₹{amount}లోపు",
    stateHeading: "మీరు ఏ రాష్ట్రం నుండి షాపింగ్ చేస్తున్నారు?",
    stateSubheading: "మీ ప్రాంతానికి అనుగుణంగా ఫ్యాబ్రిక్‌లు, స్టైల్స్ మరియు పండుగ సిఫార్సులను పర్సనలైజ్ చేస్తాము.",
    stateSearchPlaceholder: "మీ రాష్ట్రాన్ని వెతకండి...",
    noStateFound: "సరిపోలే రాష్ట్రం కనుగొనబడలేదు.",
    budgetQuestions: {
      office: "ఆఫీస్ దుస్తుల కోసం మీ బడ్జెట్ ఎంత?",
      rakhi: "మీరు ఎంత ఖర్చు చేయాలనుకుంటున్నారు?",
      wedding: "ఈ సందర్భం కోసం మీ బడ్జెట్ ఎంత?",
      gift: "గిఫ్ట్ కోసం మీరు ఎంత ఖర్చు చేయాలనుకుంటున్నారు?",
      default: "మీ బడ్జెట్ ఎంత?",
    },
    sets: {
      office: {
        title: "ఆఫీస్‌లో మీకు అత్యంత ముఖ్యమైనది ఏమిటి?",
        subtitle: "దీని ఆధారంగా మీ షార్ట్‌లిస్ట్‌ను పర్సనలైజ్ చేస్తాము.",
        options: [
          { label: "ప్రొఫెషనల్ లుక్", value: "premium", emoji: "👔" },
          { label: "రోజంతా సౌకర్యం", value: "comfort", emoji: "☁️" },
          { label: "గొప్ప విలువ", value: "value", emoji: "💰" },
          { label: "ప్రీమియం నాణ్యత", value: "premium", emoji: "✨" },
        ],
      },
      festive: {
        title: "ఈ సందర్భానికి అత్యంత ముఖ్యమైనది ఏమిటి?",
        subtitle: "పండుగలకు ప్రతి ఒక్కరూ వేరు వేరుగా షాపింగ్ చేస్తారు.",
        options: [
          { label: "ఎలిగెంట్ లుక్", value: "premium", emoji: "🌸" },
          { label: "గొప్ప విలువ", value: "value", emoji: "💰" },
          { label: "సౌకర్యం", value: "comfort", emoji: "☁️" },
          { label: "ప్రీమియం నాణ్యత", value: "premium", emoji: "✨" },
        ],
      },
      footwear: {
        title: "మీ ఫుట్‌వేర్‌లో అత్యంత ముఖ్యమైనది ఏమిటి?",
        subtitle: "మీ ప్రాధాన్యత ఆధారంగా ఉత్పత్తులను ర్యాంక్ చేస్తాము.",
        options: [
          { label: "సౌకర్యం", value: "comfort", emoji: "☁️" },
          { label: "మన్నిక", value: "durability", emoji: "🛡️" },
          { label: "పనితీరు", value: "delivery", emoji: "🏃" },
          { label: "గొప్ప విలువ", value: "value", emoji: "💰" },
        ],
      },
      gifting: {
        title: "మీ గిఫ్ట్‌లో అత్యంత ముఖ్యమైనది ఏమిటి?",
        subtitle: "దీన్ని కొంచెం స్పష్టం చేద్దాం.",
        options: [
          { label: "ప్రీమియంగా కనిపించాలి", value: "premium", emoji: "🎁" },
          { label: "గొప్ప విలువ", value: "value", emoji: "💰" },
          { label: "ప్రత్యేకమైన ఎంపిక", value: "premium", emoji: "✨" },
          { label: "వేగవంతమైన డెలివరీ", value: "delivery", emoji: "🚚" },
        ],
      },
      default: {
        title: "ఒక్కటే ఎంచుకోవాలంటే...",
        subtitle: "ఈరోజు మీకు అత్యంత ముఖ్యమైనది ఏమిటి?",
        options: [
          { label: "గొప్ప విలువ", value: "value", emoji: "💰" },
          { label: "ప్రీమియం నాణ్యత", value: "premium", emoji: "✨" },
          { label: "సౌకర్యం", value: "comfort", emoji: "☁️" },
          { label: "వేగవంతమైన డెలివరీ", value: "delivery", emoji: "🚚" },
        ],
      },
    },
  },

  loading: {
    steps: ["కేటలాగ్ స్కాన్ చేస్తోంది", "ValueIQతో స్కోర్ చేస్తోంది", "మీ షార్ట్‌లిస్ట్ సిద్ధం చేస్తోంది"],
    caption: "నిజంగా కొనదగినవి వెతుకుతోంది…",
  },

  errors: {
    title: "ఏదో తప్పు జరిగింది",
    tryAgain: "మళ్లీ ప్రయత్నించండి",
  },

  shelf: {
    personalizedFor: "{state} కోసం పర్సనలైజ్ చేయబడింది",
    personalizedBody:
      "Rai ValueIQ కోసం ఆప్టిమైజ్ చేస్తూనే ప్రాంతీయ శైలులు మరియు షాపింగ్ ప్రాధాన్యతలకు కొంచెం ప్రాధాన్యత ఇస్తోంది.",
    curated: "మీ కోసం ఎంపిక చేయబడింది",
    compared: "మేము పోల్చాము",
    products: "ఉత్పత్తులను.",
    theseAreThe: "మేము నిజంగా సిఫార్సు చేసేవి ఈ",
    actuallyRecommend: "ఉత్పత్తులు.",
    everyRecommendation:
      "ప్రతి సిఫార్సు ValueIQ ఉపయోగించి ర్యాంక్ చేయబడుతుంది — జనాదరణకు బదులుగా విలువ, రివ్యూలు, నాణ్యత, నమ్మకం మరియు సందర్భ సరిపోలికను కలిపి.",
    comparedProductsChip: "{count} ఉత్పత్తులను పోల్చాము",
    popularityIgnored: "ప్రజాదరణను పరిగణించలేదు",
    explainableRanking: "AI వివరణతో ర్యాంకింగ్",
  },

  product: {
    topPick: "ఉత్తమ ఎంపిక",
    excellentBuy: "అద్భుతమైన కొనుగోలు",
    save: "ఆదా",
    worthIt: "సరైన ఎంపిక",
    worthItFallback: "సరైన ఎంపిక",
    addToBag: "బ్యాగ్‌లో చేర్చండి",
    askSomeone: "ఎవరినైనా అడగండి",
    valueIQPick: "ValueIQ ఎంపిక",
    back: "వెనుకకు",
    whyWorthIt: "ఇది ఎందుకు సరైనది",
    regionalMatch: "ప్రాంతీయ మ్యాచ్",
    regionalMatchBody: "ఈ ఉత్పత్తి {state}లో సాధారణంగా కనిపించే షాపింగ్ ప్రాధాన్యతలకు సరిపోతుంది.",
    scoreDisclaimer:
      "ఈ స్కోర్ శిక్షణ పొందిన లాజిస్టిక్ రిగ్రెషన్ మోడల్ ద్వారా లెక్కించబడింది — చేతితో నిర్ణయించిన ఫార్ములా కాదు.",
  },

  breakdown: {
    heading: "ValueIQ విభజన",
    subheading: "Rai ఈ సిఫార్సును ఎలా మూల్యాంకనం చేసిందో ఇక్కడ ఉంది.",
    value: "విలువ",
    quality: "నాణ్యత",
    reviews: "రివ్యూలు",
    sellerTrust: "విక్రేత నమ్మకం",
    occasionMatch: "సందర్భ సరిపోలిక",
    regionalMatch: "ప్రాంతీయ మ్యాచ్",
  },

  badges: {
    greatValue: "గొప్ప విలువ",
    premium: "ప్రీమియం",
    comfort: "సౌకర్యం",
    trustedSeller: "నమ్మకమైన విక్రేత",
    fastDelivery: "వేగవంతమైన డెలివరీ",
    lowReturns: "తక్కువ రిటర్న్‌లు",
    durable: "మన్నికైనది",
    greatFit: "సరైన ఫిట్",
    recommended: "సిఫార్సు చేయబడింది",
  },

  explanations: {
    similarProducts: "సారూప్య ఉత్పత్తులు",
    youMayAlsoLike: "మీకు ఇవి కూడా నచ్చవచ్చు",
  },

  askSomeone: {
    title: "ఎవరినైనా అడగండి",
    description: "కొనే ముందు ఈ ఎంపికను నమ్మకమైన వ్యక్తితో పంచుకోండి. సంభాషణ ఇక్కడే ఉంటుంది.",
    sendTo: "{name}కి పంపండి",
    sending: "పంపుతోంది…",
    sentTo: "{name}కి పంపబడింది",
    waitingForReply: "జవాబు కోసం వేచి ఉంది…",
    close: "మూసివేయండి",
  },

  footer: {
    tagline: "Rai · ValueIQ v0.4",
    madeFor: "తక్కువ కానీ మెరుగైన ఎంపికలను ఇష్టపడే షాపర్ల కోసం రూపొందించబడింది.",
    live: "లైవ్",
  },
};

// -----------------------------------------------------------------------------
// Exported translations table
// -----------------------------------------------------------------------------
// Adding a new language later is just: add its key here with a `Translation`-
// typed object. Missing/misspelled keys fail the build immediately.

export const translations: Record<"English" | "Hindi" | "Telugu", Translation> = {
  English,
  Hindi,
  Telugu,
};