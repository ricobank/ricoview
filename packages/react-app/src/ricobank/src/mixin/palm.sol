/// SPDX-License-Identifier: AGPL-3.0

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;

abstract contract Palm {
    event NewPalm0(
        bytes32 indexed key
      , bytes32 val
    );
    event NewPalm1(
        bytes32 indexed key
      , bytes32 indexed idx0
      , bytes32 val
    );
    event NewPalm2(
        bytes32 indexed key
      , bytes32 indexed idx0
      , bytes32 indexed idx1
      , bytes32 val
    );
    event NewPalmBytes2(
        bytes32 indexed key
      , bytes32 indexed idx0
      , bytes32 indexed idx1
      , bytes val
    );
}
