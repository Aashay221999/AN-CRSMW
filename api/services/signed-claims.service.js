const fs = require("fs");
const fsPromises = require("fs/promises");

const SIGNED_CLAIMS_PATH = "./data/signed-claims.json";

// Signed-Claim db.json
// [{
// 	"username": string
// 	"walletAddress": string
// 	"claimType": number
// 	"claimScheme": number
// 	"issuerAddress": string
// 	"signature": string
// 	"claimData": string (in hex)
// 	"uri": string
// }]

function signedClaimsExist() {
  return fs.existsSync(SIGNED_CLAIMS_PATH);
}

async function getSignedClaims() {
  if (!signedClaimsExist()) {
    return [];
  }
  const claims = await fsPromises.readFile(SIGNED_CLAIMS_PATH, "utf-8");
  try {
    return JSON.parse(claims);
  } catch (error) {
    console.error("Error while parsing signed claims", error);
    return [];
  }
}

async function saveSignedClaim(claim) {
  const claims = await getSignedClaims();
  const updatedClaims = JSON.stringify([...claims, claim], null, 4);
  await fsPromises.writeFile(SIGNED_CLAIMS_PATH, updatedClaims, "utf-8");
}

async function deleteSignedClaim(walletAddress) {
  const claims = await getSignedClaims();
  const updatedClaims = claims.filter((c) => c.walletAddress != walletAddress);
  const updatedClaimsString = JSON.stringify(updatedClaims, null, 4);
  await fsPromises.writeFile(SIGNED_CLAIMS_PATH, updatedClaimsString, "utf-8");
}

module.exports = {
  getSignedClaims,
  saveSignedClaim,
  deleteSignedClaim,
};
