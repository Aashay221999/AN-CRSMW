// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {IERC735} from "./interfaces/IERC735.sol";
import "./KeyHolder.sol";
import "./AccountStorage.sol";

contract ClaimHolder is KeyHolder, IERC735 {
    using AccountStorage for AccountStorage.Layout;
    // mapping(bytes32 => Claim) claims;
    // mapping(uint256 => bytes32[]) claimsByType;

    function addClaim(
        uint256 _claimType,
        uint256 _scheme,
        address _issuer,
        bytes memory _signature,
        bytes memory _data,
        string memory _uri
    ) public returns (bytes32 claimRequestId) {
        ClaimHolderLayout storage l = AccountStorage.layout().claimholder;
        bytes32 claimId = keccak256(abi.encodePacked(_issuer, _claimType));

        if (msg.sender != address(this)) {
            require(
                keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 3),
                "Sender does not have claim signer key"
            );
        }

        if (l.claims[claimId].issuer != _issuer) {
            l.claimsByType[_claimType].push(claimId);
        }

        l.claims[claimId].claimType = _claimType;
        l.claims[claimId].scheme = _scheme;
        l.claims[claimId].issuer = _issuer;
        l.claims[claimId].signature = _signature;
        l.claims[claimId].data = _data;
        l.claims[claimId].uri = _uri;

        emit ClaimAdded(
            claimId,
            _claimType,
            _scheme,
            _issuer,
            _signature,
            _data,
            _uri
        );

        return claimId;
    }

    function removeClaim(bytes32 _claimId) public returns (bool success) {
        ClaimHolderLayout storage l = AccountStorage.layout().claimholder;
        if (msg.sender != address(this)) {
            require(
                keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1),
                "Sender does not have management key"
            );
        }

        /* uint index; */
        /* (index, ) = claimsByType[claims[_claimId].claimType].indexOf(_claimId);
        claimsByType[claims[_claimId].claimType].removeByIndex(index); */

        emit ClaimRemoved(
            _claimId,
            l.claims[_claimId].claimType,
            l.claims[_claimId].scheme,
            l.claims[_claimId].issuer,
            l.claims[_claimId].signature,
            l.claims[_claimId].data,
            l.claims[_claimId].uri
        );

        delete l.claims[_claimId];
        return true;
    }

    function getClaim(
        bytes32 _claimId
    )
        public
        view
        returns (
            uint256 claimType,
            uint256 scheme,
            address issuer,
            bytes memory signature,
            bytes memory data,
            string memory uri
        )
    {
        ClaimHolderLayout storage l = AccountStorage.layout().claimholder;
        return (
            l.claims[_claimId].claimType,
            l.claims[_claimId].scheme,
            l.claims[_claimId].issuer,
            l.claims[_claimId].signature,
            l.claims[_claimId].data,
            l.claims[_claimId].uri
        );
    }

    function getClaimIdsByType(
        uint256 _claimType
    ) public view returns (bytes32[] memory claimIds) {
        ClaimHolderLayout storage l = AccountStorage.layout().claimholder;
        return l.claimsByType[_claimType];
    }
}
