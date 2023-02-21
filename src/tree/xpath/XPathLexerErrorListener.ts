



import { ANTLRErrorListener } from "../../ANTLRErrorListener";
import { Override } from "../../Decorators";
import { Recognizer } from "../../Recognizer";
import { RecognitionException } from "../../exception/RecognitionException";

export class XPathLexerErrorListener implements ANTLRErrorListener<number> {
	@Override
	public syntaxError<T extends number>(
		recognizer: Recognizer<T, any>, offendingSymbol: T | undefined,
		line: number, charPositionInLine: number, msg: string,
		e: RecognitionException | undefined): void {
		
	}
}
