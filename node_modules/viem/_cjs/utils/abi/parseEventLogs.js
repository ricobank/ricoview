"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEventLogs = void 0;
const index_js_1 = require("../../index.js");
const decodeEventLog_js_1 = require("./decodeEventLog.js");
function parseEventLogs({ abi, eventName, logs, strict = true, }) {
    return logs
        .map((log) => {
        try {
            const event = (0, decodeEventLog_js_1.decodeEventLog)({
                ...log,
                abi,
                strict,
            });
            if (eventName && !eventName.includes(event.eventName))
                return null;
            return { ...event, ...log };
        }
        catch (err) {
            let eventName;
            let isUnnamed;
            if (err instanceof index_js_1.AbiEventSignatureNotFoundError)
                return null;
            if (err instanceof index_js_1.DecodeLogDataMismatch ||
                err instanceof index_js_1.DecodeLogTopicsMismatch) {
                if (strict)
                    return null;
                eventName = err.abiItem.name;
                isUnnamed = err.abiItem.inputs?.some((x) => !('name' in x && x.name));
            }
            return { ...log, args: isUnnamed ? [] : {}, eventName };
        }
    })
        .filter(Boolean);
}
exports.parseEventLogs = parseEventLogs;
//# sourceMappingURL=parseEventLogs.js.map