pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import { UniSetUp, PoolArgs, Asset } from "../test/UniHelper.sol";

import { Ball } from '../src/ball.sol';
import { INonfungiblePositionManager } from './Univ3Interface.sol';
import { Gem, GemFab } from '../lib/gemfab/src/gem.sol';
import { Feedbase } from '../lib/feedbase/src/Feedbase.sol';
import { Divider } from '../lib/feedbase/src/combinators/Divider.sol';
import { Medianizer } from '../lib/feedbase/src/Medianizer.sol';
import { UniswapV3Adapter } from "../lib/feedbase/src/adapters/UniswapV3Adapter.sol";
import { Vat } from '../src/vat.sol';
import { BaseHelper, WethLike } from './BaseHelper.sol';
import { ChainlinkAdapter } from "../lib/feedbase/src/adapters/ChainlinkAdapter.sol";
import { TWAP } from "../lib/feedbase/src/combinators/TWAP.sol";
import { Progression } from "../lib/feedbase/src/combinators/Progression.sol";
import { Vow } from "../src/vow.sol";
import { ERC20Hook } from '../src/hook/ERC20hook.sol';
import { Vox } from "../src/vox.sol";
import { Bank } from '../src/bank.sol';
import { File } from '../src/file.sol';
import { BankDiamond } from '../src/diamond.sol';

contract BallTest is BaseHelper {
    bytes32 internal constant RAI_ETH_TAG  = "rai:eth";
    bytes32 internal constant RAI_REF_TAG  = "rai:ref";
    bytes32 internal constant RICO_DAI_TAG = "rico:dai";

    uint160 constant risk_price = 2 ** 96;
    uint256 constant INIT_SQRTPAR = RAY * 2;
    uint256 constant INIT_PAR = (INIT_SQRTPAR ** 2) / RAY;
    uint256 constant wethamt = WAD;
    
    ChainlinkAdapter cladapt;
    UniswapV3Adapter uniadapt;
    Divider divider;
    Medianizer mdn;
    Feedbase fb;
    GemFab gf;
    address me;
    INonfungiblePositionManager npfm = INonfungiblePositionManager(NFPM);

    address rico;
    address risk;
    address ricodai;
    address ricorisk;
    int256  safedart;
    bytes32[] ilks;
    uint DEV_FUND_RISK = 1000000 * WAD;
    uint DUST = 90 * RAD / 2000;
    uint start_time;

    ERC20Hook hook;
    Vat vat;
    Vow vow;
    Vox vox;

    function advance_chainlink() internal {
        // time has skipped ahead while forked chainlink static, give adapters extra ttl equal to skipped time
        uint skipped = block.timestamp + 100_000 - start_time;
        address agg; uint ttl; uint precision;
        bytes32[4] memory tags = [XAU_USD_TAG, DAI_USD_TAG, WETH_USD_TAG, RAI_ETH_TAG];
        for(uint i; i < tags.length; i++) {
            (agg, ttl, precision) = cladapt.configs(tags[i]);
            cladapt.setConfig(tags[i], ChainlinkAdapter.Config(agg, ttl + skipped, RAY));
        }
    }

    function look_poke() internal {
        advance_chainlink();
        mdn.poke(RISK_RICO_TAG);
        mdn.poke(WETH_REF_TAG);
        mdn.poke(RAI_REF_TAG);
    }

    function setUp() public {
        start_time = block.timestamp;
        me = address(this);
        gf = new GemFab();
        fb = new Feedbase();
        rico = address(gf.build(bytes32("Rico"), bytes32("RICO")));
        risk = address(gf.build(bytes32("Rico Riskshare"), bytes32("RISK")));
        uint160 sqrt_ratio_x96 = get_rico_sqrtx96(INIT_PAR);
        ricodai = create_pool(rico, DAI, 500, sqrt_ratio_x96);
        ricorisk = create_pool(rico, risk, RISK_FEE, risk_price);

        Ball.IlkParams[] memory ips = new Ball.IlkParams[](2);
        ilks = new bytes32[](2);
        ilks[0] = WETH_ILK;
        ilks[1] = RAI_ILK;
        ips[0] = Ball.IlkParams(
            'weth',
            WETH,
            address(0),
            WETH_USD_AGG,
            RAY, // chop
            DUST, // dust
            1000000001546067052200000000, // fee
            100000 * RAD, // line
            RAY, // liqr
            20000, // ttl
            1 // range
        );
        ips[1] = Ball.IlkParams(
            'rai',
            RAI,
            RAI_ETH_AGG,
            address(0),
            RAY, // chop
            DUST, // dust
            1000000001546067052200000000, // fee
            100000 * RAD, // line
            RAY, // liqr
            20000, // ttl
            1 // range
        );

        address uniwrapper = make_uniwrapper();
        bank = make_diamond();
        Ball.UniParams memory ups = Ball.UniParams(
            NFPM,
            ':uninft',
            1000000001546067052200000000,
            RAY,
            8,
            uniwrapper
        );

        Ball.BallArgs memory bargs = Ball.BallArgs(
            bank,
            address(fb),
            rico,
            risk,
            ricodai,
            ricorisk,
            uniwrapper,
            INIT_PAR,
            100000 * WAD,
            20000, // ricodai
            BANKYEAR * 100,
            BANKYEAR, // daiusd
            BANKYEAR, // xauusd
            2,    // plat.pep
            RAY,  // plat.pop
            2,    // plot.pep
            RAY,  // plot.pop
            Bank.Ramp(WAD / BLN, block.timestamp, 1, WAD),
            DAI,
            DAI_USD_AGG,
            XAU_USD_AGG
        );

        Ball ball = new Ball(bargs);
        BankDiamond(bank).transferOwnership(address(ball));
        ball.setup(bargs);
        ball.makeilk(ips[0]);
        ball.makeilk(ips[1]);
        ball.makeuni(ups);
        ball.approve(me);
        BankDiamond(bank).acceptOwnership();

        Gem(rico).ward(bank, true);
        Gem(risk).ward(bank, true);

        vat = ball.vat();
        cladapt = ball.cladapt();
        uniadapt = ball.uniadapt();
        divider = ball.divider();
        mdn = ball.mdn();

        skip(BANKYEAR / 2);
        look_poke();

        hook = ball.hook();
        vm.prank(VAULT);
        Gem(DAI).transfer(address(this), 500 * WAD);
        Gem(WETH).approve(bank, type(uint).max);
        WethLike(WETH).deposit{value: wethamt * 100}();

        vow = ball.vow();
        vox = ball.vox();

        Gem(risk).mint(address(this), DEV_FUND_RISK);

        // find a rico borrow amount which will be safe by about 10%
        (bytes32 val,) = fb.pull(address(mdn), WETH_REF_TAG);
        // weth * wethref = art * par
        safedart = int(wethamt * uint(val) / INIT_PAR * 10 / 11);
    }

    modifier _flap_after_ {
        _;
        Gem(risk).mint(me, 10000 * WAD);
        for(uint i; i < ilks.length; ++i) {
            Vat(bank).drip(ilks[i]);
        }

        uint pre_bank_risk = Gem(risk).balanceOf(bank);
        uint pre_bank_rico = Gem(rico).balanceOf(bank);
        uint pre_bank_joy  = Vat(bank).joy();
        uint pre_user_risk = Gem(risk).balanceOf(me);
        uint pre_user_rico = Gem(rico).balanceOf(me);
        uint pre_risk_sup  = Gem(risk).totalSupply();

        Vow(bank).keep(ilks);

        uint aft_bank_risk = Gem(risk).balanceOf(bank);
        uint aft_bank_rico = Gem(rico).balanceOf(bank);
        uint aft_bank_joy  = Vat(bank).joy();
        uint aft_user_risk = Gem(risk).balanceOf(me);
        uint aft_user_rico = Gem(rico).balanceOf(me);
        uint aft_risk_sup  = Gem(risk).totalSupply();

        // user should lose risk and gain rico
        // system should lose joy and decrease supply of risk
        // system tokens should remain zero

        assertEq(pre_bank_risk, aft_bank_risk);
        assertEq(pre_bank_rico, aft_bank_rico);
        assertGt(pre_bank_joy,  aft_bank_joy);
        assertGt(pre_user_risk, aft_user_risk);
        assertLt(pre_user_rico, aft_user_rico);
        assertGt(pre_risk_sup,  aft_risk_sup);
    }

    modifier _flop_after_ {
        _;
        vm.expectCall(risk, abi.encodePacked(Gem(risk).mint.selector));
        Vow(bank).keep(ilks);
    }

    modifier _balanced_after_ {
        _;
        // should not be any auctions
        uint me_risk_1 = Gem(risk).balanceOf(me);
        uint me_rico_1 = Gem(rico).balanceOf(me);

        Vow(bank).keep(ilks);

        uint me_risk_2 = Gem(risk).balanceOf(me);
        uint me_rico_2 = Gem(rico).balanceOf(me);

        // burned one risk for rounding
        uint expected_me_risk = Vat(bank).sin() == 0 ? me_risk_2 + 1 : me_risk_2;
        assertEq(me_risk_1, expected_me_risk);
        assertEq(me_rico_1, me_rico_2);
    }

    function test_basic() public {
        // at block 16445606 ethusd about 1554, xau  about 1925
        // initial par is 4, so ricousd should be 1925*4

        (bytes32 val,) = fb.pull(address(divider), RICO_REF_TAG);
        uint vox_price = uint(val);
        assertGt(uint(vox_price), INIT_PAR * 99 / 100);
        assertLt(uint(vox_price), INIT_PAR * 100 / 99);

        (val,) = fb.pull(address(mdn), WETH_REF_TAG);
        assertClose(uint(val), 1554 * RAY / 1925, 100);
    }

    function test_eth_denominated_ilks_feed() public {
        look_poke();
        (bytes32 rai_ref_price,)  = fb.pull(address(mdn), RAI_REF_TAG);
        (bytes32 weth_ref_price,) = fb.pull(address(mdn), WETH_REF_TAG);
        (bytes32 rai_weth_price,)  = fb.pull(address(cladapt), RAI_ETH_TAG);
        assertClose(rdiv(uint(rai_ref_price), uint(weth_ref_price)), uint(rai_weth_price), 1000);
    }

    function test_ball_1() public {
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(wethamt), safedart);
        vm.expectRevert(Vat.ErrNotSafe.selector);
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(int(0)), safedart);
    }

    function test_fee_bail_flop() public _flop_after_ {
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(wethamt), safedart);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(WETH_ILK, me);
        skip(BANKYEAR * 100);
        // revert bc feed data old
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(WETH_ILK, me);
        look_poke();
        Vow(bank).keep(ilks);
        uint meweth = WethLike(WETH).balanceOf(me);
        Gem(rico).mint(me, 1000000 * WAD);
        Vat(bank).bail(WETH_ILK, me);
        assertGt(WethLike(WETH).balanceOf(me), meweth);
    }


    function test_ball_flap() public _flap_after_ {
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(wethamt), safedart);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(WETH_ILK, me);
    }

    // user pays down the urn first, then try to flap
    function test_ball_pay_flap_1() public {
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(wethamt), safedart);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(WETH_ILK, me);
        skip(BANKYEAR * 100); advance_chainlink(); look_poke();

        uint artleft = Vat(bank).urns(WETH_ILK, me);
        uint inkleft = _ink(WETH_ILK, me);

        uint rack = Vat(bank).ilks(WETH_ILK).rack;
        uint dust = Vat(bank).ilks(WETH_ILK).dust;
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(int(0)), -int((artleft * rack - dust) / rack));
        uint artleftafter = Vat(bank).urns(WETH_ILK, me);
        uint inkleftafter = _ink(WETH_ILK, me);
        assertEq(inkleftafter, inkleft);
        assertEq(artleftafter, dust / rack);

        uint self_risk_1 = Gem(risk).balanceOf(me);
        Vow(bank).keep(ilks);
        uint self_risk_2 = Gem(risk).balanceOf(me);
        assertLt(self_risk_2, self_risk_1);
    }

    function test_ball_pay_flap_success() public  _balanced_after_ {
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(wethamt), safedart);
        vm.expectRevert(Vat.ErrSafeBail.selector);
        Vat(bank).bail(WETH_ILK, me);
        skip(BANKYEAR * 100); look_poke();

        uint artleft = Vat(bank).urns(WETH_ILK, me);
        uint inkleft = _ink(WETH_ILK, me);
        Vow(bank).keep(ilks); // drips
        Gem(rico).mint(me, artleft * 1000);
        uint rack = Vat(bank).ilks(WETH_ILK).rack;
        uint dust = Vat(bank).ilks(WETH_ILK).dust;
        Vat(bank).frob(WETH_ILK, me, abi.encodePacked(int(0)), -int((artleft * rack - dust) / rack));
        uint artleftafter = Vat(bank).urns(WETH_ILK, me);
        uint inkleftafter = _ink(WETH_ILK, me);
        assertEq(inkleftafter, inkleft);
        assertGt(artleftafter, dust / rack * 999 / 1000);
        assertLt(artleftafter, dust / rack * 1000 / 999);
        // balanced now because already kept
    }

    function test_ward() public {
        File(bank).file('ceil', bytes32(WAD));
        assertEq(BankDiamond(bank).owner(), address(this));

        vm.prank(VAULT);
        vm.expectRevert("Ownable: sender must be owner");
        File(bank).file('ceil', bytes32(WAD));

        BankDiamond(bank).transferOwnership(VAULT);
        assertEq(BankDiamond(bank).owner(), address(this));

        vm.prank(VAULT);
        vm.expectRevert("Ownable: sender must be owner");
        File(bank).file('ceil', bytes32(WAD));

        File(bank).file('ceil', bytes32(WAD));

        vm.prank(VAULT);
        BankDiamond(bank).acceptOwnership();
        assertEq(BankDiamond(bank).owner(), VAULT);

        vm.expectRevert("Ownable: sender must be owner");
        File(bank).file('ceil', bytes32(WAD));

        vm.prank(VAULT);
        File(bank).file('ceil', bytes32(WAD));
    }
}
