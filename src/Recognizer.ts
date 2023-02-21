


import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { ATN } from "./atn/ATN";
import { ATNSimulator } from "./atn/ATNSimulator";
import { ConsoleErrorListener } from "./ConsoleErrorListener";
import { IntStream } from "./IntStream";
import { ParseInfo } from "./atn/info/ParseInfo";
import { ProxyErrorListener } from "./ProxyErrorListener";
import { RecognitionException } from "./exception/RecognitionException";
import { RuleContext } from "./RuleContext";
import { SuppressWarnings, NotNull } from "./Decorators";
import { Token } from "./Token";
import { Vocabulary } from "./Vocabulary";
import { VocabularyImpl } from "./VocabularyImpl";

import * as Utils from "./misc/Utils";

export abstract class Recognizer<TSymbol, ATNInterpreter extends ATNSimulator> {
	public static readonly EOF: number = -1;

	private static tokenTypeMapCache =
		new WeakMap<Vocabulary, ReadonlyMap<string, number>>();
	private static ruleIndexMapCache =
		new WeakMap<string[], ReadonlyMap<string, number>>();

	@SuppressWarnings("serial")
	@NotNull
	private readonly _listeners: Array<ANTLRErrorListener<TSymbol>> = [ConsoleErrorListener.INSTANCE];

	protected _interp!: ATNInterpreter;

	private _stateNumber = -1;

	public abstract readonly ruleNames: string[];

	
	public abstract readonly vocabulary: Vocabulary;

	
	@NotNull
	public getTokenTypeMap(): ReadonlyMap<string, number> {
		let vocabulary: Vocabulary = this.vocabulary;
		let result = Recognizer.tokenTypeMapCache.get(vocabulary);
		if (result == null) {
			let intermediateResult = new Map<string, number>();
			for (let i = 0; i <= this.atn.maxTokenType; i++) {
				let literalName = vocabulary.getLiteralName(i);
				if (literalName != null) {
					intermediateResult.set(literalName, i);
				}

				let symbolicName = vocabulary.getSymbolicName(i);
				if (symbolicName != null) {
					intermediateResult.set(symbolicName, i);
				}
			}

			intermediateResult.set("EOF", Token.EOF);
			result = intermediateResult;
			Recognizer.tokenTypeMapCache.set(vocabulary, result);
		}

		return result;
	}

	
	@NotNull
	public getRuleIndexMap(): ReadonlyMap<string, number> {
		let ruleNames: string[] = this.ruleNames;
		if (ruleNames == null) {
			throw new Error("The current recognizer does not provide a list of rule names.");
		}

		let result: ReadonlyMap<string, number> | undefined = Recognizer.ruleIndexMapCache.get(ruleNames);
		if (result == null) {
			result = Utils.toMap(ruleNames);
			Recognizer.ruleIndexMapCache.set(ruleNames, result);
		}

		return result;
	}

	public getTokenType(tokenName: string): number {
		let ttype = this.getTokenTypeMap().get(tokenName);
		if (ttype != null) {
			return ttype;
		}
		return Token.INVALID_TYPE;
	}

	
	@NotNull
	get serializedATN(): string {
		throw new Error("there is no serialized ATN");
	}

	
	public abstract readonly grammarFileName: string;

	
	@NotNull
	get atn(): ATN {
		return this._interp.atn;
	}

	
	@NotNull
	get interpreter(): ATNInterpreter {
		return this._interp;
	}

	
	set interpreter(@NotNull interpreter: ATNInterpreter) {
		this._interp = interpreter;
	}

	
	get parseInfo(): Promise<ParseInfo | undefined> {
		return Promise.resolve(undefined);
	}

	
	@NotNull
	public getErrorHeader(@NotNull e: RecognitionException): string {
		let token = e.getOffendingToken();
		if (!token) {
			return "";
		}
		let line = token.line;
		let charPositionInLine: number = token.charPositionInLine;
		return "line " + line + ":" + charPositionInLine;
	}

	
	public addErrorListener(@NotNull listener: ANTLRErrorListener<TSymbol>): void {
		if (!listener) {
			throw new TypeError("listener must not be null");
		}
		this._listeners.push(listener);
	}

	public removeErrorListener(@NotNull listener: ANTLRErrorListener<TSymbol>): void {
		let position = this._listeners.indexOf(listener);
		if (position !== -1) {
			this._listeners.splice(position, 1);
		}
	}

	public removeErrorListeners(): void {
		this._listeners.length = 0;
	}

	@NotNull
	public getErrorListeners(): Array<ANTLRErrorListener<TSymbol>> {
		return this._listeners.slice(0);
	}

	public getErrorListenerDispatch(): ANTLRErrorListener<TSymbol> {
		return new ProxyErrorListener<TSymbol, ANTLRErrorListener<TSymbol>>(this.getErrorListeners());
	}

	
	
	public sempred(
		_localctx: RuleContext | undefined,
		ruleIndex: number,
		actionIndex: number): boolean {
		return true;
	}

	public precpred(
		localctx: RuleContext | undefined,
		precedence: number): boolean {
		return true;
	}

	public action(
		_localctx: RuleContext | undefined,
		ruleIndex: number,
		actionIndex: number): void {
		
	}

	get state(): number {
		return this._stateNumber;
	}

	
	set state(atnState: number) {

		this._stateNumber = atnState;

	}

	public abstract readonly inputStream: IntStream | undefined;
}
