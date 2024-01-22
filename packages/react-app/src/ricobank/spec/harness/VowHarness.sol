pragma solidity 0.8.19;
import '../../src/vow.sol';

contract VowHarness is Vow {
    function vel() view external returns (uint) {
        return ramp.vel;
    }
    function rel() view external returns (uint) {
        return ramp.rel;
    }
    function bel() view external returns (uint) {
        return ramp.bel;
    }
    function cel() view external returns (uint) {
        return ramp.cel;
    }
    function selfaddr() view external returns (address) {
        return self;
    }
}
