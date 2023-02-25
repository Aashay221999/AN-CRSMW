const express = require("express")

const router = express.Router()

const fs = require('fs');

// API to get claim issuers
// URL: http://localhost:5000/api/identity/claimIssuers
router.get('/claimIssuers', (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync('./data/identities.json'));
      const issuers = data.filter(identity => identity.role === 'ISSUER');
      console.log(issuers);
      res.send(`${JSON.stringify(issuers)}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error getting Identities.');
    }
  });

module.exports = router;
