/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 7292:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {


// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/encoding/toHex.js
var toHex = __webpack_require__(2106);
// EXTERNAL MODULE: ./node_modules/abitype/dist/esm/human-readable/parseAbi.js + 11 modules
var parseAbi = __webpack_require__(7246);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/unit/formatUnits.js
var formatUnits = __webpack_require__(5229);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/abi/decodeAbiParameters.js + 2 modules
var decodeAbiParameters = __webpack_require__(5821);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/encoding/fromHex.js
var fromHex = __webpack_require__(5946);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/unit/parseUnits.js
var parseUnits = __webpack_require__(1803);
// EXTERNAL MODULE: ./node_modules/viem/_esm/errors/rpc.js
var rpc = __webpack_require__(9028);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
var encodeAbiParameters = __webpack_require__(5444);
// EXTERNAL MODULE: ./node_modules/viem/_esm/utils/data/pad.js
var pad = __webpack_require__(1769);
// EXTERNAL MODULE: ./node_modules/viem/_esm/clients/transports/custom.js
var custom = __webpack_require__(3980);
// EXTERNAL MODULE: ./node_modules/viem/_esm/clients/transports/http.js + 4 modules
var http = __webpack_require__(8776);
// EXTERNAL MODULE: ./node_modules/viem/_esm/clients/createWalletClient.js + 12 modules
var createWalletClient = __webpack_require__(1677);
// EXTERNAL MODULE: ./node_modules/viem/_esm/clients/createPublicClient.js + 46 modules
var createPublicClient = __webpack_require__(7759);
// EXTERNAL MODULE: ./node_modules/viem/_esm/actions/getContract.js
var getContract = __webpack_require__(8541);
// EXTERNAL MODULE: ./node_modules/viem/_esm/chains/definitions/arbitrum.js + 1 modules
var arbitrum = __webpack_require__(5433);
;// CONCATENATED MODULE: ./BankDiamond.json
const BankDiamond_namespaceObject = /*#__PURE__*/JSON.parse('{"Mt":[{"inputs":[],"name":"ErrBound","type":"error"},{"inputs":[],"name":"ErrIntOver","type":"error"},{"inputs":[],"name":"ErrIntUnder","type":"error"},{"inputs":[],"name":"ErrUintOver","type":"error"},{"inputs":[],"name":"ErrUintUnder","type":"error"},{"inputs":[],"name":"ErrWrongKey","type":"error"},{"inputs":[],"name":"ErrWrongUrn","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"NewFlog","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm0","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm1","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm2","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"val","type":"bytes"}],"name":"NewPalmBytes2","type":"event"},{"anonymous":false,"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"enum IDiamondCuttable.FacetCutAction","name":"action","type":"uint8"},{"internalType":"bytes4[]","name":"selectors","type":"bytes4[]"}],"indexed":false,"internalType":"struct IDiamondCuttable.FacetCut[]","name":"facetCuts","type":"tuple[]"},{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"DiamondCut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"enum IDiamondCuttable.FacetCutAction","name":"action","type":"uint8"},{"internalType":"bytes4[]","name":"selectors","type":"bytes4[]"}],"internalType":"struct IDiamondCuttable.FacetCut[]","name":"facetCuts","type":"tuple[]"},{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"diamondCut","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"selector","type":"bytes4"}],"name":"facetAddress","outputs":[{"internalType":"address","name":"facet","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facetAddresses","outputs":[{"internalType":"address[]","name":"addresses","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"facet","type":"address"}],"name":"facetFunctionSelectors","outputs":[{"internalType":"bytes4[]","name":"selectors","type":"bytes4[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facets","outputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes4[]","name":"selectors","type":"bytes4[]"}],"internalType":"struct IDiamondLoupe.Facet[]","name":"diamondFacets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFallbackAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nomineeOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"fallbackAddress","type":"address"}],"name":"setFallbackAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"ErrBound","type":"error"},{"inputs":[],"name":"ErrIntOver","type":"error"},{"inputs":[],"name":"ErrIntUnder","type":"error"},{"inputs":[],"name":"ErrUintOver","type":"error"},{"inputs":[],"name":"ErrUintUnder","type":"error"},{"inputs":[],"name":"ErrWrongKey","type":"error"},{"inputs":[],"name":"ErrWrongUrn","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"NewFlog","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm0","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm1","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm2","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"val","type":"bytes"}],"name":"NewPalmBytes2","type":"event"},{"inputs":[],"name":"CAP_MAX","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"REL_MAX","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"fb","outputs":[{"internalType":"contract Feedbase","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"file","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"rico","outputs":[{"internalType":"contract Gem","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ErrBound","type":"error"},{"inputs":[],"name":"ErrDebtCeil","type":"error"},{"inputs":[],"name":"ErrHookCallerNotBank","type":"error"},{"inputs":[],"name":"ErrHookData","type":"error"},{"inputs":[],"name":"ErrIlkInit","type":"error"},{"inputs":[],"name":"ErrIntOver","type":"error"},{"inputs":[],"name":"ErrIntUnder","type":"error"},{"inputs":[],"name":"ErrLock","type":"error"},{"inputs":[],"name":"ErrMultiIlk","type":"error"},{"inputs":[],"name":"ErrNoHook","type":"error"},{"inputs":[],"name":"ErrNotSafe","type":"error"},{"inputs":[],"name":"ErrSafeBail","type":"error"},{"inputs":[],"name":"ErrUintOver","type":"error"},{"inputs":[],"name":"ErrUintUnder","type":"error"},{"inputs":[],"name":"ErrUrnDust","type":"error"},{"inputs":[],"name":"ErrWrongKey","type":"error"},{"inputs":[],"name":"ErrWrongUrn","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"NewFlog","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm0","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm1","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm2","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"val","type":"bytes"}],"name":"NewPalmBytes2","type":"event"},{"inputs":[],"name":"FEE_MAX","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"MINT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"address","name":"u","type":"address"}],"name":"bail","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"ceil","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"debt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"}],"name":"drip","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"ilk","type":"bytes32"},{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32[]","name":"xs","type":"bytes32[]"},{"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"filh","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"ilk","type":"bytes32"},{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"filk","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"code","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"flash","outputs":[{"internalType":"bytes","name":"result","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"address","name":"u","type":"address"},{"internalType":"bytes","name":"dink","type":"bytes"},{"internalType":"int256","name":"dart","type":"int256"}],"name":"frob","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"ilk","type":"bytes32"},{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32[]","name":"xs","type":"bytes32[]"}],"name":"geth","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"bytes","name":"indata","type":"bytes"}],"name":"hookcallext","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"}],"name":"ilks","outputs":[{"components":[{"internalType":"uint256","name":"tart","type":"uint256"},{"internalType":"uint256","name":"rack","type":"uint256"},{"internalType":"uint256","name":"line","type":"uint256"},{"internalType":"uint256","name":"dust","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"},{"internalType":"uint256","name":"rho","type":"uint256"},{"internalType":"uint256","name":"chop","type":"uint256"},{"internalType":"address","name":"hook","type":"address"}],"internalType":"struct Bank.Ilk","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"ilk","type":"bytes32"},{"internalType":"address","name":"hook","type":"address"}],"name":"init","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"address","name":"u","type":"address"}],"name":"ink","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"joy","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"par","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rest","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"address","name":"u","type":"address"}],"name":"safe","outputs":[{"internalType":"enum Vat.Spot","name":"","type":"uint8"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"sin","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"i","type":"bytes32"},{"internalType":"address","name":"u","type":"address"}],"name":"urns","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ErrBound","type":"error"},{"inputs":[],"name":"ErrIntOver","type":"error"},{"inputs":[],"name":"ErrIntUnder","type":"error"},{"inputs":[],"name":"ErrOutDated","type":"error"},{"inputs":[],"name":"ErrReflop","type":"error"},{"inputs":[],"name":"ErrUintOver","type":"error"},{"inputs":[],"name":"ErrUintUnder","type":"error"},{"inputs":[],"name":"ErrWrongKey","type":"error"},{"inputs":[],"name":"ErrWrongUrn","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"NewFlog","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm0","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm1","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm2","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"val","type":"bytes"}],"name":"NewPalmBytes2","type":"event"},{"inputs":[],"name":"RISK","outputs":[{"internalType":"contract Gem","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"ilks","type":"bytes32[]"}],"name":"keep","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"loot","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"plat","outputs":[{"components":[{"internalType":"uint256","name":"pep","type":"uint256"},{"internalType":"uint256","name":"pop","type":"uint256"},{"internalType":"int256","name":"pup","type":"int256"}],"internalType":"struct Bank.Plx","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"plot","outputs":[{"components":[{"internalType":"uint256","name":"pep","type":"uint256"},{"internalType":"uint256","name":"pop","type":"uint256"},{"internalType":"int256","name":"pup","type":"int256"}],"internalType":"struct Bank.Plx","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ramp","outputs":[{"components":[{"internalType":"uint256","name":"bel","type":"uint256"},{"internalType":"uint256","name":"cel","type":"uint256"},{"internalType":"uint256","name":"rel","type":"uint256"},{"internalType":"uint256","name":"wel","type":"uint256"}],"internalType":"struct Bank.Ramp","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rudd","outputs":[{"components":[{"internalType":"address","name":"src","type":"address"},{"internalType":"bytes32","name":"tag","type":"bytes32"}],"internalType":"struct Bank.Rudd","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ErrBound","type":"error"},{"inputs":[],"name":"ErrIntOver","type":"error"},{"inputs":[],"name":"ErrIntUnder","type":"error"},{"inputs":[],"name":"ErrUintOver","type":"error"},{"inputs":[],"name":"ErrUintUnder","type":"error"},{"inputs":[],"name":"ErrWrongKey","type":"error"},{"inputs":[],"name":"ErrWrongUrn","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"NewFlog","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm0","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm1","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"val","type":"bytes32"}],"name":"NewPalm2","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"key","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx0","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"idx1","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"val","type":"bytes"}],"name":"NewPalmBytes2","type":"event"},{"inputs":[],"name":"cap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"how","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poke","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"tau","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tip","outputs":[{"components":[{"internalType":"address","name":"src","type":"address"},{"internalType":"bytes32","name":"tag","type":"bytes32"}],"internalType":"struct Bank.Rudd","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"way","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]}');
;// CONCATENATED MODULE: ./main.js
// Copyright (C) 2024 halys





const bankAddr   = "0x598C6c1cd9459F882530FC9D7dA438CB74C6CB3b"
const feedAddr   = "0xa84F3ad46f6Fa8D09B52EbC61f1C25aeF33231F8"
const nfpmAddr   = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const wrapAddr   = "0xf18eA2cf7A87C3F11fF8FF6B073DdEDfE2497f03"
const ricoAddr   = "0x5374EcC160A4bd68446B43B5A6B132F9c001C54C"
const arbAddr    = "0x912CE59144191C1204E64559FE8253a0e49E6548"
const daiAddr    = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
const linkAddr   = "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"
const rethAddr   = "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8"
const usdcAddr   = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const usdc_eAddr = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const wbtcAddr   = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"
const wethAddr   = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const wstethAddr = "0x5979D7b546E38E414F7E9822514be443A4800529"

const uniIlk = (0,toHex/* stringToHex */.$G)(":uninft", {size: 32})

const feedAbi  = (0,parseAbi/* parseAbi */.V)([
    "function pull(address src, bytes32 tag) external view returns (bytes32 val, uint256 ttl)"
])
const gemAbi = (0,parseAbi/* parseAbi */.V)([
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address usr, uint256 wad) external payable returns (bool ok)",
    "function balanceOf(address) external view returns (uint256)"
])
const nfpmAbi = (0,parseAbi/* parseAbi */.V)([
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) returns (address operator)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) returns (bool approved)",
    "function balanceOf(address owner) view returns (uint)",
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
])
const wrapAbi = (0,parseAbi/* parseAbi */.V)([
    "function total(address nfpm, uint tokenId, uint160 sqrtPriceX96) external view returns (uint amount0, uint amount1)"
])
const multicall3Abi = (0,parseAbi/* parseAbi */.V)([
    "function getCurrentBlockTimestamp() external view returns (uint256 timestamp)",
    "function getEthBalance(address addr) external view returns (uint256 balance)"
])
const wethAbi = (0,parseAbi/* parseAbi */.V)([
    "function deposit() external payable",
    "function withdraw(uint256 wad) external"
])
const bankAbi = BankDiamond_namespaceObject.Mt

const $ = document.querySelector.bind(document);
const BLN = BigInt(10) ** BigInt(9)
const WAD = BigInt(10) ** BigInt(18)
const RAY = BigInt(10) ** BigInt(27)
const BANKYEAR = ((365 * 24) + 6) * 3600
const MAXUINT  = BigInt(2)**BigInt(256) - BigInt(1);
const FREE = MAXUINT  // -1
const LOCK = BigInt(1)
const X96 = BigInt(2) ** BigInt(96)
const ERR_ACCT = '0x' + '1'.repeat(40);
const MIN_ETH = BigInt(10) ** BigInt(16)
const chain = arbitrum/* arbitrum */.y
// Uni Position() return value indices
const t0 = 2
const t1 = 3
const id = 12
const x32 = (s) => (0,toHex/* stringToHex */.$G)(s, {size: 32})
const tokenData = {
    arb:    {decimals: 18, address: arbAddr,    display: "ARB",    ilk: x32("arb")},
    dai:    {decimals: 18, address: daiAddr,    display: "DAI",    ilk: x32("dai")},
    link:   {decimals: 18, address: linkAddr,   display: "LINK",   ilk: x32("link")},
    reth:   {decimals: 18, address: rethAddr,   display: "rETH",   ilk: x32("reth")},
    usdc:   {decimals: 6,  address: usdcAddr,   display: "USDC",   ilk: x32("usdc")},
    usdc_e: {decimals: 6,  address: usdc_eAddr, display: "USDC.e", ilk: x32("usdc.e")},
    wbtc:   {decimals: 8,  address: wbtcAddr,   display: "WBTC",   ilk: x32("wbtc")},
    weth:   {decimals: 18, address: wethAddr,   display: "WETH",   ilk: x32("weth")},
    wsteth: {decimals: 18, address: wstethAddr, display: "wstETH", ilk: x32("wsteth")},
}

let account, transport, publicClient, walletClient
let bank, feed, nfpm, wrap, weth
let store = {}

const borrowing =()=> $('input[name="sign"]:checked').value === "Borrow/deposit"
const uniMode =()=> $('input[name="ctype"]:checked').value == "UNIV3 LP NFTs"

const updateRicoStats = async () => {
    const ricoStats = $('#ricoStats');
    ricoStats.textContent = ' '
    const tip = await bank.read.tip()
    const [parRay, wayRay, feedData] = await Promise.all([
        bank.read.par(),
        bank.read.way(),
        feed.read.pull([tip.src, tip.tag])
    ]);
    const par = (0,formatUnits/* formatUnits */.b)(parRay, 27)
    const way = apy(wayRay)
    const mar = (0,formatUnits/* formatUnits */.b)(BigInt(feedData[0]), 27)
    ricoStats.textContent = `Par: ${round7(par)}, Price rate: ${way}%, Market: ${round7(mar)}`
}

const updateHook = async () => {
    main_reset()
    const frobBtn = $('#btnFrob')
    const showUni = uniMode()

    frobBtn.disabled = true
    document.getElementById("uniHook").style.display   = showUni ? "block" : "none";
    document.getElementById("uniFrobControls").style.display   = showUni ? "flex" : "none";

    document.getElementById("erc20Hook").style.display = showUni ? "none"  : "block";
    document.getElementById("erc20FrobControls").style.display = showUni ? "none"  : "flex";
    await (showUni ? updateUni() : updateERC20());
    updateSafetyFactor()
    frobBtn.disabled = account === ERR_ACCT
}

const updateUni = async () => {
    const NFTsContainer  = $('#nftContainer')
    NFTsContainer.innerHTML = '';
    updateDricoLabel($('#uniDricoLabelContainer'), $('#uniDrico'))

    const [numNFTs, ilk, ink, urn, par, timestamp, usrRico] = await Promise.all([
        nfpm.read.balanceOf([account]),
        bank.read.ilks([uniIlk]),
        bank.read.ink( [uniIlk, account]),
        bank.read.urns([uniIlk, account]),
        bank.read.par(),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getCurrentBlockTimestamp'
        }),
        publicClient.readContract({
            address: ricoAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
    ])
    const stretchedRack = grow(ilk.rack, ilk.fee, timestamp - ilk.rho)
    const fee  = apy(ilk.fee)
    const dust = (0,formatUnits/* formatUnits */.b)(ilk.dust, 45)
    const debt = (0,formatUnits/* formatUnits */.b)(urn * stretchedRack, 45)
    const ricoStr = formatBalance(usrRico)
    store.ink  = (0,decodeAbiParameters/* decodeAbiParameters */.r)([{ name: 'ink', type: 'uint[]' }], ink)[0]
    store.art  = urn
    store.rack = stretchedRack
    store.par  = par
    store.dust  = ilk.dust
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    const inkStr = store.ink.length === 0 ? 'none' : store.ink
    $('#uniIlkStats0').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico`
    $('#uniUrnStats').textContent = `Deposited NFTS: ${inkStr}, Rico debt: ${store.debtStr}, Rico: ${ricoStr}`

    let usrIDs = [];
    if (borrowing()) {
        $('#NFTList').textContent= `LP NFTs to deposit:`
        const idsProm = Array.from({ length: Number(numNFTs) }, (_, i) => nfpm.read.tokenOfOwnerByIndex([account, i]));
        usrIDs = await Promise.all(idsProm);
        await valueNFTs([...usrIDs, ...store.ink])
        displayNfts(usrIDs)
    } else {
        $('#NFTList').textContent = `LP NFT IDS to withdraw:`;
        await valueNFTs(store.ink)
        displayNfts(store.ink)
    }
}

// store the liqr adjusted rico value of all NFTs
const valueNFTs = async (nfts) => {
    const posiProms = nfts.map(async nft => {
        const positions = await nfpm.read.positions([nft]);
        return [...positions, nft];
    });
    let positions = await Promise.all(posiProms);
    const tokens  = new Set(positions.flatMap(pos => [pos[t0], pos[t1]]))

    // get src, tag and liqr for all tokens in one multicall trip
    const argProms = {}
    Array.from(tokens).forEach(tok => {
        argProms[tok] = [
            bank.read.geth([uniIlk, x32('src'),  [rpaddr(tok)]]),
            bank.read.geth([uniIlk, x32('tag'),  [rpaddr(tok)]]),
            bank.read.geth([uniIlk, x32('liqr'), [rpaddr(tok)]]),
        ];
    })
    const tokToArgs = {};
    for (const tok of Object.keys(argProms)) {
        const [src, tag, liqr] = await Promise.all(argProms[tok]);
        tokToArgs[tok] = { src: src.slice(0, 42), tag, liqr };
    }

    const feedProms = Array.from(tokens).map(async tok => {
        const { src, tag } = tokToArgs[tok]
        let val = x32('')
        if (src !== x20('')) [val] = await feed.read.pull([src, tag])
        return [tok, (0,fromHex/* hexToBigInt */.y_)(val, { size: 32 })]
    })
    const prices = await Promise.all(feedProms)
    const gemToPrice = Object.fromEntries(prices)

    // filter positions containing token without feed
    positions = positions.filter(pos =>
        tokToArgs[pos[t0]].src !== x20('') && tokToArgs[pos[t1]].src !== x20('')
    );

    const valProms = positions.map(async pos => {
        const sqrtPriceX96 = sqrt(gemToPrice[pos[t1]] * X96 * X96 / gemToPrice[pos[t0]])
        const [amt0, amt1] = await wrap.read.total([nfpmAddr, pos[id], sqrtPriceX96])
        const liqr = maxBigInt(BigInt(tokToArgs[pos[t0]].liqr), BigInt(tokToArgs[pos[t1]].liqr))
        return [pos[id], (amt0 * gemToPrice[pos[t0]] + amt1 * gemToPrice[pos[t1]]) / liqr]
    })
    const valsArr = await Promise.all(valProms)
    store.idToVal = Object.fromEntries(valsArr)
}

// todo this displays checkboxes for each uni nft with token IDs for labels
// ~"symbol/symbol [min price, max price]" could be better. Or people can find id in uni app
function displayNfts(nftIds) {
    const container = document.getElementById('nftContainer');

    // only display positions where both tokens have feeds
    nftIds = nftIds.filter(id => store.idToVal[id] !== undefined)
    nftIds = nftIds.filter(id => store.idToVal[id] > 0n)
    if (nftIds.length == 0) {
        container.textContent = 'none'
        return
    }

    nftIds.forEach(id => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `nft-${id}`;
        checkbox.value = id;

        const label = document.createElement('label');
        label.htmlFor = `nft-${id}`;
        label.textContent = `${id}`;

        const div = document.createElement('div');
        div.style.marginRight = '10px'
        div.appendChild(checkbox);
        div.appendChild(label);

        container.appendChild(div);
    });

    document.querySelectorAll('#nftContainer input[type="checkbox"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateSafetyFactor();
        });
    });
}

function getSelectedNfts() {
    const checkboxes = document.querySelectorAll('#nftContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => BigInt(checkbox.value));
}

const updateERC20 = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const ilkHex = tokenData[ilkStr].ilk
    const gemName = tokenData[ilkStr].display
    updateDricoLabel($('#dricoLabelContainer'), $('#drico'))
    updateDinkLabel(ilkStr, gemName)

    const [srcB32, tag] = await Promise.all([
        bank.read.geth([ilkHex, x32('src'), []]),
        bank.read.geth([ilkHex, x32('tag'), []]),
    ])
    const src = srcB32.slice(0, 42)

    const [ilk, urn, ink, par, liqr, usrGemAllowance, usrGemBal, feedData, timestamp, ethBal, usrRico] = await Promise.all([
        bank.read.ilks([ilkHex]),
        bank.read.urns([ilkHex, account]),
        bank.read.ink( [ilkHex, account]),
        bank.read.par(),
        bank.read.geth([ilkHex, (0,toHex/* stringToHex */.$G)('liqr', {size: 32}), []]),
        publicClient.readContract({
            address: tokenData[ilkStr].address,
            abi: gemAbi,
            functionName: 'allowance',
            args: [account, bankAddr]
        }),
        publicClient.readContract({
            address: tokenData[ilkStr].address,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
        feed.read.pull([src, tag]),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getCurrentBlockTimestamp'
        }),
        publicClient.readContract({
            address: chain.contracts.multicall3.address,
            abi: multicall3Abi,
            functionName: 'getEthBalance',
            args: [account]
        }),
        publicClient.readContract({
            address: ricoAddr,
            abi: gemAbi,
            functionName: 'balanceOf',
            args: [account]
        }),
    ])

    const stretchedRack = grow(ilk.rack, ilk.fee, timestamp - ilk.rho)
    const fee  = apy(ilk.fee)
    const dust = (0,formatUnits/* formatUnits */.b)(ilk.dust, 45)
    const debt = (0,formatUnits/* formatUnits */.b)(urn * stretchedRack, 45)
    const inkStr = (0,formatUnits/* formatUnits */.b)(BigInt(ink), tokenData[ilkStr].decimals)
    const ltv  = Number(BLN) / Number(BigInt(liqr) / WAD)
    const ricoStr = formatBalance(usrRico)
    const unwrapped = (ilkStr === 'weth') ? maxBigInt(ethBal - MIN_ETH, 0n) : 0n
    store.ink  = BigInt(ink)
    store.art  = urn
    store.par  = par
    store.rack = stretchedRack
    store.dust = ilk.dust
    store.liqr = BigInt(liqr)
    store.feed = BigInt(feedData[0])
    store.usrGemAllowance = usrGemAllowance
    store.usrGemBal = usrGemBal
    store.unwrapped = unwrapped
    store.debtStr = parseFloat(debt).toFixed(3)
    store.usrRico = usrRico
    $('#ilkStats0').textContent = `Quantity rate: ${fee}%, Min debt: ${round(dust)} Rico, LTV: ${round(ltv * 100)}%`
    $('#urnStats').textContent = `Deposited ${gemName}: ${parseFloat(inkStr).toFixed(3)}, Rico debt: ${store.debtStr}, Rico: ${ricoStr}`
}

const updateDricoLabel = (container, input) => {
    if (borrowing()) {
        container.textContent = 'Borrow Rico:'
    } else {
        container.innerHTML = `Repay Rico(<input type="checkbox" id="dricoAllCheckbox" title="Wipe all debt">all):`
        $('#dricoAllCheckbox').addEventListener('change', (event) => {
            store.repayAll = input.disabled = event.target.checked
            if(store.repayAll) input.value = store.debtStr
            updateSafetyFactor();
        })
    }
}

const updateDinkLabel = (ilkStr, gemName) => {
    let container = $('#dinkLabelContainer')
    let input = $('#dink')
    let verb = borrowing() ? "Deposit" : "Withdraw"

    container.innerHTML = `${verb} ${gemName}(<input type="checkbox" id="dinkAllCheckbox">all):`

    $('#dinkAllCheckbox').addEventListener('change', event => {
        store.allInk = input.disabled = event.target.checked
        let inkValue = borrowing() ? store.usrGemBal + store.unwrapped : store.ink
        let inkLongText = (0,formatUnits/* formatUnits */.b)(inkValue, tokenData[ilkStr].decimals)
        if(store.allInk) input.value = parseFloat(inkLongText).toFixed(3)
        updateSafetyFactor()
    })
}

const updateSafetyFactor =()=> {
    let factor = ''
    let loan, value
    if (uniMode()) {
        let art = store.art + readDart()
        loan = art * store.rack / RAY * store.par / RAY

        const inkVal  = store.ink.reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        const dinkVal = getSelectedNfts().reduce((acc, id) => acc + (store.idToVal[id]), BigInt(0));
        value = inkVal + (borrowing() ? dinkVal : -dinkVal)
    } else {
        let art = store.art + readDart()
        loan = art * store.rack * store.par / RAY  / RAY

        const ilk = $('input[name="ilk"]:checked').value
        const sign = borrowing() ? "" : "-"
        let ink = store.ink + (0,parseUnits/* parseUnits */.v)(sign + $('#dink').value, tokenData[ilk].decimals)
        value = ink * store.feed / store.liqr
    }

    if (loan === 0n) {
        factor = '∞'
        store.safetyNumber = Number.MAX_VALUE
    } else {
        // get Number ratio from BN WADs which may be > maximum Number
        store.safetyNumber = Number(BLN * value / loan) / Number(BLN)
        factor = round(store.safetyNumber)
    }

    $('#safetyFactor').textContent = `New safety factor: ${factor}`
}

const main_reset =()=> {
    store = {}
    $('#dinkLabelContainer').innerHTML = $('#dricoLabelContainer').innerHTML = $('#uniDricoLabelContainer').innerHTML = ':'
    $('#dink').disabled = $('#drico').disabled = $('#uniDrico').disabled = false
    $('#dink').value = $('#drico').value = $('#uniDrico').value = 0
    $('#btnFrob').value = $('input[name="sign"]:checked').value
    $('#safetyFactor').textContent = `New safety factor: …`
    $('#frobError').style.display = "none"
}

const readDart =()=> {
    const input = uniMode() ? $('#uniDrico') : $('#drico')
    let dart
    if (store.repayAll && !borrowing())
        dart = -store.art
    else {
        const sign = borrowing() ? "" : "-"
        const drico = (0,parseUnits/* parseUnits */.v)(sign + input.value, 18)
        dart = drico * RAY / store.rack
    }
    return dart
}

const displayFrobSimRevert =(err)=> {
    if (err?.cause instanceof rpc/* UserRejectedRequestError */.ab) return

    const errElement = $('#frobError')
    const dart = readDart()
    const resultDebt = (store.art + dart) * store.rack
    let reason = "Transaction simulation reverted."

    if (resultDebt > 0n && resultDebt < store.dust) reason += " Resulting debt < minimum."
    if (resultDebt < 0n) reason += " Excess wipe, use repay all checkbox"
    if (store.safetyNumber >= 0 && store.safetyNumber < 1.0) reason += " Safety factor must be > 1.0."
    if (store.usrRico < (-dart * store.rack / RAY)) reason += " Insufficient Rico balance."
    if (!uniMode() && store.dink > store.usrGemBal) reason += " Insufficient collateral balance."
    if (!uniMode() && store.dink > store.usrGemAllowance) reason += " Insufficient collateral allowance."
    // This could be extended with time outs, debt ceilings, using error sigs/names etc

    errElement.textContent = reason
    errElement.style.display = "block"
}

const frobUni = async () => {
    let dink = "0x"
    const dart = readDart()
    const nfts = getSelectedNfts()
    if (nfts.length > 0) {
        const dir = borrowing() ? LOCK : FREE
        if (dir === LOCK && !await nfpm.read.isApprovedForAll([account, bankAddr])) {
            const hash = await nfpm.write.setApprovalForAll([bankAddr, true])
            await publicClient.waitForTransactionReceipt({hash})
        }
        dink = (0,encodeAbiParameters/* encodeAbiParameters */.E)([{ name: 'dink', type: 'uint[]' }], [[dir].concat(nfts)]);
    }

    try {
        const { request } = await bank.simulate.frob({account: account, args: [uniIlk, account, dink, dart]})
        const hash = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({hash})
        await Promise.all([updateRicoStats(), updateHook()])
    } catch (err) {
        displayFrobSimRevert(err)
    }
}

const frobERC20 = async () => {
    const ilkStr = $('input[name="ilk"]:checked').value
    const dart = readDart()
    let dink
    if(store.allInk) {
        dink = borrowing() ? store.usrGemBal + store.unwrapped : -store.ink
    } else {
        const sign = borrowing() ? "" : "-"
        dink = (0,parseUnits/* parseUnits */.v)(sign + $('#dink').value, tokenData[ilkStr].decimals);
    }
    store.dink = dink
    if (dink > store.usrGemAllowance) {
        const hash = await walletClient.writeContract({
            abi: gemAbi,
            address: tokenData[ilkStr].address,
            functionName: 'approve',
            args: [bankAddr, MAXUINT],
        })
        await publicClient.waitForTransactionReceipt({hash})
        store.usrGemAllowance = MAXUINT
    }
    if (dink > store.usrGemBal && dink <= (store.usrGemBal + store.unwrapped)) {
        const hash = await weth.write.deposit([], {value: dink - store.usrGemBal})
        await publicClient.waitForTransactionReceipt({hash})
    }
    const unwrap = -dink
    if (dink < 0) dink += (BigInt(2)**BigInt(256))
    const dinkB32 = (0,pad/* pad */.vk)((0,toHex/* toHex */.NC)(dink))

    try {
        const { request } = await bank.simulate.frob({account: account, args: [tokenData[ilkStr].ilk, account, dinkB32, dart]})
        const hash = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({hash})
        await Promise.all([updateRicoStats(), updateHook()])
    } catch (err) {
        displayFrobSimRevert(err)
    }

    if (unwrap > 0 && ilkStr === 'weth') await weth.write.withdraw([unwrap])
}

// attempt to connect to injected window.ethereum. No connect button, direct wallet connect support, or dependency
const simpleConnect = async () => {
    let _account, _transport
    try {
        if (!window.ethereum) throw new Error("Ethereum wallet is not detected.");
        [_account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        _transport = (0,custom/* custom */.P)(window.ethereum)
    } catch (error) {
        _account = ERR_ACCT
        _transport = (0,http/* http */.d)()
        $('#btnFrob').disabled = true
        $('#connectionError').style.display = "block"
    }
    return [_account, _transport]
}

window.onload = async() => {
    [account, transport] = await simpleConnect();
    walletClient = (0,createWalletClient/* createWalletClient */.K)({
      account,
      chain: chain,
      transport: transport
    })
    publicClient = (0,createPublicClient/* createPublicClient */.v)({
      batch: {
        multicall: true,
      },
      chain: chain,
      transport: (0,http/* http */.d)(),  // todo should replace with a dedicated RPC URL to prevent rate-limiting
    })
    const _client = {public: publicClient, wallet: walletClient}
    bank = (0,getContract/* getContract */.uN)({
      address: bankAddr,
      abi: bankAbi,
      client: _client
    })
    feed = (0,getContract/* getContract */.uN)({
      address: feedAddr,
      abi: feedAbi,
      client: _client
    })
    nfpm = (0,getContract/* getContract */.uN)({
      address: nfpmAddr,
      abi: nfpmAbi,
      client: _client
    })
    weth = (0,getContract/* getContract */.uN)({
      address: wethAddr,
      abi: wethAbi,
      client: _client
    })
    wrap = (0,getContract/* getContract */.uN)({
      address: wrapAddr,
      abi: wrapAbi,
      client: _client
    })

    $('#btnFrob').addEventListener('click', async () => {
        $('#frobError').style.display = "none"
        if (uniMode()) {
            await frobUni()
        } else {
            await frobERC20()
        }
    });

    document.querySelectorAll('input[name="ctype"], input[name="sign"], input[name="ilk"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateHook();
        });
    });

    document.querySelectorAll('input[name="dink"], input[name="drico"], input[name="uniDrico"]').forEach((elem) => {
        elem.addEventListener("change", async () => {
            await updateSafetyFactor();
        });
    });

    if(account !== ERR_ACCT) await walletClient.switchChain({ id: chain.id })
    await Promise.all([updateRicoStats(), updateHook()])
}

/* Pure helpers */

const formatBalance = (usrRico) => {
    // round down in case someone copies to repay
    const decimals = 4
    const truncate = BigInt(10) ** BigInt(18 - decimals) / 2n
    const bal = usrRico > truncate ? usrRico - truncate : usrRico
    return parseFloat((0,formatUnits/* formatUnits */.b)(bal, 18)).toFixed(decimals)
}

const maxBigInt = (a, b) => a > b ? a : b

const apy =r=> round(((Number(r) / 10**27) ** BANKYEAR - 1) * 100)

const round =f=> parseFloat(f).toPrecision(4)
const round7 =f=> parseFloat(f).toPrecision(7)

const x20 = (s) => (0,toHex/* stringToHex */.$G)(s, {size: 20})

const rpaddr = (a) => a + '00'.repeat(12)

const grow = (amt, ray, dt) => {
    for (let i = 0; i < dt; i++) {
        amt = amt * ray / RAY
    }
    return amt
}

// https://stackoverflow.com/questions/53683995/javascript-big-integer-square-root
function sqrt(value) {
    if (value < 0n) {
        throw 'square root of negative numbers is not supported'
    }

    if (value < 2n) {
        return value;
    }

    function newtonIteration(n, x0) {
        const x1 = ((n / x0) + x0) >> 1n;
        if (x0 === x1 || x0 === (x1 - 1n)) {
            return x0;
        }
        return newtonIteration(n, x1);
    }

    return newtonIteration(value, 1n);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		// The chunk loading function for additional chunks
/******/ 		// Since all referenced chunks are already included
/******/ 		// in this file, this function is empty here.
/******/ 		__webpack_require__.e = () => (Promise.resolve());
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			179: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkricoview"] = self["webpackChunkricoview"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [697], () => (__webpack_require__(7292)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;