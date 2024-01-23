// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

import { Gem } from '../../lib/gemfab/src/gem.sol';
import { Vat }  from '../../src/vat.sol';
import { Vox }  from '../../src/vox.sol';
import { BaseHelper } from "../BaseHelper.sol";
import { ERC20Handler } from './ERC20Handler.sol';

// Uses single WETH ilk and modifies WETH and RICO price during run
contract InvariantFluidPrice is Test, BaseHelper {
    ERC20Handler handler;
    uint256 cap;
    uint256 icap;
    Vat vat;
    Vox vox;
    Gem rico;

    function setUp() external {
        handler = new ERC20Handler();
        bank    = handler.bank();
        rico    = handler.rico();
        vat     = Vat(bank);
        vox     = Vox(bank);
        cap     = vox.cap();
        icap    = rinv(cap);

        targetContract(address(handler));
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = ERC20Handler.frob.selector;
        selectors[1] = ERC20Handler.frob.selector;  // add frob twice to double probability
        selectors[2] = ERC20Handler.bail.selector;
        selectors[3] = ERC20Handler.keep.selector;
        selectors[4] = ERC20Handler.drip.selector;
        selectors[5] = ERC20Handler.poke.selector;
        selectors[6] = ERC20Handler.mark.selector;
        selectors[7] = ERC20Handler.wait.selector;
        selectors[8] = ERC20Handler.date.selector;
        selectors[9] = ERC20Handler.move.selector;
        targetSelector(FuzzSelector({
            addr:      address(handler),
            selectors: selectors
        }));
    }

    // all invariant tests combined for efficiency
    function invariant_all_fluid() external {
        uint sup  = rico.totalSupply();
        uint joy  = vat.joy();
        uint debt = vat.debt();
        uint rest = vat.rest();
        uint sin  = vat.sin();
        uint tart = vat.ilks(WETH_ILK).tart;
        uint rack = vat.ilks(WETH_ILK).rack;
        uint line = vat.ilks(WETH_ILK).line;
        uint liqr = uint(vat.geth(WETH_ILK, 'liqr', empty));
        uint way  = vox.way();
        uint weth_val = handler.localWeth() * handler.weth_ref_max() / handler.minPar();

        // debt invariant
        assertEq(joy + sup, debt);

        // tart invariant. compare as RADs. unchecked - ok if both are equally negative
        unchecked {
            assertEq(tart * rack - rest, RAY * (sup + joy) - sin);
        }
        assertLt(tart * RAY, line);

        // actors ink + weth should be constant outside of liquidations and frobs which benefit a different urn,
        // actors can't steal from others CDPs
        for (uint i = 0; i < handler.NUM_ACTORS(); ++i) {
            address actor = handler.actors(i);
            int ink  = int(_ink(WETH_ILK, actor));
            int weth = int(Gem(WETH).balanceOf(actor));
            int off  = handler.ink_offset(actor);
            int init = int(handler.ACTOR_WETH());
            assertEq(ink + weth, init + off);
        }

        // assert limit on total possible RICO drawn
        assertLt(sup, rdiv(weth_val, liqr));

        // way stays within bounds given owner does not file("cap")
        assertLe(way, cap);
        assertGe(way, icap);
    }
}
