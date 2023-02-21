


import { CharStream } from "../CharStream";
import { IntervalSet } from "../misc/IntervalSet";
import { IntStream } from "../IntStream";
import { Lexer } from "../Lexer";
import { Parser } from "../Parser";
import { ParserRuleContext } from "../ParserRuleContext";
import { Recognizer } from "../Recognizer";
import { RuleContext } from "../RuleContext";
import { Token } from "../Token";



export class RecognitionException extends Error {
	

	
	private _recognizer?: Recognizer<any, any>;

	private ctx?: RuleContext;

	private input?: IntStream;

	
	private offendingToken?: Token;

	private _offendingState: number = -1;

	constructor(
		lexer: Lexer | undefined,
		input: CharStream);

	constructor(
		recognizer: Recognizer<Token, any> | undefined,
		input: IntStream | undefined,
		ctx: ParserRuleContext | undefined);

	constructor(
		recognizer: Recognizer<Token, any> | undefined,
		input: IntStream | undefined,
		ctx: ParserRuleContext | undefined,
		message: string);

	constructor(
		recognizer: Lexer | Recognizer<Token, any> | undefined,
		input: CharStream | IntStream | undefined,
		ctx?: ParserRuleContext,
		message?: string) {
		super(message);

		this._recognizer = recognizer;
		this.input = input;
		this.ctx = ctx;
		if (recognizer) {
			this._offendingState = recognizer.state;
		}
	}

	
	get offendingState(): number {
		return this._offendingState;
	}

	protected setOffendingState(offendingState: number): void {
		this._offendingState = offendingState;
	}

	
	get expectedTokens(): IntervalSet | undefined {
		if (this._recognizer) {
			return this._recognizer.atn.getExpectedTokens(this._offendingState, this.ctx);
		}
		return undefined;
	}

	
	get context(): RuleContext | undefined {
		return this.ctx;
	}

	

	get inputStream(): IntStream | undefined {
		return this.input;
	}

	public getOffendingToken(recognizer?: Recognizer<Token, any>): Token | undefined {
		if (recognizer && recognizer !== this._recognizer) {
			return undefined;
		}
		return this.offendingToken;
	}

	protected setOffendingToken<TSymbol extends Token>(
		recognizer: Recognizer<TSymbol, any>,
		offendingToken?: TSymbol): void {
		if (recognizer === this._recognizer) {
			this.offendingToken = offendingToken;
		}
	}

	
	get recognizer(): Recognizer<any, any> | undefined {
		return this._recognizer;
	}
}
