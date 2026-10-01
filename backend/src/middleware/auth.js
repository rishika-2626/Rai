const { requireAuth } = require("@clerk/express");

// Middleware to verify Clerk JWT token from request headers
const protectRoute = requireAuth({
  signInUrl: "/sign-in",
});

module.exports = { protectRoute };