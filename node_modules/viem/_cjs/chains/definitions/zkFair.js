"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zkFair = void 0;
const defineChain_js_1 = require("../../utils/chain/defineChain.js");
exports.zkFair = (0, defineChain_js_1.defineChain)({
    id: 42766,
    name: 'ZKFair Mainnet',
    network: 'zkfair-mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'USD Coin',
        symbol: 'USDC',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.zkfair.io'],
        },
        public: {
            http: ['https://rpc.zkfair.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'zkFair Explorer',
            url: 'https://scan.zkfair.io',
        },
    },
    testnet: false,
});
//# sourceMappingURL=zkFair.js.map