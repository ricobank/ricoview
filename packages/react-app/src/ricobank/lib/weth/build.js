// assemble packs for existing deployments

const fs = require('fs')

const dpack = require('@etherpacks/dpack')

// Artifacts compiled from etherscan data on 11 Jan 22
// Verified with remix
const weth_artifacts = {
  'ethereum': require('./link/weth-ethereum-artifact.json'),
  'ropsten': require('./link/weth-ropsten-artifact.json'),
  'kovan': require('./link/weth-kovan-artifact.json'),
  'goerli': require('./link/weth-goerli-artifact.json'),
  'arbitrum_goerli': require('./link/weth-goerli-artifact.json')
}

const weth_addresses = {
  'ethereum': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Verify -- it's #2 ETH holder after ETH2 deposit contract, https://tokenlists.org/
  'ropsten': '0xc778417E063141139Fce010982780140Aa0cD5Ab', // Verify -- https://tokens.uniswap.org and etherscan, 290k ropsten eth
  'kovan': '0xd0A1E359811322d97991E03f863a0C30C2cF029C', // Verify -- https://tokens.uniswap.org and etherscan, 720k kovan eth
  'goerli': '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // Verify -- https://tokens.uniswap.org and etherscan, 250k goerli eth
  'arbitrum_goerli': '0x5Bd2c68aa07AC850Ea22BC5503BeF16744A5E1d7' // Verify -- goerli.arbiscan.org, 1 goerli eth
}

async function build(network) {
  const builder = new dpack.PackBuilder(network)
  await builder.packObject({
    objectname: 'weth',
    address: weth_addresses[network],
    typename: 'WETH9',
    artifact: weth_artifacts[network]
  }, true) // alsoPackType
  await builder.packObject({ // also name it weth9
    objectname: 'weth9',
    address: weth_addresses[network],
    typename: 'WETH9',
    artifact: weth_artifacts[network]
  }, false) // typename already exists
  const pack = await builder.build();

  fs.writeFileSync(`./pack/weth_${network}.dpack.json`, JSON.stringify(pack, null, 2));
}

build('ethereum')
build('ropsten')
build('kovan')
build('goerli')
build('arbitrum_goerli')
