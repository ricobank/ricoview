// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import { VmSafe } from "lib/forge-std/src/Vm.sol";

import { RicoSetUp } from '../RicoHelper.sol';
import { Gem } from '../../lib/gemfab/src/gem.sol';
import { Vat }  from '../../src/vat.sol';
import { Vow }  from '../../src/vow.sol';
import { Vox }  from '../../src/vox.sol';
import { File } from '../../src/file.sol';
import { Local } from './Local.sol';

contract ERC20Handler is Test, Local, RicoSetUp {
    uint256   public constant ACTOR_WETH = 1000 * WAD;
    uint8     public constant NUM_ACTORS = 2;

    address   public currentActor;
    uint256   public rico_ref_val;
    uint256   public weth_ref_val;
    uint256   public weth_ref_max;
    uint256   public localWeth;  // ghost of total eth given to actors
    uint256   public minPar;     // ghost of lowest value of par
    int256    public artCap;
    address[] public actors;
    bytes32[] public ilks;
    mapping (address actor => int offset) public ink_offset;  // track bailed inter-actor weth

    constructor() {
        deploy_local_deps();
        make_bank(false);
        File(bank).file('tip.src', bytes32(bytes20(self)));
        ilks.push(WETH_ILK);
        weth_ref_val = WETH_REF_VAL;
        weth_ref_max = weth_ref_val;

        for (uint i = 1; i < NUM_ACTORS + 1; ++i) {
            address actor = vm.addr(i);
            actors.push(actor);
            deal(actor, WAD * 1_000_000);
            deal(WETH, actor, ACTOR_WETH);
            localWeth += ACTOR_WETH;

            vm.prank(actor);
            Gem(WETH).approve(bank, type(uint).max);

            vm.prank(bank);
            risk.mint(actor, WAD * 1_000_000);
        }

        uint par     = Vat(bank).par();
        minPar       = par;
        rico_ref_val = par;
        artCap       = int(ACTOR_WETH * weth_ref_val / par);

        feed.push(RICO_REF_TAG, bytes32(rico_ref_val), block.timestamp * 2);
        feedpush(WETH_REF_TAG, bytes32(weth_ref_val), block.timestamp * 2);
    }

    function frob(uint256 actorSeed, uint256 urnSeed, int256 ink, int256 art) public _larp_(actorSeed) {
        ink = bound(ink, -int(ACTOR_WETH), int(ACTOR_WETH));
        art = bound(art, -artCap, artCap);
        address urn = actors[bound(urnSeed, 0, actors.length - 1)];
        Vat(bank).frob(WETH_ILK, urn, abi.encodePacked(ink), art);

        // ink integrity tracking
        if (urn != currentActor) {
            ink_offset[currentActor] -= ink;
            ink_offset[urn]          += ink;
        }
    }

    function flash(uint256 actorSeed) public _larp_(actorSeed) {}

    // test must first set handler as tip, then this will push new values for mar
    function mark(bool up) public _self_ {
        rico_ref_val = up ? rico_ref_val * 101 / 100 : rico_ref_val * 100 / 101;
        feed.push(RICO_REF_TAG, bytes32(rico_ref_val), block.timestamp * 2);
    }

    function move(bool up) public _self_ {
        weth_ref_val = up ? weth_ref_val * 5 / 4 : weth_ref_val * 4 / 5;
        weth_ref_max = max(weth_ref_max, weth_ref_val);
        feedpush(WETH_REF_TAG, bytes32(weth_ref_val), block.timestamp * 2);
    }

    function bail(uint256 actorSeed, uint256 urnSeed) public _larp_(actorSeed) {
        // track transferred weth for actor weth + ink invariant
        uint pre_weth = Gem(WETH).balanceOf(currentActor);

        address urn = actors[bound(urnSeed, 0, actors.length - 1)];
        Vat(bank).bail(WETH_ILK, urn);

        uint aft_weth = Gem(WETH).balanceOf(currentActor);
        int sold = int(aft_weth) - int(pre_weth);
        ink_offset[currentActor] += sold;
        ink_offset[urn]          -= sold;
    }

    function keep(uint256 actorSeed) public _larp_(actorSeed) {
        Vow(bank).keep(ilks);
    }

    function drip() public {
        Vat(bank).drip(WETH_ILK);
    }

    function poke() public {
        Vox(bank).poke();
        minPar = min(minPar, Vat(bank).par());
    }

    function wait(uint16 s) public {
        skip(s);
    }

    // about 1% chance to set a feed stale, otherwise fresh
    function date(uint64 _ent) public _self_ {
        bytes32[3] memory tags = [WETH_REF_TAG, RICO_RISK_TAG, RISK_RICO_TAG];
        uint ent = uint(_ent);
        uint stale_idx = type(uint).max;
        if (ent * 100 / 99 > type(uint64).max) stale_idx = ent % tags.length;
        for(uint i; i < tags.length; i++) {
            (bytes32 val,) = feedpull(tags[i]);
            uint ttl = i == stale_idx ? 0 : block.timestamp * 2;
            feedpush(tags[i], val, ttl);
        }
    }

    /* --------------------------- non target functions --------------------------- */

    modifier _larp_(uint256 actorSeed) {
        currentActor = actors[bound(actorSeed, 0, actors.length - 1)];
        clear_prank();
        vm.startPrank(currentActor);
        _;
        vm.stopPrank();
    }

    // the prank in _larp_() persists over test runs when they revert, use this to ensure acting as handler
    modifier _self_() {
        clear_prank();
        _;
    }

    function clear_prank() internal {
        (VmSafe.CallerMode caller_mode,,) = vm.readCallers();
        if (caller_mode != VmSafe.CallerMode.None) vm.stopPrank();
    }
}
