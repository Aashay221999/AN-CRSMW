# AN-CRSMW

Git Clone  for Private Repo
    git clone https://username@github.com/username/repo_name

Compile Contracts
    npm run compile

Deploy AA-Pre Script on hardhat
    npx hardhat run --network hardhat scripts/aa-presetup.ts



# Runs go mod tidy.
make install-dev

# Generates base .env file.
# All variables in this file are required and should be filled.
# Running this command WILL override current .env file.
make generate-environment

# Parses private key in .env file and prints public key and address.
make fetch-wallet

make dev-private-mode

 
 

