"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mockDebug_1 = require("./mockDebug");
const fs_1 = require("fs");
const Net = __importStar(require("net"));
const fsAccessor = {
    isWindows: process.platform === 'win32',
    readFile(path) {
        return fs_1.promises.readFile(path);
    },
    writeFile(path, contents) {
        return fs_1.promises.writeFile(path, contents);
    }
};
let port = 0;
const args = process.argv.slice(2);
args.forEach(function (val, index, array) {
    const portMatch = /^--server=(\d{4,5})$/.exec(val);
    if (portMatch) {
        port = parseInt(portMatch[1], 10);
    }
});
if (port > 0) {
    console.error(`waiting for debug protocol on port ${port}`);
    Net.createServer((socket) => {
        console.error('>> accepted connection from client');
        socket.on('end', () => {
            console.error('>> client connection closed\n');
        });
        const session = new mockDebug_1.MockDebugSession(fsAccessor);
        session.setRunAsServer(true);
        session.start(socket, socket);
    }).listen(port);
}
else {
    const session = new mockDebug_1.MockDebugSession(fsAccessor);
    process.on('SIGTERM', () => {
        session.shutdown();
    });
    session.start(process.stdin, process.stdout);
}
//# sourceMappingURL=debugAdapter.js.map