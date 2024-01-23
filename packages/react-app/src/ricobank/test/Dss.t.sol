// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

import { Ball } from '../src/ball.sol';
import { Vat } from '../src/vat.sol';
import { Gem } from '../lib/gemfab/src/gem.sol';
import { Vow } from '../src/vow.sol';
import { RicoSetUp, Guy } from "./RicoHelper.sol";
import { Asset, PoolArgs } from "./UniHelper.sol";
import { ERC20Hook } from '../src/hook/ERC20hook.sol';
import { File } from '../src/file.sol';
import { Bank } from '../src/bank.sol';

contract Usr {
    address payable bank;
    constructor(address payable _bank) {
        bank = _bank;
    }

    receive () payable external {}

    function frob(bytes32 ilk, address u, bytes calldata dink, int dart) public {
        Vat(bank).frob(ilk, u, dink, dart);
    }
    function bail(bytes32 ilk, address usr) public {
        Vat(bank).bail(ilk, usr);
    }
    function try_call(address addr, bytes calldata data) external returns (bool) {
        bytes memory _data = data;
        assembly {
            let ok := call(gas(), addr, 0, add(_data, 0x20), mload(_data), 0, 0)
            let free := mload(0x40)
            mstore(free, ok)
            mstore(0x40, add(free, 32))
            revert(free, 32)
        }
    }
    function can_frob(bytes32 ilk, address u, bytes calldata dink, int dart) public returns (bool) {
        string memory sig = "frob(bytes32,address,bytes,int256)";
        bytes memory data = abi.encodeWithSignature(sig, ilk, u, dink, dart);

        bytes memory can_call = abi.encodeWithSignature("try_call(address,bytes)", bank, data);
        (bool ok, bytes memory success) = address(this).call(can_call);

        ok = abi.decode(success, (bool));
        if (ok) return true;
        return false;
    }

    function approve(address gem) public {
        Gem(gem).approve(bank, type(uint).max);
    }
}


contract DssJsTest is Test, RicoSetUp {
    uint256 public init_join = 1000;
    uint stack = WAD * 10;
    bytes32[] ilks;
    address me;
    Usr ali;
    Usr bob;
    Usr cat;
    address a;
    address b;
    address c;
    bytes32 i0;
    Gem gem;
    Gem joy;
    uint rico_gemrico = 10000 * WAD;
    uint goldprice = 40 * RAY / 110;
    uint160 market_price = x96(15) / 10;
    uint gembal = rico_gemrico * goldprice / RAY;
    uint constant rico_riskrico = 10000 * WAD;
    uint total_pool_rico = rico_gemrico + rico_riskrico;
    uint constant total_pool_risk = 10000 * WAD;
    uint ceil = total_pool_rico + 300 * WAD;

    function init_gem(uint init_mint) public {
        gold = Gem(address(gemfab.build(bytes32("Gold"), bytes32("GOLD"))));
        gold.mint(self, init_mint);
        gold.approve(bank, type(uint256).max);
        Vat(bank).init(gilk, address(hook));
        agold = address(gold);
        Vat(bank).filh(gilk, 'gem', empty, bytes32(bytes20(address(agold))));
        Vat(bank).filh(gilk, 'src', empty, bytes32(bytes20(address(mdn))));
        Vat(bank).filh(gilk, 'tag', empty, grtag);
        Vat(bank).filh(gilk, 'liqr', empty, bytes32(RAY));
        Vat(bank).filh(gilk, 'pep', empty, bytes32(uint(2)));
        Vat(bank).filh(gilk, 'pop', empty, bytes32(RAY));
 
        Vat(bank).filk(gilk, bytes32('chop'), bytes32(RAY));
        Vat(bank).filk(gilk, bytes32("line"), bytes32(init_mint * 10 * RAY));
        //Vat(bank).filk(gilk, bytes32('fee'), bytes32(1000000001546067052200000000));  // 5%
        feedpush(grtag, bytes32(RAY), block.timestamp + 1000);
    }

    // todo frob rico.mint
    function _gift(address usr, uint amt) internal {
        rico.transfer(usr, amt);
    }

    function setUp() public {
        me = address(this);
        make_bank();
        joy = rico;
        init_gem(gembal);
        gem = gold;
        ilks.push(gilk);
        gem.approve(bank, UINT256_MAX);

        i0 = ilks[0];

        // vat init
        File(bank).file('ceil', bytes32(ceil * RAD));
        Vat(bank).filk(i0, 'line', bytes32(1000 * RAD));

        feedpush(grtag, bytes32(RAY), block.timestamp + 1000);

        gem.approve(router, UINT256_MAX);
        rico.approve(router, UINT256_MAX);
        risk.approve(router, UINT256_MAX);

        // mint some RISK so rates relative to total supply aren't zero
        risk.mint(address(1), total_pool_risk);
        gem.burn(me, gem.balanceOf(me));

        ali = new Usr(bank);
        bob = new Usr(bank);
        cat = new Usr(bank);
        ali.approve(address(gem));
        bob.approve(address(gem));
        cat.approve(address(gem));
        a = address(ali);
        b = address(bob);
        c = address(cat);

        File(bank).file('bel', bytes32(block.timestamp - 1));
        File(bank).file('cel', bytes32(uint(1)));
        guy = new Guy(bank);
    }

    function _slip(Gem g, address usr, uint amt) internal {
        g.mint(usr, amt);
    }

    function assertRange(uint actual, uint expected, uint tolerance) internal {
        assertGe(actual, expected - tolerance * expected / WAD);
        assertLe(actual, expected + tolerance * expected / WAD);
    }
}

// vat
contract DssVatTest is DssJsTest {
    function _vat_setUp() internal {}
    modifier _vat_ { _vat_setUp(); _; }
}

contract DssFrobTest is DssVatTest {

    function _frob_setUp() internal {
        _vat_setUp();
        assertEq(gem.balanceOf(me), 0);
        assertEq(Gem(gem).balanceOf(me), 0);
        gem.mint(me, 1000 * WAD);
        feedpush(grtag, bytes32(RAY), block.timestamp + 1000);
        Vat(bank).filk(i0, 'line', bytes32(1000 * RAD));
    }
    modifier _frob_ { _frob_setUp(); _; }

    function test_setup() public _frob_ {
        assertEq(gem.balanceOf(me), 1000 * WAD);
        assertEq(gem.balanceOf(me), 1000 * WAD);
    }

    function test_lock() public _frob_ {
        assertEq(_ink(i0, me), 0);
        assertEq(gem.balanceOf(me), 1000 * WAD);
        Vat(bank).frob(i0, me, abi.encodePacked(6 * WAD), 0);
        assertEq(_ink(i0, me), 6 * WAD);
        assertEq(gem.balanceOf(me), 994 * WAD);
        Vat(bank).frob(i0, me, abi.encodePacked(-int(6 * WAD)), 0);
        assertEq(_ink(i0, me), 0);
        assertEq(gem.balanceOf(me), 1000 * WAD);
    }

    function test_calm() public _frob_ {
        // calm means that the debt ceiling is not exceeded
        // it's ok to increase debt as long as you remain calm
        Vat(bank).filk(i0, 'line', bytes32(10 * RAD));
        feedpush(grtag, bytes32(RAY * 2), UINT256_MAX);
        Vat(bank).frob(i0, me, abi.encodePacked(10 * WAD), int(9 * WAD));

        // only if under debt ceiling
        vm.expectRevert(Vat.ErrDebtCeil.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(2 * WAD));

        // but safe check comes first
        feedpush(grtag, bytes32(0), UINT256_MAX);
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(2 * WAD));

        // calm line
        feedpush(grtag, bytes32(RAY * 2), UINT256_MAX);
        Vat(bank).filk(i0, 'line', bytes32(20 * RAD));

        // but not ceil
        File(bank).file('ceil', bytes32(10 * WAD));
        vm.expectRevert(Vat.ErrDebtCeil.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(2 * WAD));

        // ok calm down
        File(bank).file('ceil', bytes32(20 * WAD));
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(2 * WAD));
    }

    function test_cool() public _frob_ {
        // cool means that the debt has decreased
        // it's ok to be over the debt ceiling as long as you're cool
        Vat(bank).filk(i0, 'line', bytes32(10 * RAD));
        Vat(bank).frob(i0, me, abi.encodePacked(10 * WAD), int(8 * WAD));
        Vat(bank).filk(i0, 'line', bytes32(5 * RAD));
        // can decrease debt when over ceiling
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), -int(WAD));
    }

    function test_safe() public _frob_ {
        // safe means that the cdp is not risky
        // you can't frob a cdp into unsafe
        Vat(bank).frob(i0, me, abi.encodePacked(10 * WAD), int(5 * WAD));
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(6 * WAD));
    }

    function test_nice() public _frob_ {
        // nice means that the collateral has increased or the debt has
        // decreased. remaining unsafe is ok as long as you're nice

        Vat(bank).frob(i0, me, abi.encodePacked(10 * WAD), int(10 * WAD));
        feedpush(grtag, bytes32(RAY / 2), block.timestamp + 1000);
        // debt can't increase if unsafe
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, '', int(WAD));
        // debt can decrease
        Vat(bank).frob(i0, me, '', -int(WAD));
        // ink can't decrease
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(-int(WAD)), 0);
        // ink can increase
        Vat(bank).frob(i0, me, abi.encodePacked(WAD), 0);

        // cdp is still unsafe
        // ink can't decrease, even if debt decreases more
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(-int(2 * WAD)), -int(4 * WAD));

        // debt can't increase, even if ink increases more
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(5 * WAD), int(WAD));

        // ink can decrease if end state is safe
        Vat(bank).frob(i0, me, abi.encodePacked(-int(WAD)), -int(4 * WAD));
        feedpush(grtag, bytes32(RAY * 2 / 5), block.timestamp + 1000);
        // debt can increase if end state is safe
        Vat(bank).frob(i0, me, abi.encodePacked(5 * WAD), int(WAD));
    }

    function test_alt_callers() public _frob_ {
        _slip(gem, a, 20 * WAD);
        _slip(gem, b, 20 * WAD);
        _slip(gem, c, 20 * WAD);

        ali.frob(i0, a, abi.encodePacked(10 * WAD), int(5 * WAD));

        // anyone can lock
        assertTrue(ali.can_frob(i0, a, abi.encodePacked(WAD), 0));
        assertTrue(bob.can_frob(i0, b, abi.encodePacked(WAD), 0));
        assertTrue(cat.can_frob(i0, c, abi.encodePacked(WAD), 0));

        // but only with own gems - N/A no v or w

        // only the lad can free
        assertTrue(ali.can_frob(i0, a, abi.encodePacked(-int(WAD)), 0));
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        bob.frob(i0, a, abi.encodePacked(-int(WAD)), 0);
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        cat.frob(i0, a, abi.encodePacked(-int(WAD)), 0);
        // the lad can free to anywhere - N/A no v or w

        // only the lad can draw
        assertTrue(ali.can_frob(i0, a, abi.encodePacked(int(0)), int(WAD)));
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        bob.frob(i0, a, '', int(WAD));
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        cat.frob(i0, a, '', int(WAD));
        // lad can draw to anywhere - N/A no v or w

        rico.mint(b, WAD + 1);  // +1 for rounding in system's favour
        rico.mint(c, WAD + 1);

        // anyone can wipe
        assertTrue(ali.can_frob(i0, a, '', -int(WAD)));
        assertTrue(bob.can_frob(i0, a, '', -int(WAD)));
        assertTrue(cat.can_frob(i0, a, '', -int(WAD)));
        // but only with their own dai - N/A no v or w
    }

    function test_hope() public _frob_ {
        _slip(gem, a, 20 * WAD);
        _slip(gem, b, 20 * WAD);
        _slip(gem, c, 20 * WAD);

        ali.frob(i0, a, abi.encodePacked(10 * WAD), int(5 * WAD));

        // only owner can do risky actions
        assertTrue(ali.can_frob(i0, a, abi.encodePacked(int(0)), int(WAD)));
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        bob.frob(i0, a, abi.encodePacked(int(0)), int(WAD));
        vm.expectRevert(Bank.ErrWrongUrn.selector);
        cat.frob(i0, a, abi.encodePacked(int(0)), int(WAD));

        // unless they hope another user - N/A no hope
    }

    function test_dust() public _frob_ {
        rico_mint(1, true); // +1 for rounding in system's favour
        Vat(bank).frob(i0, me, abi.encodePacked(9 * WAD), int(WAD));
        Vat(bank).filk(i0, 'dust', bytes32(5 * RAD));
        vm.expectRevert(Vat.ErrUrnDust.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(5 * WAD), int(2 * WAD));
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), int(5 * WAD));
        vm.expectRevert(Vat.ErrUrnDust.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), -int(5 * WAD));
        Vat(bank).frob(i0, me, abi.encodePacked(int(0)), -int(6 * WAD));
    }
}

contract DssBiteTest is DssVatTest {
    Gem gov;

    function _bite_setUp() internal {
        _vat_setUp();
        gov = risk;
        gov.mint(me, 100 * WAD);

        // jug N/A
        //   rico has fee, no jug
        //   dss setup doesn't actually set the fee, just creates the jug

        gold.mint(me, 1000 * WAD);

        feedpush(grtag, bytes32(RAY), block.timestamp + 1000);
        Vat(bank).filk(i0, 'line', bytes32(1000 * RAD));
        // cat.box N/A bail liquidates entire urn
        Vat(bank).filk(i0, 'chop', bytes32(RAY));

        gold.approve(bank, UINT256_MAX);
        // gov approve flap N/A not sure what to do with gov atm...
    }

    modifier _bite_ { _bite_setUp(); _; }

    // test_set_dunk_multiple_ilks
    //   N/A no dunk equivalent, auctions off whole thing at once

    // test_cat_set_box
    //   N/A vow liquidates entire urn, no box

    // test_bite_under_dunk
    //   N/A no dunk analogue, vow can only bail entire urn

    // test_bite_over_dunk
    //   N/A no dunk analogue, vow can only bail entire urn


    function vow_Awe() internal view returns (uint) { return Vat(bank).sin(); }

    // vow_Woe N/A - no debt queue in vow

    // do not use with very high joy/sin
    function _surp() public view returns (int) {
        int joy = int(Vat(bank).joy());
        int sin = int(Vat(bank).sin() / RAY);
        return joy - sin;
    }

    function test_happy_bite() public _bite_ {
        // dss: spot = tag / (par . mat), tag=5, mat=2
        // rico: mark = feed.val = 2.5
        // create urn (push, frob)
        feedpush(grtag, bytes32(RAY * 5 / 2), block.timestamp + 1000);
        Vat(bank).frob(i0, me, abi.encodePacked(40 * WAD), int(100 * WAD));

        // tag=4, mat=2
        // make urn unsafe, set liquidation penalty
        feedpush(grtag, bytes32(RAY * 49 / 10), block.timestamp + 1000);
        Vat(bank).filh(i0, 'liqr', empty, bytes32(RAY * 2));
        Vat(bank).filh(i0, 'pop', empty, bytes32(RAY * 2));
        Vat(bank).filk(i0, 'chop', bytes32(RAY * 11 / 10));

        assertEq(_ink(i0, me), 40 * WAD);
        assertEq(_art(i0, me), 100 * WAD);
        // Woe N/A - no debt queue (Sin) in vow
        assertEq(gem.balanceOf(me), 960 * WAD);

        // => bite everything
        // dss checks joy 0 before tend, rico checks before bail
        assertEq(Vat(bank).joy(), 0);
        // cat.file dunk N/A vow always bails whole urn
        // cat.litter N/A vow always bails urn immediately
        prepguyrico(200 * WAD, true);
        guy.bail(i0, me);
        // excess frobbed back into urn
        assertGt(_ink(i0, me), 0);
        skip(1);
        prepguyrico(550 * WAD, true);

        int surp_0 = _surp();
        guy.keep(ilks);
        assertGt(_surp(), surp_0);
    }

    // test_partial_litterbox
    //   N/A bail liquidates whole urn, dart == art

    // testFail_fill_litterbox
    //   N/A bail liquidates whole urn

    // testFail_dusty_litterbox
    //   N/A bail liquidates whole urn, and there's no liquidation limit
    //   besides debt ceiling

    // test_partial_litterbox_multiple_bites
    //   N/A bail liquidates whole urn in one tx, no liquidation limit (litterbox)

    // testFail_null_auctions_dart_realistic_values
    //   N/A vow has no dustiness check, just liquidates entire urn

    // testFail_null_auctions_dart_artificial_values
    //   N/A no box, bail liquidates entire urn immediately

    // testFail_null_auctions_dink_artificial_values

    // testFail_null_auctions_dink_artificial_values_2
    //   N/A no dunk, vow always bails whole urn

    // testFail_null_spot_value
    //   N/A bail amount doesn't depend on spot, only reverts if urn is safe

    function testFail_vault_is_safe() public _bite_ {
        feedpush(grtag, bytes32(RAY * 5 / 2), block.timestamp + 1000);
        Vat(bank).frob(i0, me, abi.encodePacked(100 * WAD), int(150 * WAD));

        assertEq(_ink(i0, me), 100 * WAD);
        assertEq(_art(i0, me), 150 * WAD);
        // Woe N/A - no debt queue (Sin) in vow
        assertEq(gem.balanceOf(me), 900 * WAD);

        // dunk, litter N/A bail liquidates whole urn in one tx, no litterbox
        vm.expectRevert('ERR_SAFE');
        Vat(bank).bail(i0, me);
    }

    function test_floppy_bite() public _bite_ {
        feedpush(grtag, bytes32(RAY * 5 / 2), block.timestamp + 1000);
        uint ricoamt = 100 * WAD;
        Vat(bank).frob(gilk, me, abi.encodePacked(40 * WAD), int(ricoamt));
        feedpush(grtag, bytes32(2 * RAY), block.timestamp + 1000);

        // dunk N/A bail always liquidates whole urn
        // vow.sin N/A no debt queue
        assertEq(Vat(bank).sin() / RAY, 0);
        assertEq(Vat(bank).joy(), 0);
        Vat(bank).bail(i0, me);
        assertEq(Vat(bank).sin() / RAY, ricoamt);
        // added 40, price is 2 and debt is 100, so earnings reduced 1.25 times
        // pep is 2 so deal factor is squared
        uint earn = WAD * 40 * 2 * 4**2 / 5**2;
        assertEq(Vat(bank).joy(), earn);
        assertEq(Vat(bank).sin() / RAY, ricoamt);
    }

    // todo maybe a similar test but get the surplus using frob/bail?
    function test_flappy_bite() public _bite_ {
        uint amt = 100 * WAD;
        force_fees(amt);
        assertEq(gov.balanceOf(me), amt);
        assertEq(vow_Awe() / RAY, 0);

        feedpush(RICO_RISK_TAG, bytes32(RAY), UINT256_MAX);
        feedpush(RISK_RICO_TAG, bytes32(RAY), UINT256_MAX);
        gov.mint(address(guy), 100 * WAD);
        Vow(bank).keep(ilks);
        assertEq(rico.balanceOf(bank), 0);
        assertEq(vow_Awe() / RAY, 0);

        // all joy & debt in existence are in vow, so deal will be x / (x * 2) == 2 wad
        // pop == 1 and pep == 2
        // => mash will be pop * deal ^ pep == 1/4
        // feeds are at equal prices so rico will be sold for 1/4 price
        assertClose(gov.balanceOf(me), amt - amt / 4, 1000);

        skip(1);

        Vow(bank).keep(ilks);
        // no surplus or deficit
        assertEq(rico.balanceOf(bank), 0);
        assertEq(vow_Awe() / RAY, 0);
        // the second keep burnt the RISK bought earlier
        assertEq(gov.balanceOf(bank), 0);
    }
}

contract DssFoldTest is DssVatTest {
    function _fold_setup() internal {
        _vat_setUp();
        File(bank).file('ceil', bytes32(100 * RAD));
        Vat(bank).filk(i0, 'line', bytes32(100 * RAD));
    }

    modifier _fold_ { _fold_setup(); _; }

    function draw(bytes32 ilk, uint joy) internal {
        File(bank).file('ceil', bytes32(joy * RAD + total_pool_rico * RAY));
        Vat(bank).filk(ilk, 'line', bytes32(joy * RAD));
        feedpush(grtag, bytes32(RAY), block.timestamp + 1000);

        _slip(gem, me, WAD);
        Vat(bank).drip(i0);
        Vat(bank).frob(ilk, me, abi.encodePacked(WAD), int(joy * WAD));
    }

    function tab(bytes32 ilk, address _urn) internal view returns (uint) {
        uint art = _art(ilk, _urn);
        uint rack = Vat(bank).ilks(ilk).rack;
        return art * rack;
    }

    function test_fold() public _fold_ {
        uint fee = Vat(bank).ilks(i0).fee;
        assertEq(fee, RAY);
        draw(i0, 1);
        Vat(bank).filk(i0, 'fee', bytes32(RAY * 21 / 20));
        assertEq(tab(i0, me), RAD);

        skip(1);
        uint mejoy0 = Vat(bank).joy() * RAY; // rad
        Vat(bank).drip(i0);
        uint djoy = Vat(bank).joy() * RAY - mejoy0;
        uint tol = RAD / 1000;

        uint actual = RAD * 21 / 20;
        assertGt(tab(i0, me), actual - tol);
        assertLt(tab(i0, me), actual + tol);

        actual = RAD / 20;
        assertGt(djoy, actual - tol);
        assertLt(djoy, actual + tol);
    }
}


contract DssFlapTest is DssJsTest {

    uint nrefunds;
    function flowback(uint256, address, uint refund) external {
        if (refund > 0) {
            nrefunds++;
        }
    }

    function _flap_setup() internal {
        rico.mint(me, 1000 * WAD);

        gem.mint(me, 1000 * WAD);
        gem.transfer(a, 200 * WAD);
        gem.transfer(b, 200 * WAD);
        // setOwner N/A, don't need to ward non-risk/rico gems
        gem.ward(me, false);
    }

    modifier _flap_ { _flap_setup(); _; }

    // testFail_tend_empty
    // test_tend
    // test_tend_dent_same_bidder
    // test_beg
    // test_tick
    //   N/A rico has standing auction mechanism, trades through uniswapv3
}


contract DssClipTest is DssJsTest {
    Usr gal;

    function _clip_setup() internal {
        goldprice = 5 * RAY;
        rico_gemrico = gembal * (goldprice * 11 / 10) / RAY;
        total_pool_rico = rico_gemrico + rico_riskrico;

        // vault already has a bunch of rico (dai) and gem (gold)...skip transfers
        // rico (dai) already wards port (DaiJoin)
        // rico has no dog, accounts interact with vow directly
        // already have i0, no need to init ilk

        _slip(gold, me, 1000 * WAD);
        // no need to join

        Vat(bank).filh(i0, 'liqr', empty, bytes32(2 * RAY)); // dss mat

        feedpush(grtag, bytes32(goldprice), block.timestamp + 1000);

        Vat(bank).filk(i0, 'dust', bytes32(20 * RAD));
        Vat(bank).filk(i0, 'line', bytes32(10000 * RAD));

        // rico has uni pools, dss doesn't
        File(bank).file('ceil', bytes32((10000 + total_pool_rico) * RAD));

        Vat(bank).filk(i0, 'chop', bytes32(11 * RAY / 10)); // dss uses wad, rico uses ray
        // hole, Hole N/A (similar to cat.box), no rico equivalent, rico bails entire urn
        // dss clipper <-> rico flower (flip)

        assertEq(gold.balanceOf(me), 1000 * WAD);
        assertEq(rico.balanceOf(me), 0);
        Vat(bank).frob(i0, me, abi.encodePacked(40 * WAD), int(100 * WAD));
        assertEq(gold.balanceOf(me), (1000 - 40) * WAD);
        assertEq(rico.balanceOf(me), 100 * WAD);

        feedpush(grtag, bytes32(4 * RAY), block.timestamp + 1000); // now unsafe

        // dss me/ali/bob hope clip N/A, rico vat wards vow

        rico.mint(me, 1000 * WAD);
        rico.mint(a, 1000 * WAD);
        rico.mint(b, 1000 * WAD);
    }

    modifier _clip_ { _clip_setup(); _; }

    // test_change_dog
    //   N/A rico flow has per-auction vow (dss dog)

    // test_get_chop
    //   N/A rico has no dss chop function equivalent, just uses vat.ilks

    function test_kick_4() public _clip_ {
        // tip, chip N/A, rico currently has no keeper reward

        // clip.kicks() N/A rico flow doesn't count flips
        // clip.sales() N/A rico flow doesn't store sale information

        assertEq(gold.balanceOf(me), (1000 - 40) * WAD);
        assertEq(rico.balanceOf(a), 1000 * WAD);
        uint art = _art(i0, me);
        uint ink1 = _ink(i0, me);
        assertEq(ink1, 40 * WAD);
        assertEq(art, 100 * WAD);
        prepguyrico(1000 * WAD, true);
        guy.bail(i0, me); // no keeper arg
        feedpush(wrtag, bytes32(RAY * 100), UINT256_MAX);
        // clip.kicks() N/A rico flow doesn't count flips
        // clip.sales() N/A rico flow doesn't store sale information

        art = _art(i0, me);
        uint ink2 = _ink(i0, me);
        assertLt(ink2, ink1);
        assertEq(art, 0);

        // Spot = $2.5
        feedpush(grtag, bytes32(goldprice), block.timestamp + 1000); // dss pip.poke

        skip(100);
        Vat(bank).frob(i0, me, abi.encodePacked(40 * WAD), int(100 * WAD)); // dss pip.poke
        // Spot = $2
        feedpush(grtag, bytes32(4 * RAY), block.timestamp + 1000); /// dss spot.poke, now unsafe

        // clip.sales N/A
        assertEq(gold.balanceOf(me), (1000 - 80) * WAD);
        // buf N/A rico has no standing auction
        // tip, chip N/A

        assertEq(rico.balanceOf(b), 1000 * WAD);

        art = _art(i0, me);
        guy.bail(i0, me);
        // wait till price goes to 0
        // clip.kicks() N/A rico flow doesn't count flips
        // clip.sales() N/A rico flow doesn't store sale information

        assertEq(gold.balanceOf(me), (1000 - 80) * WAD);
        art = _art(i0, me);
        assertEq(art, 0);

        assertEq(rico.balanceOf(b), 1000 * WAD); // dss has bailer rewards, rico bark doesn't
    }

    function testFail_kick_zero_price() public _clip_ {
        feedpush(grtag, bytes32(0), UINT256_MAX);
        vm.expectRevert(); // todo need error types for zero cases
        Vat(bank).bail(i0, me);
    }

    // testFail_redo_zero_price
    //   N/A rico has no auction (todo now it does...)

//    function test_kick_zero_lot() public _clip_ {
//        // but cut == 0 if ink == 0
//        // TODO curb_ramp handle undefined?
//        // rel similar to dss lot
//        curb(address(gem), 0, WAD, block.timestamp, 1);
//        vm.expectRevert(); // todo need error types for zero cases
//        Vat(bank).bail(i0, me);
//    }

    function test_kick_zero_usr() public _clip_ {
        // flow.flow (dss kick) actually uses msg.sender
        // so this is kind of N/A
        // but test bail's (dss bark) usr anyway
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(i0, address(0));
    }

    // opposite behavior, bail takes the whole urn
    // refunds later
    function test_bark_not_leaving_dust() public _clip_ {
        Vat(bank).bail(i0, me);

        uint art = _art(i0, me);
        assertEq(art, 0);
    }

    // test_bark_not_leaving_dust_over_hole
    //   N/A rico has no hole

    // test_bark_not_leaving_dust_rate
    //   N/A dart depends on hole, rico doesn't have hole, always takes entire urn
    //   and refunds later

    // test_bark_only_leaving_dust_over_hole_rate
    // test_Hole_hole
    // test_partial_liquidation_Hole_limit
    // test_partial_liquidation_hole_limit
    //   N/A no hole or Hole or partial liquidations

    // test_take_*, testFail_take_*, test_auction_*
    //   N/A no standing auction, rico v1 goes through uniswapv3

    // test_redo_*
    //   N/A currently no way to reset dead auctions

    // test_stopped_*
    //   N/A no stopped/pause

    // test_incentive_max_values
    //   N/A rico is an MEV snack

    // test_Clipper_yank
    //   N/A no shutdown

    // test_remove_id
    // testFail_id_out_of_range
    //   N/A rico doesn't keep flow auctions as a list because maximum auction id is so high


    // testFail_not_enough_dai
    // test_flashsale
    // testFail_reentrancy_take
    // testFail_reentrancy_redo
    // testFail_reentrancy_kick
    // testFail_reentrancy_file_uint
    // testFail_reentrancy_file_addr
    // testFail_reentrancy_yank
    // testFail_take_impersonation
    // test_gas_partial_take
    // test_gas_full_take
    //   N/A no standing auction, rico v1 goes through uniswapv3, no take
    //   also no clipper-like callback

    function test_gas_bark_kick() public _clip_ {
        uint gas = gasleft();
        vm.expectCall(address(hook), abi.encodePacked(hook.bailhook.selector));
        Vat(bank).bail(i0, me);
        check_gas(gas, 87618);
    }
}

// end
//   N/A no end
// cure
//   N/A no cure, only thing that uses cure is end
// dai
//   N/A rico uses gem, already tested
//

contract DssVowTest is DssJsTest {
    function _vow_setUp() internal {
        gem.mint(me, 10000 * WAD);
        gem.approve(bank, UINT256_MAX);
        File(bank).file('rel', bytes32(WAD / BLN));
        File(bank).file('bel', bytes32(block.timestamp));
        File(bank).file('cel', bytes32(uint(1)));
    }
    modifier _vow_ { _vow_setUp(); _; }

    // test_flog_wait
    //   N/A no vow.wait in rico

    function test_no_reflop() public _vow_ {
        uint amt = WAD / 1000;
        File(bank).file('rel', bytes32(WAD / BLN));
        File(bank).file('bel', bytes32(block.timestamp));
        File(bank).file('cel', bytes32(uint(1)));
        skip(1);

        // frob some, bail but don't glug
        Vat(bank).frob(i0, me, abi.encodePacked(amt), int(amt));
        feedpush(grtag, bytes32(0), UINT256_MAX);
        Vat(bank).bail(i0, me); // lots of debt

        // keep, should be a flop
        uint rs1 = risk.totalSupply();
        Vow(bank).keep(ilks);
        uint rs2 = risk.totalSupply();
        assertGt(rs2, rs1);

        // try to reflop
        vm.expectRevert(Vow.ErrReflop.selector);
        Vow(bank).keep(ilks);

        // create a surplus
        Vat(bank).drip(gilk);
        Vat(bank).filk(gilk, 'fee',  bytes32(RAY * 15 / 10));
        Vat(bank).filk(gilk, 'line', bytes32(10_000 * RAD));
        rico_mint(1000 * WAD, false);
        skip(1);

        // get ready to call keep
        feedpush(RISK_RICO_TAG, bytes32(10 * RAY), UINT256_MAX);
        risk.mint(me, 10000 * WAD);

        // should be a flap this time
        uint sr1 = rico.balanceOf(self);
        Vow(bank).keep(ilks);
        uint sr2 = rico.balanceOf(self);
        assertGt(sr2, sr1); // flap, not flop
    }

    function test_flap() public _vow_ {
        Vat(bank).drip(i0);
        Vat(bank).filk(gilk, bytes32('chop'), bytes32(RAY * 11 / 10));
        Vat(bank).filk(i0, 'fee', bytes32(RAY * 15 / 10));
        Vat(bank).frob(i0, me, abi.encodePacked(200 * WAD), int(100 * WAD));
        skip(10);

        risk.mint(me, 10000 * WAD);

        uint sr1 = rico.balanceOf(self);
        Vow(bank).keep(ilks);
        uint sr2 = rico.balanceOf(self);
        assertGt(sr2, sr1);
    }

    // test_no_flap_pending_sin
    //   N/A keep always flops on debt and flaps on surplus, there's no debt queue

    // test_no_flap_nonzero_woe
    //   N/A this test is actually the same as test_no_flap_pending_sin

    // test_no_flap_pending_flop
    // test_no_flap_pending_heal
    //   N/A keep can flap while there's a pending flop auction if a surplus is generated
    //   uses ramps to rate limit both

    function test_no_surplus_after_good_flop() public _vow_ {
        Vat(bank).filk(i0, 'fee', bytes32(RAY * 21 / 20));
        Vat(bank).frob(i0, me, abi.encodePacked(int(100)), 100);
        feedpush(grtag, bytes32(0), UINT256_MAX);
        
        // accrue some interest so vat has some joy
        skip(1);
        Vat(bank).drip(i0);
        
        Vat(bank).bail(i0, me); // lots of debt
        skip(1);
        rico_mint(50 * WAD, true);
        uint self_rico1 = rico.balanceOf(self);
        Vow(bank).keep(ilks);
        uint self_rico2 = rico.balanceOf(self);
        // should only have some rico from instant risk sale +1 extra which wasn't spent healing
        uint vows_expected_rico = self_rico1 - self_rico2 + 1;
        assertEq(Vat(bank).joy(), vows_expected_rico);
    }

    // test_multiple_flop_dents
    //   N/A no standing auction mechanism, no dent, trades through AMM
}

contract DssDogTest is DssJsTest {
    Usr gal;

    function _dog_setUp() internal {
        File(bank).file('ceil', bytes32(10000 * RAD));
        Vat(bank).filk(i0, 'line', bytes32(10000 * RAD));
        gem.mint(me, 100000 * WAD);
        gem.approve(bank, UINT256_MAX);
        Vow(bank).keep(ilks);
        feedpush(grtag, bytes32(1000 * RAY), UINT256_MAX);
    }

    modifier _dog_ { _dog_setUp(); _; }

    function setUrn(uint ink, uint art) internal {
        (bytes32 price, uint ttl) = feed.pull(me, grtag);
        feedpush(grtag, bytes32(2 * RAY * art / ink), UINT256_MAX);
        Vat(bank).frob(i0, me, abi.encodePacked(ink), int(art));
        feedpush(grtag, price, ttl);
    }

    function test_bark_basic() public _dog_ {
        feedpush(grtag, bytes32(RAY / 1000), UINT256_MAX);
        uint init_ink = WAD;
        setUrn(init_ink, 2000 * WAD);
        Vat(bank).bail(i0, me);
        uint art = _art(i0, me);
        uint ink = _ink(i0, me);
        assertLt(ink, init_ink);
        assertEq(art, 0);
    }

    function test_bark_not_unsafe() public _dog_ {
        setUrn(WAD, 500 * WAD);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(i0, me);
    }

    function test_bark_dusty_vault() public {
        // difference from dss: error on dust, no dog
        gold.mint(me, 200000 * WAD);
        uint dust = 200;
        Vat(bank).filk(i0, 'dust', bytes32(dust * RAD));
        vm.expectRevert(Vat.ErrUrnDust.selector);
        Vat(bank).frob(i0, me, abi.encodePacked(200000 * WAD), int(199 * WAD));
    }

    // test_bark_partial_liquidation_dirt_exceeds_hole_to_avoid_dusty_remnant
    // test_bark_partial_liquidation_dirt_does_not_exceed_hole_if_remnant_is_nondusty
    // test_bark_partial_liquidation_Dirt_exceeds_Hole_to_avoid_dusty_remnant
    // test_bark_partial_liquidation_Dirt_does_not_exceed_Hole_if_remnant_is_nondusty
    // test_bark_dusty_vault_dusty_room
    // test_bark_do_not_create_dusty_auction_hole
    // test_bark_do_not_create_dusty_auction_Hole
    //   N/A no hole
}
