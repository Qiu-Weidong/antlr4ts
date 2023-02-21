


import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";
import { Override, NotNull } from "./Decorators";


export class ProxyErrorListener<TSymbol, TListener extends ANTLRErrorListener<TSymbol>> implements ANTLRErrorListener<TSymbol> {

	constructor(private delegates: TListener[]) {
		if (!delegates) {
			throw new Error("Invalid delegates");
		}
	}

	protected getDelegates(): ReadonlyArray<TListener> {
		return this.delegates;
	}

	@Override
	public syntaxError<T extends TSymbol>(
		@NotNull recognizer: Recognizer<T, any>,
		offendingSymbol: T | undefined,
		line: number,
		charPositionInLine: number,
		@NotNull msg: string,
		e: RecognitionException | undefined): void {
		this.delegates.forEach((listener) => {
			if (listener.syntaxError) {
				listener.syntaxError(recognizer, offendingSymbol, line, charPositionInLine, msg, e);
			}
		});
	}
}
