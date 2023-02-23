import { BigNumber } from "ethers";
import { getCreate2Address, hexlify, hexZeroPad, keccak256 } from "ethers/lib/utils";
import { ethers, network, run } from "hardhat";
import { IApproveToken, IUserOpReceipt, SoulWalletLib, UserOperation } from 'soul-wallet-lib';
import { USDCoin__factory, TokenPaymaster__factory, SingletonFactory__factory, EntryPoint__factory, ERC20__factory } from "../src/types/index";
import { Utils } from "./aa-signer-utils";
import * as dotenv from 'dotenv'
dotenv.config()

function isLocalTestnet() {
    return ['localhost', 'hardhat'].includes(network.name);
}

const BUNDLER_RPC_URL_LOCAL =
  process.env.BUNDLER_RPC_URL_LOCAL! ||
  "RPC_URL_LOCAL"; 

const WALLET_OWNER_ADDRESS =
  process.env.WALLET_OWNER_ADDRESS! ||
  "0x93EDb58cFc5d77028C138e47Fffb929A57C52082"; 
const WALLET_OWNER_PRIVATE_KEY =
  process.env.WALLET_OWNER_PRIVATE_KEY! ||
  "0x82cfe73c005926089ebf7ec1f49852207e5670870d0dfa544caabb83d2cd2d5f"; 

async function main() {

    // Required to be sent during SoulWallet Library calls
    let mockGasFee = {
        "low": {
          "suggestedMaxPriorityFeePerGas": "0.1",
          "suggestedMaxFeePerGas": "10"
        },
        "medium": {
          "suggestedMaxPriorityFeePerGas": "0.1",
          "suggestedMaxFeePerGas": "11"
        },
        "high": {
          "suggestedMaxPriorityFeePerGas": "0.1",
          "suggestedMaxFeePerGas": "12"
        },
        "estimatedBaseFee": "1",
        "networkCongestion": 0.31675,
        "latestPriorityFeeRange": [
          "0.131281956",
          "4.015436404"
        ],
        "historicalPriorityFeeRange": [
          "0.02829803",
          "58.45567467"
        ],
        "historicalBaseFeeRange": [
          "13.492240252",
          "17.51875421"
        ],
        "priorityFeeTrend": "level",
        "baseFeeTrend": "down"
    }

    let EOA = (await ethers.getSigners())[0]; // Deployement EOA
    let USDCContractAddress = ''; // MockUSDC Contract Address
    let USDCPriceFeedAddress = ''; // MockPriceFeed Contract Address
    let eip1559GasFee; // ERP1559 GasPrice Details
    let soulWalletLib; // Configured SoulWalletLib 

    const networkBundler: Map<string, string> = new Map(); // Mapping to store Network to NetWork Bundler RPC 
    networkBundler.set('ArbGoerli', 'https://bundler-arb-goerli.soulwallets.me/rpc'); // Bundler running by SoulWallet
    if (isLocalTestnet()){
        networkBundler.set(network.name, BUNDLER_RPC_URL_LOCAL); // Bundler running for hardhat
    }
   
    console.log("1. EOA Address which is used for deployment : ", EOA.address);

    /*
        Step 1 - Deploy SingletonFactory, USDCCoin and USDCPriceFeed Contracts
        If already deployed (TestNet), obtain their addresses

    */
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const walletOwner = WALLET_OWNER_ADDRESS;
    const walletOwnerPrivateKey = WALLET_OWNER_PRIVATE_KEY;

    if (isLocalTestnet()) {
        let create2 = await new SingletonFactory__factory(EOA).deploy();
        console.log("0. Singleton Factory Address : ", create2.address);
        soulWalletLib = new SoulWalletLib(create2.address);
        let usdc = await new USDCoin__factory(EOA).deploy();
        console.log("0. USDCoin  Address : ", usdc.address);
        USDCContractAddress = usdc.address;

        const amount = ethers.BigNumber.from("10000000000000000000")
        const mintTransaction = await usdc.mint(walletOwner, amount);
        await mintTransaction.wait(1);

        USDCPriceFeedAddress = await (await (await ethers.getContractFactory("MockOracle")).deploy()).address;
        console.log("0. MockOracle  Address : ", USDCPriceFeedAddress);
        eip1559GasFee = mockGasFee;
        console.log("2. SingletonFactory Contract Address : ", create2.address);
        console.log("3. MockUSDC Contract Address : ", usdc.address);
        console.log("4. USDCPriceFeed Contract Address : ", USDCPriceFeedAddress);
    } else {
        soulWalletLib = new SoulWalletLib();
        // if (["mainnet", "goerli"].includes(network.name)) {
        //   USDCContractAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        //  eip1559GasFee = await EIP4337Lib.Utils.suggestedGasFee.getEIP1559GasFees(chainId);
        // } else 
        if (network.name === "ArbGoerli") {
          USDCContractAddress = "0xe34a90dF83c29c28309f58773C41122d4E8C757A";
          //https://docs.chain.link/data-feeds/price-feeds/addresses/?network=arbitrum
          USDCPriceFeedAddress = "0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08";
          eip1559GasFee = mockGasFee;
        } else {
          throw new Error("network not support");
        }
    }


    // get code of soulWalletLib.singletonFactory
    if (await ethers.provider.getCode(soulWalletLib.singletonFactory) === '0x') {
        throw new Error("singletonFactory not deployed");
    }

    

    const salt = hexZeroPad(hexlify(0), 32);

    /*

        Step 2 - EntryPoint Contract Deployement
            Using Create2, calculate the EntryPoint contract address 
            If not deployed, user SingletonFactory to deploy EntryPoint contract
            Verify that contract onchain for explorer

    */

    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    const EntryPointFactoryBytecode = EntryPointFactory.bytecode;
    const EntryPointInitCodeHash = keccak256(EntryPointFactoryBytecode);
    const EntryPointAddress = getCreate2Address(soulWalletLib.singletonFactory, salt, EntryPointInitCodeHash);
    
    console.log("5. EntryPoint Contract Address calculated using CREATE2 :", EntryPointAddress);
    // if not deployed, deploy
    if (await ethers.provider.getCode(EntryPointAddress) === '0x') {
        // console.log("EntryPoint not deployed, deploying...");
        const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
        return ethers.BigNumber.from(Math.pow(10, 7) + '');
        //return estimatedGasLimit.mul(10)  // 10x gas
        }
        const create2FactoryContract = SingletonFactory__factory.connect(soulWalletLib.singletonFactory, EOA);
        const estimatedGas = await create2FactoryContract.estimateGas.deploy(EntryPointFactoryBytecode, salt);
        const tx = await create2FactoryContract.deploy(EntryPointFactoryBytecode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
        // console.log("EntryPoint tx:", tx.hash);
        while (await ethers.provider.getCode(EntryPointAddress) === '0x') {
        console.log("EntryPoint not deployed, waiting...");
        await new Promise(r => setTimeout(r, 3000));
        }
        if (!isLocalTestnet()) {
        // console.log("EntryPoint deployed, verifying...");
        try {
            await run("verify:verify", {
            address: EntryPointAddress,
            constructorArguments: [],
            });
        } catch (error) {
            console.log("EntryPoint verify failed:", error);
        }
        }
    } else {
        console.log("EntryPoint already deployed at:" + EntryPointAddress);
    }

/*

        Step 3 - SoulWallet Contract Deployement (Logic Contract)
            Using Create2, calculate the SoulWallet contract address 
            If not deployed, user SingletonFactory to deploy SoulWallet contract
            Verify that contract onchain for explorer

    */

            const WalletLogicFactory = await ethers.getContractFactory("SoulWallet");
            const WalletLogicBytecode = WalletLogicFactory.bytecode;
            const WalletLogicInitCodeHash = keccak256(WalletLogicBytecode);
            const WalletLogicAddress = getCreate2Address(soulWalletLib.singletonFactory, salt, WalletLogicInitCodeHash);
            console.log("5. SoulWallet Contract Address calculated using CREATE2 :", WalletLogicAddress);
            // if not deployed, deploy
            if (await ethers.provider.getCode(WalletLogicAddress) === '0x') {
                // console.log("WalletLogic not deployed, deploying...");
                const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
                return ethers.BigNumber.from(Math.pow(10, 7) + '');
                //return estimatedGasLimit.mul(10)  // 10x gas
                }
                const create2FactoryContract = SingletonFactory__factory.connect(soulWalletLib.singletonFactory, EOA);
                const estimatedGas = await create2FactoryContract.estimateGas.deploy(WalletLogicBytecode, salt);
                const tx = await create2FactoryContract.deploy(WalletLogicBytecode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
                console.log("WalletLogic tx:", tx.hash);
                while (await ethers.provider.getCode(WalletLogicAddress) === '0x') {
                console.log("WalletLogic not deployed, waiting...");
                await new Promise(r => setTimeout(r, 3000));
                }
            
                if (!isLocalTestnet()) {
                // console.log("WalletLogic deployed, verifying...");
                try {
                    await run("verify:verify", {
                    address: WalletLogicAddress,
                    constructorArguments: [],
                    });
                } catch (error) {
                    console.log("WalletLogic verify failed:", error);
                }
                }
            } else {
                console.log("WalletLogic already deployed at:" + WalletLogicAddress);
            }
        
            /*
        
                Step 4 - SoulWalletFactory Contract Deployement (Factory Contract)
                    Use soulWalletLib.Utils.deployFactory's method getAddress(Logic Contract Address) to get the factory contract address
                    If not deployed, soulWalletLib.Utils.deployFactory's method deploy to deploy the SoulWalletFactory
                    Verify that contract onchain for explorer
        
            */
        
        
        
            const walletFactoryAddress = soulWalletLib.Utils.deployFactory.getAddress(WalletLogicAddress);
            console.log("6. SoulWalletFactory Contract Address obtained using DeployFactory (which uses CREATE2):", walletFactoryAddress);
            // if not deployed, deploy
            if (await ethers.provider.getCode(walletFactoryAddress) === '0x') {
                // console.log("walletFactory not deployed, deploying...");
                const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
                return ethers.BigNumber.from(Math.pow(10, 7) + '');
                //return estimatedGasLimit.mul(10)  // 10x gas
                }
                await soulWalletLib.Utils.deployFactory.deploy(WalletLogicAddress, ethers.provider, EOA);
            
                while (await ethers.provider.getCode(walletFactoryAddress) === '0x') {
                console.log("walletFactory not deployed, waiting...");
                await new Promise(r => setTimeout(r, 3000));
                }
            
                if (!isLocalTestnet()) {
                // console.log("walletFactory deployed, verifying...");
                try {
                    // verify contract/SoulWalletFactory.sol:SoulWalletFactory at walletFactoryAddress
                    {
                    // npx hardhat verify --network ArbGoerli 0xb8EE53678Ffc1fcc1Bec87dEF082dB4Afc72c92B 0xaD1021AD721cb98E682F51489b1aD84395F3e495 0xce0042B868300000d44A59004Da54A005ffdcf9f 
                    console.log("walletFactoryAddress:", walletFactoryAddress);
                    console.log("WalletLogicAddress:", WalletLogicAddress);
                    console.log("soulWalletLib.singletonFactory:", soulWalletLib.singletonFactory);
                    }
                    await run("verify:verify", {
                    address: walletFactoryAddress,
                    constructorArguments: [
                        WalletLogicAddress,
                        soulWalletLib.singletonFactory
                    ]
                    });
                } catch (error) {
                    console.log("walletFactory verify failed:", error);
                }
                }
            } else {
                console.log("walletFactory already deployed at:" + walletFactoryAddress);
            }
        
        
            const WalletFactory = {
                contract: await ethers.getContractAt("SoulWalletFactory", walletFactoryAddress)
            };
            
        
            /*
        
                Step 5 - PriceOracle Contract Deployement (Logic Contract)
                    Using Create2, calculate the PriceOracle contract address 
                    If not deployed, user SingletonFactory to deploy PriceOracle contract
                    Verify that contract onchain for explorer
        
            */
        
            const PriceOracleFactory = await ethers.getContractFactory("PriceOracle");
            // constructor(AggregatorV3Interface _priceFeed) {
            const PriceOracleBytecode = PriceOracleFactory.getDeployTransaction(USDCPriceFeedAddress).data;
            if (!PriceOracleBytecode) {
                throw new Error("PriceOracleBytecode not set");
            }
            const PriceOracleInitCodeHash = keccak256(PriceOracleBytecode);
            const PriceOracleAddress = getCreate2Address(soulWalletLib.singletonFactory, salt, PriceOracleInitCodeHash);
            console.log("7. PriceOracle Contract Address calculated using CREATE2 :", PriceOracleAddress);
            // if not deployed, deploy
            if (await ethers.provider.getCode(PriceOracleAddress) === '0x') {
                // console.log("PriceOracle not deployed, deploying...");
                const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
                return ethers.BigNumber.from(Math.pow(10, 7) + '');
                //return estimatedGasLimit.mul(10)  // 10x gas
                }
                const create2FactoryContract = SingletonFactory__factory.connect(soulWalletLib.singletonFactory, EOA);
                const estimatedGas = await create2FactoryContract.estimateGas.deploy(PriceOracleBytecode, salt);
                const tx = await create2FactoryContract.deploy(PriceOracleBytecode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
                console.log("PriceOracle tx:", tx.hash);
                while (await ethers.provider.getCode(PriceOracleAddress) === '0x') {
                console.log("PriceOracle not deployed, waiting...");
                await new Promise(r => setTimeout(r, 3000));
                }
            
                if (!isLocalTestnet()) {
                // console.log("PriceOracle deployed, verifying...");
                try {
                    await run("verify:verify", {
                    address: PriceOracleAddress,
                    constructorArguments: [
                        USDCPriceFeedAddress
                    ],
                    });
                } catch (error) {
                    console.log("PriceOracle verify failed:", error);
                }
                }
            } else {
                console.log("PriceOracle already deployed at:" + PriceOracleAddress);
            }
        
            /*
        
                Step 6 - TokenPaymaster Contract Deployement (Logic Contract)
                    Using Create2, calculate the TokenPaymaster contract address 
                    If not deployed, user SingletonFactory to deploy TokenPaymaster contract
                    Verify that contract onchain for explorer
                    Call TokenPaymaster.setToken([USDCContractAddress], [PriceOracleAddress]) to add Token and its PriceFeed Oracle 
                    Add Stake for Paymaster (0.1 Eth) (10^17)
                    Add Deposit for EOA to TokenPaymaster of 0.1 Eth 
        
            */
        
            const TokenPaymasterFactory = await ethers.getContractFactory("TokenPaymaster");
            //constructor(IEntryPoint _entryPoint, address _owner, address _walletFactory)
            const TokenPaymasterBytecode = TokenPaymasterFactory.getDeployTransaction(EntryPointAddress, EOA.address, WalletFactory.contract.address).data;
            if (!TokenPaymasterBytecode) {
                throw new Error("TokenPaymasterBytecode not set");
            }
            const TokenPaymasterInitCodeHash = keccak256(TokenPaymasterBytecode);
            const TokenPaymasterAddress = getCreate2Address(soulWalletLib.singletonFactory, salt, TokenPaymasterInitCodeHash);
            console.log("8. TokenPaymaster Contract Address calculated using CREATE2 :", TokenPaymasterAddress);
            // if not deployed, deploy
            if (await ethers.provider.getCode(TokenPaymasterAddress) === '0x') {
                // console.log("TokenPaymaster not deployed, deploying...");
                const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
                return ethers.BigNumber.from(Math.pow(10, 7) + '');
                //return estimatedGasLimit.mul(10)  // 10x gas
                }
                const create2FactoryContract = SingletonFactory__factory.connect(soulWalletLib.singletonFactory, EOA);
                const estimatedGas = await create2FactoryContract.estimateGas.deploy(TokenPaymasterBytecode, salt);
                const tx = await create2FactoryContract.deploy(TokenPaymasterBytecode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
                // console.log("EntryPoint tx:", tx.hash);
                while (await ethers.provider.getCode(TokenPaymasterAddress) === '0x') {
                console.log("TokenPaymaster not deployed, waiting...");
                await new Promise(r => setTimeout(r, 3000));
                }
                {
                const _paymasterStake = '' + Math.pow(10, 17);
                const TokenPaymaster = await TokenPaymaster__factory.connect(TokenPaymasterAddress, EOA);
                console.log(await TokenPaymaster.owner());
            
                await TokenPaymaster.setToken([USDCContractAddress], [PriceOracleAddress]);
            
                console.log('adding stake');
                await TokenPaymaster.addStake(
                    1, {
                    from: EOA.address,
                    value: _paymasterStake
                });
                await TokenPaymaster.deposit({
                    from: EOA.address,
                    value: _paymasterStake
                });
                }
            
                if (!isLocalTestnet()) {
                // console.log("TokenPaymaster deployed, verifying...");
                try {
                    await run("verify:verify", {
                    address: TokenPaymasterAddress,
                    constructorArguments: [
                        EntryPointAddress, EOA.address, WalletFactory.contract.address
                    ],
                    });
                } catch (error) {
                    console.log("TokenPaymaster verify failed:", error);
                }
                }
            } else {
                console.log("TokenPaymaster already deployed at:" + TokenPaymasterAddress);
            }
                  
        
            /*
        
                Step 7 - GuardianMultiSigWallet Contract Deployement (Logic Contract)
                    Using Create2, calculate the GuardianLogic contract address 
                    If not deployed, user SingletonFactory to deploy GuardianLogic contract
                    Verify that contract onchain for explorer
        
            */
        
        
            const GuardianLogicFactory = await ethers.getContractFactory("GuardianMultiSigWallet");
            const GuardianLogicBytecode = GuardianLogicFactory.bytecode;
            const GuardianLogicInitCodeHash = keccak256(GuardianLogicBytecode);
            const GuardianLogicAddress = getCreate2Address(soulWalletLib.singletonFactory, salt, GuardianLogicInitCodeHash);
            console.log("9. GuardianMultiSigWallet Contract Address calculated using CREATE2 :", GuardianLogicAddress);
            // if not deployed, deploy
            if (await ethers.provider.getCode(GuardianLogicAddress) === '0x') {
                // console.log("GuardianLogic not deployed, deploying...");
                const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
                return ethers.BigNumber.from(Math.pow(10, 7) + '');
                //return estimatedGasLimit.mul(10)  // 10x gas
                }
                const create2FactoryContract = SingletonFactory__factory.connect(soulWalletLib.singletonFactory, EOA);
                const estimatedGas = await create2FactoryContract.estimateGas.deploy(GuardianLogicBytecode, salt);
                const tx = await create2FactoryContract.deploy(GuardianLogicBytecode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
                console.log("GuardianLogic tx:", tx.hash);
                while (await ethers.provider.getCode(GuardianLogicAddress) === '0x') {
                console.log("GuardianLogic not deployed, waiting...");
                await new Promise(r => setTimeout(r, 3000));
                }
                if (!isLocalTestnet()) {
                // console.log("GuardianLogic deployed, verifying...");
                try {
                    await run("verify:verify", {
                    address: GuardianLogicAddress,
                    constructorArguments: [],
                    });
                } catch (error) {
                    console.log("GuardianLogic verify failed:", error);
                }
                }
            } else {
                console.log("GuardianLogic already deployed at:" + GuardianLogicAddress);
            }
        

}


main().catch((error) => {
console.error(error);
process.exitCode = 1;
});