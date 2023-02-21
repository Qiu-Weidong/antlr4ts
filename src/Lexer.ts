



import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { CharStream } from "./CharStream";
import { CommonTokenFactory } from "./CommonTokenFactory";
import { IntegerStack } from "./misc/IntegerStack";
import { Interval } from "./misc/Interval";
import { IntStream } from "./IntStream";
import { LexerATNSimulator } from "./atn/LexerATNSimulator";
import { Override } from "./Decorators";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";
import { Token } from "./Token";
import { TokenFactory } from "./TokenFactory";
import { TokenSource } from "./TokenSource";
import { LexerNoViableAltException } from "./exception/LexerNoViableAltException";


export abstract class Lexer extends Recognizer<number, LexerATNSimulator>
	implements TokenSource {
	public static readonly DEFAULT_MODE: number = 0;
	public static readonly MORE: number = -2;
	public static readonly SKIP: number = -3;

	static get DEFAULT_TOKEN_CHANNEL(): number {
		return Token.DEFAULT_CHANNEL;
	}

	static get HIDDEN(): number {
		return Token.HIDDEN_CHANNEL;
	}

	public static readonly MIN_CHAR_VALUE: number = 0x0000;
	public static readonly MAX_CHAR_VALUE: number = 0x10FFFF;

	public _input: CharStream;

	protected _tokenFactorySourcePair: { source: TokenSource, stream: CharStream };

	
	protected _factory: TokenFactory = CommonTokenFactory.DEFAULT;

	
	public _token: Token | undefined;

	
	public _tokenStartCharIndex: number = -1;

	
	public _tokenStartLine: number = 0;

	
	public _tokenStartCharPositionInLine: number = 0;

	
	public _hitEOF: boolean = false;

	
	public _channel: number = 0;

	
	public _type: number = 0;

	public readonly _modeStack: IntegerStack = new IntegerStack();
	public _mode: number = Lexer.DEFAULT_MODE;

	
	public _text: string | undefined;

	constructor(input: CharStream) {
		super();
		this._input = input;
		this._tokenFactorySourcePair = { source: this, stream: input };
	}

	public reset(): void;
	public reset(resetInput: boolean): void;
	public reset(resetInput?: boolean): void {
		
		if (resetInput === undefined || resetInput) {
			this._input.seek(0); 
		}

		this._token = undefined;
		this._type = Token.INVALID_TYPE;
		this._channel = Token.DEFAULT_CHANNEL;
		this._tokenStartCharIndex = -1;
		this._tokenStartCharPositionInLine = -1;
		this._tokenStartLine = -1;
		this._text = undefined;

		this._hitEOF = false;
		this._mode = Lexer.DEFAULT_MODE;
		this._modeStack.clear();

		this.interpreter.reset();
	}

	
	@Override
	public nextToken(): Token {
		if (this._input == null) {
			throw new Error("nextToken requires a non-null input stream.");
		}

		
		
		let tokenStartMarker: number = this._input.mark();
		try {
			outer:
			while (true) {
				if (this._hitEOF) {
					return this.emitEOF();
				}

				this._token = undefined;
				this._channel = Token.DEFAULT_CHANNEL;
				this._tokenStartCharIndex = this._input.index;
				this._tokenStartCharPositionInLine = this.interpreter.charPositionInLine;
				this._tokenStartLine = this.interpreter.line;
				this._text = undefined;
				do {
					this._type = Token.INVALID_TYPE;



					let ttype: number;
					try {
						ttype = this.interpreter.match(this._input, this._mode);
					}
					catch (e) {
						if (e instanceof LexerNoViableAltException) {
							this.notifyListeners(e);		
							this.recover(e);
							ttype = Lexer.SKIP;
						} else {
							throw e;
						}
					}
					if (this._input.LA(1) === IntStream.EOF) {
						this._hitEOF = true;
					}
					if (this._type === Token.INVALID_TYPE) {
						this._type = ttype;
					}
					if (this._type === Lexer.SKIP) {
						continue outer;
					}
				} while (this._type === Lexer.MORE);
				if (this._token == null) {
					return this.emit();
				}
				return this._token;
			}
		}
		finally {
			
			
			this._input.release(tokenStartMarker);
		}
	}

	
	public skip(): void {
		this._type = Lexer.SKIP;
	}

	public more(): void {
		this._type = Lexer.MORE;
	}

	public mode(m: number): void {
		this._mode = m;
	}

	public pushMode(m: number): void {
		if (LexerATNSimulator.debug) {
			console.log("pushMode " + m);
		}
		this._modeStack.push(this._mode);
		this.mode(m);
	}

	public popMode(): number {
		if (this._modeStack.isEmpty) {
			throw new Error("EmptyStackException");
		}
		if (LexerATNSimulator.debug) {
			console.log("popMode back to " + this._modeStack.peek());
		}
		this.mode(this._modeStack.pop());
		return this._mode;
	}

	@Override
	get tokenFactory(): TokenFactory {
		return this._factory;
	}

	
	set tokenFactory(factory: TokenFactory) {
		this._factory = factory;
	}

	@Override
	get inputStream(): CharStream {
		return this._input;
	}

	
	set inputStream(input: CharStream) {
		this.reset(false);
		this._input = input;
		this._tokenFactorySourcePair = { source: this, stream: this._input };
	}

	@Override
	get sourceName(): string {
		return this._input.sourceName;
	}


	
	public emit(token: Token): Token;

	
	public emit(): Token;

	public emit(token?: Token): Token {
		if (!token) {
			token = this._factory.create(
				this._tokenFactorySourcePair, this._type, this._text, this._channel,
				this._tokenStartCharIndex, this.charIndex - 1, this._tokenStartLine,
				this._tokenStartCharPositionInLine);
		}
		this._token = token;
		return token;
	}

	public emitEOF(): Token {
		let cpos: number = this.charPositionInLine;
		let line: number = this.line;
		let eof: Token = this._factory.create(
			this._tokenFactorySourcePair, Token.EOF, undefined,
			Token.DEFAULT_CHANNEL, this._input.index, this._input.index - 1,
			line, cpos);
		this.emit(eof);
		return eof;
	}

	@Override
	get line(): number {
		return this.interpreter.line;
	}

	set line(line: number) {
		this.interpreter.line = line;
	}

	@Override
	get charPositionInLine(): number {
		return this.interpreter.charPositionInLine;
	}

	set charPositionInLine(charPositionInLine: number) {
		this.interpreter.charPositionInLine = charPositionInLine;
	}

	
	get charIndex(): number {
		return this._input.index;
	}

	
	get text(): string {
		if (this._text != null) {
			return this._text;
		}
		return this.interpreter.getText(this._input);
	}

	
	set text(text: string) {
		this._text = text;
	}

	
	get token(): Token | undefined { return this._token; }

	set token(_token: Token | undefined) {
		this._token = _token;
	}

	set type(ttype: number) {
		this._type = ttype;
	}

	get type(): number {
		return this._type;
	}

	set channel(channel: number) {
		this._channel = channel;
	}

	get channel(): number {
		return this._channel;
	}

	public abstract readonly channelNames: string[];

	public abstract readonly modeNames: string[];

	
	public getAllTokens(): Token[] {
		let tokens: Token[] = [];
		let t: Token = this.nextToken();
		while (t.type !== Token.EOF) {
			tokens.push(t);
			t = this.nextToken();
		}
		return tokens;
	}

	public notifyListeners(e: LexerNoViableAltException): void {
		let text: string = this._input.getText(
			Interval.of(this._tokenStartCharIndex, this._input.index));
		let msg: string = "token recognition error at: '" +
			this.getErrorDisplay(text) + "'";

		let listener: ANTLRErrorListener<number> = this.getErrorListenerDispatch();
		if (listener.syntaxError) {
			listener.syntaxError(this, undefined, this._tokenStartLine, this._tokenStartCharPositionInLine, msg, e);
		}
	}

	public getErrorDisplay(s: string | number): string {
		if (typeof s === "number") {
			switch (s) {
			case Token.EOF:
				return "<EOF>";
			case 0x0a:
				return "\\n";
			case 0x09:
				return "\\t";
			case 0x0d:
				return "\\r";
			}
			return String.fromCharCode(s);
		}
		return s.replace(/\n/g, "\\n")
			.replace(/\t/g, "\\t")
			.replace(/\r/g, "\\r");
	}

	public getCharErrorDisplay(c: number): string {
		let s: string = this.getErrorDisplay(c);
		return "'" + s + "'";
	}

	
	public recover(re: RecognitionException): void;
	public recover(re: LexerNoViableAltException): void;
	public recover(re: RecognitionException): void {
		if (re instanceof LexerNoViableAltException) {
			if (this._input.LA(1) !== IntStream.EOF) {
				
				this.interpreter.consume(this._input);
			}
		} else {
			
			
			
			this._input.consume();
		}
	}
}
