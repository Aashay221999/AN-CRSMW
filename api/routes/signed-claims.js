const express = require("express");
const {
  getSignedClaims,
  saveSignedClaim,
  deleteSignedClaim,
} = require("../services/signed-claims.service");

const router = express.Router();

router.post("/", async (req, res) => {
  // TODO: Validate claim structure received
  const claim = req.body;
  try {
    await saveSignedClaim(claim);
    const claims = await getSignedClaims();
    return res.status(200).json({
      status: "claim added",
      claims,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "server error",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const claims = await getSignedClaims();
    return res.status(200).json({
      claims,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "server error",
    });
  }
});

router.delete("/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;
  try {
    await deleteSignedClaim(walletAddress);
    return res.status(200).json({
      status: `claim for ${walletAddress} was deleted`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "server error",
    });
  }
});

module.exports = router;
