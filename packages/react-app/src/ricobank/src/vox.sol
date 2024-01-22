// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2021-2023 halys

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity ^0.8.19;

import { Bank } from './bank.sol';

// price rate controller
// ensures that market price (mar) roughly tracks par
// note that price rate (way) can be less than 1
// this is how the system achieves negative effective borrowing rates
// if quantity rate is 1%/yr (fee > RAY) but price rate is -2%/yr (way < RAY)
// borrowers are rewarded about 1%/yr for borrowing and shorting rico
contract Vox is Bank {
    function way() external view returns (uint256) {return getVoxStorage().way;}
    function how() external view returns (uint256) {return getVoxStorage().how;}
    function tau() external view returns (uint256) {return getVoxStorage().tau;}
    function cap() external view returns (uint256) {return getVoxStorage().cap;}
    function tip() external view returns (Rudd memory) {return getVoxStorage().tip;}

    // poke par and way
    function poke() _flog_ external {
        VatStorage storage vatS = getVatStorage();
        VoxStorage storage voxS = getVoxStorage();

        // get time diff, update tau
        uint tau_ = voxS.tau;
        if (tau_ == block.timestamp) return;
        uint dt   = block.timestamp - tau_;
        voxS.tau  = block.timestamp;
        emit NewPalm0('tau', bytes32(block.timestamp));

        // use previous `way` to grow `par` to keep par updates predictable
        uint par_ = vatS.par;
        uint way_ = voxS.way;
        par_      = grow(par_, way_, dt);
        vatS.par  = par_;
        emit NewPalm0('par', bytes32(par_));

        // pull mar
        // forgo way updates if the feed can't be sensed
        (bytes32 mar, uint ttl) = getBankStorage().fb.pull(voxS.tip.src, voxS.tip.tag);
        if (block.timestamp > ttl) { return; }

        // raise the price rate (way) when mar < par, lower when mar > par
        // this is how mar tracks par
        if (uint(mar) < par_) {
            way_ = min(voxS.cap, grow(way_, voxS.how, dt));
        } else if (uint(mar) > par_) {
            way_ = max(rinv(voxS.cap), grow(way_, rinv(voxS.how), dt));
        }
        voxS.way = way_;
        emit NewPalm0('way', bytes32(way_));
    }
}
