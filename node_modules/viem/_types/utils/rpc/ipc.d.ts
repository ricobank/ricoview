/// <reference types="node" />
/// <reference types="node" />
import { type Socket as NetSocket } from 'node:net';
import { type SocketRpcClient } from './socket.js';
export declare function extractMessages(buffer: Buffer): [Buffer[], Buffer];
export type IpcRpcClient = SocketRpcClient<NetSocket>;
export declare function getIpcRpcClient(path: string): Promise<IpcRpcClient>;
//# sourceMappingURL=ipc.d.ts.map