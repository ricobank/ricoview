"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIpcRpcClient = exports.extractMessages = void 0;
const node_net_1 = require("node:net");
const index_js_1 = require("../../index.js");
const socket_js_1 = require("./socket.js");
const openingBrace = '{'.charCodeAt(0);
const closingBrace = '}'.charCodeAt(0);
function extractMessages(buffer) {
    const messages = [];
    let cursor = 0;
    let level = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === openingBrace)
            level++;
        if (buffer[i] === closingBrace)
            level--;
        if (level === 0) {
            const message = buffer.subarray(cursor, i + 1);
            if (message[0] === openingBrace &&
                message[message.length - 1] === closingBrace)
                messages.push(message);
            cursor = i + 1;
        }
    }
    return [messages, buffer.subarray(cursor)];
}
exports.extractMessages = extractMessages;
async function getIpcRpcClient(path) {
    return (0, socket_js_1.getSocketRpcClient)({
        async getSocket({ onResponse }) {
            const socket = (0, node_net_1.connect)(path);
            function onClose() {
                socket.off('close', onClose);
                socket.off('message', onData);
            }
            let lastRemaining = Buffer.alloc(0);
            function onData(buffer) {
                const [messages, remaining] = extractMessages(Buffer.concat([lastRemaining, buffer]));
                for (const message of messages) {
                    const response = JSON.parse(Buffer.from(message).toString());
                    onResponse(response);
                }
                lastRemaining = remaining;
            }
            socket.on('close', onClose);
            socket.on('data', onData);
            await new Promise((resolve, reject) => {
                socket.on('ready', () => {
                    resolve();
                    socket.off('error', reject);
                });
                socket.on('error', reject);
            });
            return Object.assign(socket, {
                close() {
                    socket.destroy();
                    socket.end();
                },
                request({ body }) {
                    if (socket.readyState !== 'open')
                        throw new index_js_1.WebSocketRequestError({
                            body,
                            url: path,
                            details: 'Socket is closed.',
                        });
                    return socket.write(JSON.stringify(body));
                },
            });
        },
        url: path,
    });
}
exports.getIpcRpcClient = getIpcRpcClient;
//# sourceMappingURL=ipc.js.map