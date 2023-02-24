const express = require("express");

// import example routes
const exampleRoutes = require("./routes.example.js");

const router = express.Router();

// Add example routes to app
router.use("/example", exampleRoutes);

module.exports = router;
