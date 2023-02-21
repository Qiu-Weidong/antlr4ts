



import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";


export class ConsoleErrorListener implements ANTLRErrorListener<any> {
	
	public static readonly INSTANCE: ConsoleErrorListener = new ConsoleErrorListener();

	
	public syntaxError<T>(
		recognizer: Recognizer<T, any>,
		offendingSymbol: T,
		line: number,
		charPositionInLine: number,
		msg: string,
		e: RecognitionException | undefined): void {
		console.error(`line ${line}:${charPositionInLine} ${msg}`);
	}
}
