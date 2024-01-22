import { task } from 'hardhat/config'

task('deploy-mock-feedbase', '')
.setAction(async (args, hre) => {
  return await hre.run('deploy-feedbase', args)
});
