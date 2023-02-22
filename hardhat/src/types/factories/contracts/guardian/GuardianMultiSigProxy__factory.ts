/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BytesLike,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  GuardianMultiSigProxy,
  GuardianMultiSigProxyInterface,
} from "../../../contracts/guardian/GuardianMultiSigProxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516107be3803806107be83398101604081905261002f9161032a565b818161003d82826000610046565b50505050610447565b61004f8361007c565b60008251118061005c5750805b156100775761007583836100bc60201b6100291760201c565b505b505050565b610085816100e8565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606100e18383604051806060016040528060278152602001610797602791396101ba565b9392505050565b6100fb8161023360201b6100551760201c565b6101625760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b806101997f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b61024260201b6100711760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b6060600080856001600160a01b0316856040516101d791906103f8565b600060405180830381855af49150503d8060008114610212576040519150601f19603f3d011682016040523d82523d6000602084013e610217565b606091505b50909250905061022986838387610245565b9695505050505050565b6001600160a01b03163b151590565b90565b606083156102b45782516000036102ad576001600160a01b0385163b6102ad5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610159565b50816102be565b6102be83836102c6565b949350505050565b8151156102d65781518083602001fd5b8060405162461bcd60e51b81526004016101599190610414565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610321578181015183820152602001610309565b50506000910152565b6000806040838503121561033d57600080fd5b82516001600160a01b038116811461035457600080fd5b60208401519092506001600160401b038082111561037157600080fd5b818501915085601f83011261038557600080fd5b815181811115610397576103976102f0565b604051601f8201601f19908116603f011681019083821181831017156103bf576103bf6102f0565b816040528281528860208487010111156103d857600080fd5b6103e9836020830160208801610306565b80955050505050509250929050565b6000825161040a818460208701610306565b9190910192915050565b6020815260008251806020840152610433816040850160208701610306565b601f01601f19169190910160400192915050565b610341806104566000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610074565b6100b9565b565b606061004e83836040518060600160405280602781526020016102e5602791396100dd565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b3660008037600080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b60606000808573ffffffffffffffffffffffffffffffffffffffff16856040516101079190610277565b600060405180830381855af49150503d8060008114610142576040519150601f19603f3d011682016040523d82523d6000602084013e610147565b606091505b509150915061015886838387610162565b9695505050505050565b606083156101fd5782516000036101f65773ffffffffffffffffffffffffffffffffffffffff85163b6101f6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064015b60405180910390fd5b5081610207565b610207838361020f565b949350505050565b81511561021f5781518083602001fd5b806040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101ed9190610293565b60005b8381101561026e578181015183820152602001610256565b50506000910152565b60008251610289818460208701610253565b9190910192915050565b60208152600082518060208401526102b2816040850160208701610253565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220c1bb1f75ff0709a7a5dfafb0858d275a1ab22814735febce302232798f609a7b64736f6c63430008110033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564";

type GuardianMultiSigProxyConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GuardianMultiSigProxyConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GuardianMultiSigProxy__factory extends ContractFactory {
  constructor(...args: GuardianMultiSigProxyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    logic: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<GuardianMultiSigProxy> {
    return super.deploy(
      logic,
      data,
      overrides || {}
    ) as Promise<GuardianMultiSigProxy>;
  }
  override getDeployTransaction(
    logic: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(logic, data, overrides || {});
  }
  override attach(address: string): GuardianMultiSigProxy {
    return super.attach(address) as GuardianMultiSigProxy;
  }
  override connect(signer: Signer): GuardianMultiSigProxy__factory {
    return super.connect(signer) as GuardianMultiSigProxy__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GuardianMultiSigProxyInterface {
    return new utils.Interface(_abi) as GuardianMultiSigProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GuardianMultiSigProxy {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as GuardianMultiSigProxy;
  }
}
