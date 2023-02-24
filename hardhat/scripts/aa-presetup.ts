import { BigNumber , ethers as ETHERS, providers} from "ethers";
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

const salt = hexZeroPad(hexlify(0), 32);
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

let etherProvider : ETHERS.providers.BaseProvider;
async function main() {

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
   
    console.log("EOA Address which is used for deployment : ", EOA.address);

    /*
        Step 1 - Deploy SingletonFactory, USDCCoin and USDCPriceFeed Contracts
        If already deployed (TestNet), obtain their addresses

    */
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const walletOwner = WALLET_OWNER_ADDRESS;
    const walletOwnerPrivateKey = WALLET_OWNER_PRIVATE_KEY;

    if (isLocalTestnet()) {
        etherProvider = new ETHERS.providers.JsonRpcProvider("http://localhost:8545/")
        let create2 = await new SingletonFactory__factory(EOA).deploy();
        // console.log("0. Singleton Factory Address : ", create2.address);
        soulWalletLib = new SoulWalletLib(create2.address);
        let usdc = await new USDCoin__factory(EOA).deploy();
        // console.log("0. USDCoin  Address : ", usdc.address);
        USDCContractAddress = usdc.address;

        const amount = ethers.BigNumber.from("10000000000000000000")
        const mintTransaction = await usdc.mint(walletOwner, amount);
        await mintTransaction.wait(1);

        USDCPriceFeedAddress = await (await (await ethers.getContractFactory("MockOracle")).deploy()).address;
        // console.log("0. MockOracle  Address : ", USDCPriceFeedAddress);
        eip1559GasFee = mockGasFee;
        console.log("AA Script Log : SingletonFactory Contract Address : ", create2.address);
        console.log("AA Script Log : USDCoin Contract Address : ", usdc.address);
        console.log("AA Script Log : USDCPriceFeed Contract Address : ", USDCPriceFeedAddress);
    } else {
        soulWalletLib = new SoulWalletLib();
        etherProvider = ethers.provider;
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
    /*

        Step 2 - EntryPoint Contract Deployement
            Using Create2, calculate the EntryPoint contract address 
            If not deployed, user SingletonFactory to deploy EntryPoint contract
            Verify that contract onchain for explorer

    */

    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    console.log("AA Script Log : Deploying EntryPoint Contract");
    const EntryPointAddress = await deployContractUsingSingletonFactory(
        EntryPointFactory.bytecode, 
        soulWalletLib.singletonFactory,
        EOA,
        etherProvider
    )
    console.log("AA Script Log : Deployed EntryPoint Contract at ", EntryPointAddress);
    
    
/*
        Step 3 - SoulWallet Contract Deployement (Logic Contract)
            Using Create2, calculate the SoulWallet contract address 
            If not deployed, user SingletonFactory to deploy SoulWallet contract
            Verify that contract onchain for explorer

    */

    const WalletLogicFactory = await ethers.getContractFactory("SoulWallet");
    console.log("AA Script Log : Deploying SoulWallet Logic Contract");
    const WalletLogicAddress = await deployContractUsingSingletonFactory(
        WalletLogicFactory.bytecode, 
        soulWalletLib.singletonFactory,
        EOA,
        etherProvider
    )
    console.log("AA Script Log : Deployed SoulWallet Logic Contract at ", WalletLogicAddress);
            

    /*

        Step 4 - SoulWalletFactory Contract Deployement (Factory Contract)
            Use soulWalletLib.Utils.deployFactory's method getAddress(Logic Contract Address) to get the factory contract address
            If not deployed, soulWalletLib.Utils.deployFactory's method deploy to deploy the SoulWalletFactory
            Verify that contract onchain for explorer

    */
        
    
    const walletFactoryAddress = soulWalletLib.Utils.deployFactory.getAddress(WalletLogicAddress);
    console.log("SoulWallet Factory Contract Address - ", walletFactoryAddress)
    if (await ethers.provider.getCode(walletFactoryAddress) === '0x') {

        const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
            return ethers.BigNumber.from(Math.pow(10, 7) + '');
            //return estimatedGasLimit.mul(10)  // 10x gas
        }
        console.log("AA Script Log : Deploying SoulWallet Logic Contract");
        await soulWalletLib.Utils.deployFactory.deploy(WalletLogicAddress, ethers.provider, EOA);
    
        while (await ethers.provider.getCode(walletFactoryAddress) === '0x') {
            await new Promise(r => setTimeout(r, 3000));
        }
    
    } else {
    }
    console.log("AA Script Log : Deployed SoulWalletFactory Contract at ", walletFactoryAddress);
           
    
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
    const PriceOracleBytecode = PriceOracleFactory.getDeployTransaction(USDCPriceFeedAddress).data;
    if (!PriceOracleBytecode) {
        throw new Error("PriceOracleBytecode not set");
    }
    console.log("AA Script Log : Deploying PriceOracle Contract");
    const PriceOracleAddress = await deployContractUsingSingletonFactory(
        PriceOracleBytecode, 
        soulWalletLib.singletonFactory,
        EOA,
        etherProvider
    )
    console.log("AA Script Log : Deployed PriceOracle Contract at ", PriceOracleAddress);
                 
    
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
    const TokenPaymasterBytecode = TokenPaymasterFactory.getDeployTransaction(EntryPointAddress, EOA.address, WalletFactory.contract.address).data;
    if (!TokenPaymasterBytecode) {
        throw new Error("TokenPaymasterBytecode not set");
    }
    console.log("AA Script Log : Deploying TokenPaymaster Contract");
    const TokenPaymasterAddress = await deployContractUsingSingletonFactory(
        TokenPaymasterBytecode, 
        soulWalletLib.singletonFactory,
        EOA,
        etherProvider
    )
    console.log("AA Script Log : Deployed TokenPaymaster Contract at ", TokenPaymasterAddress);
    const TokenPaymaster = await TokenPaymaster__factory.connect(TokenPaymasterAddress, EOA);
    console.log("AA Script Log :  TokenPaymaster Owner is ", await TokenPaymaster.owner());
    await TokenPaymaster.setToken([USDCContractAddress], [PriceOracleAddress]);
    console.log('AA Script Log :  Adding stake and deposit for the paymaster');
    const _paymasterStake = '' + Math.pow(10, 17);
    await TokenPaymaster.addStake(
        1, {
        from: EOA.address,
        value: _paymasterStake
    });
    await TokenPaymaster.deposit({
        from: EOA.address,
        value: _paymasterStake
    });
    

    /*

        Step 7 - GuardianMultiSigWallet Contract Deployement (Logic Contract)
            Using Create2, calculate the GuardianLogic contract address 
            If not deployed, user SingletonFactory to deploy GuardianLogic contract
            Verify that contract onchain for explorer

    */
        
        
    const GuardianLogicFactory = await ethers.getContractFactory("GuardianMultiSigWallet");
    console.log("AA Script Log : Deploying GuardianMultiSigWallet Logic Contract");
    const GuardianLogicAddress = await deployContractUsingSingletonFactory(
        GuardianLogicFactory.bytecode, 
        soulWalletLib.singletonFactory,
        EOA,
        etherProvider
    )
    console.log("AA Script Log : Deployed GuardianMultiSigWallet Logic Contract at ", GuardianLogicAddress);
    
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


async function deployContractUsingSingletonFactory(
    contractByteCode : string | ETHERS.Bytes,
    signletonFactoryContractAddress : string,
    EOA : ETHERS.Signer,
    provider : ETHERS.providers.BaseProvider ) : Promise<string> {


    const initCodeHash = keccak256(contractByteCode);
    const contractAddress = getCreate2Address(signletonFactoryContractAddress, salt, initCodeHash);

    const codeAtAddress = await provider.getCode(contractAddress);

    if (codeAtAddress !== '0x') {
        console.log("AA Script Log : Contract already deployed at address", contractAddress);
        return contractAddress;
    } else {
        const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
            return ethers.BigNumber.from(Math.pow(10, 7) + '');
            //return estimatedGasLimit.mul(10)  // 10x gas
        }

        const create2FactoryContract = SingletonFactory__factory.connect(signletonFactoryContractAddress, EOA);
        const estimatedGas = await create2FactoryContract.estimateGas.deploy(contractByteCode, salt);
        const deployTransaction = await create2FactoryContract.deploy(contractByteCode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
        console.log("AA Script Log : Deploy Transaction Hash : ", deployTransaction.hash);
        const deployTransactionReciept = await deployTransaction.wait(1);
        console.log("AA Script Log : Deploy Transaction Receipt included in Block:", deployTransactionReciept.blockNumber)

        return contractAddress;
    }
}


