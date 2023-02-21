



import { CharStream } from "./CharStream";
import { CommonToken } from "./CommonToken";
import { Interval } from "./misc/Interval";
import { Override } from "./Decorators";
import { TokenFactory } from "./TokenFactory";
import { TokenSource } from "./TokenSource";


export class CommonTokenFactory implements TokenFactory {
	
	protected copyText: boolean;

	
	constructor(copyText: boolean = false) {
		this.copyText = copyText;
	}

	@Override
	public create(
		source: { source?: TokenSource, stream?: CharStream },
		type: number,
		text: string | undefined,
		channel: number,
		start: number,
		stop: number,
		line: number,
		charPositionInLine: number): CommonToken {

		let t: CommonToken = new CommonToken(type, text, source, channel, start, stop);
		t.line = line;
		t.charPositionInLine = charPositionInLine;
		if (text == null && this.copyText && source.stream != null) {
			t.text = source.stream.getText(Interval.of(start, stop));
		}

		return t;
	}

	@Override
	public createSimple(type: number, text: string): CommonToken {
		return new CommonToken(type, text);
	}
}

export namespace CommonTokenFactory {
	
	export const DEFAULT: TokenFactory = new CommonTokenFactory();
}
