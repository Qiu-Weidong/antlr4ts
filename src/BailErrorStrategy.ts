



import { DefaultErrorStrategy } from "./DefaultErrorStrategy";
import { Parser } from "./Parser";
import { InputMismatchException } from "./exception/InputMismatchException";
import { Override } from "./Decorators";
import { ParseCancellationException } from "./misc/ParseCancellationException";
import { ParserRuleContext } from "./ParserRuleContext";
import { RecognitionException } from "./exception/RecognitionException";
import { Token } from "./Token";


export class BailErrorStrategy extends DefaultErrorStrategy {
	
	@Override
	public recover(recognizer: Parser, e: RecognitionException): void {
		for (let context: ParserRuleContext | undefined = recognizer.context; context; context = context.parent) {
			context.exception = e;
		}

		throw new ParseCancellationException(e);
	}

	
	@Override
	public recoverInline(recognizer: Parser): Token {
		let e = new InputMismatchException(recognizer);
		for (let context: ParserRuleContext | undefined = recognizer.context; context; context = context.parent) {
			context.exception = e;
		}

		throw new ParseCancellationException(e);
	}

	
	@Override
	public sync(recognizer: Parser): void {
		
	}
}
