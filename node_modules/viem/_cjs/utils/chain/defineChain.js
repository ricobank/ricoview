"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineChain = void 0;
function defineChain(chain) {
    return {
        formatters: undefined,
        fees: undefined,
        serializers: undefined,
        ...chain,
    };
}
exports.defineChain = defineChain;
//# sourceMappingURL=defineChain.js.map