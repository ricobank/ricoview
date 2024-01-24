const fs = require('fs')
const path = require('path')

const dpack = require('@etherpacks/dpack')
const { task } = require('hardhat/config')

task('deploy-mock-uniswap', 'deploy mock uniswapv3')
.setAction(async (args, hre) => {
  const [ signer ]  = await hre.ethers.getSigners()
  const weth_pack = args.weth_pack
  const pack = require('../pack/uniswapv3_ethereum.dpack.json')  // reference deployment for mocks
  const dapp = await dpack.load(pack, hre.ethers, signer)
  const factory  = await dapp._types.UniswapV3Factory.deploy()
  const router = await dapp._types.SwapRouter.deploy(factory.address, weth_pack.objects.weth9.address)
  const mockpack = JSON.parse(JSON.stringify(pack))
  mockpack.network = hre.network.name
  mockpack.objects.swapRouter.address = router.address
  mockpack.objects.uniswapV3Factory.address = factory.address
  const mockpath = path.join(__dirname, `../pack/uniswapv3_${hre.network.name}.dpack.json`)
  const mockjson = JSON.stringify(mockpack, null, 2)
  fs.writeFileSync(mockpath, mockjson)
  return mockpack
})
