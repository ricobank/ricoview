
## ricobank
`ricobank` is an `autobank`.  Rico is an iteration on Rai with some important differences, including but not limited to:
- Tick controller, see `vox`
- Composable price feeds, see `feedbase`
- Endgamed incentive structure, see `vow` and `hook` and `feedbase`
- Simpler implementation, see everything

## autobank

`autobank` is a generic term for the synthetic asset system used in Dai, Rai, and Rico. The behavior of the synthetic depends on the type of controller used. See [bank.dev/vox](https://bank.dev/vox) for a description of how these controllers can be used to implement synthetics that behave like a variety of instruments, from "wrapped perps" to fiat-like synthetic assets.

### overview

- `ball.sol` -- a single contract that deploys and wires up most contracts in the system
- `diamond.sol` -- ERC-2535 diamond
- `bank.sol` -- storage and some internal utilities common between core modules
- `vat.sol` -- the core CDP engine
- `vow.sol` -- triggers liquidations and processes debt/surplus auctions
- `vox.sol` -- adjusts `par` and `way`
- `file.sol` -- modify and read core parameters
- `ERC20hook.sol` -- hook `vat` uses to handle ERC20 moves and pricing
- `UniNFTHook.sol` -- hook `vat` uses to handle NonfungiblePositionManager moves and pricing

### developing

You need `node`/`npm`, and you need `ipfs daemon` running.
This repo uses submodules for managing some dependencies.

- `npm run initialize` -- this will perform:
    - `npm install`
    - `npm run download-submodules`
    - `npm run install-submodules`
    - `npm run build:all`
- `FOUNDRY_PROFILE=lite npm test`

To run js tests with `ipfs daemon` running:
- `npm run js-test`

To deploy from hardhat console:

- `pack = await hre.run('deploy-ricobank', { writepack: 'true', netname: <pack's network name>, tokens: './tokens.json', mock: 'true', gasLimit: <gas limit> })`

### dpack

Ricobank is set up to deploy using dpack.  To deploy ricobank and create a new pack for it, run the `deploy-ricobank` task.  It will return the pack object and also write it to a json file in ./pack/.  To load the pack,

- `pack = require(path_to_pack_file)` or `pack = hre.run('deploy-ricobank', ...)`
- `dapp = await dpack.load(pack, ethers, signer)`
- `bank = dapp.bank`

`dapp` contains `bank`, the core Ricobank object, and some other external utilities.
To create a CDP, approve your tokens to `bank`, and run `bank.frob(...)` using the ethers Solidity ABI.


