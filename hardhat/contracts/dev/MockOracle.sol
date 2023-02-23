// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MockOracle {
    constructor() {}

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
	return (92233720368547799018,161542070000, 1677066209,1678066209,92233720368547799018);

    }
   function decimals() external view returns (uint8){
        return 6;
    }
}
