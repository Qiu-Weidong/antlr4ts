



import { NotNull, Override } from "../../Decorators";
import { SemanticContext } from "../context/SemanticContext";
import { ATNState } from "../state/ATNState";
import { AbstractPredicateTransition } from "./AbstractPredicateTransition";
import { TransitionType } from "./TransitionType";


export class PredicateTransition extends AbstractPredicateTransition {
	public ruleIndex: number;
	public predIndex: number;
	public isCtxDependent: boolean;   

	constructor(@NotNull target: ATNState, ruleIndex: number, predIndex: number, isCtxDependent: boolean) {
		super(target);
		this.ruleIndex = ruleIndex;
		this.predIndex = predIndex;
		this.isCtxDependent = isCtxDependent;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.PREDICATE;
	}

	@Override
	get isEpsilon(): boolean { return true; }

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return false;
	}

	get predicate(): SemanticContext.Predicate {
		return new SemanticContext.Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
	}

	@Override
	@NotNull
	public toString(): string {
		return "pred_" + this.ruleIndex + ":" + this.predIndex;
	}
}
