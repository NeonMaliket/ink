"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolkaVMI = void 0;
const fs = require("fs");
const vscode = require("vscode");
class PolkaVMI {
    constructor() {
        this.asm = 'pvmi.asm';
    }
    load() {
        console.log(`[ink-trace] PolkaVMI: Loaded instructions from ${this.asm}`);
        return this.parse();
    }
    parse() {
        const map = new Map();
        const re = /^\s*[0-9a-f]+\s+([^\;]+);\s+.+:(\d+)$/;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder is open.');
        }
        const path = `${workspaceFolders[0].uri.fsPath}/${this.asm}`;
        console.log(`[ink-trace] PolkaVMI: Reading instructions from ${path}`);
        fs.readFileSync(path, 'utf8')
            .split('\n')
            .forEach(row => {
            const m = re.exec(row);
            if (m)
                map.set(+m[2], m[1].trim());
        });
        return map;
    }
}
exports.PolkaVMI = PolkaVMI;
//# sourceMappingURL=polkaVMInstructions.js.map