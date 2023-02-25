const express = require("express")

const router = express.Router()

const fs = require('fs');

// API to submit new identity creation for issuer and holder
// URL: http://localhost:5000/api/identity/createIdentity
/* request body:
{
  "username": "john_doe",
  "email": "john_doe@example.com",
  "walletAddress": "0x5a1f5d5c057d967f8225621ae5b5d82bcbf7f810",
  "role": "IDENTITY"
}
*/
router.post('/createIdentity', (req, res) => {
    const identity = req.body; 
    const data = JSON.parse(fs.readFileSync('./data/identities.json'));
    data.push(identity);
    fs.writeFileSync('./data/identities.json', JSON.stringify(data));
    res.status(201).json(identity);
});
 

module.exports = router;