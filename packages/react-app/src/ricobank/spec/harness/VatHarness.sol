pragma solidity 0.8.19;
import { Vat } from '../../src/vat.sol';
import { Hook } from '../../src/hook/hook.sol';

contract VatHarness is Vat {
    function rack(bytes32 i) external returns (uint) {
        return ilks[i].rack;
    }

    function art(bytes32 i, address u) external returns (uint) {
        return urns[i][u].art;
    }

    function tart(bytes32 i) external returns (uint) {
        return ilks[i].tart;
    }

    function self() external returns (address) {
        return address(this);
    }

    function hookie(bytes32 i) external returns (address) {
        return ilks[i].hook;
    }

    function rho(bytes32 i) external returns (uint) {
        return ilks[i].rho;
    }

}
