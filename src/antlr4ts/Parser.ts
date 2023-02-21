



import * as assert from "assert";
import * as Utils from "./misc/Utils";

import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { ANTLRErrorStrategy } from "./ANTLRErrorStrategy";
import { ATN } from "./atn/ATN";
import { ATNDeserializationOptions } from "./atn/ATNDeserializationOptions";
import { ATNDeserializer } from "./atn/ATNDeserializer";
import { ATNSimulator } from "./atn/ATNSimulator";
import { ATNState } from "./atn/state/ATNState";
import { DefaultErrorStrategy } from "./DefaultErrorStrategy";
import { DFA } from "./dfa/DFA";
import { ErrorNode } from "./tree/ErrorNode";
import { IntegerStack } from "./misc/IntegerStack";
import { IntervalSet } from "./misc/IntervalSet";
import { IntStream } from "./IntStream";
import { Lexer } from "./Lexer";
import { Override, NotNull, Nullable } from "./Decorators";
import { ParseInfo } from "./atn/info/ParseInfo";
import { ParserATNSimulator } from "./atn/ParserATNSimulator";
import { ParserErrorListener } from "./ParserErrorListener";
import { ParserRuleContext } from "./ParserRuleContext";
import { ParseTreeListener } from "./tree/ParseTreeListener";
import { ParseTreePattern } from "./tree/pattern/ParseTreePattern";
import { ProxyParserErrorListener } from "./ProxyParserErrorListener";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";
import { RuleContext } from "./RuleContext";
import { TerminalNode } from "./tree/TerminalNode";
import { Token } from "./Token";
import { TokenFactory } from "./TokenFactory";
import { TokenSource } from "./TokenSource";
import { TokenStream } from "./TokenStream";
import { RuleTransition } from "./atn/transition/RuleTransition";

class TraceListener implements ParseTreeListener {
	constructor(private ruleNames: string[], private tokenStream: TokenStream) {
	}

	@Override
	public enterEveryRule(ctx: ParserRuleContext): void {
		console.log("enter   " + this.ruleNames[ctx.ruleIndex] +
			", LT(1)=" + this.tokenStream.LT(1).text);
	}

	@Override
	public exitEveryRule(ctx: ParserRuleContext): void {
		console.log("exit    " + this.ruleNames[ctx.ruleIndex] +
			", LT(1)=" + this.tokenStream.LT(1).text);
	}

	@Override
	public visitErrorNode(node: ErrorNode): void {
		
	}

	@Override
	public visitTerminal(node: TerminalNode): void {
		let parent = node.parent!.ruleContext;
		let token: Token = node.symbol;
		console.log("consume " + token + " rule " + this.ruleNames[parent.ruleIndex]);
	}
}


export abstract class Parser extends Recognizer<Token, ParserATNSimulator> {
	
	private static readonly bypassAltsAtnCache = new Map<string, ATN>();

	
	@NotNull
	protected _errHandler: ANTLRErrorStrategy = new DefaultErrorStrategy();

	
	protected _input!: TokenStream;

	protected readonly _precedenceStack: IntegerStack = new IntegerStack();

	
	protected _ctx!: ParserRuleContext;

	
	private _buildParseTrees: boolean = true;

	
	private _tracer: TraceListener | undefined;

	
	protected _parseListeners: ParseTreeListener[] = [];

	
	protected _syntaxErrors: number = 0;

	
	protected matchedEOF: boolean = false;

	constructor(input: TokenStream) {
		super();
		this._precedenceStack.push(0);
		this.inputStream = input;
	}

	
	public reset(): void;
	public reset(resetInput: boolean): void;
	public reset(resetInput?: boolean): void {
		
		if (resetInput === undefined || resetInput) {
			this.inputStream.seek(0);
		}

		this._errHandler.reset(this);
		this._ctx = undefined as any;
		this._syntaxErrors = 0;
		this.matchedEOF = false;
		this.isTrace = false;
		this._precedenceStack.clear();
		this._precedenceStack.push(0);
		let interpreter: ATNSimulator = this.interpreter;
		if (interpreter != null) {
			interpreter.reset();
		}
	}

	
	@NotNull
	public match(ttype: number): Token {
		let t: Token = this.currentToken;
		if (t.type === ttype) {
			if (ttype === Token.EOF) {
				this.matchedEOF = true;
			}
			this._errHandler.reportMatch(this);
			this.consume();
		}
		else {
			t = this._errHandler.recoverInline(this);
			if (this._buildParseTrees && t.tokenIndex === -1) {
				
				
				this._ctx.addErrorNode(this.createErrorNode(this._ctx, t));
			}
		}
		return t;
	}

	
	@NotNull
	public matchWildcard(): Token {
		let t: Token = this.currentToken;
		if (t.type > 0) {
			this._errHandler.reportMatch(this);
			this.consume();
		}
		else {
			t = this._errHandler.recoverInline(this);
			if (this._buildParseTrees && t.tokenIndex === -1) {
				
				
				this._ctx.addErrorNode(this.createErrorNode(this._ctx, t));
			}
		}

		return t;
	}

	
	set buildParseTree(buildParseTrees: boolean) {
		this._buildParseTrees = buildParseTrees;
	}

	
	get buildParseTree(): boolean {
		return this._buildParseTrees;
	}

	@NotNull
	public getParseListeners(): ParseTreeListener[] {
		return this._parseListeners;
	}

	
	public addParseListener(@NotNull listener: ParseTreeListener): void {
		if (listener == null) {
			throw new TypeError("listener cannot be null");
		}

		this._parseListeners.push(listener);
	}

	
	public removeParseListener(listener: ParseTreeListener): void {
		let index = this._parseListeners.findIndex((l) => l === listener);
		if (index !== -1) {
			this._parseListeners.splice(index, 1);
		}
	}


	
	public removeParseListeners(): void {
		this._parseListeners.length = 0;
	}

	
	protected triggerEnterRuleEvent(): void {
		for (let listener of this._parseListeners) {
			if (listener.enterEveryRule) {
				listener.enterEveryRule(this._ctx);
			}

			this._ctx.enterRule(listener);
		}
	}

	
	protected triggerExitRuleEvent(): void {
		
		for (let i = this._parseListeners.length - 1; i >= 0; i--) {
			let listener: ParseTreeListener = this._parseListeners[i];
			this._ctx.exitRule(listener);
			if (listener.exitEveryRule) {
				listener.exitEveryRule(this._ctx);
			}
		}
	}

	
	get numberOfSyntaxErrors(): number {
		return this._syntaxErrors;
	}

	get tokenFactory(): TokenFactory {
		return this._input.tokenSource.tokenFactory;
	}

	
	@NotNull
	public getATNWithBypassAlts(): ATN {
		let serializedAtn: string = this.serializedATN;
		if (serializedAtn == null) {
			throw new Error("The current parser does not support an ATN with bypass alternatives.");
		}

		let result = Parser.bypassAltsAtnCache.get(serializedAtn);
		if (result == null) {
			let deserializationOptions: ATNDeserializationOptions = new ATNDeserializationOptions();
			deserializationOptions.isGenerateRuleBypassTransitions = true;
			result = new ATNDeserializer(deserializationOptions).deserialize(Utils.toCharArray(serializedAtn));
			Parser.bypassAltsAtnCache.set(serializedAtn, result);
		}

		return result;
	}

	
	public compileParseTreePattern(pattern: string, patternRuleIndex: number): Promise<ParseTreePattern>;

	
	public compileParseTreePattern(pattern: string, patternRuleIndex: number, lexer?: Lexer): Promise<ParseTreePattern>;

	public async compileParseTreePattern(pattern: string, patternRuleIndex: number, lexer?: Lexer): Promise<ParseTreePattern> {
		if (!lexer) {
			if (this.inputStream) {
				let tokenSource = this.inputStream.tokenSource;
				if (tokenSource instanceof Lexer) {
					lexer = tokenSource;
				}
			}

			if (!lexer) {
				throw new Error("Parser can't discover a lexer to use");
			}
		}

		let currentLexer = lexer;
		let m = await import("./tree/pattern/ParseTreePatternMatcher");
		let matcher = new m.ParseTreePatternMatcher(currentLexer, this);
		return matcher.compile(pattern, patternRuleIndex);
	}

	@NotNull
	get errorHandler(): ANTLRErrorStrategy {
		return this._errHandler;
	}

	set errorHandler(@NotNull handler: ANTLRErrorStrategy) {
		this._errHandler = handler;
	}

	@Override
	get inputStream(): TokenStream {
		return this._input;
	}

	
	set inputStream(input: TokenStream) {
		this.reset(false);
		this._input = input;
	}

	
	@NotNull
	get currentToken(): Token {
		return this._input.LT(1);
	}

	public notifyErrorListeners( msg: string): void;
	public notifyErrorListeners( msg: string,  offendingToken: Token | null, e: RecognitionException | undefined): void;

	public notifyErrorListeners(msg: string, offendingToken?: Token | null, e?: RecognitionException | undefined): void {
		if (offendingToken === undefined) {
			offendingToken = this.currentToken;
		} else if (offendingToken === null) {
			offendingToken = undefined;
		}

		this._syntaxErrors++;
		let line: number = -1;
		let charPositionInLine: number = -1;
		if (offendingToken != null) {
			line = offendingToken.line;
			charPositionInLine = offendingToken.charPositionInLine;
		}

		let listener = this.getErrorListenerDispatch();
		if (listener.syntaxError) {
			listener.syntaxError(this, offendingToken, line, charPositionInLine, msg, e);
		}
	}

	
	public consume(): Token {
		let o: Token = this.currentToken;
		if (o.type !== Parser.EOF) {
			this.inputStream.consume();
		}
		let hasListener: boolean = this._parseListeners.length !== 0;
		if (this._buildParseTrees || hasListener) {
			if (this._errHandler.inErrorRecoveryMode(this)) {
				let node: ErrorNode = this._ctx.addErrorNode(this.createErrorNode(this._ctx, o));
				if (hasListener) {
					for (let listener of this._parseListeners) {
						if (listener.visitErrorNode) {
							listener.visitErrorNode(node);
						}
					}
				}
			}
			else {
				let node: TerminalNode = this.createTerminalNode(this._ctx, o);
				this._ctx.addChild(node);
				if (hasListener) {
					for (let listener of this._parseListeners) {
						if (listener.visitTerminal) {
							listener.visitTerminal(node);
						}
					}
				}
			}
		}
		return o;
	}

	
	public createTerminalNode(parent: ParserRuleContext, t: Token): TerminalNode {
		return new TerminalNode(t);
	}

	
	public createErrorNode(parent: ParserRuleContext, t: Token): ErrorNode {
		return new ErrorNode(t);
	}

	protected addContextToParseTree(): void {
		let parent = this._ctx._parent as ParserRuleContext | undefined;
		
		if (parent != null) {
			parent.addChild(this._ctx);
		}
	}

	
	public enterRule(@NotNull localctx: ParserRuleContext, state: number, ruleIndex: number): void {
		this.state = state;
		this._ctx = localctx;
		this._ctx._start = this._input.LT(1);
		if (this._buildParseTrees) {
			this.addContextToParseTree();
		}
		this.triggerEnterRuleEvent();
	}

	public enterLeftFactoredRule(localctx: ParserRuleContext, state: number, ruleIndex: number): void {
		this.state = state;
		if (this._buildParseTrees) {
			let factoredContext = this._ctx.getChild(this._ctx.childCount - 1) as ParserRuleContext;
			this._ctx.removeLastChild();
			factoredContext._parent = localctx;
			localctx.addChild(factoredContext);
		}

		this._ctx = localctx;
		this._ctx._start = this._input.LT(1);
		if (this._buildParseTrees) {
			this.addContextToParseTree();
		}

		this.triggerEnterRuleEvent();
	}

	public exitRule(): void {
		if (this.matchedEOF) {
			
			this._ctx._stop = this._input.LT(1); 
		}
		else {
			this._ctx._stop = this._input.tryLT(-1); 
		}
		
		this.triggerExitRuleEvent();
		this.state = this._ctx.invokingState;
		this._ctx = this._ctx._parent as ParserRuleContext;
	}

	public enterOuterAlt(localctx: ParserRuleContext, altNum: number): void {
		localctx.altNumber = altNum;
		
		
		if (this._buildParseTrees && this._ctx !== localctx) {
			let parent = this._ctx._parent as ParserRuleContext | undefined;
			if (parent != null) {
				parent.removeLastChild();
				parent.addChild(localctx);
			}
		}
		this._ctx = localctx;
	}

	
	get precedence(): number {
		if (this._precedenceStack.isEmpty) {
			return -1;
		}

		return this._precedenceStack.peek();
	}

	public enterRecursionRule(localctx: ParserRuleContext, state: number, ruleIndex: number, precedence: number): void {
		this.state = state;
		this._precedenceStack.push(precedence);
		this._ctx = localctx;
		this._ctx._start = this._input.LT(1);
		this.triggerEnterRuleEvent(); 
	}

	
	public pushNewRecursionContext(localctx: ParserRuleContext, state: number, ruleIndex: number): void {
		let previous: ParserRuleContext = this._ctx;
		previous._parent = localctx;
		previous.invokingState = state;
		previous._stop = this._input.tryLT(-1);

		this._ctx = localctx;
		this._ctx._start = previous._start;
		if (this._buildParseTrees) {
			this._ctx.addChild(previous);
		}

		this.triggerEnterRuleEvent(); 
	}

	public unrollRecursionContexts(_parentctx: ParserRuleContext): void {
		this._precedenceStack.pop();
		this._ctx._stop = this._input.tryLT(-1);
		let retctx: ParserRuleContext = this._ctx; 

		
		if (this._parseListeners.length > 0) {
			while (this._ctx !== _parentctx) {
				this.triggerExitRuleEvent();
				this._ctx = this._ctx._parent as ParserRuleContext;
			}
		}
		else {
			this._ctx = _parentctx;
		}

		
		retctx._parent = _parentctx;

		if (this._buildParseTrees && _parentctx != null) {
			
			_parentctx.addChild(retctx);
		}
	}

	public getInvokingContext(ruleIndex: number): ParserRuleContext | undefined {
		let p = this._ctx;
		while (p && p.ruleIndex !== ruleIndex) {
			p = p._parent as ParserRuleContext;
		}
		return p;
	}

	get context(): ParserRuleContext {
		return this._ctx;
	}

	set context(ctx: ParserRuleContext) {
		this._ctx = ctx;
	}

	@Override
	public precpred(@Nullable localctx: RuleContext, precedence: number): boolean {
		return precedence >= this._precedenceStack.peek();
	}

	@Override
	public getErrorListenerDispatch(): ParserErrorListener {
		return new ProxyParserErrorListener(this.getErrorListeners());
	}

	public inContext(context: string): boolean {
		
		return false;
	}

	
	public isExpectedToken(symbol: number): boolean {

		let atn: ATN = this.interpreter.atn;
		let ctx: ParserRuleContext = this._ctx;
		let s: ATNState = atn.states[this.state];
		let following: IntervalSet = atn.nextTokens(s);
		if (following.contains(symbol)) {
			return true;
		}

		if (!following.contains(Token.EPSILON)) {
			return false;
		}

		while (ctx != null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
			let invokingState: ATNState = atn.states[ctx.invokingState];
			let rt = invokingState.transition(0) as RuleTransition;
			following = atn.nextTokens(rt.followState);
			if (following.contains(symbol)) {
				return true;
			}

			ctx = ctx._parent as ParserRuleContext;
		}

		if (following.contains(Token.EPSILON) && symbol === Token.EOF) {
			return true;
		}

		return false;
	}

	get isMatchedEOF(): boolean {
		return this.matchedEOF;
	}

	
	@NotNull
	public getExpectedTokens(): IntervalSet {
		return this.atn.getExpectedTokens(this.state, this.context);
	}

	@NotNull
	public getExpectedTokensWithinCurrentRule(): IntervalSet {
		let atn: ATN = this.interpreter.atn;
		let s: ATNState = atn.states[this.state];
		return atn.nextTokens(s);
	}

	
	public getRuleIndex(ruleName: string): number {
		let ruleIndex = this.getRuleIndexMap().get(ruleName);
		if (ruleIndex != null) {
			return ruleIndex;
		}
		return -1;
	}

	get ruleContext(): ParserRuleContext { return this._ctx; }

	

	public getRuleInvocationStack(ctx: RuleContext = this._ctx): string[] {
		let p: RuleContext | undefined = ctx;  		
		let ruleNames: string[] = this.ruleNames;
		let stack: string[] = [];
		while (p != null) {
			
			let ruleIndex: number = p.ruleIndex;
			if (ruleIndex < 0) {
				stack.push("n/a");
			} else {
				stack.push(ruleNames[ruleIndex]);
			}
			p = p._parent as RuleContext;
		}
		return stack;
	}

	
	public getDFAStrings(): string[] {
		let s: string[] = [];
		for (let dfa of this._interp.atn.decisionToDFA) {
			s.push(dfa.toString(this.vocabulary, this.ruleNames));
		}
		return s;
	}

	
	public dumpDFA(): void {
		let seenOne: boolean = false;
		for (let dfa of this._interp.atn.decisionToDFA) {
			if (!dfa.isEmpty) {
				if (seenOne) {
					console.log();
				}
				console.log("Decision " + dfa.decision + ":");
				process.stdout.write(dfa.toString(this.vocabulary, this.ruleNames));
				seenOne = true;
			}
		}
	}

	get sourceName(): string {
		return this._input.sourceName;
	}

	@Override
	get parseInfo(): Promise<ParseInfo | undefined> {
		return import("./atn/ProfilingATNSimulator").then((m) => {
			let interp: ParserATNSimulator = this.interpreter;
			if (interp instanceof m.ProfilingATNSimulator) {
				return new ParseInfo(interp);
			}

			return undefined;
		});
	}

	
	public async setProfile(profile: boolean): Promise<void> {
		let m = await import("./atn/ProfilingATNSimulator");
		let interp: ParserATNSimulator = this.interpreter;
		if (profile) {
			if (!(interp instanceof m.ProfilingATNSimulator)) {
				this.interpreter = new m.ProfilingATNSimulator(this);
			}
		} else if (interp instanceof m.ProfilingATNSimulator) {
			this.interpreter = new ParserATNSimulator(this.atn, this);
		}

		this.interpreter.setPredictionMode(interp.getPredictionMode());
	}

	
	set isTrace(trace: boolean) {
		if (!trace) {
			if (this._tracer) {
				this.removeParseListener(this._tracer);
				this._tracer = undefined;
			}
		}
		else {
			if (this._tracer) {
				this.removeParseListener(this._tracer);
			} else {
				this._tracer = new TraceListener(this.ruleNames, this._input);
			}

			this.addParseListener(this._tracer);
		}
	}

	
	get isTrace(): boolean {
		return this._tracer != null;
	}
}
