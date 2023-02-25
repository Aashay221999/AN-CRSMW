"use strict";

const router = require("express").Router();
const claimSigningService = require("../services/claim-request");

router.post("/submit", async function (req, res) {
  try {
    //refirect to service
    const response = await claimSigningService.submitClaim(req.body);
    res.send(response);
  } catch (error) {
    res.status(error.status || 500).send(error);
  }
});

router.get("/retrieve", async function (req, res) {
  try {
    //refirect to service
    const response = await claimSigningService.getClaims();
    res.send(response);
  } catch (error) {
    res.status(error.status || 500).send(error);
  }
});

router.get("/retrieve/:walletAddress", async function (req, res) {
  const { walletAddress } = req.params;
  try {
    //refirect to service
    const response = await claimSigningService.getClaimsForIdentity(walletAddress);
    res.send(response);
  } catch (error) {
    res.status(error.status || 500).send(error);
  }
});

module.exports = router;
