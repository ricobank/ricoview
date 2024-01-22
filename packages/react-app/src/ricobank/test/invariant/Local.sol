// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

// For non fork tests. Deploys copies of weth and some of uni v3, no balances or liquidity.
contract Local is Test {
    string constant v3FactoryArtifact  = 'node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
    string constant SwapRouterArtifact = 'node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
    string constant NFPMArtifact       = 'node_modules/@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json';

    // Descriptor artifact isn't pulled from node_modules/@uniswap/... because it is custom made. Compiled
    // with libs built in so deployCode() can be used, and uni deployed without mixing compiler versions
    string constant DescriptorArtifact = 'test/invariant/external_artifacts/NonfungibleTokenPositionDescriptor.json';
    string constant weth9Artifact      = 'test/invariant/external_artifacts/WETH9.json';

    // Contracts placed at real ethereum deploy addresses to help integrate with fork tests
    address constant public weth_addr       = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant public factory_addr    = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address constant public router_addr     = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant public descriptor_addr = 0x42B24A95702b9986e82d421cC3568932790A48Ec;
    address constant public nfpm_addr       = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;

    function deploy_local_deps() public {
        deployCodeTo(weth9Artifact,      weth_addr);
        deployCodeTo(v3FactoryArtifact,  factory_addr);
        deployCodeTo(SwapRouterArtifact, abi.encode(factory_addr, weth_addr), router_addr);
        deployCodeTo(DescriptorArtifact, abi.encode(weth_addr, bytes32('ETH')), descriptor_addr);
        deployCodeTo(NFPMArtifact,       abi.encode(factory_addr, weth_addr, descriptor_addr), nfpm_addr);
    }
}
