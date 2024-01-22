// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import { RicoSetUp } from "../test/RicoHelper.sol";
import { WethLike } from "../test/RicoHelper.sol";

contract SetupScript is Script, RicoSetUp {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        make_bank();
        feedpush(wrtag, bytes32(RAY * 1000), block.timestamp + 1000);
        WethLike(WETH).deposit{value: 1000 * WAD}();
        console.log('bank @ %s fb @ %s', bank, address(feed));
        vm.stopBroadcast();
    }
}
