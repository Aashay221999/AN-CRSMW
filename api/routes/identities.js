const express = require("express")

const router = express.Router()

const fs = require('fs');

// API to get identities
// URL: http://localhost:5000/api/identity/identities
router.get('/identities', (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync('./data/identities.json'));
      console.log(data);
      res.send(`${JSON.stringify(data)}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error getting Identities.');
    }
  });

module.exports = router;