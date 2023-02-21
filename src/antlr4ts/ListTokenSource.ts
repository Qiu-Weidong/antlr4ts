



import { CharStream } from "./CharStream";
import { CommonTokenFactory } from "./CommonTokenFactory";
import { NotNull, Override } from "./Decorators";
import { Token } from "./Token";
import { TokenFactory } from "./TokenFactory";
import { TokenSource } from "./TokenSource";


export class ListTokenSource implements TokenSource {
	
	protected tokens: Token[];

	
	private _sourceName?: string;

	
	protected i: number = 0;

	
	protected eofToken?: Token;

	
	private _factory: TokenFactory = CommonTokenFactory.DEFAULT;

	
	constructor(@NotNull tokens: Token[], sourceName?: string) {
		if (tokens == null) {
			throw new Error("tokens cannot be null");
		}

		this.tokens = tokens;
		this._sourceName = sourceName;
	}

	
	@Override
	get charPositionInLine(): number {
		if (this.i < this.tokens.length) {
			return this.tokens[this.i].charPositionInLine;
		} else if (this.eofToken != null) {
			return this.eofToken.charPositionInLine;
		} else if (this.tokens.length > 0) {
			
			
			let lastToken: Token = this.tokens[this.tokens.length - 1];
			let tokenText: string | undefined = lastToken.text;
			if (tokenText != null) {
				let lastNewLine: number = tokenText.lastIndexOf("\n");
				if (lastNewLine >= 0) {
					return tokenText.length - lastNewLine - 1;
				}
			}

			return lastToken.charPositionInLine + lastToken.stopIndex - lastToken.startIndex + 1;
		}

		
		
		return 0;
	}

	
	@Override
	public nextToken(): Token {
		if (this.i >= this.tokens.length) {
			if (this.eofToken == null) {
				let start: number = -1;
				if (this.tokens.length > 0) {
					let previousStop: number = this.tokens[this.tokens.length - 1].stopIndex;
					if (previousStop !== -1) {
						start = previousStop + 1;
					}
				}

				let stop: number = Math.max(-1, start - 1);
				this.eofToken = this._factory.create({ source: this, stream: this.inputStream }, Token.EOF, "EOF", Token.DEFAULT_CHANNEL, start, stop, this.line, this.charPositionInLine);
			}

			return this.eofToken;
		}

		let t: Token = this.tokens[this.i];
		if (this.i === this.tokens.length - 1 && t.type === Token.EOF) {
			this.eofToken = t;
		}

		this.i++;
		return t;
	}

	
	@Override
	get line(): number {
		if (this.i < this.tokens.length) {
			return this.tokens[this.i].line;
		} else if (this.eofToken != null) {
			return this.eofToken.line;
		} else if (this.tokens.length > 0) {
			
			
			let lastToken: Token = this.tokens[this.tokens.length - 1];
			let line: number = lastToken.line;

			let tokenText: string | undefined = lastToken.text;
			if (tokenText != null) {
				for (let i = 0; i < tokenText.length; i++) {
					if (tokenText.charAt(i) === "\n") {
						line++;
					}
				}
			}

			
			return line;
		}

		
		
		return 1;
	}

	
	@Override
	get inputStream(): CharStream | undefined {
		if (this.i < this.tokens.length) {
			return this.tokens[this.i].inputStream;
		} else if (this.eofToken != null) {
			return this.eofToken.inputStream;
		} else if (this.tokens.length > 0) {
			return this.tokens[this.tokens.length - 1].inputStream;
		}

		
		return undefined;
	}

	
	@Override
	get sourceName(): string {
		if (this._sourceName) {
			return this._sourceName;
		}

		let inputStream: CharStream | undefined = this.inputStream;
		if (inputStream != null) {
			return inputStream.sourceName;
		}

		return "List";
	}

	
	
	set tokenFactory(@NotNull factory: TokenFactory) {
		this._factory = factory;
	}

	
	@Override
	@NotNull
	get tokenFactory(): TokenFactory {
		return this._factory;
	}
}
