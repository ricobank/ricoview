// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;

import { OwnableInternal, OwnableStorage } from '../lib/solidstate-solidity/contracts/access/OwnableInternal.sol';
import { Math } from './mixin/math.sol';
import { Flog } from './mixin/flog.sol';
import { Palm } from './mixin/palm.sol';
import { Gem }  from '../lib/gemfab/src/gem.sol';
import { Feedbase } from '../lib/feedbase/src/Feedbase.sol';

abstract contract Bank is Math, Flog, Palm, OwnableInternal {

    // per-collateral type accounting
    struct Ilk {
        uint256 tart;  // [wad] Total Normalised Debt
        uint256 rack;  // [ray] Accumulated Rate

        uint256 line;  // [rad] Debt Ceiling
        uint256 dust;  // [rad] Urn Debt Floor

        uint256  fee;  // [ray] Collateral-specific, per-second compounding rate
        uint256  rho;  // [sec] Time of last drip

        uint256 chop;  // [ray] Liquidation Penalty

        address hook;  // [obj] Frob/grab/safe hook
    }

    struct BankStorage {
        Gem      rico;
        Feedbase fb;
    }

    struct VatStorage {
        mapping (bytes32 => Ilk) ilks;                          // collaterals
        mapping (bytes32 => mapping (address => uint256)) urns; // CDPs
        uint joy;   // [wad]
        uint sin;   // [rad]
        uint rest;  // [rad] Remainder from
        uint debt;  // [wad] Total Rico Issued
        uint ceil;  // [wad] Total Debt Ceiling
        uint par;   // [ray] System Price (rico/ref)
        uint lock;  // lock
        uint flock; // flash lock
    }

    uint constant UNLOCKED = 2;
    uint constant LOCKED = 1;

    // RISK mint rate. Used in struct, never extend in upgrade
    // flop uses min(vel rate, rel rate)
    struct Ramp {
        uint rel; // [wad] fraction of RISK supply/s
        uint bel; // [sec] last flop timestamp
        uint cel; // [sec] max seconds flop can ramp up
        uint wel; // [wad] fraction of joy/flap
    }

    struct Plx {
        uint pep; // [ray] rush gradient
        uint pop; // [ray] rush offset
    }

    struct Rudd {
        address src;
        bytes32 tag;
    }

    struct VowStorage {
        Gem     RISK;
        Ramp    ramp;
        uint256 toll;
        Plx     plat; // flap plot
        Plx     plot; // flop plot
        Rudd    rudd; // risk:rico feed
    }

    struct VoxStorage {
        Rudd    tip; // feedbase src,tag
        uint256 way; // [ray] System Rate (SP growth rate)
        uint256 how; // [ray] sensitivity paramater
        uint256 tau; // [sec] last poke
        uint256 cap; // [ray] `way` bound
    }

    bytes32 constant VAT_INFO = 'vat.0';
    bytes32 constant VAT_POS  = keccak256(abi.encodePacked(VAT_INFO));
    bytes32 constant VOW_INFO = 'vow.0';
    bytes32 constant VOW_POS  = keccak256(abi.encodePacked(VOW_INFO));
    bytes32 constant VOX_INFO = 'vox.0';
    bytes32 constant VOX_POS  = keccak256(abi.encodePacked(VOX_INFO));
    bytes32 constant BANK_INFO = 'ricobank.0';
    bytes32 constant BANK_POS  = keccak256(abi.encodePacked(BANK_INFO));
    function getVowStorage() internal pure returns (VowStorage storage vs) {
        bytes32 pos = VOW_POS;  assembly { vs.slot := pos }
    }
    function getVoxStorage() internal pure returns (VoxStorage storage vs) {
        bytes32 pos = VOX_POS;  assembly { vs.slot := pos }
    }
    function getVatStorage() internal pure returns (VatStorage storage vs) {
        bytes32 pos = VAT_POS;  assembly { vs.slot := pos }
    }
    function getBankStorage() internal pure returns (BankStorage storage bs) {
        bytes32 pos = BANK_POS; assembly { bs.slot := pos }
    }

    error ErrWrongKey();
    error ErrWrongUrn();

    // bubble up error code from a reverted call
    function bubble(bytes memory data) internal pure {
        assembly {
            let size := mload(data)
            revert(add(32, data), size)
        }
    }

    function owner() internal view returns (address) {
        return OwnableStorage.layout().owner;
    }

}
