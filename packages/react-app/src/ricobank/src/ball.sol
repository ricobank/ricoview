/// SPDX-License-Identifier: AGPL-3.0

// Copyright (C) 2021-2023 halys

// The cannonball is the canonical deployment sequence
// implemented as one big contract. You can diff more
// efficient deployment sequences against the result of
// this one.

pragma solidity ^0.8.19;

import {Diamond, IDiamondCuttable} from '../lib/solidstate-solidity/contracts/proxy/diamond/Diamond.sol';
import {Block} from "../lib/feedbase/src/mixin/Read.sol";
import {ChainlinkAdapter} from "../lib/feedbase/src/adapters/ChainlinkAdapter.sol";
import {Divider} from "../lib/feedbase/src/combinators/Divider.sol";
import {Feedbase} from "../lib/feedbase/src/Feedbase.sol";
import {Medianizer} from "../lib/feedbase/src/Medianizer.sol";
import {Multiplier} from "../lib/feedbase/src/combinators/Multiplier.sol";
import {UniswapV3Adapter, IUniWrapper} from "../lib/feedbase/src/adapters/UniswapV3Adapter.sol";
import {Ward} from "../lib/feedbase/src/mixin/ward.sol";

import {Vat} from './vat.sol';
import {Vow} from './vow.sol';
import {Vox} from './vox.sol';
import {File} from './file.sol';
import {Math} from './mixin/math.sol';
import {ERC20Hook} from './hook/ERC20hook.sol';
import {UniNFTHook} from './hook/nfpm/UniV3NFTHook.sol';

contract Ball is Math, Ward {
    bytes32 internal constant RICO_DAI_TAG  = "rico:dai";
    bytes32 internal constant RICO_USD_TAG  = "rico:usd";
    bytes32 internal constant XAU_USD_TAG   = "xau:usd";
    bytes32 internal constant DAI_USD_TAG   = "dai:usd";
    bytes32 internal constant RICO_REF_TAG  = "rico:ref";
    bytes32 internal constant RISK_RICO_TAG = "risk:rico";
    bytes32 internal constant WETH_USD_TAG  = "weth:usd";
    bytes32 internal constant HOW = bytes32(uint(1000000000000003652500000000));
    bytes32 internal constant CAP = bytes32(uint(1000000021970000000000000000));
    bytes32[] internal empty = new bytes32[](0);
    IDiamondCuttable.FacetCutAction internal constant ADD = IDiamondCuttable.FacetCutAction.ADD;

    Vat public vat;
    Vow public vow;
    Vox public vox;
    ERC20Hook public hook;
    UniNFTHook public nfthook;
    address public feedbase;

    Medianizer public mdn;
    UniswapV3Adapter public uniadapt;
    Divider public divider;
    Multiplier public multiplier;
    ChainlinkAdapter public cladapt;
    address payable public bank;
    File public file;

    struct IlkParams {
        bytes32 ilk;
        address gem;
        address gemethagg;
        address gemusdagg;
        uint256 chop;
        uint256 dust;
        uint256 fee;
        uint256 line;
        uint256 liqr;
        uint256 ttl;
        uint256 range;
    }

    struct UniParams {
        address nfpm;
        bytes32 ilk;
        uint256 fee;
        uint256 chop;
        uint256 room;
        address uniwrapper;
    }

    struct BallArgs {
        address payable bank; // diamond
        address feedbase;
        address rico;
        address risk;
        address ricodai;
        address ricorisk;
        address uniwrapper;
        uint256 par;
        uint256 ceil;
        uint256 adaptrange;
        uint256 adaptttl;
        uint256 daiusdttl;
        uint256 xauusdttl;
        uint256 platpep;
        uint256 platpop;
        uint256 plotpep;
        uint256 plotpop;
        Vow.Ramp mintramp;
        address DAI;
        address DAI_USD_AGG;
        address XAU_USD_AGG;
    }

    address public rico;
    address public risk;

    constructor(BallArgs memory args) {
        vat  = new Vat();
        vow  = new Vow();
        vox  = new Vox();
        file = new File();
        hook = new ERC20Hook();
        nfthook = new UniNFTHook();

        mdn = new Medianizer(args.feedbase);
        uniadapt = new UniswapV3Adapter(Feedbase(args.feedbase), IUniWrapper(args.uniwrapper));
        cladapt = new ChainlinkAdapter(args.feedbase);
        divider = new Divider(args.feedbase);
        multiplier = new Multiplier(args.feedbase);

        bank = args.bank;
        rico = args.rico;
        risk = args.risk;
        feedbase = args.feedbase;

        // rico/usd, rico/ref
        cladapt.setConfig(XAU_USD_TAG, ChainlinkAdapter.Config(args.XAU_USD_AGG, args.xauusdttl, RAY));
        cladapt.setConfig(DAI_USD_TAG, ChainlinkAdapter.Config(args.DAI_USD_AGG, args.daiusdttl, RAY));
        // rico/dai, dai/rico (== 1 / (rico/dai))
        uniadapt.setConfig(
            RICO_DAI_TAG,
            UniswapV3Adapter.Config(args.ricodai, args.adaptrange, args.adaptttl, args.DAI < args.rico)
        );

        _configureBlock(multiplier, RICO_USD_TAG,
                       address(cladapt),  DAI_USD_TAG,
                       address(uniadapt), RICO_DAI_TAG);
        _configureBlock(divider, RICO_REF_TAG,
                       address(multiplier), RICO_USD_TAG,
                       address(cladapt),    XAU_USD_TAG);

        // risk:rico
        uniadapt.setConfig(
            RISK_RICO_TAG,
            UniswapV3Adapter.Config(args.ricorisk, args.adaptrange, args.adaptttl, args.risk < args.rico)
        );
        Medianizer.Config memory mdnconf = Medianizer.Config(new address[](1), new bytes32[](1), 1);
        mdnconf.srcs[0] = address(uniadapt); mdnconf.tags[0] = RISK_RICO_TAG;
        mdn.setConfig(RISK_RICO_TAG, mdnconf);
    }

    function setup(BallArgs calldata args) _ward_ external {
        IDiamondCuttable.FacetCut[] memory facetCuts = new IDiamondCuttable.FacetCut[](4);
        bytes4[] memory filesels = new bytes4[](3);
        bytes4[] memory vatsels  = new bytes4[](20);
        bytes4[] memory vowsels  = new bytes4[](6);
        bytes4[] memory voxsels  = new bytes4[](6);
        File fbank = File(bank);

        filesels[0] = File.file.selector;
        filesels[1] = File.fb.selector;
        filesels[2] = File.rico.selector;
        vatsels[0]  = Vat.filk.selector;
        vatsels[1]  = Vat.filh.selector;
        vatsels[2]  = Vat.init.selector;
        vatsels[3]  = Vat.frob.selector;
        vatsels[4]  = Vat.bail.selector;
        vatsels[5]  = Vat.safe.selector;
        vatsels[6]  = Vat.joy.selector;
        vatsels[7] = Vat.sin.selector;
        vatsels[8] = Vat.ilks.selector;
        vatsels[9] = Vat.urns.selector;
        vatsels[10] = Vat.rest.selector;
        vatsels[11] = Vat.debt.selector;
        vatsels[12] = Vat.ceil.selector;
        vatsels[13] = Vat.par.selector;
        vatsels[14] = Vat.drip.selector;
        vatsels[15] = Vat.MINT.selector;
        vatsels[16] = Vat.ink.selector;
        vatsels[17] = Vat.flash.selector;
        vatsels[18] = Vat.geth.selector;
        vatsels[19] = Vat.hookcallext.selector;
        vowsels[0]  = Vow.keep.selector;
        vowsels[1]  = Vow.RISK.selector;
        vowsels[2]  = Vow.ramp.selector;
        vowsels[3]  = Vow.rudd.selector;
        vowsels[4]  = Vow.plat.selector;
        vowsels[5]  = Vow.plot.selector;
        voxsels[0]  = Vox.poke.selector;
        voxsels[1]  = Vox.way.selector;
        voxsels[2]  = Vox.how.selector;
        voxsels[3]  = Vox.cap.selector;
        voxsels[4]  = Vox.tip.selector;
        voxsels[5]  = Vox.tau.selector;

        facetCuts[0] = IDiamondCuttable.FacetCut(address(file), ADD, filesels);
        facetCuts[1] = IDiamondCuttable.FacetCut(address(vat),  ADD, vatsels);
        facetCuts[2] = IDiamondCuttable.FacetCut(address(vow),  ADD, vowsels);
        facetCuts[3] = IDiamondCuttable.FacetCut(address(vox),  ADD, voxsels);
        Diamond(payable(address(fbank))).acceptOwnership();
        Diamond(payable(address(fbank))).diamondCut(facetCuts, address(0), bytes(''));

        fbank.file('rico', bytes32(bytes20(rico)));
        fbank.file('risk', bytes32(bytes20(risk)));
        fbank.file('fb',  bytes32(bytes20(feedbase)));

        fbank.file('par',  bytes32(args.par));
        fbank.file('ceil', bytes32(args.ceil));

        fbank.file('plat.pep', bytes32(args.platpep));
        fbank.file('plat.pop', bytes32(args.platpop));
        fbank.file('rudd.tag', RISK_RICO_TAG);
        fbank.file('rudd.src', bytes32(bytes20(address(mdn))));
        fbank.file('plot.pep', bytes32(args.plotpep));
        fbank.file('plot.pop', bytes32(args.plotpop));

        fbank.file("rel", bytes32(args.mintramp.rel));
        fbank.file("bel", bytes32(args.mintramp.bel));
        fbank.file("cel", bytes32(args.mintramp.cel));
        fbank.file("wel", bytes32(args.mintramp.wel));

        fbank.file('tip.src', bytes32(bytes20(address(divider))));
        fbank.file('tip.tag', RICO_REF_TAG);
        fbank.file('how', HOW);
        fbank.file('cap', CAP);
        fbank.file('tau', bytes32(block.timestamp));
        fbank.file('way', bytes32(RAY));
    }

    function makeilk(IlkParams calldata ilkparams) _ward_ external {
        bytes32 ilk = ilkparams.ilk;
        bytes32 gemreftag = concat(ilk, ':ref');
        Vat(bank).init(ilk, address(hook));
        Vat(bank).filk(ilk, 'chop', bytes32(ilkparams.chop));
        Vat(bank).filk(ilk, 'dust', bytes32(ilkparams.dust));
        Vat(bank).filk(ilk, 'fee',  bytes32(ilkparams.fee));
        Vat(bank).filk(ilk, 'line', bytes32(ilkparams.line));
        Vat(bank).filh(ilk, 'liqr', empty, bytes32(ilkparams.liqr));
        Vat(bank).filh(ilk, 'gem', empty, bytes32(bytes20(ilkparams.gem)));
        Vat(bank).filh(ilk, 'src', empty, bytes32(bytes20(address(mdn))));
        Vat(bank).filh(ilk, 'tag', empty, gemreftag);
        Vat(bank).filh(ilk, 'pep', empty, bytes32(uint(2)));
        Vat(bank).filh(ilk, 'pop', empty, bytes32(RAY));
        {
            Medianizer.Config memory mdnconf = Medianizer.Config(new address[](1), new bytes32[](1), 1);
            mdnconf.srcs[0] = address(divider); mdnconf.tags[0] = gemreftag;
            mdn.setConfig(gemreftag, mdnconf);
        }
        bytes32 gemusdtag = concat(ilk, ':usd');
        bytes32 gemclatag;
        address gemusdsrc;
        if (ilkparams.gemethagg == address(0)) {
            // ilk has feed sequence of gem/usd / rico/usd
            cladapt.setConfig(gemusdtag, ChainlinkAdapter.Config(ilkparams.gemusdagg, ilkparams.ttl, RAY));
            gemusdsrc = address(cladapt);
            gemclatag = gemusdtag;
        } else {
            // ilk has feed sequence of gem/eth * eth/usd / rico/usd
            bytes32 gemethtag = concat(ilk, ':eth');
            cladapt.setConfig(gemethtag, ChainlinkAdapter.Config(ilkparams.gemethagg, ilkparams.ttl, RAY));
            // add a multiplier config which reads gem/usd. Relies on weth ilk existing for weth:usd cladapter
            _configureBlock(multiplier, gemusdtag,
                            address(cladapt), gemethtag,
                            address(cladapt), WETH_USD_TAG);
            gemusdsrc = address(multiplier);
            gemclatag = gemethtag;
        }
        _configureBlock(divider, gemreftag,
                        address(gemusdsrc), gemusdtag,
                        address(cladapt),   XAU_USD_TAG);
    }

    function makeuni(UniParams calldata ups) _ward_ external {
        Vat(bank).init(ups.ilk, address(nfthook));
        Vat(bank).filh(ups.ilk, 'nfpm', empty, bytes32(bytes20(address(ups.nfpm))));
        Vat(bank).filh(ups.ilk, 'room', empty, bytes32(ups.room));
        Vat(bank).filh(ups.ilk, 'wrap', empty, bytes32(bytes20(address(ups.uniwrapper))));

        Vat(bank).filk(ups.ilk, 'fee',  bytes32(ups.fee));
        Vat(bank).filk(ups.ilk, 'chop', bytes32(ups.chop));

        Vat(bank).filh(ups.ilk, 'pep',  empty, bytes32(uint(2)));
        Vat(bank).filh(ups.ilk, 'pop',  empty, bytes32(RAY));
    }

    function approve(address usr) _ward_ external {
        mdn.give(usr);
        divider.give(usr);
        multiplier.give(usr);
        uniadapt.give(usr);
        cladapt.give(usr);

        Diamond(bank).transferOwnership(usr);
    }

    function _configureBlock(Block b, bytes32 tag, address s1, bytes32 t1, address s2, bytes32 t2) internal {
        address[] memory sources = new address[](2);
        bytes32[] memory tags    = new bytes32[](2);
        sources[0] = s1; tags[0] = t1;
        sources[1] = s2; tags[1] = t2;
        b.setConfig(tag, Block.Config(sources, tags));
    }
}
