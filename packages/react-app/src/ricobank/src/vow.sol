// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;

import { Vat }  from './vat.sol';
import { Bank, Gem } from './bank.sol';

// accounting mechanism
// triggers collateral (flip), surplus (flap), and deficit (flop) auctions
contract Vow is Bank {
    function RISK() view external returns (Gem) {return getVowStorage().RISK;}
    function ramp() view external returns (Ramp memory) {
        return getVowStorage().ramp;
    }
    function toll() view external returns (uint) { return getVowStorage().toll; }
    function rudd() view external returns (Rudd memory) { return getVowStorage().rudd; }
    function plat() view external returns (Plx memory) { return getVowStorage().plat; }
    function plot() view external returns (Plx memory) { return getVowStorage().plot; }

    error ErrReflop();
    error ErrOutDated();

    function keep(bytes32[] calldata ilks) _flog_ external {
        VowStorage storage  vowS  = getVowStorage();
        VatStorage storage  vatS  = getVatStorage();
        BankStorage storage bankS = getBankStorage();

        for (uint256 i = 0; i < ilks.length; ++i) {
            Vat(address(this)).drip(ilks[i]);
        }

        Gem rico = bankS.rico;
        Gem risk = vowS.RISK;
        uint joy = vatS.joy;

        // use equal scales for sin and joy
        uint sin = vatS.sin / RAY;
        if (joy > sin) {

            // pay down sin, then auction off surplus RICO for RISK
            if (sin > 1) {
                // gas - don't zero sin
                joy = _heal(sin - 1);
            }

            // deal decreases as surplus increases, i.e. if there's a massive
            // surplus the system deduces that it's overpricing rico
            uint debt = vatS.debt;
            uint deal = rdiv(debt, debt + joy);
            uint mash = rmul(vowS.plat.pop, rpow(deal, vowS.plat.pep));

            // buy-and-burn risk with remaining (`flap`) rico
            uint flap  = wmul(joy - 1, vowS.ramp.wel);
            joy       -= flap;
            vatS.joy   = joy;
            emit NewPalm0('joy', bytes32(joy));

            uint price = rdiv(mash, _price()) + 1;
            uint sell  = rmul(flap, RAY - vowS.toll);
            uint earn  = rmul(sell, price) + 1;

            // swap rico for RISK, pay protocol fee
            Gem(risk).burn(msg.sender, earn);
            Gem(rico).mint(msg.sender, sell);
            if (sell < flap) Gem(rico).mint(owner(), flap - sell);

        } else if (sin > joy) {

            // mint-and-sell risk to cover `under`
            uint under = sin - joy;

            // pay down as much sin as possible
            if (joy > 1) {
                // gas - don't zero joy
                joy = _heal(joy - 1);
            }

            // deal decreases as system becomes undercollateralized
            // i.e. if it's very undercollateralized then bank deduces
            // that it's overpricing RISK
            uint debt  = vatS.debt;
            uint deal  = rdiv(debt, debt + under);
            uint mash  = rmul(vowS.plot.pop, rpow(deal, vowS.plot.pep));

            // rate-limit flop
            uint elapsed = min(block.timestamp - vowS.ramp.bel, vowS.ramp.cel);
            uint flop    = elapsed * wmul(vowS.ramp.rel, risk.totalSupply());
            if (0 == flop) revert ErrReflop();

            // swap RISK for rico to cover sin
            uint earn = rmul(flop, rmul(_price(), mash));
            uint bel  = block.timestamp;
            if (earn > under) {
                // always advances >= 1s from max(vowS.bel, timestamp - cel)
                bel  -= wmul(elapsed, WAD - wdiv(under, earn));
                flop  = flop * under / earn;
                earn  = under;
            }

            // update last flop stamp
            vowS.ramp.bel = bel;
            emit NewPalm0('bel', bytes32(bel));

            Gem(rico).burn(msg.sender, earn);
            Gem(risk).mint(msg.sender, flop);

            // new joy will heal some sin in next flop
            joy     += earn;
            vatS.joy = joy;
            emit NewPalm0('joy', bytes32(joy));

        }
    }

    function _heal(uint wad) internal returns (uint joy) {
        VatStorage storage vs = getVatStorage();

        vs.sin  = vs.sin  - (wad * RAY);
        emit NewPalm0('sin', bytes32(vs.sin));

        vs.joy  = (joy = vs.joy - wad);
        emit NewPalm0('joy', bytes32(joy));

        vs.debt = vs.debt - wad;
        emit NewPalm0('debt', bytes32(vs.debt));
    }

    function _price() internal view returns (uint) {
        BankStorage storage bankS = getBankStorage();
        VowStorage  storage vowS  = getVowStorage();
        (bytes32 _val, uint ttl)  = bankS.fb.pull(vowS.rudd.src, vowS.rudd.tag);
        if (ttl < block.timestamp) revert ErrOutDated();
        return uint(_val);
    }

}
