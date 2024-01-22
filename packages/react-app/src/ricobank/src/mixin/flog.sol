/// SPDX-License-Identifier: AGPL-3.0

// Copyright (C) 2021-2023 halys

pragma solidity ^0.8.19;

abstract contract Flog {
    event NewFlog(
        address indexed caller
      , bytes4 indexed sig
      , bytes data
    );

    modifier _flog_ {
        emit NewFlog(msg.sender, msg.sig, msg.data);
        _;
    }
}
