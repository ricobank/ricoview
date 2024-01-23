// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;

import { Bank } from '../bank.sol';

interface Hook {
    struct FHParams {
        address sender;
        bytes32 i;
        address u;
        bytes   dink;
        int     dart;
    }
    struct BHParams {
        bytes32 i;
        address u;
        uint    bill;
        uint    owed;
        address keeper;
        uint    deal;
        uint    tot;
    }

    function frobhook(FHParams calldata) external returns (bool safer);
    function bailhook(BHParams calldata) external returns (bytes memory);
    function safehook(bytes32 i, address u) view external
      returns (uint tot, uint cut, uint minttl);
    function ink(bytes32 i, address u) external view returns (bytes memory);
}

abstract contract HookMix is Hook, Bank {

    // Sync with vat. Update joy and possibly line. Workaround for stack too deep
    function vsync(bytes32 i, uint earn, uint owed, uint over) internal {
        VatStorage storage vs = getVatStorage();

        if (earn < owed) {
            // drop line value for this ilk as precaution
            uint prev = vs.ilks[i].line;
            uint loss = RAY * (owed - earn);
            uint next = loss > prev ? 0 : prev - loss;
            vs.ilks[i].line = next;
            emit NewPalm1('line', i, bytes32(next));
        }

        // update joy to help cancel out sin
        uint mood = vs.joy + earn - over;
        vs.joy = mood;
        emit NewPalm0('joy', bytes32(mood));
    }
}
