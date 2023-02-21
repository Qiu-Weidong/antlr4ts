



import * as assert from "assert";
import { CommonToken } from "./CommonToken";
import { Interval } from "./misc/Interval";
import { Lexer } from "./Lexer";
import { NotNull, Override } from "./Decorators";
import { RuleContext } from "./RuleContext";
import { Token } from "./Token";
import { TokenSource } from "./TokenSource";
import { TokenStream } from "./TokenStream";
import { WritableToken } from "./WritableToken";


export class BufferedTokenStream implements TokenStream {
	
	@NotNull
	private _tokenSource: TokenSource;

	
	protected tokens: Token[] = [];

	
	protected p: number = -1;

	
	protected fetchedEOF: boolean = false;

	constructor(@NotNull tokenSource: TokenSource) {
		if (tokenSource == null) {
			throw new Error("tokenSource cannot be null");
		}

		this._tokenSource = tokenSource;
	}

	@Override
	get tokenSource(): TokenSource {
		return this._tokenSource;
	}

	
	set tokenSource(tokenSource: TokenSource) {
		this._tokenSource = tokenSource;
		this.tokens.length = 0;
		this.p = -1;
		this.fetchedEOF = false;
	}

	@Override
	get index(): number {
		return this.p;
	}

	@Override
	public mark(): number {
		return 0;
	}

	@Override
	public release(marker: number): void {
		
	}

	@Override
	public seek(index: number): void {
		this.lazyInit();
		this.p = this.adjustSeekIndex(index);
	}

	@Override
	get size(): number {
		return this.tokens.length;
	}

	@Override
	public consume(): void {
		let skipEofCheck: boolean;
		if (this.p >= 0) {
			if (this.fetchedEOF) {
				
				
				skipEofCheck = this.p < this.tokens.length - 1;
			} else {
				
				skipEofCheck = this.p < this.tokens.length;
			}
		} else {
			
			skipEofCheck = false;
		}

		if (!skipEofCheck && this.LA(1) === Token.EOF) {
			throw new Error("cannot consume EOF");
		}

		if (this.sync(this.p + 1)) {
			this.p = this.adjustSeekIndex(this.p + 1);
		}
	}

	
	protected sync(i: number): boolean {
		assert(i >= 0);
		let n: number = i - this.tokens.length + 1; 
		
		if (n > 0) {
			let fetched: number = this.fetch(n);
			return fetched >= n;
		}

		return true;
	}

	
	protected fetch(n: number): number {
		if (this.fetchedEOF) {
			return 0;
		}

		for (let i = 0; i < n; i++) {
			let t: Token = this.tokenSource.nextToken();
			if (this.isWritableToken(t)) {
				t.tokenIndex = this.tokens.length;
			}

			this.tokens.push(t);
			if (t.type === Token.EOF) {
				this.fetchedEOF = true;
				return i + 1;
			}
		}

		return n;
	}

	@Override
	public get(i: number): Token {
		if (i < 0 || i >= this.tokens.length) {
			throw new RangeError("token index " + i + " out of range 0.." + (this.tokens.length - 1));
		}

		return this.tokens[i];
	}

	
	public getRange(start: number, stop: number): Token[] {
		if (start < 0 || stop < 0) {
			return [];
		}

		this.lazyInit();
		let subset: Token[] = new Array<Token>();
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}

		for (let i = start; i <= stop; i++) {
			let t: Token = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}

			subset.push(t);
		}

		return subset;
	}

	@Override
	public LA(i: number): number {
		let token = this.LT(i);
		if (!token) {
			return Token.INVALID_TYPE;
		}

		return token.type;
	}

	protected tryLB(k: number): Token | undefined {
		if ((this.p - k) < 0) {
			return undefined;
		}

		return this.tokens[this.p - k];
	}

	@NotNull
	@Override
	public LT(k: number): Token {
		let result = this.tryLT(k);
		if (result === undefined) {
			throw new RangeError("requested lookback index out of range");
		}

		return result;
	}

	public tryLT(k: number): Token | undefined {
		this.lazyInit();
		if (k === 0) {
			throw new RangeError("0 is not a valid lookahead index");
		}

		if (k < 0) {
			return this.tryLB(-k);
		}

		let i: number = this.p + k - 1;
		this.sync(i);
		if (i >= this.tokens.length) {
			
			
			return this.tokens[this.tokens.length - 1];
		}

		
		return this.tokens[i];
	}

	
	protected adjustSeekIndex(i: number): number {
		return i;
	}

	protected lazyInit(): void {
		if (this.p === -1) {
			this.setup();
		}
	}

	protected setup(): void {
		this.sync(0);
		this.p = this.adjustSeekIndex(0);
	}

	public getTokens(): Token[];

	public getTokens(start: number, stop: number): Token[];

	public getTokens(start: number, stop: number, types: Set<number>): Token[];

	public getTokens(start: number, stop: number, ttype: number): Token[];

	
	public getTokens(start?: number, stop?: number, types?: Set<number> | number): Token[] {
		this.lazyInit();

		if (start === undefined) {
			assert(stop === undefined && types === undefined);
			return this.tokens;
		} else if (stop === undefined) {
			stop = this.tokens.length - 1;
		}

		if (start < 0 || stop >= this.tokens.length || stop < 0 || start >= this.tokens.length) {
			throw new RangeError("start " + start + " or stop " + stop + " not in 0.." + (this.tokens.length - 1));
		}

		if (start > stop) {
			return [];
		}

		if (types === undefined) {
			return this.tokens.slice(start, stop + 1);
		} else if (typeof types === "number") {
			types = new Set<number>().add(types);
		}

		let typesSet = types;

		
		let filteredTokens: Token[] = this.tokens.slice(start, stop + 1);
		filteredTokens = filteredTokens.filter((value) => typesSet.has(value.type));

		return filteredTokens;
	}

	
	protected nextTokenOnChannel(i: number, channel: number): number {
		this.sync(i);
		if (i >= this.size) {
			return this.size - 1;
		}

		let token: Token = this.tokens[i];
		while (token.channel !== channel) {
			if (token.type === Token.EOF) {
				return i;
			}

			i++;
			this.sync(i);
			token = this.tokens[i];
		}

		return i;
	}

	
	protected previousTokenOnChannel(i: number, channel: number): number {
		this.sync(i);
		if (i >= this.size) {
			
			return this.size - 1;
		}

		while (i >= 0) {
			let token: Token = this.tokens[i];
			if (token.type === Token.EOF || token.channel === channel) {
				return i;
			}

			i--;
		}

		return i;
	}

	
	public getHiddenTokensToRight(tokenIndex: number, channel: number = -1): Token[] {
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw new RangeError(tokenIndex + " not in 0.." + (this.tokens.length - 1));
		}

		let nextOnChannel: number = this.nextTokenOnChannel(tokenIndex + 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		let to: number;
		let from: number = tokenIndex + 1;
		
		if (nextOnChannel === -1) {
			to = this.size - 1;
		} else {
			to = nextOnChannel;
		}

		return this.filterForChannel(from, to, channel);
	}

	
	public getHiddenTokensToLeft(tokenIndex: number, channel: number = -1): Token[] {
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw new RangeError(tokenIndex + " not in 0.." + (this.tokens.length - 1));
		}

		if (tokenIndex === 0) {
			
			return [];
		}

		let prevOnChannel: number = this.previousTokenOnChannel(tokenIndex - 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		if (prevOnChannel === tokenIndex - 1) {
			return [];
		}

		
		let from: number = prevOnChannel + 1;
		let to: number = tokenIndex - 1;

		return this.filterForChannel(from, to, channel);
	}

	protected filterForChannel(from: number, to: number, channel: number): Token[] {
		let hidden: Token[] = new Array<Token>();
		for (let i = from; i <= to; i++) {
			let t: Token = this.tokens[i];
			if (channel === -1) {
				if (t.channel !== Lexer.DEFAULT_TOKEN_CHANNEL) {
					hidden.push(t);
				}
			} else {
				if (t.channel === channel) {
					hidden.push(t);
				}
			}
		}

		return hidden;
	}

	@Override
	get sourceName(): string {
		return this.tokenSource.sourceName;
	}

	
	public getText(): string;
	public getText(interval: Interval): string;
	public getText(context: RuleContext): string;
	@NotNull
	@Override
	public getText(interval?: Interval | RuleContext): string {
		if (interval === undefined) {
			interval = Interval.of(0, this.size - 1);
		} else if (!(interval instanceof Interval)) {
			
			interval = interval.sourceInterval;
		}

		let start: number = interval.a;
		let stop: number = interval.b;
		if (start < 0 || stop < 0) {
			return "";
		}

		this.fill();
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}

		let buf: string = "";
		for (let i = start; i <= stop; i++) {
			let t: Token = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}

			buf += t.text;
		}

		return buf.toString();
	}

	@NotNull
	@Override
	public getTextFromRange(start: any, stop: any): string {
		if (this.isToken(start) && this.isToken(stop)) {
			return this.getText(Interval.of(start.tokenIndex, stop.tokenIndex));
		}

		return "";
	}

	
	public fill(): void {
		this.lazyInit();
		const blockSize: number = 1000;
		while (true) {
			let fetched: number = this.fetch(blockSize);
			if (fetched < blockSize) {
				return;
			}
		}
	}

	
	private isWritableToken(t: Token): t is WritableToken {
		return t instanceof CommonToken;
	}

	
	private isToken(t: any): t is Token {
		return t instanceof CommonToken;
	}
}
