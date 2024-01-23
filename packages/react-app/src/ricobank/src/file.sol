// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;
import { Gem }  from '../lib/gemfab/src/gem.sol';
import { Feedbase } from '../lib/feedbase/src/Feedbase.sol';
import { Bank } from './bank.sol';

contract File is Bank {
    error ErrHighToll();
    error ErrHighWel();

    function file(bytes32 key, bytes32 val) onlyOwner _flog_ external {
        VatStorage storage vatS = getVatStorage();
        VowStorage storage vowS = getVowStorage();
        VoxStorage storage voxS = getVoxStorage();
        BankStorage storage bankS = getBankStorage();
        // bank
        if (key == "rico") { bankS.rico = Gem(address(bytes20(val))); }
        else if (key == 'fb') { bankS.fb = Feedbase(address(bytes20(val))); }
        // vat
        else if (key == "ceil") { vatS.ceil = uint(val); }
        else if (key == "par") { vatS.par = uint(val); }
        // vow
        else if (key == "rel") { vowS.ramp.rel = uint(val); }
        else if (key == "bel") { vowS.ramp.bel = uint(val); }
        else if (key == "cel") { vowS.ramp.cel = uint(val); }
        else if (key == "wel") {
            if (uint(val) > WAD) revert ErrHighWel();
            vowS.ramp.wel = uint(val);
        }
        else if (key == "toll") { 
            if (uint(val) > RAY) revert ErrHighToll();
            vowS.toll = uint(val);
        }
        else if (key == "plot.pep") { vowS.plot.pep = uint(val); }
        else if (key == "plat.pep") { vowS.plat.pep = uint(val); }
        else if (key == "plot.pop") { vowS.plot.pop = uint(val); }
        else if (key == "plat.pop") { vowS.plat.pop = uint(val); }
        else if (key == "rudd.src") { vowS.rudd.src = address(bytes20(bytes32(val))); }
        else if (key == "rudd.tag") { vowS.rudd.tag = val; }
        else if (key == 'risk') { vowS.RISK = Gem(address(bytes20(val))); }
        // vox
        else if (key == "tip.src") { voxS.tip.src = address(bytes20(val)); }
        else if (key == "tip.tag") { voxS.tip.tag = val; }
        else if (key == "how") { voxS.how = uint256(val); }
        else if (key == "cap") { voxS.cap = uint256(val); }
        else if (key == "tau") { voxS.tau = uint256(val); }
        else if (key == "way") { voxS.way = uint256(val); }
        else revert ErrWrongKey();
        emit NewPalm0(key, val);
    }

    function rico() external view returns (Gem) {return getBankStorage().rico;}
    function fb() external view returns (Feedbase) {return getBankStorage().fb;}
}
