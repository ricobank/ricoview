const debug = require('debug')('ricobank:task')

import { task } from 'hardhat/config'
const dpack = require('@etherpacks/dpack')

task('deploy-mock-dependencies', '')
.addOptionalParam('gasLimit', 'per-tx gas limit')
.setAction(async (args, hre) => {
  let weth_addr  // todo never set
  debug('deploying dependencies...')
  const uni_pack = require(`../lib/uniswapv3/pack/uniswapv3_${args.netname}.dpack.json`)
  uni_pack.network = hre.network.name
  debug('found uni pack')
  const fb_pack = await hre.run('deploy-mock-feedbase', {netname: args.netname})
  debug('deployed fb')
  const gf_pack = await hre.run('deploy-mock-gemfab', {netname: args.netname, gasLimit: args.gasLimit})
  debug('deployed gf')
  const tokens_pack = await hre.run(
      'deploy-mock-tokens',
      {
          gf_pack: gf_pack,
          uni_pack: uni_pack,
          tokens: args.tokens,
          weth: weth_addr, 
          netname: args.netname,
          gasLimit: args.gasLimit
      }
  )
  debug('deployed (or loaded) tokens')

  const pb = new dpack.PackBuilder(hre.network.name)
  await pb.merge(uni_pack, fb_pack, gf_pack, tokens_pack);

  const pack = await pb.build();
  pack.network = hre.network.name

  return pack
});
