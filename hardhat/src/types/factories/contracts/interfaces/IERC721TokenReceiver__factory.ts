/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IERC721TokenReceiver,
  IERC721TokenReceiverInterface,
} from "../../../contracts/interfaces/IERC721TokenReceiver";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "_from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IERC721TokenReceiver__factory {
  static readonly abi = _abi;
  static createInterface(): IERC721TokenReceiverInterface {
    return new utils.Interface(_abi) as IERC721TokenReceiverInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC721TokenReceiver {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IERC721TokenReceiver;
  }
}
