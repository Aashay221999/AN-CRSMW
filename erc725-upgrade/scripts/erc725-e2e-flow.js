const hre = require("hardhat");

/**
 * !WARNING!
 * Verification step fails to recover the original Issuer Identity address
 * Needs to be debugged
 */

const {ethers} = hre


function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while(i < len) {
  c = array[i++];
  switch(c >> 4)
  { 
    case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
      // 0xxxxxxx
      out += String.fromCharCode(c);
      break;
    case 12: case 13:
      // 110x xxxx   10xx xxxx
      char2 = array[i++];
      out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
      break;
    case 14:
      // 1110 xxxx  10xx xxxx  10xx xxxx
      char2 = array[i++];
      char3 = array[i++];
      out += String.fromCharCode(((c & 0x0F) << 12) |
                     ((char2 & 0x3F) << 6) |
                     ((char3 & 0x3F) << 0));
      break;
  }
  }

  return out;
}


const KEY_PURPOSES = {
  "MANAGEMENT" : 1,
  "CLAIM_SIGNER" : 3,
};

const KEY_TYPES = {
  "ECDSA" : 1
};

const CLAIM_SCHEMES = {
  "ECDSA" : 1
};

const CLAIM_TYPES = {
  "KYC" : 7
};

async function main() {
  const accounts = await ethers.getSigners();
  const issuerManagementAccount = accounts[0];
  const issuerClaimAccount = accounts[1];
  const verifierAccount = accounts[2];
  const identityAccount = accounts[3];

  /*
    Step 1 - Deploy Identity Contract for ClaimIssuer

  */
  console.log("Deploying Identity Contract for ClaimIssuer...");
  const ClaimHolder_factory = await ethers.getContractFactory("ClaimHolder");
  const issuerClaimHolder = await ClaimHolder_factory.connect(issuerManagementAccount).deploy().then((c) => c.deployed());
  console.log("Issuer Identity contract deployed to:", issuerClaimHolder.address);
  /*
    Step 2 - Add ClaimSigner Key on ClaimIssuer's Identity

  */

  const issuerClaimKeyHash = ethers.utils.keccak256(issuerClaimAccount.address);
  await issuerClaimHolder.connect(issuerManagementAccount).addKey(issuerClaimKeyHash, KEY_PURPOSES.CLAIM_SIGNER, KEY_TYPES.ECDSA, {
      gasLimit: 4612388,
    });
  console.log("Adding a claim signing key to Issuer's ClaimHolder...");

  /*
   * Step3 - Deploy Identity contract for Nick
  */
  console.log("Deploying Nick's ClaimHolder...");

  const identityClaimHolder = await ClaimHolder_factory.connect(identityAccount)
    .deploy()
    .then((c) => c.deployed());
  console.log("Nick Claim Holder deployed to:", identityClaimHolder.address);
  console.log();


  /*
   * Issuer signs a KYC claim for Identity to add to their ClaimHolder
   *  - Issuer does KYC/OAuth checks for Identity
   *  - Issuer generates claim data for Identity
   *  - Issuer signs data - (Identity wallet address, Claim Type, Claim data bytes)
   *  - Issuer gives the data and signature on data to Identity
   */

  console.log("Signing KYC claim with Issuer's Key for Identity...");

  const claimData = "Yea no, this guy is totes legit";
  const claimDataInHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(claimData));
  const claimDataToSign = [identityClaimHolder.address, CLAIM_TYPES.KYC, claimDataInHex];
  const claimDataToSignBytes = ethers.utils.solidityPack(
    ["address", "uint256", "bytes"],
    claimDataToSign
  );
  const hashedDataToSign = ethers.utils.keccak256(claimDataToSignBytes);
  const signature = await issuerClaimAccount.signMessage(
    ethers.utils.arrayify(hashedDataToSign)
  );
  console.log("claimData:", claimData);
  console.log("claimDataInHex:", claimDataInHex);
  console.log("claimDataToSign:", claimDataToSign);
  console.log("claimDataToSignBytes:", claimDataToSignBytes);
  console.log("hashedDataToSign:", hashedDataToSign);
  console.log("Signature:", signature);
  /*
   * Identity adds Issuers's claim to own ClaimHolder
   */

  console.log("Adding Issuer's KYC claim on Identity's ClaimHolder...");

  const claimIssuer = issuerClaimHolder.address;
  const addClaimABI = identityClaimHolder.interface.encodeFunctionData(
    "addClaim",
    [
      CLAIM_TYPES.KYC,
      CLAIM_SCHEMES.ECDSA,
      claimIssuer,
      signature,
      claimDataInHex,
      "https://www.example.com/issuer/",
    ]
  );
  await identityClaimHolder
    .connect(identityAccount)
    .execute(identityClaimHolder.address, 0, addClaimABI, {
      gasLimit: 4612388,
    }).then(tx => tx.wait());
  
  const claimId = ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [claimIssuer, CLAIM_TYPES.KYC]
  );
  console.log("Claim on-chain:", await identityClaimHolder.getClaim(claimId));
  console.log();


  /*
   * Deploy a verifier contract
   */
  console.log("Deploying a Claim verifier...");
  const ClaimVerifier_factory = await ethers.getContractFactory("ClaimVerifier");
  const claimVerifier = await ClaimVerifier_factory.connect(verifierAccount)
    .deploy(claimIssuer)
    .then((c) => c.deployed());

  const isKycClaimVerified = await claimVerifier.claimIsValid(
    identityClaimHolder.address,
    CLAIM_TYPES.KYC
  );
  console.log("KYC claim verification status:", isKycClaimVerified);

  console.log("--------------------")
  console.log("claim Id", claimId);
  console.log("dataHash", hashedDataToSign);
  const ethSignedMessgeHash = ethers.utils.solidityKeccak256(
    ["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", hashedDataToSign]
  );
  console.log("ethSignedMessage", ethSignedMessgeHash);
  const sig = ethers.utils.splitSignature(signature);
  const recoverdAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(hashedDataToSign), sig);
  console.log("Signature:", sig);
  console.log("Recovered Address:", recoverdAddress);
  console.log("hashaddr", ethers.utils.solidityKeccak256(["address"], [recoverdAddress]));
  console.log("Recovered address from contract (eth signed message):", await claimVerifier.getRecoveredAddress(signature, ethSignedMessgeHash));
  console.log("Issuer claim signer account:", issuerClaimAccount.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
