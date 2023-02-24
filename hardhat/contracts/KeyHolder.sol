// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import {IERC725v1} from "./interfaces/IERC725v1.sol";
import "./AccountStorage.sol";


contract KeyHolder is IERC725v1 {
    using AccountStorage for AccountStorage.Layout;


    uint256 constant MANAGEMENT_KEY = 1;
    uint256 constant ACTION_KEY = 2;
    uint256 constant CLAIM_SIGNER_KEY = 3;
    uint256 constant ENCRYPTION_KEY = 4;

    // uint256 executionNonce;

    // struct Execution {
    //     address to;
    //     uint256 value;
    //     bytes data;
    //     bool approved;
    //     bool executed;
    // }

    // mapping(bytes32 => Key) keys;
    // mapping(uint256 => bytes32[]) keysByPurpose;
    // mapping(uint256 => Execution) executions;

    // event ExecutionFailed(
    //     uint256 indexed executionId,
    //     address indexed to,
    //     uint256 indexed value,
    //     bytes data
    // );

    constructor() {
        // bytes32 _key = keccak256(abi.encodePacked(msg.sender));
        // keys[_key].key = _key;
        // keys[_key].purpose = 1;
        // keys[_key].keyType = 1;
        // keysByPurpose[1].push(_key);
        // emit KeyAdded(_key, keys[_key].purpose, 1);
    }

    function getKey(
        bytes32 _key
    ) public view returns (uint256 purpose, uint256 keyType, bytes32 key) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;
        return (l.keys[_key].purpose, l.keys[_key].keyType, l.keys[_key].key);
    }

    function getKeyPurpose(bytes32 _key) public view returns (uint256 purpose) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;
        return (l.keys[_key].purpose);
    }

    function getKeysByPurpose(
        uint256 _purpose
    ) public view returns (bytes32[] memory _keys) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;
        return l.keysByPurpose[_purpose];
    }

    function addKey(
        bytes32 _key,
        uint256 _purpose,
        uint256 _type
    ) public returns (bool success) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;
        require(l.keys[_key].key != _key, "Key already exists"); // Key should not already exist
        if (msg.sender != address(this)) {
            require(
                keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1),
                "Sender does not have management key"
            ); // Sender has MANAGEMENT_KEY
        }

        l.keys[_key].key = _key;
        l.keys[_key].purpose = _purpose;
        l.keys[_key].keyType = _type;

        l.keysByPurpose[_purpose].push(_key);

        emit KeyAdded(_key, _purpose, _type);

        return true;
    }

    // function approve(uint256 _id, bool _approve) public returns (bool success) {
    //     require(
    //         keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 2),
    //         "Sender does not have action key"
    //     );

    //     emit Approved(_id, _approve);

    //     if (_approve == true) {
    //         executions[_id].approved = true;
    //         (success, ) = executions[_id].to.call{value: executions[_id].value}(
    //             executions[_id].data
    //         );
    //         if (success) {
    //             executions[_id].executed = true;
    //             emit Executed(
    //                 _id,
    //                 executions[_id].to,
    //                 executions[_id].value,
    //                 executions[_id].data
    //             );
    //             return success;
    //         } else {
    //             emit ExecutionFailed(
    //                 _id,
    //                 executions[_id].to,
    //                 executions[_id].value,
    //                 executions[_id].data
    //             );
    //             return success;
    //         }
    //     } else {
    //         executions[_id].approved = false;
    //     }
    //     return true;
    // }

    // function execute(
    //     address _to,
    //     uint256 _value,
    //     bytes memory _data
    // ) public payable returns (uint256 executionId) {
    //     require(!executions[executionNonce].executed, "Already executed");
    //     executions[executionNonce].to = _to;
    //     executions[executionNonce].value = _value;
    //     executions[executionNonce].data = _data;

    //     emit ExecutionRequested(executionNonce, _to, _value, _data);

    //     if (
    //         keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 1) ||
    //         keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), 2)
    //     ) {
    //         approve(executionNonce, true);
    //     }

    //     executionNonce++;
    //     return executionNonce - 1;
    // }

    function removeKey(bytes32 _key) public returns (bool success) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;

        require(l.keys[_key].key == _key, "No such key");
        emit KeyRemoved(l.keys[_key].key, l.keys[_key].purpose, l.keys[_key].keyType);

        /* uint index;
        (index,) = keysByPurpose[keys[_key].purpose.indexOf(_key);
        keysByPurpose[keys[_key].purpose.removeByIndex(index); */

        delete l.keys[_key];

        return true;
    }

    function keyHasPurpose(
        bytes32 _key,
        uint256 _purpose
    ) public view returns (bool result) {
        KeyHolderLayout storage l = AccountStorage.layout().keyholder;
        bool isThere;
        if (l.keys[_key].key == 0) return false;
        isThere = l.keys[_key].purpose <= _purpose;
        return isThere;
    }
}
