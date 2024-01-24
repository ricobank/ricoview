// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

import { RicoSetUp } from "./RicoHelper.sol";
import { File } from '../src/file.sol';
import { Vat } from '../src/vat.sol';
import { Vox } from '../src/vox.sol';

contract VoxTest is Test, RicoSetUp {
    uint pre_cap;

    modifier _orig_ {
        File(bank).file(bytes32('cap'), bytes32(pre_cap));
        _;
    }

    function setUp() public {
        make_bank();
        pre_cap = Vox(bank).cap();
        File(bank).file('tip.tag', rtag);
        File(bank).file('cap', bytes32(3 * RAY));
        File(bank).file('par', bytes32(7 * WAD));
    }

    function test_sway() public {
        feedpush(rtag, bytes32(7 * WAD), block.timestamp + 1000);

        skip(100);
        Vox(bank).poke();
        assertEq(Vat(bank).par(), 7 * WAD);

        File(bank).file(bytes32('way'), bytes32(2 * RAY));
        skip(2);
        Vox(bank).poke();
        assertEq(Vat(bank).par(), 28 * WAD);
    }

    function test_poke_highmar_gas() public {
        skip(1);
        uint way = Vox(bank).way();
        feedpush(rtag, bytes32(10 * WAD), block.timestamp + 1000);
        uint gas = gasleft();
        Vox(bank).poke();
        check_gas(gas, 30065);
        assertLt(Vox(bank).way(), way);
    }

    function test_poke_lowmar_gas() public {
        skip(1);
        uint way = Vox(bank).way();
        feedpush(rtag, bytes32(uint(1)), block.timestamp + 1000);
        uint gas = gasleft();
        Vox(bank).poke();
        check_gas(gas, 29578);
        assertGt(Vox(bank).way(), way);
    }

    function test_ricolike_vox() public {
        Vox(bank).poke(); // how > 1 but mar == par, par stuck at 7
        uint how = RAY + (RAY * 12 / 10) / (10 ** 16);
        File(bank).file(bytes32('how'), bytes32(how));
        feedpush(rtag, bytes32(0), 10 ** 12);

        Vox(bank).poke(); // no time has passed
        assertEq(Vat(bank).par(), 7 * WAD);
        skip(1);
        Vox(bank).poke();
        assertEq(Vat(bank).par(), 7 * WAD); // way *= how, par will increase next

        skip(1);
        Vox(bank).poke();
        uint expectedpar2 = 7 * WAD * how / RAY;
        assertEq(Vat(bank).par(), expectedpar2); // way > 1 -> par increases

        skip(1);
        feedpush(rtag, bytes32(10 * WAD), 10 ** 12); // raise mar above par
        Vox(bank).poke(); // poke updates par before way, par should increase again
        // this time it's multiplied by how ** 2
        uint expectedpar3 = 7 * WAD * how / RAY * how / RAY * how / RAY;
        assertEq(Vat(bank).par(), expectedpar3);

        skip(1);
        // way decreased but still > 1, par increases
        Vox(bank).poke();
        assertGt(Vat(bank).par(), expectedpar3);
        skip(1);
        // way ~= 1, par shouldn't change much
        Vox(bank).poke();
        assertGt(Vat(bank).par(), expectedpar3);
        skip(1);
        // way < 1, should decrease, maybe rounding error goes a little under par3
        Vox(bank).poke();
        assertLe(Vat(bank).par(), expectedpar3);
        skip(1);
        // way < 1, should decrease
        Vox(bank).poke();
        assertLe(Vat(bank).par(), expectedpar2);

        feedpush(rtag, bytes32(0), 10 ** 12);
        skip(100000000);
        // way doesn't change until after par update
        Vox(bank).poke();
        skip(100000000);
        Vox(bank).poke();
        assertGe(Vat(bank).par(), 20 * WAD);
    }

    function test_ttl() public {
        uint old_way = Vox(bank).way();
        vm.startPrank(Vox(bank).tip().src);
        File(bank).fb().push(Vox(bank).tip().tag, bytes32(Vat(bank).par()), block.timestamp - 1);
        vm.stopPrank();
        Vox(bank).poke();
        assertEq(old_way, Vox(bank).way());
    }

    function test_cap_min() public _orig_ {
        // _orig_ set cap back to original value, otw it's too big to reasonably reach
        Vox(bank).poke();
        skip(100000000);
        vm.startPrank(Vox(bank).tip().src);
        File(bank).fb().push(Vox(bank).tip().tag, 0, block.timestamp + 1);
        vm.stopPrank();
        Vox(bank).poke();
        assertEq(Vox(bank).way(), Vox(bank).cap());
    }

    function test_cap_max() public _orig_ {
        Vox(bank).poke();
        skip(100000000);
        vm.startPrank(Vox(bank).tip().src);
        uint256 high = 2 ** 128;
        File(bank).fb().push(Vox(bank).tip().tag, bytes32(high), block.timestamp + 1 );
        vm.stopPrank();
        Vox(bank).poke();
        assertEq(Vox(bank).way(), rinv(Vox(bank).cap()));
    }

    function test_par_grows_with_stale_tip() public _orig_ {
        // set rico market feed low and fresh
        feedpush(rtag, bytes32(WAD), block.timestamp + 10000);
        skip(10);
        Vox(bank).poke();

        uint way0 = Vox(bank).way();
        uint par0 = Vat(bank).par();

        // set rico market feed low and stale
        feedpush(rtag, bytes32(WAD), block.timestamp);
        skip(10);
        Vox(bank).poke();

        // without market price sense par should progress but not way
        uint way1 = Vox(bank).way();
        uint par1 = Vat(bank).par();
        assertEq(way1, way0);
        assertGt(par1, par0);

        // set rico market feed low and fresh, without progressing time
        feedpush(rtag, bytes32(WAD), block.timestamp + 10000);
        Vox(bank).poke();

        // no delayed way change after feed refreshed
        uint way2 = Vox(bank).way();
        uint par2 = Vat(bank).par();
        assertEq(way2, way1);
        assertEq(par2, par1);

        // with fresh rico market feed both should progress
        feedpush(rtag, bytes32(WAD), block.timestamp + 10000);
        skip(10);
        Vox(bank).poke();

        uint way3 = Vox(bank).way();
        uint par3 = Vat(bank).par();
        assertGt(way3, way2);
        assertGt(par3, par2);
    }

// Sanity test that release constants behave as expected
    function test_release_how_day() public _orig_ {
        Vox(bank).poke();
        uint par0 = Vat(bank).par();
        uint way0 = Vox(bank).way();
        assertEq(way0, RAY);

        // wait a std day and poke with market price below par
        feedpush(rtag, bytes32(0), block.timestamp + 10 * BANKYEAR);
        skip(1 days);
        Vox(bank).poke();

        // wait a bank year and poke again to see the way par changes
        skip(BANKYEAR);
        Vox(bank).poke();

        uint par1 = Vat(bank).par();
        uint incr = rdiv(par1, par0);

        // given const of 1000000000000003652500000000, how way changed should
        // have increased par by 1% over 365.25 days (BANKYEAR)
        assertClose(incr, RAY * 101 / 100, 100000);
    }

    function test_release_how_cap() public _orig_ {
        Vox(bank).poke();
        uint way0 = Vox(bank).way();
        assertEq(way0, RAY);

        feedpush(rtag, bytes32(0), block.timestamp + 10 * BANKYEAR);
        skip(68.9 days);
        Vox(bank).poke();

        assertLt(Vox(bank).way(), Vox(bank).cap());

        skip(1 days);
        Vox(bank).poke();

        // with single direction movement way should take 69 days to go from neutral to cap
        assertEq(Vox(bank).way(), Vox(bank).cap());
    }

    function test_release_cap() public _orig_ {
        // Let way grow to cap
        Vox(bank).poke();
        feedpush(rtag, bytes32(0), block.timestamp + 10 * BANKYEAR);
        skip(100 days);
        Vox(bank).poke();

        // let par grow for a year at max way
        uint par0 = Vat(bank).par();
        skip(BANKYEAR);
        Vox(bank).poke();
        uint par1 = Vat(bank).par();
        uint incr = rdiv(par1, par0);

        // at max growth par should should double in one year
        assertClose(incr, RAY * 2, 1_000);
    }

    function test_release_how_day_down() public _orig_ {
        Vox(bank).poke();
        uint par0 = Vat(bank).par();
        uint way0 = Vox(bank).way();
        assertEq(way0, RAY);

        // wait a std day and poke with market price above par
        feedpush(rtag, bytes32(1_000_000_000 * WAD), block.timestamp + 10 * BANKYEAR);
        skip(1 days);
        Vox(bank).poke();

        // wait a bank year and poke again to see the way par changes
        skip(BANKYEAR);
        Vox(bank).poke();

        uint par1 = Vat(bank).par();
        uint incr = rdiv(par1, par0);

        // given const of 1000000000000003652500000000, how way changed should
        // have decreased par by 1% over 365.25 days (BANKYEAR)
        assertClose(incr, RAY * 100 / 101, 100000);
    }

    function test_release_how_cap_down() public _orig_ {
        Vox(bank).poke();
        uint way0 = Vox(bank).way();
        assertEq(way0, RAY);

        feedpush(rtag, bytes32(1_000_000_000 * WAD), block.timestamp + 10 * BANKYEAR);
        skip(68.9 days);
        Vox(bank).poke();

        assertGt(Vox(bank).way(), rinv(Vox(bank).cap()));

        skip(1 days);
        Vox(bank).poke();

        // with single direction movement way should take 69 days to go from neutral to cap
        assertEq(Vox(bank).way(), rinv(Vox(bank).cap()));
    }

    function test_release_cap_down() public _orig_ {
        // Let way grow to inv cap
        Vox(bank).poke();
        feedpush(rtag, bytes32(1_000_000_000 * WAD), block.timestamp + 10 * BANKYEAR);
        skip(100 days);
        Vox(bank).poke();

        // let par grow for a year at min way
        uint par0 = Vat(bank).par();
        skip(BANKYEAR);
        Vox(bank).poke();
        uint par1 = Vat(bank).par();
        uint incr = rdiv(par1, par0);

        assertClose(incr, RAY / 2, 1_000);
    }
}
