




import { ATNConfigSet } from "../atn/config/ATNConfigSet";
import { CharStream } from "../CharStream";
import { NotNull, Override } from "../Decorators";
import { Lexer } from "../Lexer";
import { Interval } from "../misc";
import { RecognitionException } from "./RecognitionException";
import * as Utils from '../misc/Utils';

export class LexerNoViableAltException extends RecognitionException {
	

	
	private _startIndex: number;

	
	private _deadEndConfigs?: ATNConfigSet;

	constructor(
		lexer: Lexer | undefined,
		@NotNull input: CharStream,
		startIndex: number,
		deadEndConfigs: ATNConfigSet | undefined) {
		super(lexer, input);
		this._startIndex = startIndex;
		this._deadEndConfigs = deadEndConfigs;
	}

	get startIndex(): number {
		return this._startIndex;
	}

	get deadEndConfigs(): ATNConfigSet | undefined {
		return this._deadEndConfigs;
	}

	@Override
	get inputStream(): CharStream {
		return super.inputStream as CharStream;
	}

	@Override
	public toString(): string {
		let symbol = "";
		if (this._startIndex >= 0 && this._startIndex < this.inputStream.size) {
			symbol = this.inputStream.getText(Interval.of(this._startIndex, this._startIndex));
			symbol = Utils.escapeWhitespace(symbol, false);
		}

		
		return `LexerNoViableAltException('${symbol}')`;
	}
}
