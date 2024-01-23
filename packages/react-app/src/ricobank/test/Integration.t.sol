// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

import { Ball } from '../src/ball.sol';
import { Flasher } from "./Flasher.sol";
import { RicoSetUp, Guy } from "./RicoHelper.sol";
import { Gem } from '../lib/gemfab/src/gem.sol';
import { Vat }  from '../src/vat.sol';
import { Vow }  from '../src/vow.sol';
import { Hook } from '../src/hook/hook.sol';
import '../src/mixin/math.sol';
import {File} from '../src/file.sol';
import {BankDiamond} from '../src/diamond.sol';
import {Bank} from '../src/bank.sol';

contract IntegrationTest is Test, RicoSetUp {
    bytes32[] ilks;

    function setUp() public {
        make_bank();
        init_gold();
        ilks.push(gilk);
        risk.mint(self, 10_000 * WAD);
    }
    
    function test_joy_accounting() public {
        Vat(bank).frob(gilk, self, abi.encodePacked(10 * WAD), int(5 * WAD));
        skip(100);
        Vat(bank).drip(gilk);
        check_integrity();

        // flap, interest has caused surplus
        Vow(bank).keep(ilks);
        check_integrity();

        rico_mint(6 * WAD, false);
        feedpush(grtag, bytes32(RAY / 4), type(uint).max);
        Vat(bank).bail(gilk, self);
        check_integrity();

        // flop, system is in debt
        Vow(bank).keep(ilks);
        check_integrity();
    }

    function test_bail_joy_direction() public _check_integrity_after_ {
        Vat(bank).frob(gilk, self, abi.encodePacked(10 * WAD), int(5 * WAD));
        rico_mint(6 * WAD, false);
        feedpush(grtag, bytes32(RAY / 4), type(uint).max);
        uint sup0 = rico.totalSupply();
        uint joy0 = Vat(bank).joy();
        Vat(bank).bail(gilk, self);
        uint sup1 = rico.totalSupply();
        uint joy1 = Vat(bank).joy();
        assertGt(joy1, joy0);
        assertLt(sup1, sup0);
    }

    function test_flap_joy_direction() public _check_integrity_after_ {
        Vat(bank).frob(gilk, self, abi.encodePacked(10 * WAD), int(5 * WAD));
        skip(100);
        Vat(bank).drip(gilk);
        risk.mint(self, 10_000 * WAD);

        uint rico_sup0 = rico.totalSupply();
        uint risk_sup0 = risk.totalSupply();
        uint joy0 = Vat(bank).joy();
        Vow(bank).keep(ilks);
        uint rico_sup1 = rico.totalSupply();
        uint risk_sup1 = risk.totalSupply();
        uint joy1 = Vat(bank).joy();
        assertLt(joy1, joy0);
        assertLt(risk_sup1, risk_sup0);
        assertGt(rico_sup1, rico_sup0);
    }

    function test_flop_joy_direction() public _check_integrity_after_ {
        risk.mint(self, 10_000 * WAD);
        skip(100);
        rico_mint(10 * WAD, true);

        uint rico_sup0 = rico.totalSupply();
        uint risk_sup0 = risk.totalSupply();
        uint joy0 = Vat(bank).joy();
        Vow(bank).keep(ilks);
        uint rico_sup1 = rico.totalSupply();
        uint risk_sup1 = risk.totalSupply();
        uint joy1 = Vat(bank).joy();
        assertGt(joy1, joy0);
        assertGt(risk_sup1, risk_sup0);
        assertLt(rico_sup1, rico_sup0);
    }
}
