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


    const singletonFactoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const usdcCoinContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const usdcPriceFeedContractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
    const EntryPointAddress='0x25ddC9Aab8f335c4754ac21061C61240d846C4b5';
    const WalletLogicAddress = '0x9Ae9b2c6b91404C8e043635d082f31790673167F';
    const walletFactoryAddress = '0x8611faf3ad6ac8d3b938713EF2F9091712f14dc9';
    const PriceOracleAddress = '0x763C6b7C4274F866c4dEdB75Feb7183c9066ef71';
    const TokenPaymasterAddress = '0xe193F5aC46ab23dfF12F91DaDc387D7E24bC7eaa';
    const GuardianLogicAddress = '0x14c1d9B76610395e8CFc7BaEa1eF62095f37Fdcf';

    if (isLocalTestnet()) {
        soulWalletLib = new SoulWalletLib(singletonFactoryAddress);
        USDCContractAddress = usdcCoinContractAddress;
        USDCPriceFeedAddress = usdcPriceFeedContractAddress;
        eip1559GasFee = mockGasFee;

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

    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const walletOwner = WALLET_OWNER_ADDRESS;
    const walletOwnerPrivateKey = WALLET_OWNER_PRIVATE_KEY;

    const salt = hexZeroPad(hexlify(0), 32);

    
    /*

        Step 8 - Deploy Wallet with support for TokenPaymaster

            1. Calculate SoulWalletProxy(Wallet) Contract address usign Create2
            2. Check if the Wallet is activated by obtaining the code at that address
            3. If Not, Constuc a Activate UserOperation using soulWalletLib.activateWalletOp
                Obtain Required Pre Fund for the Activate UserOperation 
                Obtain exchangePrice
                Calculate the Required USDC and the maxUSDC (10 perc more)
                Construct Paymaster Data and update activateOp.paymasterAndData field
                Obtain approveCallData and update the calldata and callGastLimit field of the UserOperation
                Calculate userOpHash
                Sign the UserOperation

                Obtain the bundler
                Simulate Validation
                Simulate Handler Op
                Send UserOperation to the Bunder and await on bundlerEvent
            
    */

    if (true) {

        const upgradeDelay = 10;
        const guardianDelay = 10;
        const salt = 1;
        const walletAddress = await soulWalletLib.calculateWalletAddress(
            WalletLogicAddress,
            EntryPointAddress,
            walletOwner,
            upgradeDelay,
            guardianDelay,
            SoulWalletLib.Defines.AddressZero,
            salt
        );
    
        console.log("10. SoulWalletProxy(Wallet Contract) for Owner ", walletAddress, "Contract Address calculated using CREATE2 :", walletAddress);
    
        // check if wallet is activated (deployed) 
        const code = await ethers.provider.getCode(walletAddress);
        if (code === "0x") {
            const activateOp = soulWalletLib.activateWalletOp(
            WalletLogicAddress,
            EntryPointAddress,
            walletOwner,
            upgradeDelay,
            guardianDelay,
            SoulWalletLib.Defines.AddressZero,
            TokenPaymasterAddress,
            ethers.utils
                .parseUnits(eip1559GasFee.high.suggestedMaxFeePerGas, "gwei")
                .toString(),
            ethers.utils
                .parseUnits(eip1559GasFee.high.suggestedMaxPriorityFeePerGas, "gwei")
                .toString()
            , salt
            );
    
            // calculate eth cost
            const requiredPrefund = activateOp.requiredPrefund(ethers.utils.parseUnits(eip1559GasFee.estimatedBaseFee, "gwei"));
            console.log('requiredPrefund: ' + ethers.utils.formatEther(requiredPrefund) + ' ETH');
            // get USDC exchangeRate
            const exchangePrice = await soulWalletLib.getPaymasterExchangePrice(ethers.provider, TokenPaymasterAddress, USDCContractAddress, true);
            const tokenDecimals = exchangePrice.tokenDecimals || 6;
            // print price now
            console.log('exchangePrice: ' + ethers.utils.formatUnits(exchangePrice.price, exchangePrice.decimals), 'USDC/ETH');
            // get required USDC : (requiredPrefund/10^18) * (exchangePrice.price/10^exchangePrice.decimals)
            const requiredUSDC = requiredPrefund.mul(exchangePrice.price)
            .mul(BigNumber.from(10).pow(tokenDecimals))
            .div(BigNumber.from(10).pow(exchangePrice.decimals))
            .div(BigNumber.from(10).pow(18));
            console.log('requiredUSDC: ' + ethers.utils.formatUnits(requiredUSDC, tokenDecimals), 'USDC');
            const maxUSDC = requiredUSDC.mul(110).div(100); // 10% more
            let paymasterAndData = soulWalletLib.getPaymasterData(TokenPaymasterAddress, USDCContractAddress, maxUSDC);
            activateOp.paymasterAndData = paymasterAndData;
            if(true){
                const USDCContract = await ethers.getContractAt("USDCoin", USDCContractAddress);
                const amount = ethers.BigNumber.from("10000000000000000000")
                const mintTransaction = await USDCContract.mint(walletOwner, amount);
                await mintTransaction.wait(1);
                // send maxUSDC USDC to wallet
                await USDCContract.transfer(walletAddress, maxUSDC);
                // get balance of USDC
                const usdcBalance = await USDCContract.balanceOf(walletAddress);
                console.log('usdcBalance: ' + ethers.utils.formatUnits(usdcBalance, exchangePrice.tokenDecimals), 'USDC');
            }
    
            const approveData: IApproveToken[] = [
            {
                token: USDCContractAddress,
                spender: TokenPaymasterAddress,
                value: ethers.utils.parseEther('100').toString()
            }
            ];
            const approveCallData = await soulWalletLib.Tokens.ERC20.getApproveCallData(ethers.provider, walletAddress, approveData);
            activateOp.callData = approveCallData.callData;
            activateOp.callGasLimit = approveCallData.callGasLimit;
    
            const userOpHash = activateOp.getUserOpHash(EntryPointAddress, chainId);
            activateOp.signWithSignature(
            walletOwner,
            Utils.signMessage(userOpHash, walletOwnerPrivateKey)
            );
            const bundlerUrl = networkBundler.get(network.name);
            console.log("0.Bundler URL is : ", bundlerUrl);
            if (!bundlerUrl) {
                throw new Error(`bundler rpc not found for network ${network.name}`);
            }
            const bundler = new soulWalletLib.Bundler(EntryPointAddress, ethers.provider, bundlerUrl);
            console.log("Starting Bundler availability test");
            // await bundler.init(); // run init to check bundler is alivable
            console.log("Test Completed - Bundler Availiable");
            const validation = await bundler.simulateValidation(activateOp);
            console.log("reached1");
            if (validation.status !== 0) {
              console.log("reached2");
              throw new Error(`error code:${validation.status}`);
            }
            console.log("reached3");
            const simulate = await bundler.simulateHandleOp(activateOp);
            if (simulate.status !== 0) {
              console.log("reached3, simulate.status", simulate.status);
              console.log("simulate", simulate)
              throw new Error(`error code:${simulate.status}`);
            }
            console.log("reached4");
            const bundlerEvent = bundler.sendUserOperation(activateOp, 1000 * 60 * 3);
            console.log("reached5");
            bundlerEvent.on('error', (err: any) => {
              console.log("reached6");
              console.log(err);
            });
            bundlerEvent.on('send', (userOpHash: string) => {
              console.log("reached7");
              console.log('send: ' + userOpHash);
            });
            bundlerEvent.on('receipt', (receipt: IUserOpReceipt) => {
              console.log("reached8");
              console.log('receipt: ' + receipt);
            });
            bundlerEvent.on('timeout', () => {
              console.log("reached9");
              console.log('timeout');
            });
            while (true) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
    
        }
    }







}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});