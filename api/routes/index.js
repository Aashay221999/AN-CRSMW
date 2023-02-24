const express = require("express");

// import example routes
const exampleRoutes = require("./routes.example.js");
const claimRoute = require("./claim-request.js");

const router = express.Router();

// Add example routes to app
router.use("/example", exampleRoutes);
router.use("/claim", claimRoute);

module.exports = router;
