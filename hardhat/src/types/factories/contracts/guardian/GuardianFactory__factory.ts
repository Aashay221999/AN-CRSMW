/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  GuardianFactory,
  GuardianFactoryInterface,
} from "../../../contracts/guardian/GuardianFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "NewGuardianCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_guardianMultiSigImpAddr",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "_guardians",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "_threshold",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "createGuardianMultiSig",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    name: "getGuardianAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610da4806100206000396000f3fe60806040523480156200001157600080fd5b50600436106200003a5760003560e01c80634acf9d2e146200003f57806363a7834e146200007f575b600080fd5b62000056620000503660046200032d565b62000096565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b620000566200009036600462000404565b620001a1565b600060ff60f81b308360405180602001620000b190620002c6565b601f1982820381018352601f909101166040819052620000d89089908990602001620004c6565b60408051601f1981840301815290829052620000f8929160200162000518565b604051602081830303815290604052805190602001206040516020016200018194939291907fff0000000000000000000000000000000000000000000000000000000000000094909416845260609290921b7fffffffffffffffffffffffffffffffffffffffff0000000000000000000000001660018401526015830152603582015260550190565b60408051601f198184030181529190528051602090910120949350505050565b6000806200022e876360b5bb3f60e01b888888604051602401620001c8939291906200054b565b60408051601f198184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152856200027c565b60405190915073ffffffffffffffffffffffffffffffffffffffff8216907fde0ca9b865516d001f83a71c31aa87a19a643c3493d8b5fe860262b98010a51490600090a29695505050505050565b60008184846040516200028f90620002c6565b6200029c929190620004c6565b8190604051809103906000f5905080158015620002bd573d6000803e3d6000fd5b50949350505050565b6107be80620005b183390190565b803573ffffffffffffffffffffffffffffffffffffffff81168114620002f957600080fd5b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000806000606084860312156200034357600080fd5b6200034e84620002d4565b9250602084013567ffffffffffffffff808211156200036c57600080fd5b818601915086601f8301126200038157600080fd5b813581811115620003965762000396620002fe565b604051601f8201601f19908116603f01168101908382118183101715620003c157620003c1620002fe565b81604052828152896020848701011115620003db57600080fd5b826020860160208301376000602084830101528096505050505050604084013590509250925092565b6000806000806000608086880312156200041d57600080fd5b6200042886620002d4565b9450602086013567ffffffffffffffff808211156200044657600080fd5b818801915088601f8301126200045b57600080fd5b8135818111156200046b57600080fd5b8960208260051b85010111156200048157600080fd5b9699602092909201985095966040810135965060600135945092505050565b60005b83811015620004bd578181015183820152602001620004a3565b50506000910152565b73ffffffffffffffffffffffffffffffffffffffff83168152604060208201526000825180604084015262000503816060850160208701620004a0565b601f01601f1916919091016060019392505050565b600083516200052c818460208801620004a0565b83519083019062000542818360208801620004a0565b01949350505050565b6040808252810183905260008460608301825b868110156200059d5773ffffffffffffffffffffffffffffffffffffffff6200058784620002d4565b168252602092830192909101906001016200055e565b506020939093019390935250939250505056fe608060405234801561001057600080fd5b506040516107be3803806107be83398101604081905261002f9161032a565b818161003d82826000610046565b50505050610447565b61004f8361007c565b60008251118061005c5750805b156100775761007583836100bc60201b6100291760201c565b505b505050565b610085816100e8565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606100e18383604051806060016040528060278152602001610797602791396101ba565b9392505050565b6100fb8161023360201b6100551760201c565b6101625760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b806101997f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b61024260201b6100711760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b6060600080856001600160a01b0316856040516101d791906103f8565b600060405180830381855af49150503d8060008114610212576040519150601f19603f3d011682016040523d82523d6000602084013e610217565b606091505b50909250905061022986838387610245565b9695505050505050565b6001600160a01b03163b151590565b90565b606083156102b45782516000036102ad576001600160a01b0385163b6102ad5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610159565b50816102be565b6102be83836102c6565b949350505050565b8151156102d65781518083602001fd5b8060405162461bcd60e51b81526004016101599190610414565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610321578181015183820152602001610309565b50506000910152565b6000806040838503121561033d57600080fd5b82516001600160a01b038116811461035457600080fd5b60208401519092506001600160401b038082111561037157600080fd5b818501915085601f83011261038557600080fd5b815181811115610397576103976102f0565b604051601f8201601f19908116603f011681019083821181831017156103bf576103bf6102f0565b816040528281528860208487010111156103d857600080fd5b6103e9836020830160208801610306565b80955050505050509250929050565b6000825161040a818460208701610306565b9190910192915050565b6020815260008251806020840152610433816040850160208701610306565b601f01601f19169190910160400192915050565b610341806104566000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610074565b6100b9565b565b606061004e83836040518060600160405280602781526020016102e5602791396100dd565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b3660008037600080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b60606000808573ffffffffffffffffffffffffffffffffffffffff16856040516101079190610277565b600060405180830381855af49150503d8060008114610142576040519150601f19603f3d011682016040523d82523d6000602084013e610147565b606091505b509150915061015886838387610162565b9695505050505050565b606083156101fd5782516000036101f65773ffffffffffffffffffffffffffffffffffffffff85163b6101f6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064015b60405180910390fd5b5081610207565b610207838361020f565b949350505050565b81511561021f5781518083602001fd5b806040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101ed9190610293565b60005b8381101561026e578181015183820152602001610256565b50506000910152565b60008251610289818460208701610253565b9190910192915050565b60208152600082518060208401526102b2816040850160208701610253565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220c1bb1f75ff0709a7a5dfafb0858d275a1ab22814735febce302232798f609a7b64736f6c63430008110033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201088ec819f155e430d2f59f013ae91fad1a4399c5429954c6576368db3039b4364736f6c63430008110033";

type GuardianFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GuardianFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GuardianFactory__factory extends ContractFactory {
  constructor(...args: GuardianFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<GuardianFactory> {
    return super.deploy(overrides || {}) as Promise<GuardianFactory>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): GuardianFactory {
    return super.attach(address) as GuardianFactory;
  }
  override connect(signer: Signer): GuardianFactory__factory {
    return super.connect(signer) as GuardianFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GuardianFactoryInterface {
    return new utils.Interface(_abi) as GuardianFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GuardianFactory {
    return new Contract(address, _abi, signerOrProvider) as GuardianFactory;
  }
}
