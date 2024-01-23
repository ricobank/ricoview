import '../../lib/gemfab/src/gem.sol';
// these are here because prover creates exactly one instance per contract
contract Gem0 is Gem {
    constructor(bytes32 name, bytes32 symbol) Gem(name, symbol) {}
}
contract Gem1 is Gem {
    constructor(bytes32 name, bytes32 symbol) Gem(name, symbol) {}
}

