"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebSocketRpcClient = void 0;
const request_js_1 = require("../../errors/request.js");
const socket_js_1 = require("./socket.js");
async function getWebSocketRpcClient(url) {
    return (0, socket_js_1.getSocketRpcClient)({
        async getSocket({ onResponse }) {
            const WebSocket = await Promise.resolve().then(() => require('isows')).then((module) => module.WebSocket);
            const socket = new WebSocket(url);
            function onClose() {
                socket.removeEventListener('close', onClose);
                socket.removeEventListener('message', onMessage);
            }
            function onMessage({ data }) {
                onResponse(JSON.parse(data));
            }
            socket.addEventListener('close', onClose);
            socket.addEventListener('message', onMessage);
            if (socket.readyState === WebSocket.CONNECTING) {
                await new Promise((resolve, reject) => {
                    if (!socket)
                        return;
                    socket.onopen = resolve;
                    socket.onerror = reject;
                });
            }
            const { close: close_ } = socket;
            return Object.assign(socket, {
                close() {
                    close_.bind(socket)();
                    onClose();
                },
                request({ body }) {
                    if (socket.readyState === socket.CLOSED ||
                        socket.readyState === socket.CLOSING)
                        throw new request_js_1.WebSocketRequestError({
                            body,
                            url: socket.url,
                            details: 'Socket is closed.',
                        });
                    return socket.send(JSON.stringify(body));
                },
            });
        },
        url,
    });
}
exports.getWebSocketRpcClient = getWebSocketRpcClient;
//# sourceMappingURL=webSocket.js.map