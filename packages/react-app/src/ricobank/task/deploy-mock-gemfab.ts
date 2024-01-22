import { task } from 'hardhat/config'

task('deploy-mock-gemfab', '')
.setAction(async (args, hre) => {
  return await hre.run('deploy-gemfab', args)
})
