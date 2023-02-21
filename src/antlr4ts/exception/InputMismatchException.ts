



import { RecognitionException } from "./RecognitionException";
import { NotNull } from "../Decorators";
import { Parser } from "../Parser";
import { ParserRuleContext } from "../ParserRuleContext";


export class InputMismatchException extends RecognitionException {
	

	constructor( recognizer: Parser);
	constructor( recognizer: Parser, state: number, context: ParserRuleContext);
	constructor(@NotNull recognizer: Parser, state?: number, context?: ParserRuleContext) {
		if (context === undefined) {
			context = recognizer.context;
		}

		super(recognizer, recognizer.inputStream, context);

		if (state !== undefined) {
			this.setOffendingState(state);
		}

		this.setOffendingToken(recognizer, recognizer.currentToken);
	}
}
