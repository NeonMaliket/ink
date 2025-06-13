import * as vscode from 'vscode';
import {
    DebugSession,
    InitializedEvent,
    StoppedEvent,
    Breakpoint,
    Thread,
    OutputEvent,
    Source,
    StackFrame,
    ContinuedEvent
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import * as path from 'path';
import { PolkaVMI } from './polkaVMInstructions';

export function activate(context: vscode.ExtensionContext) {
    console.log('[ink-trace] activate');
    context.subscriptions.push(
        vscode.debug.registerDebugAdapterDescriptorFactory(
            'ink-trace',
            new InkDebugAdapterDescriptorFactory()
        ),
        vscode.debug.registerDebugConfigurationProvider(
            'ink-trace',
            new InkDebugConfigurationProvider()
        )
    );
}

export function deactivate() { }

class InkDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(_folder: any, config: any) {
        console.log('[ink-trace] resolveDebugConfiguration', config);
        return config;
    }
}

class InkDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor() {
        console.log('[ink-trace] createDebugAdapterDescriptor');
        return new vscode.DebugAdapterInlineImplementation(new InkDebugSession());
    }
}

class InkDebugSession extends DebugSession {
    private _breakpoints: DebugProtocol.Breakpoint[] = [];
    private readonly instr: Map<number, string>;
    private _cursor = 0;
    private _project = vscode.workspace.workspaceFolders?.[0]
        ? path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath)
        : 'unknown_project';

    constructor() {
        super();
        console.log('[ink-trace] DemoDebugSession started');
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
        this.instr = new PolkaVMI().load();
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse): void {
        response.body = {
            supportsConfigurationDoneRequest: true
        };
        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());
    }

    protected setBreakPointsRequest(
        response: DebugProtocol.SetBreakpointsResponse,
        args: DebugProtocol.SetBreakpointsArguments
    ): void {
        const src = new Source(args.source!.name!, args.source!.path!);
        this._breakpoints = (args.breakpoints ?? [])
            .map(bp => new Breakpoint(true, bp.line, undefined, src))
            .sort((a, b) => ((a as DebugProtocol.Breakpoint).line ?? 0) - ((b as DebugProtocol.Breakpoint).line ?? 0));
        this._cursor = 0;
        response.body = { breakpoints: this._breakpoints };

        this.sendEvent(new OutputEvent(`[ink-trace] breakpoints set: ${JSON.stringify(args)}\n`));

        this.sendResponse(response);
    }

    protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse): void {
        this.sendResponse(response);
        setTimeout(() => {
            const bp = this._breakpoints[0];
            if (bp) {
                this.sendEvent(new OutputEvent(`[ink-trace] hit instruction at line ${bp.line}\n`));
            }
            this.sendEvent(new StoppedEvent("breakpoint", 1));
        }, 300);
    }

    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        response.body = {
            threads: [new Thread(1, "main thread")]
        };
        this.sendResponse(response);
    }

    protected stackTraceRequest(
        response: DebugProtocol.StackTraceResponse
    ): void {
        const bp = this._breakpoints[this._cursor];
        // Ensure we use the correct Source type and provide a fallback for name/path
        const src = new Source(
            bp.source?.name ?? 'unknown',
            bp.source?.path ?? ''
        );
        response.body = {
            stackFrames: [
                new StackFrame(
                    1,
                    this._project,
                    src,
                    bp.line!,
                    1
                )
            ],
            totalFrames: 1
        };
        this.sendEvent(new OutputEvent(`[ink-trace] hit instruction at line ${JSON.stringify(bp)}\n`));

        this.sendResponse(response);
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse): void {
        response.body = { scopes: [] };
        this.sendResponse(response);
    }

    protected variablesRequest(response: DebugProtocol.VariablesResponse): void {
        response.body = { variables: [] };
        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse): void {
        this.sendResponse(response);
    }

    protected nextRequest(res: DebugProtocol.NextResponse): void {
        if (this._cursor >= this._breakpoints.length - 1) {
            this.sendEvent(new OutputEvent('[ink-trace] no more breakpoints\n'));
            this.sendResponse(res);2
            return;
        }

        this.sendEvent(new ContinuedEvent(1, true));

        this._cursor++;
        const bp = this._breakpoints[this._cursor];
        const instr = this.instr.get(bp.line!) ?? '??';
        
        this.sendEvent(new OutputEvent(`[ink-trace] next instruction: ${JSON.stringify(this.instr)}\n`));

        this.sendEvent(new OutputEvent(`[ink-trace] ${instr} @${bp.line}\n`));
        this.sendEvent(new StoppedEvent('step', 1));
        this.sendResponse(res);
    }
}
