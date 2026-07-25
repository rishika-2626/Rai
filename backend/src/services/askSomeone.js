/**
 * Ask Someone — social confirmation loop.
 *
 * For the MVP this is an in-memory store: creating a share schedules a
 * simulated reply after a short delay, standing in for a real recipient
 * responding over WhatsApp/SMS. The interface (createShare / getShare) is
 * written so swapping in a real messaging provider (Twilio, WhatsApp
 * Business API) later only requires changing what happens inside
 * createShare — the route and frontend contract stay the same.
 */

const shares = new Map();

const SAMPLE_REPLIES = [
  { name: "Didi", text: "This one! The color is perfect 😍 go for it" },
  { name: "Mummy", text: "Haan theek hai, order kar do" },
  { name: "Best friend", text: "Yesss this is so cute, buy it" },
];

function createShare(productId, recipient = "Didi") {
  const id = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const reply = SAMPLE_REPLIES.find((r) => r.name === recipient) || SAMPLE_REPLIES[0];

  shares.set(id, {
    id,
    productId,
    recipient,
    status: "pending",
    reply: null,
    createdAt: Date.now(),
  });

  const delayMs = 1500 + Math.random() * 1500;
  setTimeout(() => {
    const share = shares.get(id);
    if (share) {
      share.status = "replied";
      share.reply = reply;
    }
  }, delayMs);

  return shares.get(id);
}

function getShare(id) {
  return shares.get(id) || null;
}

module.exports = { createShare, getShare };
