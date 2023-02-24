/*
Deploy Wallet with support for TokenPaymaster

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
import { BigNumber, BigNumberish, ethers as ETHERS } from "ethers";
import { getCreate2Address, hexlify, hexZeroPad, keccak256 } from "ethers/lib/utils";
import { ethers, network, run } from "hardhat";
import { IApproveToken, IUserOpReceipt, SoulWalletLib, UserOperation } from 'soul-wallet-lib';
import { USDCoin__factory, TokenPaymaster__factory, SingletonFactory__factory, EntryPoint__factory, ERC20__factory } from "../src/types/index";
import { Utils } from "./aa-signer-utils";
import * as dotenv from 'dotenv'
import { Address } from 'ethereumjs-util';
// import SOUL_WALLET_ABI from '../artifacts/contracts/SoulWallet.sol/SoulWallet.json';
import IERC20_ABI from "../artifacts/contracts/dev/USDC.sol/USDCoin.json";

const SOUL_WALLET_INTERFACE = new ETHERS.utils.Interface(
  [
    "function execFromEntryPoint(address dest, uint256 value, bytes func)",
    "function nonce() view returns (uint256)"
  ]);

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

let etherProvider = new ETHERS.providers.JsonRpcProvider("http://localhost:8545/");
const EoaAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const EoAPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let EOA = new ethers.Wallet(EoAPrivateKey, etherProvider);
console.log("AA Activate Script Log : EAO Address is : ", EOA.address);

let USDCContractAddress = ''; // MockUSDC Contract Address
let USDCPriceFeedAddress = ''; // MockPriceFeed Contract Address
let eip1559GasFee:any; // ERP1559 GasPrice Details
let soulWalletLib:any; // Configured SoulWalletLib 

const singletonFactoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const usdcCoinContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const usdcPriceFeedContractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const EntryPointAddress='0x25ddC9Aab8f335c4754ac21061C61240d846C4b5';
const WalletLogicAddress = '0xb3f3c82B58976f18E8532164c756B5Df0a9dec86';
const walletFactoryAddress = '0x632b291Cf33b8c8d72887fc8d533c482273162Da';
const PriceOracleAddress = '0x6961F3A8FE7b4C9d933ef84CD01d657d71115023';
const TokenPaymasterAddress = '0x2C409D963A7EBf08f1370a6C6adAf6dED38b246A';
const GuardianLogicAddress = '0x14c1d9B76610395e8CFc7BaEa1eF62095f37Fdcf';
console.log("AA Activate Script Log : singletonFactoryAddress is : ", singletonFactoryAddress);
console.log("AA Activate Script Log : usdcCoinContractAddress is : ", usdcCoinContractAddress);
console.log("AA Activate Script Log : usdcPriceFeedContractAddress is : ", usdcPriceFeedContractAddress);
console.log("AA Activate Script Log : EntryPointAddress is : ", EntryPointAddress);
console.log("AA Activate Script Log : WalletLogicAddress is : ", WalletLogicAddress);
console.log("AA Activate Script Log : walletFactoryAddress is : ", walletFactoryAddress);
console.log("AA Activate Script Log : PriceOracleAddress is : ", PriceOracleAddress);
console.log("AA Activate Script Log : TokenPaymasterAddress is : ", TokenPaymasterAddress);
console.log("AA Activate Script Log : GuardianLogicAddress is : ", GuardianLogicAddress);


const chainId = 31337;
const claimHolderAddress = WALLET_OWNER_ADDRESS;
const claimHolderPrivateKey = WALLET_OWNER_PRIVATE_KEY;

const claimIssuerAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
const claimIssuerPrivateKey = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

const salt = hexZeroPad(hexlify(0), 32);
const networkBundler: Map<string, string> = new Map(); // Mapping to store Network to NetWork Bundler RPC 

const UDCCoinContract = new USDCoin__factory(EOA).connect(EOA).attach(usdcCoinContractAddress);

async function main() {

  console.log("USDCContractAddress", USDCContractAddress);
  await intializeSoulWalletLib();
  console.log("USDCContractAddress", USDCContractAddress);
  
  const claimHolderWalletAddress = await deployWalletForUser(claimHolderAddress, claimHolderPrivateKey);
  if (claimHolderWalletAddress == null || claimHolderWalletAddress == "")
  {
    console.log("AA Activate Script Log : Failed to Deploy Wallet for ClaimHolder")
  }
  const claimIssuerWalletAddress = await deployWalletForUser(claimIssuerAddress,claimIssuerPrivateKey);
  if (claimIssuerWalletAddress == null || claimIssuerWalletAddress == "")
  {
    console.log("AA Activate Script Log : Failed to Deploy Wallet for ClaimIssuer")
  }

  console.log("AA Activate Script Log : ClaimHolder Wallet Deployed at ", claimHolderWalletAddress);
  console.log("AA Activate Script Log : ClaimIssuer Wallet Deployed at ", claimIssuerWalletAddress);

  // Execute MockUSDC transfer using UserOperation

  console.log("AA Activate Script Log : USDC Balance for Claim Holder Wallet", await UDCCoinContract.balanceOf(claimHolderWalletAddress))
  console.log("AA Activate Script Log : USDC Balance for Claim Issuer Wallet", await UDCCoinContract.balanceOf(claimIssuerWalletAddress))

  await executeTransferFromWallet(
    claimHolderAddress,
    claimHolderPrivateKey,
    claimHolderWalletAddress,
    claimIssuerWalletAddress,
    USDCContractAddress,
    TokenPaymasterAddress,
    ethers.BigNumber.from(1),
    ethers.provider );

  console.log("AA Activate Script Log : USDC Balance for Claim Holder Wallet", await UDCCoinContract.balanceOf(claimHolderWalletAddress))
  console.log("AA Activate Script Log : USDC Balance for Claim Issuer Wallet", await UDCCoinContract.balanceOf(claimIssuerWalletAddress))
  
  // console.log("AA Activate Script Log : ETH Balance for Claim Holder Wallet", await ethers.provider.getBalance(claimHolderWalletAddress));
  // console.log("AA Activate Script Log : ETH Balance for Claim Issuer Wallet", await ethers.provider.getBalance(claimIssuerWalletAddress));

  // await executeEthTransfer(
  //   claimHolderAddress,
  //   claimHolderPrivateKey,
  //   claimHolderWalletAddress,
  //   claimIssuerWalletAddress,
  //   USDCContractAddress,
  //   TokenPaymasterAddress,
  //   ethers.BigNumber.from(1),
  //   ethers.provider );

  // console.log("AA Activate Script Log : ETH Balance for Claim Holder Wallet", await ethers.provider.getBalance(claimHolderWalletAddress));
  // console.log("AA Activate Script Log : ETH Balance for Claim Issuer Wallet", await ethers.provider.getBalance(claimIssuerWalletAddress));
  
  // console.log("AA Activate Script Log : USDC Balance for Claim Holder Wallet", await UDCCoinContract.balanceOf(claimHolderWalletAddress))
  // console.log("AA Activate Script Log : USDC Balance for Claim Issuer Wallet", await UDCCoinContract.balanceOf(claimIssuerWalletAddress))
  

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


async function deployWalletForUser (walletOwner:string, walletOwnerPrivateKey : string) : Promise<any> {

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

  console.log("AA Activate Script Log : SoulWalletProxy(Wallet Contract) for Owner ", walletOwner, "Contract Address calculated using CREATE2 :", walletAddress);

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
          .toString(), 
      salt
    );

    // calculate eth cost
    const requiredPrefund = activateOp.requiredPrefund(ethers.utils.parseUnits(eip1559GasFee.estimatedBaseFee, "gwei"));
    console.log('AA Activate Script Log :requiredPrefund: ' + ethers.utils.formatEther(requiredPrefund) + ' ETH');
    // get USDC exchangeRate
    const exchangePrice = await soulWalletLib.getPaymasterExchangePrice(ethers.provider, TokenPaymasterAddress, USDCContractAddress, true);
    const tokenDecimals = exchangePrice.tokenDecimals || 6;
    // print price now
    console.log('AA Activate Script Log : exchangePrice: ' + ethers.utils.formatUnits(exchangePrice.price, exchangePrice.decimals), 'USDC/ETH');
    // get required USDC : (requiredPrefund/10^18) * (exchangePrice.price/10^exchangePrice.decimals)
    const requiredUSDC = requiredPrefund.mul(exchangePrice.price)
      .mul(BigNumber.from(10).pow(tokenDecimals))
      .div(BigNumber.from(10).pow(exchangePrice.decimals))
      .div(BigNumber.from(10).pow(18));
    console.log('AA Activate Script Log : requiredUSDC: ' + ethers.utils.formatUnits(requiredUSDC, tokenDecimals), 'USDC');
    const maxUSDC = requiredUSDC.mul(110).div(100); // 10% more
    let paymasterAndData = soulWalletLib.getPaymasterData(TokenPaymasterAddress, USDCContractAddress, maxUSDC);
    activateOp.paymasterAndData = paymasterAndData;
    console.log("im here1");

    // MINT USDC to walletAddress
    const USDCContract = await ethers.getContractAt("USDCoin", USDCContractAddress, EOA);
    const amount = ethers.BigNumber.from("10000000000000000000")
    console.log("im here2");
    const mintTransaction = await USDCContract.mint(walletAddress, amount);
    await mintTransaction.wait(1);
    console.log("im here3");
    const usdcBalance = await USDCContract.balanceOf(walletAddress);
    console.log('usdcBalance: ' + ethers.utils.formatUnits(usdcBalance, exchangePrice.tokenDecimals), 'USDC');

    // Transfer Eth from WalletOwner to WalletAddress
    console.log("im here4");
    const signer = new ethers.Wallet(WALLET_OWNER_PRIVATE_KEY, ethers.provider);
    await signer.sendTransaction({
      to: walletAddress,
      value: 500
    });

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
    console.log("AA Activate Script Log : Bundler URL is : ", bundlerUrl);
    if (!bundlerUrl) {
        throw new Error(`bundler rpc not found for network ${network.name}`);
    }
    const bundler = new soulWalletLib.Bundler(EntryPointAddress, ethers.provider, bundlerUrl);
    console.log("AA Activate Script Log : Starting Bundler availability test");
    // await bundler.init(); // run init to check bundler is alivable
    console.log("AA Activate Script Log : Test Completed - Bundler Availiable");
    const validation = await bundler.simulateValidation(activateOp);

    if (validation.status !== 0) {
      console.log("AA Activate Script Log : Bundler Simulate Validation Failed : Returned validation is : ", validation);
      throw new Error(`error code:${validation.status}`);
    }

    const simulate = await bundler.simulateHandleOp(activateOp);
    if (simulate.status !== 0) {
      console.log("AA Activate Script Log : reached3, simulate.status", simulate.status);
      console.log("AA Activate Script Log : simulate", simulate)
      throw new Error(`error code:${simulate.status}`);
    }
    console.log("AA Activate Script Log : Bundler Simulate Handler Ops Completed. Sending UserOperation");
    const bundlerEvent = bundler.sendUserOperation(activateOp, 1000 * 60 * 3);
    console.log("AA Activate Script Log : Bundler sending UserOperation Completed. Waiting for Bundler Event");
    startBundlerEvent(bundlerEvent, walletAddress);
    let a=15;
    while (a--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return walletAddress;
  } else {
    return walletAddress;
  }
}


function startBundlerEvent(bundlerEvent:any, walletAddress:string) {
  bundlerEvent.on('error', (err: any) => {
    console.log("AA Activate Script Log : Bundler Event : Error triggered, Error is ", err);
    return "";

  });
  bundlerEvent.on('send', (userOpHash: string) => {
    console.log("AA Activate Script Log : Bundler Event : Send received for userOpHash", userOpHash);
  });
  bundlerEvent.on('receipt', (receipt: IUserOpReceipt) => {
    console.log("AA Activate Script Log : Bundler Event Received with receipt success: ", receipt.success);
    return walletAddress;
  });
  bundlerEvent.on('timeout', () => {
    console.log("AA Activate Script Log : Bundler Event : Timeout reached");
    console.log('timeout');
    return "";
  });
}

async function intializeSoulWalletLib () {

  networkBundler.set('ArbGoerli', 'https://bundler-arb-goerli.soulwallets.me/rpc'); // Bundler running by SoulWallet
  if (isLocalTestnet()){
      networkBundler.set(network.name, BUNDLER_RPC_URL_LOCAL); // Bundler running for hardhat
  }
 
  if (isLocalTestnet()) {
      etherProvider = new ETHERS.providers.JsonRpcProvider("http://localhost:8545/")
      soulWalletLib = new SoulWalletLib(singletonFactoryAddress);
      USDCContractAddress = usdcCoinContractAddress;
      USDCPriceFeedAddress = usdcPriceFeedContractAddress;
      eip1559GasFee = mockGasFee;

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
}



async function calculateGasLimit (
    etherProvider:ETHERS.providers.BaseProvider, 
    walletAddress:string, 
    value : ETHERS.BigNumber, to : string, 
    encodedFunctionData:string) : Promise<string> {

  let gasLimit = ethers.BigNumber.from(21000);
  if (encodedFunctionData !== ""){
    gasLimit = gasLimit.add((await etherProvider.estimateGas({
      from:walletAddress,
      to: to,
      value : value,
      data : encodedFunctionData
    })));
  } 
  return gasLimit.toHexString();
}

/*

  Creating encoded function data for - calling testFunction(uint a, string b) on Test Contract
  const encodedFunctionData = new ethers.utils.Interface(TEST_CONTRACT_ABI).encodeFunctionData(
    "testFunction", [1, "TestString"]
  );
  Note - to execute transfer, data is empty

*/
function calculateEncodedFunctionData(
  contractInterface : ETHERS.utils.Interface,
  functionName : string,
  argumentsArray : any) : string {

    return contractInterface.encodeFunctionData(
      functionName, 
      argumentsArray
    );
  
}


function calculateUserOperationCallData(
  to : string,
  value : BigNumberish,
  encodedFunctionData : string ) : string {

    return SOUL_WALLET_INTERFACE.encodeFunctionData(
      "execFromEntryPoint",
      [to, value, encodedFunctionData]
    );

} 


async function calculateUserOperationPaymasterAndData(
  userOperation : UserOperation,
  provider : ETHERS.providers.BaseProvider,
  tokenPaymasterAddress : string,
  USDCContractAddress:string) : Promise<any> {

  const requiredPreFundObtained = userOperation.requiredPrefund(
    ethers.utils.parseUnits(eip1559GasFee.estimatedBaseFee, "gwei"));
  
  console.log("AA Activate Script Log : UserOperation Log - Calculated Required PreFund as : ", ethers.utils.formatEther(requiredPreFundObtained), "ETH")
  
  const exchangePriceObtained = await soulWalletLib.getPaymasterExchangePrice(
    provider, tokenPaymasterAddress, USDCContractAddress, true);

  const tokenDecimals = exchangePriceObtained.tokenDecimals || 6;
  console.log("AA Activate Script Log : UserOperation Log - Calculated Exchange Price  as : ", + ethers.utils.formatUnits(exchangePriceObtained.price, exchangePriceObtained.decimals), 'USDC/ETH');

  const requiredUSDC = requiredPreFundObtained.mul(exchangePriceObtained.price)
    .mul(BigNumber.from(10).pow(tokenDecimals))
    .div(BigNumber.from(10).pow(exchangePriceObtained.decimals))
    .div(BigNumber.from(10).pow(18));

  console.log("AA Activate Script Log : UserOperation Log - Calculated Required USDC  as : ", ethers.utils.formatUnits(requiredUSDC, tokenDecimals), 'USDC');
  const maxUSDC = requiredUSDC.mul(110).div(100); // 10% more

  return soulWalletLib.getPaymasterData(TokenPaymasterAddress, USDCContractAddress, maxUSDC);
}



async function createUserOperation(
  walletAddress : string,
  provider : ETHERS.providers.BaseProvider,
  tokenPaymasterAddress : string,
  USDCContractAddress:string): Promise<UserOperation> {

  const soulWalletInterface = SOUL_WALLET_INTERFACE;
  let userOp = new UserOperation();
  userOp.sender = walletAddress;
  const obtainedNonce = await (new ethers.Contract(walletAddress, soulWalletInterface, provider)).nonce();
  console.log("AA Activate Script Log : UserOperation created for Nonce ", obtainedNonce);
  userOp.nonce = obtainedNonce.toHexString();
  userOp.initCode = "0x";
  // userOp.paymasterAndData = await calculateUserOperationPaymasterAndData(
  //   userOp, provider, tokenPaymasterAddress, USDCContractAddress );
  
  userOp.maxFeePerGas = ethers.utils
    .parseUnits(eip1559GasFee.high.suggestedMaxFeePerGas, "gwei")
    .toString();

  userOp.maxPriorityFeePerGas = ethers.utils
    .parseUnits(eip1559GasFee.high.suggestedMaxPriorityFeePerGas, "gwei")
    .toString()
  return userOp;

}


async function deployContractUsingSingletonFactory(
  contractByteCode : string | ETHERS.Bytes,
  signletonFactoryContractAddress : string,
  EOA : ETHERS.Signer,
  provider : ETHERS.providers.BaseProvider ) : Promise<string> {


  const initCodeHash = keccak256(contractByteCode);
  const contractAddress = getCreate2Address(signletonFactoryContractAddress, salt, initCodeHash);

  const codeAtAddress = await provider.getCode(contractAddress);

  if (codeAtAddress !== '0x') {
      console.log("AA Activate Script Log : AA Activate Script Log : Contract already deployed at address", contractAddress);
      return contractAddress;
  } else {
      const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
          return ethers.BigNumber.from(Math.pow(10, 7) + '');
          //return estimatedGasLimit.mul(10)  // 10x gas
      }

      const create2FactoryContract = SingletonFactory__factory.connect(signletonFactoryContractAddress, EOA);
      const estimatedGas = await create2FactoryContract.estimateGas.deploy(contractByteCode, salt);
      const deployTransaction = await create2FactoryContract.deploy(contractByteCode, salt, { gasLimit: increaseGasLimit(estimatedGas) })
      console.log("AA Activate Script Log : AA Script Log : Deploy Transaction Hash : ", deployTransaction.hash);
      const deployTransactionReciept = await deployTransaction.wait(1);
      console.log("AA Activate Script Log : AA Script Log : Deploy Transaction Receipt included in Block:", deployTransactionReciept.blockNumber)

      return contractAddress;
  }
}


async function executeTransferFromWallet (
  walletOwner:string,
  walletOwnerPrivateKey:string,
  walletAddress:string, 
  receipient:string,
  tokenContractAddres:string,
  tokenPaymasterAddress:string,
  amount:BigNumber,
  provider : ETHERS.providers.BaseProvider) {

  let userOperation = await createUserOperation(
    walletAddress,
    provider,
    tokenPaymasterAddress,
    usdcCoinContractAddress );

  userOperation.paymasterAndData = await calculateUserOperationPaymasterAndData(
    userOperation,
    provider,
    tokenPaymasterAddress, 
    usdcCoinContractAddress );

  const IERC20_INTERFACE = new ethers.utils.Interface(IERC20_ABI.abi);

  const encodedFunctionData = calculateEncodedFunctionData(
    IERC20_INTERFACE, "transfer", [receipient, amount] );

  const userOperationCallData = calculateUserOperationCallData(
    tokenContractAddres, 0, encodedFunctionData
  )
  
  const userOperationGasLimit = await calculateGasLimit(
    provider, walletAddress, ETHERS.BigNumber.from(0), tokenContractAddres, encodedFunctionData );

  userOperation.callData = userOperationCallData;
  userOperation.callGasLimit = userOperationGasLimit;

  const userOpHash = userOperation.getUserOpHash(EntryPointAddress, chainId);
  
  userOperation.signWithSignature(
    walletOwner,
    Utils.signMessage(userOpHash, walletOwnerPrivateKey)
  );

  const bundlerUrl = networkBundler.get(network.name);
  console.log("AA Activate Script Log : Bundler RPC URL to be used ", bundlerUrl);

  const bundler = new soulWalletLib.Bundler(EntryPointAddress, ethers.provider, bundlerUrl);
    

  const validation = await bundler.simulateValidation(userOperation);
  if (validation.status !== 0) {
    console.log("AA Activate Script Log : Bundler Simulate Validation Failed : Returned validation is : ", validation);
    throw new Error(`error code:${validation.status}`);
  }

  const simulate = await bundler.simulateHandleOp(userOperation);
  if (simulate.status !== 0) {
    console.log("AA Activate Script Log : Bundler Simulate HandleOps Failed : Returned validation is : ", simulate.status);
    throw new Error(`error code:${simulate.status}`);
  }
  console.log("AA Activate Script Log : Bundler Simulate Handler Ops Completed. Sending UserOperation");

  const bundlerEvent = bundler.sendUserOperation(userOperation, 1000 * 60 * 3);
  console.log("AA Activate Script Log : Bundler sending UserOperation Completed. Waiting for Bundler Event");
  startBundlerEvent(bundlerEvent, walletAddress);
    
  // Timeout to wait for UserOperation to be succesful
  let a=15;
  while (a--) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

}

// async function executeEthTransfer (
//   walletOwner:string,
//   walletOwnerPrivateKey:string,
//   walletAddress:string, 
//   receipient:string,
//   tokenContractAddres:string,
//   tokenPaymasterAddress:string,
//   amount:BigNumber,
//   provider : ETHERS.providers.BaseProvider) {


//   let userOperation = await createUserOperation(
//     walletAddress,
//     provider,
//     tokenPaymasterAddress,
//     usdcCoinContractAddress );

//   userOperation.paymasterAndData = await calculateUserOperationPaymasterAndData(
//     userOperation,
//     provider,
//     tokenPaymasterAddress, 
//     usdcCoinContractAddress );
  
//   const encodedFunctionData = "0x"; //Empty Calldata

//   const userOperationCallData = calculateUserOperationCallData(
//     tokenContractAddres, amount, encodedFunctionData
//   );

//   const userOperationGasLimit = await calculateGasLimit(
//     provider, walletAddress, amount, 
//     tokenContractAddres, encodedFunctionData );

//   userOperation.callData = userOperationCallData;
//   userOperation.callGasLimit = userOperationGasLimit;

//   const userOpHash = userOperation.getUserOpHash(EntryPointAddress, chainId);
  
//   userOperation.signWithSignature(
//     walletOwner,
//     Utils.signMessage(userOpHash, walletOwnerPrivateKey)
//   );

//   const bundlerUrl = networkBundler.get(network.name);
//   console.log("AA Activate Script Log : Bundler RPC URL to be used ", bundlerUrl);

//   const bundler = new soulWalletLib.Bundler(EntryPointAddress, ethers.provider, bundlerUrl);
    

//   const validation = await bundler.simulateValidation(userOperation);
//   if (validation.status !== 0) {
//     console.log("AA Activate Script Log : Bundler Simulate Validation Failed : Returned validation is : ", validation);
//     throw new Error(`error code:${validation.status}`);
//   }

//   const simulate = await bundler.simulateHandleOp(userOperation);
//   if (simulate.status !== 0) {
//     console.log("AA Activate Script Log : Bundler Simulate HandleOps Failed : Returned validation is : ", simulate.status);
//     throw new Error(`error code:${simulate.status}`);
//   }

  
//   console.log("AA Activate Script Log : Bundler Simulate Handler Ops Completed. Sending UserOperation");

//   const bundlerEvent = bundler.sendUserOperation(userOperation, 1000 * 60 * 3);
//   console.log("AA Activate Script Log : Bundler sending UserOperation Completed. Waiting for Bundler Event");
//   startBundlerEvent(bundlerEvent, walletAddress);
    
//   // Timeout to wait for UserOperation to be succesful
//   let a=15;
//   while (a--) {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   }





// }