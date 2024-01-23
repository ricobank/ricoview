"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitTorrent = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.bitTorrent = (0, defineChain_js_1.defineChain)({
    id: 199,
    name: 'BitTorrent',
    network: 'bittorrent-chain-mainnet',
    nativeCurrency: { name: 'BitTorrent', symbol: 'BTT', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.bittorrentchain.io'] },
        public: { http: ['https://rpc.bittorrentchain.io'] },
    },
    blockExplorers: {
        etherscan: { name: 'Bttcscan', url: 'https://bttcscan.com' },
        default: { name: 'Bttcscan', url: 'https://bttcscan.com' },
    },
});
//# sourceMappingURL=bitTorrent.js.map