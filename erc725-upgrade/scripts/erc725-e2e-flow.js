const hre = require("hardhat");

/**
 * !WARNING!
 * Verification step fails to recover the original Issuer Identity address
 * Needs to be debugged
 */

const {ethers} = hre

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
   * Issuer deploys own ClaimHolder contract
   */

  console.log("Deploying Issuer's ClaimHolder...");

  const ClaimHolder_factory = await ethers.getContractFactory("ClaimHolder");

  const issuerClaimHolder = await ClaimHolder_factory.connect(
    issuerManagementAccount
  )
    .deploy()
    .then((c) => c.deployed());

  console.log("Issuer Claim Holder deployed to:", issuerClaimHolder.address);
  console.log();

  /*
   * Issuer adds claim signing key on its ClaimHolder
   */

  console.log("Adding a claim signing key to Issuer's ClaimHolder...");

  const issuerClaimKeyHash = ethers.utils.keccak256(issuerClaimAccount.address);
  await issuerClaimHolder
    .connect(issuerManagementAccount)
    .addKey(issuerClaimKeyHash, KEY_PURPOSES.CLAIM_SIGNER, KEY_TYPES.ECDSA, {
      gasLimit: 4612388,
    });
  console.log();


  /*
   * Identity deploys their ClaimHolder contract
   */

  console.log("Deploying Identity's ClaimHolder...");

  const identityClaimHolder = await ClaimHolder_factory.connect(identityAccount)
    .deploy()
    .then((c) => c.deployed());
  console.log("Identity Claim Holder deployed to:", identityClaimHolder.address);
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
  const claimDataToSign = [identityClaimHolder.address, CLAIM_TYPES.KYC, claimData];
  const claimDataToSignBytes = ethers.utils.solidityPack(
    ["address", "uint256", "string"],
    claimDataToSign
  );
  const hashedDataToSign = ethers.utils.keccak256(claimDataToSignBytes);
  const signature = await issuerClaimAccount.signMessage(
    ethers.utils.arrayify(hashedDataToSign)
  );
  console.log("Claim data to sign:", claimDataToSign);
  console.log("Claim data bytes:", claimDataToSignBytes);
  console.log("Hashed data to sign:", hashedDataToSign);
  console.log("Signature:", signature);
  console.log();


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
      claimDataToSignBytes,
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

  console.log("Recovered address:", await claimVerifier.getRecoveredAddress(signature, hashedDataToSign))
  console.log("Issuer claim signer account:", issuerClaimAccount.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
