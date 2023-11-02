import erc20Abi from "./abis/erc20.json";
import ownableAbi from "./abis/ownable.json";

import bankArtifact from '../../react-app/src/ricobank/artifacts/hardhat-diamond-abi/HardhatDiamondABI.sol/BankDiamond.json';
const abis = {
  erc20: erc20Abi,
  ownable: ownableAbi,
  bank: bankArtifact.abi
};

export default abis;
