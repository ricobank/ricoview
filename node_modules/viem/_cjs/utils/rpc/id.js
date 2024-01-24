"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idCache = exports.createIdStore = void 0;
function createIdStore() {
    return {
        current: 0,
        take() {
            return this.current++;
        },
        reset() {
            this.current = 0;
        },
    };
}
exports.createIdStore = createIdStore;
exports.idCache = createIdStore();
//# sourceMappingURL=id.js.map