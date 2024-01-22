"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWithdrawals = void 0;
const extractWithdrawalMessageLogs_js_1 = require("./extractWithdrawalMessageLogs.js");
function getWithdrawals({ logs, }) {
    const extractedLogs = (0, extractWithdrawalMessageLogs_js_1.extractWithdrawalMessageLogs)({ logs });
    return extractedLogs.map((log) => log.args);
}
exports.getWithdrawals = getWithdrawals;
//# sourceMappingURL=getWithdrawals.js.map