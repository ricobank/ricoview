const fs = require('fs')

const dpack   = require('@etherpacks/dpack')
const factory = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')
const pool    = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json')
const router  = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json')
const nfpm    = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json')
const urouter = require('@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json')
const urouter_address = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'

async function build(network, router_address, factory_address, nfpm_address) {
  const builder = new dpack.PackBuilder(network)
  const json = JSON.stringify

  const Factory_artifact = {
    abi: factory.abi,
    bytecode: factory.bytecode
  }
  const Pool_artifact = {
    abi: pool.abi,
    bytecode: pool.bytecode
  }
  const Nfpm_artifact = {
    abi: nfpm.abi,
    bytecode: nfpm.bytecode
  }

  const UniversalRouter_artifact = {
      abi: urouter.abi,
      bytecode: urouter.bytecode
  }

  fs.writeFileSync(`./link/UniswapV3Factory.json`, json(Factory_artifact))
  fs.writeFileSync(`./link/UniswapV3Pool.json`, json(Pool_artifact))
  fs.writeFileSync(`./link/NonfungiblePositionManager.json`, json(Nfpm_artifact))

  if (router_address) {
      const Router_artifact = {
        abi: router.abi,
        bytecode: router.bytecode
      }
      fs.writeFileSync(`./link/SwapRouter.json`, json(Router_artifact))
      await builder.packObject({
        objectname: 'swapRouter',
        address: router_address,
        typename: 'SwapRouter',
        artifact: Router_artifact
      })
  }
  await builder.packObject({
    objectname: 'uniswapV3Factory',
    address: factory_address,
    typename: 'UniswapV3Factory',
    artifact: Factory_artifact
  })
  await builder.packObject({
    objectname: 'nonfungiblePositionManager',
    address: nfpm_address,
    typename: 'NonfungiblePositionManager',
    artifact: Nfpm_artifact
  })
  await builder.packType({
    typename: 'UniswapV3Pool',
    artifact: Pool_artifact
  })
  await builder.packObject({
    objectname: 'universalRouter',
    typename: 'UniversalRouter',
    artifact: UniversalRouter_artifact,
    address: urouter_address
  })

  const pack = await builder.build();
  fs.writeFileSync(`./pack/uniswapv3_${network}.dpack.json`, JSON.stringify(pack, null, 2));
}

const mainnet_factory_address = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const mainnet_router_address  = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const mainnet_nfpm_address = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

build('ethereum', mainnet_router_address, mainnet_factory_address, mainnet_nfpm_address)
build('arbitrum', mainnet_router_address, mainnet_factory_address, mainnet_nfpm_address)
build('optimism', mainnet_router_address, mainnet_factory_address, mainnet_nfpm_address)
build('goerli', mainnet_router_address, mainnet_factory_address, mainnet_nfpm_address)
build(
  'arbitrum_goerli',
  undefined, // arb goerli uses the old swaprouter; just use universal
  "0x4893376342d5D7b3e31d4184c08b265e5aB2A3f6", 
  "0x622e4726a167799826d1E1D150b076A7725f5D81"
)
