# AN-CRSMW

Git Clone  for Private Repo
    git clone https://username@github.com/username/repo_name

Node Version 18.13.0 on all terminals
Bundler Pre-Req
1. cd bundler
2. yarn && yarn preprocess
3. Update the bundler-config in (bundler\packages\bundler\localconfig\bundler.config.json) as follows 
        Update beneficiary to whichever EOA of Harhdat you want remaining funds to go E.g., 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   
Hardhat Pre-req
1. cd hardhat
2. npm install
3. npx hardhat compile

Instructions for Deploying AA-Contracts, Starting bundler
   1. Start hardhat node - cd hardhat and run npx hardhat node
   2. cd hardhat and run npx hardhat run --network localhost scripts/aa-presetup.ts
   3. Update the bundler config with EntryPoint address and the address obtained in aa-activate-wallet (if required)
   4. cd bundler and run yarn hardhat-deploy --network localhost
   5. cd bundler and Run the bunder yarn run bundler --unsafe
   6. cd hardhat and run script to activate-wallet - npx hardhat run --network localhost scripts/aa-activate-wallet.ts
  


 
 
yarn && yarn preprocess
yarn hardhat-deploy --network localhost
yarn run bundler --unsafe
yarn run runop --deployFactory --network localhost

To run the full test bundler spec test suite, visit https://github.com/eth-infinitism/bundler-spec-tests

SDK to create and send UserOperations
see [SDK Readme](./packages/sdk/README.md)