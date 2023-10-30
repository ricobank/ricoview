// This address points to a dummy ERC-20 contract. Replace it with your own smart contracts.
//let pack = require('./ricobank/pack/ricobank_arbitrum_goerli.dpack.json');
import pack from '../../react-app/src/ricobank/pack/ricobank_arbitrum_goerli.dpack.json';
const addresses = {
  ceaErc20: "0xa6dF0C88916f3e2831A329CE46566dDfBe9E74b7",
  bank: pack.objects.bank.address
};
export default addresses;
