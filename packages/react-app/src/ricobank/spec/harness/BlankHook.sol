pragma solidity 0.8.19;

contract BlankHook {
    function frobhook(
        address urn, bytes32 i, address u, bytes calldata dink, int dart
    ) external {}
    function grabhook(
        address urn, bytes32 i, address u, uint art, uint bill, address payable keeper
    ) external returns (uint) { return 0; }
    function safehook(bytes32 i, address u) view external returns (bytes32, uint) {
        return (bytes32(uint(10 ** 27)), type(uint).max);
    }
}
