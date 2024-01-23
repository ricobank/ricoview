// vow spec

using Gem1 as RISK
using Gem0 as RICO
using Vat as vat
using DutchFlower as flow
methods {
    keep(bytes32[] calldata) returns (uint)
    bail(bytes32,address) returns (uint)
    drip(bytes32)
    grant(address)
    pair(address,bytes32,uint)
    vel() returns (uint) envfree
    rel() returns (uint) envfree
    bel() returns (uint) envfree
    cel() returns (uint) envfree
    RICO.totalSupply() returns (uint) envfree
    RISK.totalSupply() returns (uint) envfree
    RISK.balanceOf(address) returns (uint) envfree
    RICO.balanceOf(address) returns (uint) envfree
    grabhook(address,bytes32,address,uint,uint,uint,address payable) returns (uint) => DISPATCHER(true)
    selfaddr() returns (address) envfree
    vat.sin(address) returns (uint) envfree
}

rule riskMintFollowsRamp {
    env e; method f; calldataarg args;
    mathint WAD = 10 ^ 18;
    mathint RAY = 10 ^ 27;
    mathint risksupply = RISK.totalSupply();
    mathint toburn = RISK.balanceOf(selfaddr());
    require toburn <= risksupply;
 
    mathint sloperel = to_mathint(rel()) * to_mathint(risksupply - toburn) / WAD;
    mathint slopevel = vel();
    mathint slope = sloperel < slopevel ? sloperel : slopevel;

    require vat.sin(selfaddr()) / RAY > RICO.balanceOf(selfaddr());

    require f.selector == keep(bytes32[]).selector || f.selector == bail(bytes32, address).selector;
    uint elapsed = e.block.timestamp - bel();

    bytes32[] ilks;
    require(ilks.length == 0);
    uint aid = keep(e, ilks);

    assert RISK.totalSupply() - (risksupply - toburn) <= slope * elapsed;
    assert RISK.totalSupply() - (risksupply - toburn) == slope * (elapsed < cel() ? elapsed : cel());
}
