import { task } from 'hardhat/config'

const debug = require('debug')('ricobank:task')
const dpack = require('@etherpacks/dpack')
import { b32, ray, rad, send, wad, BANKYEAR } from 'minihat'

task('deploy-ricobank', '')
  .addOptionalParam('mock', 'Ignore dependency args and deploy new mock dependencies')
  .addOptionalParam('dependencies', 'Pack with all required dependencies')
  .addOptionalParam('arb', 'Arbitrum deploy')
  .addOptionalParam('tokens', 'JSON file with token addresses')
  .addOptionalParam('writepack', 'write pack to pack dir')
  .addOptionalParam('gasLimit', 'per-tx gas limit')
  .addParam('netname', 'network name to load packs from')
  .setAction(async (args, hre) => {
    debug('network name in task:', hre.network.name)
    const [ali] = await hre.ethers.getSigners()

    if (args.mock && args.dependencies) {
      throw new Error('Panic: don\'t use \'mock\' and \'dependencies\' together')
    }
    let deps
    if (args.dependencies) {
      deps = JSON.parse(args.dependencies)
    } else if (args.mock) {
      deps = await hre.run('deploy-mock-dependencies', { tokens: args.tokens, netname: args.netname})
    } else {
      throw new Error('Panic: must provide either \'mock\' or \'dependencies\'')
    }

    const pb = new dpack.PackBuilder(hre.network.name)

    const agg_artifact = require('../artifacts/src/test/MockChainlinkAggregator.sol/MockChainlinkAggregator.json')
    const agg_type = hre.ethers.ContractFactory.fromSolidity(agg_artifact, ali)
    const agg_daiusd = await agg_type.deploy(deps.objects.feedbase.address, ali.address, b32('dai:usd'), 8, {gasLimit: args.gasLimit})
    const agg_xauusd = await agg_type.deploy(deps.objects.feedbase.address, ali.address, b32('xau:usd'), 8, {gasLimit: args.gasLimit})
    let fb = await hre.ethers.getContractAt('Feedbase', deps.objects.feedbase.address);
    let timestamp = (await hre.ethers.provider.getBlock('latest')).timestamp
    const bn2b32 = (bn) => hre.ethers.utils.hexZeroPad(bn.toHexString(), 32)
    await send(fb.push, b32('dai:usd'), bn2b32(hre.ethers.BigNumber.from('100000000')), timestamp * 2);
    await send(fb.push, b32('xau:usd'), bn2b32(hre.ethers.BigNumber.from('190000000000')), timestamp * 2);

    const diamond_artifact = require('../artifacts/src/diamond.sol/BankDiamond.json')
    const diamond_type = hre.ethers.ContractFactory.fromSolidity(diamond_artifact, ali)
    debug('deploying diamond')
    const diamond = await diamond_type.deploy({gasLimit: args.gasLimit})
    const ball_artifact = require('../artifacts/src/ball.sol/Ball.json')
    const ball_type = hre.ethers.ContractFactory.fromSolidity(ball_artifact, ali)
    timestamp = (await hre.ethers.provider.getBlock('latest')).timestamp

    const uniwrapper_artifact = require('../lib/feedbase/artifacts/src/adapters/UniWrapper.sol/UniWrapper.json')
    const uniwrapper_type = hre.ethers.ContractFactory.fromSolidity(uniwrapper_artifact, ali)
    debug('deploying uni wrapper')
    const uniwrapper = await uniwrapper_type.deploy({gasLimit: args.gasLimit});
    // TODO uni debt ceil
    const ups = {
            nfpm: deps.objects.nonfungiblePositionManager.address,
            ilk: b32(':uninft'),
            fee: hre.ethers.BigNumber.from("1000000001546067052200000000"),
            chop: ray(1),
            room: 8,
            uniwrapper: uniwrapper.address
    }

    const ballargs = {
        bank: diamond.address,
        feedbase: deps.objects.feedbase.address,
        rico: deps.objects.rico.address,
        risk: deps.objects.risk.address,
        ricodai: deps.objects.ricodai.address,
        ricorisk: deps.objects.ricorisk.address,
        uniwrapper: uniwrapper.address,
        par: ray(1),
        ceil: wad(100000),
        adaptrange: 1,
        adaptttl:   BANKYEAR / 4,
        daiusdttl:  BANKYEAR,
        xauusdttl:  BANKYEAR,
        twaprange:  500,
        twapttl:    BANKYEAR,
        platpep:    2,
        platpop:    ray(1),
        plotpep:    2,
        plotpop:    ray(1),
        mintramp:   { rel: wad(0.02).div(BANKYEAR), bel: timestamp, cel: 1, wel: wad(1) },
        DAI: deps.objects.dai.address,
        DAI_USD_AGG: agg_daiusd.address,
        XAU_USD_AGG: agg_xauusd.address,
    }

    let ilks = []
    const tokens = args.tokens ? require(args.tokens)[args.netname] : {}
    for (let token in tokens) {
        const params = tokens[token];  
        let ilk = {
            ilk: b32(params.ilk),
            gem: deps.objects[token].address,
            gemethagg: params.gemethagg,
            gemusdagg: params.gemusdagg,
            chop: ray(params.chop),
            dust: rad(params.dust),
            fee: ray(params.fee),
            line: rad(params.line),
            liqr: ray(params.liqr),
            ttl: params.ttl,
            range: params.range
        }
        // create mock chainlink feed with price of 2000
        if (params.gemusdagg == '0x' + '00'.repeat(20)) {
            if(params.gemethagg == '0x' + '00'.repeat(20)){
                await send(fb.push, b32(token + ':usd'), bn2b32(hre.ethers.BigNumber.from('200000000000')), timestamp * 2);
                debug('deploying mock aggregator for token', token)
                const agg_tokenusd = await agg_type.deploy(deps.objects.feedbase.address, ali.address, b32(token + ':usd'), 8, {gasLimit: args.gasLimit})
                ilk.gemusdagg = agg_tokenusd.address;
            } else {
                ilk.gemusdagg = '0x' + '00'.repeat(20);
            }
        }
        ilks.push(ilk)
    }

    debug('deploying ball...')
    const ball = await ball_type.deploy(ballargs, {gasLimit: args.gasLimit})
    debug('transferring diamond to ball')
    await send(diamond.transferOwnership, ball.address)
    debug('running ball setup...')

    await send(ball.setup, ballargs)
    debug(`done deploying ball at ${ball.address}...making ilks`)
    for (let ilk of ilks) {
        await send(ball.makeilk, ilk)
    }
    debug(`done making ilks...making uni hook`)
    await send(ball.makeuni, ups);
    await send(ball.approve, ali.address);
    debug('done making uni hook')
    const deps_dapp = await dpack.load(deps, hre.ethers, ali)
    debug('ward rico and risk')
    await send(deps_dapp.rico.ward, diamond.address, 1)
    await send(deps_dapp.risk.ward, diamond.address, 1)
    debug('accept ownership')
    await send(diamond.acceptOwnership)
    debug('creating pack')

    const getartifact = async (ty) => {
        debug(`getting artifact for ${ty}`)
        return dpack.getIpfsJson(deps.types[ty].artifact['/']);
    }


    debug('packing feeds')
    const contracts = [
        ['mdn', 'Medianizer', await getartifact('Medianizer')],
        ['divider', 'Divider', await getartifact('Divider')],
        ['uniadapt', 'UniswapV3Adapter', await getartifact('UniswapV3Adapter')],
        ['cladapt', 'ChainlinkAdapter', await getartifact('ChainlinkAdapter')],
        ['hook', 'ERC20Hook', require('../artifacts/src/hook/ERC20hook.sol/ERC20Hook.json')],
        ['nfthook', 'UniNFTHook', require('../artifacts/src/hook/nfpm/UniV3NFTHook.sol/UniNFTHook.json')]
    ]

    for await (const [state_var, typename, artifact] of contracts) {
      const pack_type = [
          'Gem', 'Divider', 'Medianizer', 'TWAP', 'UniswapV3Adapter',
          'ChainlinkAdapter'
      ].indexOf(typename) == -1
      await pb.packObject({
        objectname: state_var,
        address: await ball[state_var](),
        typename: typename,
        artifact: artifact
      }, pack_type)
    }

    await pb.packObject({
        objectname: 'uniswapV3Wrapper',
        address: uniwrapper.address,
        typename: 'UniWrapper',
        artifact: uniwrapper_artifact
    })

    debug('packing ball')
    await pb.packObject({
        objectname: 'ball',
        address: ball.address,
        typename: 'Ball',
        artifact: require('../artifacts/src/ball.sol/Ball.json')
    })

    const artifact_dirs = [
        '../artifacts/src/bank.sol/Bank.json',
        '../artifacts/src/file.sol/File.json',
        '../artifacts/src/vat.sol/Vat.json',
        '../artifacts/src/vow.sol/Vow.json',
        '../artifacts/src/vox.sol/Vox.json'
    ]

    debug('packing Ricobank diamond')
    let top_artifact = require('../artifacts/hardhat-diamond-abi/HardhatDiamondABI.sol/BankDiamond.json')
    top_artifact.deployedBytecode = diamond_artifact.deployedBytecode
    top_artifact.bytecode = diamond_artifact.bytecode
    top_artifact.linkReferences = diamond_artifact.linkReferences
    top_artifact.deployedLinkReferences = diamond_artifact.deployedLinkReferences
    top_artifact.abi = top_artifact.abi.filter((item, idx) => {
        return top_artifact.abi.findIndex(a => item.name == a.name) == idx
    })

    await pb.packObject({
        objectname: 'bank',
        address: diamond.address,
        typename: 'Ricobank',
        artifact: top_artifact
    }, true)
    debug('all packed, merging')

    const pack = (await pb.merge(deps)).build()
    if (args.writepack) {
        const outfile = require('path').join(
            __dirname, `../pack/ricobank_${hre.network.name}.dpack.json`
        )
        const packstr = JSON.stringify(pack, null, 2)
        require('fs').writeFileSync(outfile, packstr)
    }
    return pack
  })
