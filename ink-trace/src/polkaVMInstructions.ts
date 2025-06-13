import * as fs from 'fs';

import * as vscode from 'vscode';

export class PolkaVMI {
    private readonly asm = 'pvmi.asm';

    load(): Map<number, string> {
        console.log(`[ink-trace] PolkaVMI: Loaded instructions from ${this.asm}`);
        return this.parse();
    }

    
    private parse(): Map<number, string> {
        const map = new Map<number, string>();
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
                if (m) map.set(+m[2], m[1].trim());
            });
        return map;
    }
}
