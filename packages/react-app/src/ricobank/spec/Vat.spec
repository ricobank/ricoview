// vat spec

using Gem as rico
using BlankHook as blankhook
methods {
    hookie(bytes32) returns (address) envfree
    frob(bytes32,address,bytes,int)
    grab(bytes32,address,address)
    heal(uint)
    drip(bytes32)
    urns(bytes32, address) returns (uint) envfree
    flash(address code, bytes data)
    ilks(bytes32) returns (uint,uint,uint,uint,uint,uint,uint,uint,address)
    rack(bytes32) returns (uint) envfree
    rho(bytes32) returns (uint) envfree
    art(bytes32, address) returns (uint) envfree
    tart(bytes32) returns (uint) envfree
    rico() returns (address) envfree
    debt() returns (uint) envfree
    rest() returns (uint) envfree
    init(bytes32, address)
    sin(address) returns (uint) envfree

    rico.totalSupply() returns (uint) envfree
    rico.balanceOf(address) returns (uint) envfree
    rico.wards(address) returns (bool) envfree
    rico.mint(address,uint)

    wards(address) returns (bool) envfree
    self() returns (address) envfree

    frobhook(address,bytes32,address,bytes,int) => DISPATCHER(true)
    grabhook(address,bytes32,address,uint,uint,address payable) returns (uint) => DISPATCHER(true)
    safehook(bytes32,address) returns (uint) => DISPATCHER(true)
}

// frob increases debt and art by dart * rack
ghost mapping(bytes32=>mathint) sum_of_arts {
    init_state axiom (forall bytes32 i . sum_of_arts[i] == 0);
}
hook Sstore urns[KEY bytes32 i][KEY address u].art uint newval (uint oldval) STORAGE {
    sum_of_arts[i] = sum_of_arts[i] + (to_mathint(newval) - to_mathint(oldval));
}

// Prevent large rico balances > total supply
ghost mathint ghostRicoSupply {
    init_state axiom (ghostRicoSupply == 0);
}
hook Sstore rico.balanceOf[KEY address a] uint256 balance (uint256 old_balance) STORAGE {
    ghostRicoSupply = ghostRicoSupply + (balance - old_balance);
}
hook Sload uint v rico.totalSupply STORAGE {
    require v == ghostRicoSupply;
}

ghost mathint sum_of_tartracks {
    init_state axiom (sum_of_tartracks == 0);
}

// rack
ghost mapping(bytes32=>mathint) rackghost {
    init_state axiom (forall bytes32 i . rackghost[i] == 0);
}

ghost mapping(bytes32=>mathint) tartghost {
    init_state axiom (forall bytes32 i . tartghost[i] == 0);
}

hook Sload uint v ilks[KEY bytes32 i].rack STORAGE {
    require rackghost[i] == v && rackghost[i] >= 10 ^ 27;
}

hook Sstore ilks[KEY bytes32 i].rack uint newval (uint oldval) STORAGE {
    rackghost[i] = newval;
    sum_of_tartracks = sum_of_tartracks + (tartghost[i] * to_mathint(newval)) - (tartghost[i] * to_mathint(oldval));
}

// sum(tart(i) * rack(i) / 10 ^ 27)
hook Sstore ilks[KEY bytes32 i].tart uint newval (uint oldval) STORAGE {
    tartghost[i] = newval;
    sum_of_tartracks = sum_of_tartracks + (rackghost[i] * to_mathint(newval)) - (rackghost[i] * to_mathint(oldval));
}

hook Sload uint v ilks[KEY bytes32 i].tart STORAGE {
    require tartghost[i] == v;
}

invariant ilkUninitializedIfRackIs(bytes32 i)
    rack(i) != 0 || tart(i) == 0

// ilks[i].tart == sum_u(urns[i][u].art)
invariant tartIsSumOfArts(bytes32 i)
    to_mathint(tart(i)) == sum_of_arts[i]
    { preserved { requireInvariant ilkUninitializedIfRackIs(i); } }

// only one vat => rico.totalSupply() == debt()
invariant debtEqualsSupply()
    to_mathint(rico.totalSupply()) == debt()

ghost mathint sum_of_sins {
    init_state axiom sum_of_sins == 0;
}

hook Sstore sin[KEY address vow] uint newval (uint oldval) STORAGE {
    sum_of_sins = sum_of_sins + (to_mathint(newval) - to_mathint(oldval));
}

invariant fundie()
    sum_of_tartracks + sum_of_sins == to_mathint(debt()) * (10 ^ 27) + to_mathint(rest())

rule urnStaysSafeWithoutFeedOrRackChange {
    env e; method f; bytes32 i; address u; calldataarg args; uint sel;

    // safehook is dispatched to return (RAY, UINT_MAX)
    uint    rackbefore = rack(i);

    require safe(e, i, u) == 2;

    // need to do this because cant figure out how to summarize
    // a function that returns a tuple
    if (sel == 0) {
        drip(e, i);
    } else if (sel == 1) {
        address k;
        grab(e, i, u, k);
    } else if (sel == 2) {
        address h;
        init(e, i, h);
    } else if (sel == 3) {
        uint wad;
        heal(e, wad);
    }

    require rack(i) == rackbefore;
    assert safe(e, i, u) == 2;
}

// todo hook steal ink test
rule noAddingArtToOtherAddr {
    env ali; env bob; bytes32 i; method f; calldataarg args;

    uint artali = art(i, ali.msg.sender);
    require ali.msg.sender != bob.msg.sender;
    require f.selector != grab(bytes32,address,address).selector;

    f(bob, args);

    assert art(i, ali.msg.sender) <= artali;
}
