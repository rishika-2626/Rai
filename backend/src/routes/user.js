const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protectRoute } = require("../middleware/auth");

// 1. Sync User Profile (Syncs Clerk user to MongoDB)
router.post("/sync", protectRoute, async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body.userId;
    const { email, firstName, lastName } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    let user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      user = await User.create({
        clerkUserId: userId,
        email,
        firstName,
        lastName,
      });
    }

    console.log("✅ User synced successfully:", userId);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ USER SYNC ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Add Search Query to History
router.post("/history", protectRoute, async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body.userId;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $push: {
          searchHistory: {
            $each: [{ query, timestamp: new Date() }],
            $position: 0, // Latest search sabse upar dikhegi
          },
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, history: user.searchHistory });
  } catch (error) {
    console.error("❌ HISTORY POST ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get User Search History
router.get("/history", protectRoute, async (req, res) => {
  try {
    const userId = req.auth?.userId || req.query.userId;
    const user = await User.findOne({ clerkUserId: userId });

    res.status(200).json({ success: true, history: user?.searchHistory || [] });
  } catch (error) {
    console.error("❌ HISTORY GET ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Save a Pick/Recommendation
router.post("/saved-picks", protectRoute, async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body.userId;
    const { title, details } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      { $push: { savedPicks: { title, details } } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, savedPicks: user.savedPicks });
  } catch (error) {
    console.error("❌ SAVED PICKS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Get User Profile & Saved Data
router.get("/profile", protectRoute, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const user = await User.findOne({ clerkUserId: userId });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ PROFILE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;