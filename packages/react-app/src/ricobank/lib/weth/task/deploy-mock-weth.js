const fs = require('fs')
const path = require('path')

const dpack = require('@etherpacks/dpack')
const { task } = require('hardhat/config')
const GASLIMIT = '1000000000000'

task('deploy-mock-weth', 'deploy mock weth')
.setAction(async (args, hre) => {
  const pack = require('../pack/weth_ethereum.dpack.json')
  const [ signer ]  = await hre.ethers.getSigners()
  const dapp = await dpack.load(pack, hre.ethers, signer)
  const weth = await dapp._types.WETH9.deploy({gasLimit: GASLIMIT})
  const mockpack = JSON.parse(JSON.stringify(pack))
  mockpack.network = hre.network.name
  mockpack.objects.weth.address = weth.address;
  mockpack.objects.weth9.address = weth.address;
  const mockpath = path.join(__dirname, `../pack/weth_${hre.network.name}.dpack.json`)
  const mockjson = JSON.stringify(mockpack, null, 2)
  fs.writeFileSync(mockpath, mockjson);
  return mockpack;
})
