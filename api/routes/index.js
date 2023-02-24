const express = require("express");

// import example routes
const exampleRoutes = require("./routes.example.js");

const router = express.Router();

/**
 * Add example routes to app
 */
router.use("/example", exampleRoutes);

// Apply routes on app
// app.use(identityRoutes)
// app.use(claimRequestRoutes)
// app.use(signedClaimsRoutes)

module.exports = router;
