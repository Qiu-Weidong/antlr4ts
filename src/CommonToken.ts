



import { ATNSimulator } from "./atn/ATNSimulator";
import { CharStream } from "./CharStream";
import { Interval } from "./misc/Interval";
import { NotNull, Override } from "./Decorators";
import { Recognizer } from "./Recognizer";
import { Token } from "./Token";
import { TokenSource } from "./TokenSource";
import { WritableToken } from "./WritableToken";

export class CommonToken implements WritableToken {
	
	protected static readonly EMPTY_SOURCE: { source?: TokenSource, stream?: CharStream } =
		{ source: undefined, stream: undefined };

	
	private _type: number;
	
	private _line: number = 0;
	
	private _charPositionInLine: number = -1; 
	
	private _channel: number = Token.DEFAULT_CHANNEL;
	
	@NotNull
	protected source: { source?: TokenSource, stream?: CharStream };

	
	private _text?: string;

	
	protected index: number = -1;

	
	protected start: number;

	
	private stop: number;

	constructor(type: number, text?: string, @NotNull source: { source?: TokenSource, stream?: CharStream } = CommonToken.EMPTY_SOURCE, channel: number = Token.DEFAULT_CHANNEL, start: number = 0, stop: number = 0) {
		this._text = text;
		this._type = type;
		this.source = source;
		this._channel = channel;
		this.start = start;
		this.stop = stop;
		if (source.source != null) {
			this._line = source.source.line;
			this._charPositionInLine = source.source.charPositionInLine;
		}
	}

	
	public static fromToken(@NotNull oldToken: Token): CommonToken {
		let result: CommonToken = new CommonToken(oldToken.type, undefined, CommonToken.EMPTY_SOURCE, oldToken.channel, oldToken.startIndex, oldToken.stopIndex);
		result._line = oldToken.line;
		result.index = oldToken.tokenIndex;
		result._charPositionInLine = oldToken.charPositionInLine;

		if (oldToken instanceof CommonToken) {
			result._text = oldToken._text;
			result.source = oldToken.source;
		} else {
			result._text = oldToken.text;
			result.source = { source: oldToken.tokenSource, stream: oldToken.inputStream };
		}

		return result;
	}

	@Override
	get type(): number {
		return this._type;
	}

	
	set type(type: number) {
		this._type = type;
	}

	@Override
	get line(): number {
		return this._line;
	}

	
	set line(line: number) {
		this._line = line;
	}

	@Override
	get text(): string | undefined {
		if (this._text != null) {
			return this._text;
		}

		let input: CharStream | undefined = this.inputStream;
		if (input == null) {
			return undefined;
		}

		let n: number = input.size;
		if (this.start < n && this.stop < n) {
			return input.getText(Interval.of(this.start, this.stop));
		} else {
			return "<EOF>";
		}
	}

	
	
	set text(text: string | undefined) {
		this._text = text;
	}

	@Override
	get charPositionInLine(): number {
		return this._charPositionInLine;
	}

	
	set charPositionInLine(charPositionInLine: number) {
		this._charPositionInLine = charPositionInLine;
	}

	@Override
	get channel(): number {
		return this._channel;
	}

	
	set channel(channel: number) {
		this._channel = channel;
	}

	@Override
	get startIndex(): number {
		return this.start;
	}

	set startIndex(start: number) {
		this.start = start;
	}

	@Override
	get stopIndex(): number {
		return this.stop;
	}

	set stopIndex(stop: number) {
		this.stop = stop;
	}

	@Override
	get tokenIndex(): number {
		return this.index;
	}

	
	set tokenIndex(index: number) {
		this.index = index;
	}

	@Override
	get tokenSource(): TokenSource | undefined {
		return this.source.source;
	}

	@Override
	get inputStream(): CharStream | undefined {
		return this.source.stream;
	}

	public toString(): string;
	public toString<TSymbol, ATNInterpreter extends ATNSimulator>(recognizer: Recognizer<TSymbol, ATNInterpreter> | undefined): string;

	@Override
	public toString<TSymbol, ATNInterpreter extends ATNSimulator>(recognizer?: Recognizer<TSymbol, ATNInterpreter>): string {
		let channelStr: string = "";
		if (this._channel > 0) {
			channelStr = ",channel=" + this._channel;
		}

		let txt: string | undefined = this.text;
		if (txt != null) {
			txt = txt.replace(/\n/g, "\\n");
			txt = txt.replace(/\r/g, "\\r");
			txt = txt.replace(/\t/g, "\\t");
		} else {
			txt = "<no text>";
		}

		let typeString = String(this._type);
		if (recognizer) {
			typeString = recognizer.vocabulary.getDisplayName(this._type);
		}

		return "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" + txt + "',<" + typeString + ">" + channelStr + "," + this._line + ":" + this.charPositionInLine + "]";
	}
}
