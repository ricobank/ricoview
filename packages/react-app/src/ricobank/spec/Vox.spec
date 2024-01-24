// vox spec

using Vat as vat
methods {
    poke()
    way() returns (uint) envfree
    cap() returns (uint) envfree
    how() returns (uint) envfree
    tau() returns (uint) envfree
    file(bytes32,bytes32)

    vat.par() returns (uint) envfree
}

ghost ghostcap() returns mathint {
    axiom ghostcap() >= 10 ^ 27;
}

invariant noWayPastCap()
    way() <= cap() && way() >= (10 ^ 27) * (10 ^ 27) / cap()
    filtered {
        f -> f.selector != file(bytes32,bytes32).selector
    }
    { preserved { 
        require cap() == ghostcap(); 
        require how() >= 10 ^ 27;
    }}

rule wayIsPriceRate {
    env e; method f; 

    uint waybefore = way();
    uint parbefore = vat.par();

    mathint RAY = 10 ^ 27;
    require e.block.timestamp == tau() + 1;
    require cap() >= RAY;
    require waybefore >= RAY * RAY / cap() || waybefore <= cap();

    poke(e);

    assert vat.par() == parbefore * waybefore / RAY;
}

