/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IGuardianControl,
  IGuardianControlInterface,
} from "../../../contracts/interfaces/IGuardianControl";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "guardian",
        type: "address",
      },
    ],
    name: "GuardianCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "guardian",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "previousGuardian",
        type: "address",
      },
    ],
    name: "GuardianConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "guardian",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "activateTime",
        type: "uint64",
      },
    ],
    name: "GuardianSet",
    type: "event",
  },
] as const;

export class IGuardianControl__factory {
  static readonly abi = _abi;
  static createInterface(): IGuardianControlInterface {
    return new utils.Interface(_abi) as IGuardianControlInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IGuardianControl {
    return new Contract(address, _abi, signerOrProvider) as IGuardianControl;
  }
}
