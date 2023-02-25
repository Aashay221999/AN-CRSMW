const express = require("express");

// import example routes
const exampleRoutes = require("./routes.example.js");
const claimRoute = require("./claim-request.js");
const getIdentity = require("./identity.js");
const identities = require("./identities.js")
const createIdentity = require("./createIdentity.js");
const claimIssuers = require("./claimIssuers.js");
const router = express.Router();

// Add example routes to app
router.use("/example", exampleRoutes);
router.use("/claim", claimRoute);
router.use("/identity", getIdentity);
router.use("/identity", identities);
router.use("/identity", createIdentity);
router.use("/identity", claimIssuers);

// Apply routes on app
// app.use(identityRoutes)
// app.use(claimRequestRoutes)
// app.use(signedClaimsRoutes)

module.exports = router;
