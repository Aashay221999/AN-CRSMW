const express = require("express")

const router = express.Router()

const fs = require('fs');

// API to get identity from wallet address
// URL: http://localhost:5000/api/identity/getIdentity
/* request body:
{
  "walletAddress": "0x5a1f5d5c057d967f8225621ae5b5d82bcbf7f810"
}
*/
router.get('/getIdentity/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  const data = JSON.parse(fs.readFileSync('./data/identities.json'));
  const identity = data.find(identity => identity.walletAddress === walletAddress);
  if (!identity) {
    res.status(404).send('Identity not found');
  } else {
    res.json(identity);
  }
});

module.exports = router
