



import { ATN } from "../atn/ATN";
import { ATNState } from "../atn/state/ATNState";
import { Parser } from "../Parser";
import { RecognitionException } from "./RecognitionException";
import { Recognizer } from "../Recognizer";
import { NotNull } from "../Decorators";
import { AbstractPredicateTransition } from "../atn/transition/AbstractPredicateTransition";
import { PredicateTransition } from "../atn/transition/PredicateTransition";


export class FailedPredicateException extends RecognitionException {
	

	private _ruleIndex: number;
	private _predicateIndex: number;
	private _predicate?: string;

	constructor(@NotNull recognizer: Parser, predicate?: string, message?: string) {
		super(
			recognizer,
			recognizer.inputStream,
			recognizer.context,
			FailedPredicateException.formatMessage(predicate, message));
		let s: ATNState = recognizer.interpreter.atn.states[recognizer.state];

		let trans = s.transition(0) as AbstractPredicateTransition;
		if (trans instanceof PredicateTransition) {
			this._ruleIndex = trans.ruleIndex;
			this._predicateIndex = trans.predIndex;
		}
		else {
			this._ruleIndex = 0;
			this._predicateIndex = 0;
		}

		this._predicate = predicate;
		super.setOffendingToken(recognizer, recognizer.currentToken);
	}

	get ruleIndex(): number {
		return this._ruleIndex;
	}

	get predicateIndex(): number {
		return this._predicateIndex;
	}

	get predicate(): string | undefined {
		return this._predicate;
	}

	@NotNull
	private static formatMessage(predicate: string | undefined, message: string | undefined): string {
		if (message) {
			return message;
		}

		return `failed predicate: {${predicate}}?`;
	}
}
