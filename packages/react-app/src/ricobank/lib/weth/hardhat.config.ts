import '@nomiclabs/hardhat-ethers'
import './task/deploy-mock-weth'

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  networks: {
      arbitrum_goerli: {
          url: process.env["ARB_GOERLI_RPC_URL"],
          accounts: {
            mnemonic: process.env["ARB_GOERLI_MNEMONIC"]
          },
          chainId: 421613
      }
  }
}
