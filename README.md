# AN-CRSMW

## Cloning the repo

Git Clone  for Private Repo `git clone https://username@github.com/username/repo_name`

## Pre-requisites

### Software installation

- Node Version 18.13.0
- WSL2 setup on Windows
  > **Note:** Prefer to run all below steps on WSL

### Bundler Pre-Req

1. `cd bundler`
2. `yarn && yarn preprocess`
3. Update the bundler-config in [bundler.config.json](bundler/packages/bundler/localconfig/bundler.config.json)
    as follows  
    - Update beneficiary to whichever EOA of Hardhat you want remaining funds to go E.g., `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` 
   
### Hardhat Pre-req

1. `cd hardhat`
2. `npm install`
3. `npx hardhat compile`

## Instructions for Deploying AA-Contracts, Starting bundler

Create separate terminals for Hardhat dir and Bundler dir

### 1. In Hardhat terminal

1. Start hardhat node
    ```sh
    cd hardhat 
    npx hardhat node
    ```
2. In another terminal in hardhat folder, run aa-presetup script
   ```sh
   npx hardhat run --network localhost scripts/aa-presetup.ts
   ```
3. Update the [bundler config](bundler/packages/bundler/localconfig/bundler.config.json) with
    EntryPoint address
4. Update the addresses generated by `aa-presetup.ts` in
    [aa-activate-wallet](./hardhat/scripts/aa-activate-wallet.ts)

### 2. In Bundler terminal

1. Deploy bundler contracts
   ```sh
   cd bundler
   yarn hardhat-deploy --network localhost
   ```
2. Run the bundler 
   ```sh
   yarn run bundler --unsafe
   ```

### 3. In Hardhat terminal

1. Go to hardhat folder and run script to activate-wallet
   ```sh
   npx hardhat run --network localhost scripts/aa-activate-wallet.ts
   ```

## Troubleshooting

- yarn command not found  
  [guide](https://bobbyhadz.com/blog/not-recognized-as-internal-or-external-command-yarn)
- Certificate issues with node.js or yarn  
  Add zscaler pem certificate to nodejs trust store using NODE_EXTRA_CA_CERTS variable  
  [guide](https://nodejs.org/dist/latest-v18.x/docs/api/cli.html#node_extra_ca_certsfile)
- Certificate issues with WSL  
  Add zscaler crt certificate to ca-certificates  
  [guide](https://github.com/microsoft/WSL/issues/3161#issue-320777324)
- Error when running `aa-presetup.ts` like below
  ```
  npx hardhat run --network localhost scripts/aa-presetup.ts
  Error: Cannot find module '../utils/token'

  OR

  npx hardhat run --network localhost scripts/aa-presetup.ts
  Error: Cannot find module '../utils/guardian'

  ```
  Solution:
  1. Delete existing node modules in hardhat folder
  2. Make sure package.json in hardhat folder has below version for soul-wallet-lib  
      `"soul-wallet-lib": "github:proofofsoulprotocol/soulwalletlib#v0.1.0-alpha.4"`
  3. Re-install node modules for hardhat. Go to soul-wallet-lib dir and rebuild it
      ```
      npm install
      cd node_modules/soul-wallet-lib
      npm run rebuild
      ```
      Then re-run `aa-presetup.ts`



## Further Readings

To run the full test bundler spec test suite, visit https://github.com/eth-infinitism/bundler-spec-tests

SDK to create and send UserOperations
see [SDK Readme](./packages/sdk/README.md)