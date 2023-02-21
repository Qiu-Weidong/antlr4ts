




import { Recognizer } from "./Recognizer";
import { RecognitionException } from "./exception/RecognitionException";

export interface ANTLRErrorListener<TSymbol> {
	
	syntaxError?: <T extends TSymbol>(
		
		recognizer: Recognizer<T, any>,
		offendingSymbol: T | undefined,
		line: number,
		charPositionInLine: number,
		
		msg: string,
		e: RecognitionException | undefined) => void;
}
