// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

import { Gem } from '../lib/gemfab/src/gem.sol';
import { Ward } from '../lib/feedbase/src/mixin/ward.sol';
import { Ball } from '../src/ball.sol';
import { Vat } from '../src/vat.sol';
import { Vow } from '../src/vow.sol';
import { RicoSetUp, WethLike, Guy } from "./RicoHelper.sol";
import { Asset, PoolArgs } from "./UniHelper.sol";
import { Math } from '../src/mixin/math.sol';
import { Hook } from '../src/hook/hook.sol';
import { ERC20Hook } from '../src/hook/ERC20hook.sol';
import {File} from '../src/file.sol';
import {Bank} from '../src/bank.sol';

// integrated vow/flow tests
contract VowTest is Test, RicoSetUp {
    uint256 public init_join = 1000;
    uint stack = WAD * 10;
    bytes32[] ilks;
    address rico_risk_pool;
    uint back_count;

    function setUp() public {
        make_bank();
        init_gold();
        ilks.push(gilk);

        File(bank).file('rel', bytes32(uint(1e12)));
        File(bank).file('bel', bytes32(uint(0)));
        File(bank).file('cel', bytes32(uint(600)));

        // have 10k each of rico, risk and gold
        gold.approve(router, type(uint256).max);
        rico.approve(router, type(uint256).max);
        risk.approve(router, type(uint256).max);
        gold.approve(bank, type(uint256).max);

        rico_risk_pool = getPoolAddr(arico, arisk, 3000);
        rico_mint(2000 * WAD, true);
        risk.mint(self, 100000 * WAD);
        PoolArgs memory rico_risk_args = getArgs(arico, 1000 * WAD, arisk, 1000 * WAD, 3000, x96(1));
        join_pool(rico_risk_args);

        PoolArgs memory gold_rico_args = getArgs(agold, 1000 * WAD, arico, 1000 * WAD, 3000, x96(1));
        create_and_join_pool(gold_rico_args);

        guy = new Guy(bank);
    }

    function test_flap_price() public {
        uint borrow = WAD;
        uint rico_price_in_risk = 10;
        feedpush(grtag, bytes32(1000 * RAY), type(uint).max);
        feedpush(RISK_RICO_TAG, bytes32(rinv(rico_price_in_risk * RAY)), type(uint).max);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(borrow));
        skip(BANKYEAR);
        Vat(bank).drip(gilk);

        uint surplus = Vat(bank).joy();
        uint rack = Vat(bank).ilks(gilk).rack;
        assertClose(surplus, rmul(rack, borrow) - borrow, 1_000_000_000);

        // cancel out any sin so only joy needs to be considered
        uint sin_wad = Vat(bank).sin() / RAY;
        force_fees(sin_wad);

        uint pep = 2;
        uint pop = RAY * 99 / 100;
        // set pep to * 1000 growth rate
        File(bank).file('plat.pep', bytes32(pep));
        // set pop to increase initial price by 1%
        File(bank).file('plat.pop', bytes32(pop));

        uint debt = Vat(bank).debt() - sin_wad;
        uint deal = rdiv(debt, debt + surplus);
        uint mash = rmul(pop, rpow(deal, pep));
        // 0.99 * (2001.05 / (0.05 + 2001.05)) ^ 2 ~= 0.9899505278281044
        assertClose(mash, RAY * 989_950_527 / 1_000_000_000, 100_000);

        uint expected_risk_cost = rmul(surplus * rico_price_in_risk, mash);

        risk.mint(self, WAD * 1_000);
        uint self_rico_1 = rico.balanceOf(self);
        uint self_risk_1 = risk.balanceOf(self);

        Vow(bank).keep(empty);

        uint rico_gain = rico.balanceOf(self) - self_rico_1;
        uint risk_cost = self_risk_1 - risk.balanceOf(self);

        assertClose(expected_risk_cost, risk_cost, 10_000);
        assertEq(rico_gain, surplus);
    }

    function test_flop_price() public {
        uint borrow = WAD * 10000;
        uint risk_price_in_rico = 10 * RAY;
        feedpush(grtag, bytes32(10000 * RAY), type(uint).max);
        feedpush(RISK_RICO_TAG, bytes32(risk_price_in_rico), type(uint).max);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(borrow));

        // set pep to *1000 rate discount increases
        uint pep = 4;
        uint pop = RAY * 101 / 100;
        File(bank).file('plot.pep', bytes32(pep));
        // set pop so initial flop discount is about 1%
        File(bank).file('plot.pop', bytes32(pop));

        uint debt = Vat(bank).debt();
        uint sin  = Vat(bank).sin() / RAY;
        uint joy  = Vat(bank).joy();

        uint flop = sin - joy;
        uint deal = rdiv(debt, debt + flop);
        uint mash = rmul(pop, rpow(deal, pep));
        uint expected_rico_per_risk = rmul(risk_price_in_rico, mash);

        uint self_rico_1 = rico.balanceOf(self);
        uint self_risk_1 = risk.balanceOf(self);

        Vow(bank).keep(ilks);

        uint rico_cost = self_rico_1 - rico.balanceOf(self);
        uint risk_gain = risk.balanceOf(self) - self_risk_1;

        assertClose(rdiv(rico_cost, risk_gain), expected_rico_per_risk, 1000000000);
    }

    function test_bail_price() public {
        // frob to edge of safety
        uint borrow = WAD * 1000;
        feedpush(grtag, bytes32(1000 * RAY), type(uint).max);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(borrow));

        // drop gold/rico to 75%
        feedpush(grtag, bytes32(750 * RAY), type(uint).max);
        // price should be 0.75**3, 0.75 for oracle drop and 0.75**2 for deal**pep
        uint expected = wmul(borrow, WAD * 75**3 / 100**3);
        rico_mint(expected, false);
        rico.transfer(address(guy), expected);
        bytes memory data = guy.bail(gilk, self);

        uint earn = uint(bytes32(data));

        // check returned bytes represent quantity of tokens received
        assertEq(earn, WAD);

        // guy was given exact amount, check all was spent for all gold deposit
        assertEq(rico.balanceOf(address(guy)), uint(0));
        assertEq(gold.balanceOf(address(guy)), WAD);
    }

    function test_bail_refund() public {
        // set c ratio to double
        uint pop = RAY * 3 / 2;
        uint dink = WAD;
        Vat(bank).filh(gilk, "liqr", empty, bytes32(RAY * 2));
        Vat(bank).filh(gilk, "pep", empty, bytes32(uint(2)));
        Vat(bank).filh(gilk, "pop", empty, bytes32(pop));
        uint borrow = WAD * 500;
        feedpush(grtag, bytes32(1000 * RAY), type(uint).max);
        // frob to edge of safety
        Vat(bank).frob(gilk, self, abi.encodePacked(dink), int(borrow));

        // drop gold/rico to 75%
        feedpush(grtag, bytes32(750 * RAY), type(uint).max);
        // position is still overcollateralized, should get a refund and guy should only pay borrowed rico
        rico_mint(borrow, false);
        rico.transfer(address(guy), borrow);
        // price should be 0.75**2, as 0.75 for oracle drop and 0.75 for deal factor
        guy.bail(gilk, self);

        // guy should not get all gold, should be ink * (amount borrowed / expected price for full collateral and deal)
        // price should be 0.75**3, as 0.75 for oracle drop and 0.75**2 for deal**pep factor
        uint expected_full = rmul(wmul(borrow * 2, dink * 75**3 / 100**3), pop);
        uint guy_earn = wmul(dink, wdiv(borrow, expected_full));
        assertEq(gold.balanceOf(address(guy)), guy_earn);

        // as self urn was overcollateralized not all ink should have been taken, check correct amount still there
        uint ink_left = _ink(gilk, self);
        assertEq(ink_left, WAD - guy_earn);
        assertGt(ink_left, 0);
    }

    function test_keep_deficit_gas() public {
        feedpush(grtag, bytes32(1000 * RAY), block.timestamp + 1000);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(WAD));
        feedpush(grtag, bytes32(RAY * 0), block.timestamp + 1000);
        Vat(bank).bail(gilk, self);

        bytes32[] memory gilks = new bytes32[](2);
        gilks[0] = gilk;
        gilks[1] = gilk;
        rico_mint(100 * WAD, false);
        uint gas = gasleft();
        Vow(bank).keep(gilks);
        check_gas(gas, 139036);
    }

    function test_keep_surplus_gas() public {
        Vat(bank).filk(gilk, 'fee', bytes32(2 * RAY));
        feedpush(grtag, bytes32(10000 * RAY), block.timestamp + 1000);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(3000 * WAD));
        skip(1);

        bytes32[] memory gilks = new bytes32[](2);
        gilks[0] = gilk;
        gilks[1] = gilk;
        uint gas = gasleft();
        Vow(bank).keep(gilks);
        check_gas(gas, 133640);
    }

    function test_bail_gas() public {
        feedpush(grtag, bytes32(1000 * RAY), block.timestamp + 1000);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(WAD));
        feedpush(grtag, bytes32(0), block.timestamp + 1000);
        uint gas = gasleft();
        Vat(bank).bail(gilk, self);
        check_gas(gas, 46744);
    }

    // goldusd, par, and liqr all = 1 after setup
    function test_risk_ramp_is_used() public {
        // art == 10 * ink
        feedpush(grtag, bytes32(RAY * 1000), block.timestamp + 1000);
        Vat(bank).frob(gilk, address(this), abi.encodePacked(1000 * WAD), int(10000 * WAD));
 
        // set rate of risk sales to near zero
        // set mint ramp higher to use risk ramp
        uint supply = risk.totalSupply();
        File(bank).file('rel', bytes32(wdiv(WAD, supply)));
        File(bank).file('bel', bytes32(block.timestamp - 1));
        File(bank).file('cel', bytes32(uint(1)));

        // setup frobbed to edge, dropping gold price puts system way underwater
        feedpush(grtag, bytes32(RAY), block.timestamp + 10000);

        // create the sin and kick off risk sale
        vm.expectCall(bank, abi.encodePacked(Vat.bail.selector));
        Vat(bank).bail(gilk, self);
        feedpush(RISK_RICO_TAG, bytes32(10000 * RAY), block.timestamp + 1000);
        Vow(bank).keep(ilks);
        assertEq(risk.totalSupply(), supply + WAD);

        rico_mint(10000 * WAD, true);
        rico.transfer(address(guy), 10000 * WAD);

        rico_mint(10000 * WAD, true);
        rico.transfer(address(guy), 10000 * WAD);
        uint vowrisk = risk.balanceOf(bank);

        // vow flow.flow'd for max possible - should receive nothing back
        assertEq(risk.balanceOf(bank), vowrisk);
    }

    function test_drip() public {
        uint rho = Vat(bank).ilks(gilk).rho;
        assertEq(rho, block.timestamp);
        assertEq(rico.balanceOf(self), 0);

        Vat(bank).filk(gilk, 'fee', bytes32(2 * RAY));
        feedpush(grtag, bytes32(RAY * 1000), type(uint).max);
        Vat(bank).frob(gilk, address(this), abi.encodePacked(WAD), int(WAD));
        uint firstrico = rico.balanceOf(self);
        rico_mint(1, false); // vat burns 1 extra to round in system's favor
        Vat(bank).frob(gilk, address(this), abi.encodePacked(-int(WAD)), -int(WAD));

        skip(1);
        // can only mint a wad rico for a wad gold
        Vat(bank).frob(gilk, address(this), abi.encodePacked(WAD), int(WAD));
        assertEq(rico.balanceOf(self), firstrico);
        rico_mint(1, false);
        Vat(bank).frob(gilk, address(this), abi.encodePacked(-int(WAD)), -int(WAD));

        // until drip, then can mint more
        Vat(bank).drip(gilk);
        assertEq(rico.balanceOf(self), 0);
        Vat(bank).frob(gilk, address(this), abi.encodePacked(WAD), int(WAD));
        assertEq(rico.balanceOf(self), firstrico * 2);
    }

    function test_keep_balanced() public {
        Vat(bank).filk(gilk, 'fee', bytes32(2 * RAY));

        feedpush(grtag, bytes32(RAY * 1000), block.timestamp + 1000);
        uint amt = Vat(bank).sin() / RAY;
        Vat(bank).frob(gilk, address(this), abi.encodePacked(amt), int(amt));
        skip(1);

        feedpush(grtag, bytes32(0), block.timestamp + 10000);

        assertEq(Vat(bank).joy(), 0);
        Vow(bank).keep(ilks);
        assertEq(Vat(bank).joy(), Vat(bank).sin() / RAY);
    }

    function test_keep_unbalanced_slightly_more_rico() public {
        Vat(bank).filk(gilk, 'fee', bytes32(2 * RAY));

        feedpush(grtag, bytes32(RAY * 1000), block.timestamp + 1000);
        uint amt = Vat(bank).sin() / RAY + 1;
        Vat(bank).frob(gilk, address(this), abi.encodePacked(amt), int(amt));
        skip(1);

        feedpush(grtag, bytes32(0), block.timestamp + 10000);

        feedpush(RISK_RICO_TAG, bytes32(RAY / 1000), UINT256_MAX);
        assertEq(Vat(bank).joy(), 0);
        uint self_risk_1 = risk.balanceOf(self);
        Vow(bank).keep(ilks);
        uint self_risk_2 = risk.balanceOf(self);
        assertEq(Vat(bank).joy(), 1);
        assertGt(self_risk_1, self_risk_2);
    }

    function test_keep_unbalanced_slightly_more_sin() public {
        Vat(bank).filk(gilk, 'fee', bytes32(2 * RAY));

        feedpush(grtag, bytes32(RAY * 1000), block.timestamp + 1000);
        uint amt = Vat(bank).sin() / RAY - 1;
        Vat(bank).frob(gilk, address(this), abi.encodePacked(amt), int(amt));
        skip(1);

        feedpush(grtag, bytes32(0), block.timestamp + 10000);

        assertEq(Vat(bank).joy(), 0);
        uint flop = 1; // clipped to deficit
        feedpush(RISK_RICO_TAG, bytes32(RAY), block.timestamp + 1000);
        uint risk_ts1 = risk.totalSupply();
        Vow(bank).keep(ilks);
        uint risk_ts2 = risk.totalSupply();
        assertGt(Vat(bank).joy(), 1);
        assertEq(Vat(bank).sin(), 2 * RAY);
        assertEq(risk_ts2, risk_ts1 + flop);
    }

    function test_bail_hook() public {
        FrobHook hook = new FrobHook();
        Vat(bank).filk(gilk, 'hook', bytes32(uint(bytes32(bytes20(address(hook))))));
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(WAD));
        uint vowgoldbefore = gold.balanceOf(bank);

        ZeroHook zhook = new ZeroHook();
        Vat(bank).filk(gilk, 'hook', bytes32(uint(bytes32(bytes20(address(zhook))))));
        vm.expectCall(address(zhook), abi.encodePacked(zhook.bailhook.selector));
        Vat(bank).bail(gilk, self);
        assertEq(gold.balanceOf(bank), vowgoldbefore);
    }

    function test_flop_deal() public {
        // generate a flop, with nonnegligible joy and sin
        // vow should properly update cached joy and sin values after heal
        // so that deal is correct
        feedpush(grtag, bytes32(RAY * 1000), UINT256_MAX);
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(WAD * 1000));
        skip(BANKYEAR);
        Vat(bank).bail(gilk, self);

        // have a bunch of sin, now make some joy but less joy than sin
        Vat(bank).frob(gilk, self, abi.encodePacked(WAD), int(WAD * 800));
        skip(BANKYEAR * 10);
        Vat(bank).drip(gilk);

        uint sin = Vat(bank).sin() / RAY;
        // both nonnegligible, and sin > joy
        assertGt(sin, 100);
        assertGt(sin, Vat(bank).joy());
        uint joy = Vat(bank).joy();
        uint debt = Vat(bank).debt() - joy; // post heal debt
        uint under = sin - joy;
        // feed price, pep, and pop are all 1
        // -> deal should be debt / (under + debt)
        uint deal = rdiv(debt, under + debt);

        // keep
        uint earn = rico.balanceOf(self);
        uint sell = risk.balanceOf(self);
        Vow(bank).keep(empty);
        earn = earn - rico.balanceOf(self);
        sell = risk.balanceOf(self) - sell;

        // pop == 1, pep == 2 -> keeper should lose sell * deal ^ 2 risk
        assertClose(earn, rmul(sell, rpow(deal, 2)), 1000);
    }

    function test_toll() public {
        File(bank).file('toll', bytes32(RAY / 3));
        uint _dink = 10000 * WAD;
        gold.mint(address(guy), _dink);
        risk.mint(address(guy), 1000000 * WAD);
        feedpush(RISK_RICO_TAG, bytes32(RAY / 10), type(uint).max);

        vm.startPrank(address(guy));

        // frob some rico
        gold.approve(bank, UINT256_MAX);
        Vat(bank).frob(gilk, address(guy), abi.encodePacked(_dink), int(_dink));

        // wait a few years and keep
        skip(BANKYEAR * 10);
        uint guys  = rico.balanceOf(address(guy));
        uint selfs = rico.balanceOf(self);
        uint burned = risk.balanceOf(address(guy));

        for (uint i = 0; i < ilks.length; i++) Vat(bank).drip(ilks[i]);
        uint debt  = Vat(bank).debt() - Vat(bank).sin() / RAY;
        uint flap  = Vat(bank).joy() - Vat(bank).sin() / RAY;
        uint mash  = rpow(rinv(rdiv(debt + flap, debt)), 2); // pep == 2
        uint price = rmul(10 * RAY, mash);

        Vow(bank).keep(ilks);

        // owner and guy's portions of the flap
        guys  = rico.balanceOf(address(guy)) - guys;
        selfs = rico.balanceOf(self) - selfs;
        burned = burned - risk.balanceOf(address(guy));

        // check that owner got about 1/3 of what keeper got
        assertClose(guys, selfs * 2, 100000);
        assertClose(burned, rmul(guys, price), 100000);

        vm.stopPrank();
        // try with toll == 100%
        File(bank).file('toll', bytes32(RAY));
        vm.startPrank(address(guy));

        // wait a few years and keep
        skip(BANKYEAR * 10);
        guys  = rico.balanceOf(address(guy));
        selfs = rico.balanceOf(self);
        Vow(bank).keep(ilks);

        // owner and guy's portions of the flap
        guys  = rico.balanceOf(address(guy)) - guys;
        selfs = rico.balanceOf(self) - selfs;

        // check that owner got everything
        assertEq(guys, 0);
        assertGt(selfs, 0);

        vm.stopPrank();

    }

    function test_high_toll() public {
        File(bank).file('toll', bytes32(RAY));
        vm.expectRevert(File.ErrHighToll.selector);
        File(bank).file('toll', bytes32(RAY + 1));
    }

    function test_pep_pop() public {
        // some awk numbers for pep and pop
        uint pep = 13;
        uint pop = RAY * 3;
        File(bank).file('plat.pep', bytes32(pep));
        File(bank).file('plat.pop', bytes32(pop));

        feedpush(RISK_RICO_TAG, bytes32(100 * RAY), type(uint).max);
        // force surplus == debt_before_keep / 3
        force_fees(Vat(bank).sin() / RAY + Vat(bank).debt() / 3);

        uint debt = Vat(bank).debt();
        // 1/4 because force_fees increased debt
        uint deal = rdiv(debt, debt + (debt * 1 / 4));
        uint mash = rmul(pop, rpow(deal, pep));

        // check vow's ask price
        uint selfrisk = risk.balanceOf(self);
        uint selfrico = rico.balanceOf(self);
        Vow(bank).keep(empty);

        assertClose(
            100 * rdiv(selfrisk - risk.balanceOf(self), rico.balanceOf(self) - selfrico),
            mash,
            100000
        );
    }

    function test_zero_flap() public {
        feedpush(RISK_RICO_TAG, bytes32(RAY), type(uint).max);

        force_sin(0);
        force_fees(1);
        Vow(bank).keep(empty);

        assertEq(Vat(bank).sin(), 0);
        assertEq(Vat(bank).joy(), 1);

        // vow leaves at least 1 joy to avoid toggling 0
        // so this keep should flap 0
        uint pre_rico = rico.balanceOf(self);
        uint pre_risk = risk.balanceOf(self);
        Vow(bank).keep(empty);
        uint aft_rico = rico.balanceOf(self);
        uint aft_risk = risk.balanceOf(self);

        assertEq(aft_rico, pre_rico);
        assertEq(aft_risk, pre_risk - 1);
    }

    function test_wel() public _check_integrity_after_ {
        feedpush(RISK_RICO_TAG, bytes32(RAY), type(uint).max);

        // can't flap more rico than surplus
        vm.expectRevert(File.ErrHighWel.selector);
        File(bank).file('wel', bytes32(WAD + 1));

        uint wel = WAD / 7;
        File(bank).file('wel', bytes32(wel));
        Vat(bank).frob(gilk, self, abi.encodePacked(int(WAD)), int(WAD));

        // drip a bunch of joy
        Vat(bank).filk(gilk, 'fee', bytes32(RAY * 10));
        skip(5);
        Vat(bank).drip(gilk);

        // keep should flap 1/7 the joy
        uint joy = Vat(bank).joy() - Vat(bank).sin() / RAY;
        uint pre_rico = rico.balanceOf(self);
        uint pre_risk = risk.balanceOf(self);

        // make sure it offers the right price
        // feed price == 1 and pop == 1, so rico:risk == mash
        uint debt     = Vat(bank).debt() - Vat(bank).sin() / RAY;
        uint exp_mash = rpow(rdiv(debt, debt + joy), 2);

        Vow(bank).keep(empty);

        uint aft_rico = rico.balanceOf(self);
        uint aft_risk = risk.balanceOf(self);

        assertClose(aft_rico - pre_rico, joy / 7, 100000000000);

        uint act_price = rdiv(pre_risk - aft_risk, aft_rico - pre_rico);
        assertClose(act_price, exp_mash, 1000000);
    }

}

contract FrobHook is Hook {
    function frobhook(FHParams calldata p) external pure returns (bool safer) {
        return int(uint(bytes32(p.dink[:32]))) >= 0 && p.dart <= 0;
    }
    function bailhook(BHParams calldata) external returns (bytes memory) {}
    function safehook(
        bytes32 , address
    ) external pure returns (uint, uint, uint) {
        return(10 ** 45, 10 ** 45, type(uint256).max);
    }
    function ink(bytes32, address) pure external returns (bytes memory) {
        return abi.encode(uint(0));
    }
}

contract ZeroHook is Hook {
    function frobhook(FHParams calldata) external returns (bool safer) {}
    function bailhook(BHParams calldata) external returns (bytes memory) {}
    function safehook(
        bytes32 , address
    ) external pure returns (uint, uint, uint) {
        return(0, 0, type(uint256).max);
    }
    function ink(bytes32, address) pure external returns (bytes memory) {
        return abi.encode(uint(0));
    }
}

contract Usr {
    WethLike weth;
    address payable bank;
    Vat vat;
    constructor(address payable _bank, WethLike _weth) {
        weth = _weth;
        bank = _bank;
    }
    function deposit() public payable {
        weth.deposit{value: msg.value}();
    }
    function approve(address usr, uint amt) public {
        weth.approve(usr, amt);
    }
    function frob(bytes32 ilk, address usr, bytes calldata dink, int dart) public {
        Vat(bank).frob(ilk, usr, dink, dart);
    }
    function transfer(address gem, address dst, uint amt) public {
        Gem(gem).transfer(dst, amt);
    }
}

contract VowJsTest is Test, RicoSetUp {
    // me == js ALI
    address me;
    Usr bob;
    Usr cat;
    address b;
    address c;
    address rico_risk_pool;
    WethLike weth;
    bytes32 i0;
    bytes32[] ilks;

    function setUp() public {
        make_bank();
        init_dai();
        init_gold();
        weth = WethLike(WETH);
        me = address(this);
        bob = new Usr(bank, weth);
        cat = new Usr(bank, weth);
        b = address(bob);
        c = address(cat);
        i0 = WETH_ILK;
        ilks.push(i0);

        weth.deposit{value: 6000 * WAD}();
        risk.mint(me, 10000 * WAD);
        weth.approve(bank, UINT256_MAX);

        File(bank).file('ceil', bytes32(uint(10000 * RAD)));
        Vat(bank).filk(i0, 'line', bytes32(10000 * RAD));
        Vat(bank).filk(i0, 'chop', bytes32(RAY * 11 / 10));

        File(bank).file('rel', bytes32(uint(WAD / 10000)));
        File(bank).file('bel', bytes32(uint(0)));
        File(bank).file('cel', bytes32(uint(60)));

        feedpush(wrtag, bytes32(RAY), block.timestamp + 2 * BANKYEAR);
        feedpush(grtag, bytes32(RAY), block.timestamp + 2 * BANKYEAR);
        uint fee = 1000000001546067052200000000; // == ray(1.05 ** (1/BANKYEAR))
        Vat(bank).filk(i0, 'fee', bytes32(fee));
        Vat(bank).frob(i0, me, abi.encodePacked(100 * WAD), 0);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(99 * WAD));

        uint bal = rico.balanceOf(me);
        assertEq(bal, 99 * WAD);
        (Vat.Spot safe1,,) = Vat(bank).safe(i0, me);
        assertEq(uint(safe1), uint(Vat.Spot.Safe));

        cat.deposit{value: 7000 * WAD}();
        cat.approve(bank, UINT256_MAX);
        cat.frob(i0, c, abi.encodePacked(4001 * WAD), int(4000 * WAD));
        cat.transfer(arico, me, 4000 * WAD);

        weth.approve(address(router), UINT256_MAX);
        rico.approve(address(router), UINT256_MAX);
        risk.approve(address(router), UINT256_MAX);
        dai.approve(address(router), UINT256_MAX);
        weth.approve(bank, UINT256_MAX);
        dai.approve(bank, UINT256_MAX);

        PoolArgs memory dai_rico_args = getArgs(DAI, 2000 * WAD, arico, 2000 * WAD, 500, x96(1));
        join_pool(dai_rico_args);

        PoolArgs memory risk_rico_args = getArgs(arisk, 2000 * WAD, arico, 2000 * WAD, 3000, x96(1));
        join_pool(risk_rico_args);
        rico_risk_pool = getPoolAddr(arisk, arico, 3000);
        
        File(bank).file('rel', bytes32(uint(WAD)));
        File(bank).file('bel', bytes32(uint(block.timestamp)));
        File(bank).file('cel', bytes32(uint(1)));
        guy = new Guy(bank);
    }

    function test_bail_urns_1yr_unsafe() public {
        // wait a year, flap the surplus
        skip(BANKYEAR);
        uint start_ink = _ink(i0, me);
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        Vow(bank).keep(ilks);

        (Vat.Spot spot,,) = Vat(bank).safe(i0, me);
        assertEq(uint(spot), uint(Vat.Spot.Sunk));

        // should be balanced
        uint sin0 = Vat(bank).sin();
        uint joy0 = Vat(bank).joy();
        assertEq(sin0 / RAY, 0);
        assertEq(joy0, 1);

        // bail the urn frobbed in setup
        rico_mint(1000 * WAD, false);
        rico.transfer(address(guy), 1000 * WAD);
        vm.expectCall(address(hook), abi.encodePacked(ERC20Hook.bailhook.selector));
        Vat(bank).bail(i0, me);
        // urn should be bailed
        uint ink = _ink(i0, me); uint art = _art(i0, me);
        assertEq(art, 0);
        assertLt(ink, start_ink);

        uint sin1 = Vat(bank).sin();
        uint joy1 = Vat(bank).joy();
        assertEq(art, 0);
        assertGt(sin1, 1);
        assertGt(joy1, 1);
    }

    function test_bail_urns_when_safe() public {
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(i0, me);

        uint sin0 = Vat(bank).sin();
        assertEq(sin0 / RAY, 0);

        skip(BANKYEAR);
        feedpush(wrtag, bytes32(0), UINT256_MAX);

        vm.expectCall(address(hook), abi.encodePacked(hook.bailhook.selector));
        Vat(bank).bail(i0, me);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(i0, me);
    }

    function test_keep_vow_1yr_drip_flap() public {
        uint initial_total = rico.totalSupply();
        skip(BANKYEAR);
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        //vm.expectCall(address(hook), abi.encodePacked(hook.flow.selector));
        Vow(bank).keep(ilks);
        uint final_total = rico.totalSupply();
        assertGt(final_total, initial_total);
        // minted 4099, fee is 1.05. 0.05*4099 as no surplus buffer
        assertGe(final_total - initial_total, 204.94e18);
        assertLe(final_total - initial_total, 204.96e18);
    }

    function test_keep_vow_1yr_drip_flop() public {
        // wait a year, bail the existing urns
        // bails should leave more sin than rico dripped
        skip(BANKYEAR);
        feedpush(wrtag, bytes32(RAY / 2), UINT256_MAX);
        vm.expectCall(address(hook), abi.encodePacked(hook.bailhook.selector));
        Vat(bank).bail(i0, me);
        rico_mint(WAD * 5000, false);
        Vat(bank).bail(i0, address(cat));

        // more sin than rico, should flop
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        Vow(bank).keep(ilks);
    }

    function test_keep_rate_limiting_flop() public {
        File(bank).file('ceil', bytes32(uint(100000 * RAD)));
        Vat(bank).filk(i0, 'line', bytes32(uint(100000 * RAD)));
        File(bank).file('rel', bytes32(uint(WAD)));
        File(bank).file('bel', bytes32(uint(block.timestamp - 1)));
        File(bank).file('cel', bytes32(uint(1)));

        assertGt(risk.totalSupply(), WAD);
        uint risksupply = risk.totalSupply();
        prepguyrico(10000 * WAD, true);
        guy.keep(ilks);
        assertEq(risk.totalSupply(), risksupply + risksupply);
    }

    function test_e2e_all_actions() public {
        // run a flap and ensure risk is burnt
        // pep a little bit more to account for chop >1 now that liqr is in hook
        Vat(bank).filh(i0, 'pep', empty, bytes32(uint(3)));
        uint risk_initial_supply = risk.totalSupply();
        skip(BANKYEAR);
        feedpush(RISK_RICO_TAG, bytes32(RAY / 2), UINT256_MAX);

        risk.mint(address(guy), 1000 * WAD);
        File(bank).file('rel', bytes32(WAD / 1000));

        guy.keep(ilks);

        uint risk_post_flap_supply = risk.totalSupply();
        assertLt(risk_post_flap_supply, risk_initial_supply + 1000 * WAD * 2);

        // confirm bail trades the weth for rico
        feedpush(wrtag, bytes32(RAY / 10), UINT256_MAX);
        uint joy0 = Vat(bank).joy();
        vm.expectCall(address(hook), abi.encodePacked(hook.bailhook.selector));
        Vat(bank).bail(i0, me);
        uint joy1 = Vat(bank).joy();
        assertGt(joy1, joy0);

        // bail price was too low to cover, now have deficit
        uint pre_flop_joy = Vat(bank).joy();
        feedpush(RISK_RICO_TAG, bytes32(10 * RAY), UINT256_MAX);
        prepguyrico(2000 * WAD, false);
        guy.keep(ilks);

        // after flop bank should have more joy
        uint post_flop_joy = Vat(bank).joy();
        assertGt(post_flop_joy, pre_flop_joy);
    }

    function test_flop_clipping() public {
        skip(10);
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        feedpush(wrtag, bytes32(0), UINT256_MAX);
        // cause bank deficit by flipping with zero price
        Vat(bank).bail(i0, me);

        // set rel small so first flop will not cover deficit
        File(bank).file('rel', bytes32(uint(WAD / 1_000_000)));
        File(bank).file('cel', bytes32(uint(5)));
        Bank.Ramp memory ramp = Vow(bank).ramp();
        uint flop = wmul(ramp.rel, risk.totalSupply()) * min(block.timestamp - ramp.bel, ramp.cel);

        prepguyrico(2000 * WAD, false);
        uint ts0 = risk.totalSupply();
        uint gr0 = rico.balanceOf(address(guy));
        guy.keep(ilks);
        uint ts1 = risk.totalSupply();
        uint gr1 = rico.balanceOf(address(guy));
        uint price_unclipped = WAD * (gr0 - gr1) / (ts1 - ts0);

        // with small rel, flop size should not have been clipped
        assertEq(flop, ts1 - ts0);

        skip(2);
        File(bank).file('rel', bytes32(uint(WAD * 200)));
        Vat(bank).drip(WETH_ILK);

        uint under = Vat(bank).sin() / RAY - Vat(bank).joy();
        uint ts2 = risk.totalSupply();
        uint gr2 = rico.balanceOf(address(guy));
        guy.keep(ilks);
        uint ts3 = risk.totalSupply();
        uint gr3 = rico.balanceOf(address(guy));
        // with large rel flop size should have been clipped
        assertEq(under, gr2 - gr3);

        // a clipped flop should leave bank with neither a surplus nor deficit
        uint joy = Vat(bank).joy();
        uint sin = Vat(bank).sin() / RAY;
        assertEq(joy, sin);

        // the first flop was small, price should be about the same
        uint price_clipped = WAD * (gr2 - gr3) / (ts3 - ts2);
        assertClose(price_clipped, price_unclipped, 1_000);

        // should only advance bel 1 second starting from
        // previous bel bc deficit was tiny and elapsed time
        // was <= cel
        assertEq(Vow(bank).ramp().bel, block.timestamp - 1);

    }

    function test_sparse_flop_bel() public {
        // test bel when elapsed time is >> cel

        uint cel = 100;
        File(bank).file('cel', bytes32(cel));
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);

        // cause bank deficit by flipping with zero price
        feedpush(wrtag, bytes32(0), UINT256_MAX);
        Vat(bank).bail(i0, me);

        // set rel high so flop is clipped
        File(bank).file('rel', bytes32(uint(WAD * 20)));

        // elapse a lot more than cel
        uint elapsed = cel * 1000;
        skip(elapsed);
        Vat(bank).drip(gilk);
        Vow(bank).keep(empty);

        // elapsed time > cel
        // -> bel should advance from new timestamp - cel, not last timestamp
        uint bel = Vow(bank).ramp().bel;
        assertGt(bel, block.timestamp - cel);
        assertLt(bel, block.timestamp);
        
    }
}
