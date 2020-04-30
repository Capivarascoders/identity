pragma solidity 0.6.4;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract Identity is ChainlinkClient {
    constructor(address _link) public {
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
    }
}