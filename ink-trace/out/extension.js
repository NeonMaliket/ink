"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const debugadapter_1 = require("@vscode/debugadapter");
const path = require("path");
const polkaVMInstructions_1 = require("./polkaVMInstructions");
function activate(context) {
    console.log('[ink-trace] activate');
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('ink-trace', new InkDebugAdapterDescriptorFactory()), vscode.debug.registerDebugConfigurationProvider('ink-trace', new InkDebugConfigurationProvider()));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
class InkDebugConfigurationProvider {
    resolveDebugConfiguration(_folder, config) {
        console.log('[ink-trace] resolveDebugConfiguration', config);
        return config;
    }
}
class InkDebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor() {
        console.log('[ink-trace] createDebugAdapterDescriptor');
        return new vscode.DebugAdapterInlineImplementation(new InkDebugSession());
    }
}
class InkDebugSession extends debugadapter_1.DebugSession {
    constructor() {
        var _a;
        super();
        this._breakpoints = [];
        this._cursor = 0;
        this._project = ((_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0])
            ? path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath)
            : 'unknown_project';
        console.log('[ink-trace] DemoDebugSession started');
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
        this.instr = new polkaVMInstructions_1.PolkaVMI().load();
    }
    initializeRequest(response) {
        response.body = {
            supportsConfigurationDoneRequest: true
        };
        this.sendResponse(response);
        this.sendEvent(new debugadapter_1.InitializedEvent());
    }
    setBreakPointsRequest(response, args) {
        var _a;
        const src = new debugadapter_1.Source(args.source.name, args.source.path);
        this._breakpoints = ((_a = args.breakpoints) !== null && _a !== void 0 ? _a : [])
            .map(bp => new debugadapter_1.Breakpoint(true, bp.line, undefined, src))
            .sort((a, b) => { var _a, _b; return ((_a = a.line) !== null && _a !== void 0 ? _a : 0) - ((_b = b.line) !== null && _b !== void 0 ? _b : 0); });
        this._cursor = 0;
        response.body = { breakpoints: this._breakpoints };
        this.sendEvent(new debugadapter_1.OutputEvent(`[ink-trace] breakpoints set: ${JSON.stringify(args)}\n`));
        this.sendResponse(response);
    }
    configurationDoneRequest(response) {
        this.sendResponse(response);
        setTimeout(() => {
            const bp = this._breakpoints[0];
            if (bp) {
                this.sendEvent(new debugadapter_1.OutputEvent(`[ink-trace] hit instruction at line ${bp.line}\n`));
            }
            this.sendEvent(new debugadapter_1.StoppedEvent("breakpoint", 1));
        }, 300);
    }
    threadsRequest(response) {
        response.body = {
            threads: [new debugadapter_1.Thread(1, "main thread")]
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response) {
        var _a, _b, _c, _d;
        const bp = this._breakpoints[this._cursor];
        // Ensure we use the correct Source type and provide a fallback for name/path
        const src = new debugadapter_1.Source((_b = (_a = bp.source) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown', (_d = (_c = bp.source) === null || _c === void 0 ? void 0 : _c.path) !== null && _d !== void 0 ? _d : '');
        response.body = {
            stackFrames: [
                new debugadapter_1.StackFrame(1, this._project, src, bp.line, 1)
            ],
            totalFrames: 1
        };
        this.sendEvent(new debugadapter_1.OutputEvent(`[ink-trace] hit instruction at line ${JSON.stringify(bp)}\n`));
        this.sendResponse(response);
    }
    scopesRequest(response) {
        response.body = { scopes: [] };
        this.sendResponse(response);
    }
    variablesRequest(response) {
        response.body = { variables: [] };
        this.sendResponse(response);
    }
    continueRequest(response) {
        this.sendResponse(response);
    }
    nextRequest(res) {
        var _a;
        if (this._cursor >= this._breakpoints.length - 1) {
            this.sendEvent(new debugadapter_1.OutputEvent('[ink-trace] no more breakpoints\n'));
            this.sendResponse(res);
            2;
            return;
        }
        this.sendEvent(new debugadapter_1.ContinuedEvent(1, true));
        this._cursor++;
        const bp = this._breakpoints[this._cursor];
        const instr = (_a = this.instr.get(bp.line)) !== null && _a !== void 0 ? _a : '??';
        this.sendEvent(new debugadapter_1.OutputEvent(`[ink-trace] next instruction: ${JSON.stringify(this.instr)}\n`));
        this.sendEvent(new debugadapter_1.OutputEvent(`[ink-trace] ${instr} @${bp.line}\n`));
        this.sendEvent(new debugadapter_1.StoppedEvent('step', 1));
        this.sendResponse(res);
    }
}
//# sourceMappingURL=extension.js.map