const express = require("express");

// import example routes
const exampleRoutes = require("./routes.example.js");
const claimRoute = require("./claim-request.js");
const signedClaimsRoutes = require("./signed-claims");

const router = express.Router();

// Add example routes to app
router.use("/example", exampleRoutes);
router.use("/claim", claimRoute);
router.use("/signed-claims", signedClaimsRoutes);

module.exports = router;
