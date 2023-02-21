



import { AbstractPredicateTransition } from "./AbstractPredicateTransition";
import { ATNState } from "../state/ATNState";
import { NotNull, Override } from "../../Decorators";
import { TransitionType } from "./TransitionType";
import { SemanticContext } from "../context/SemanticContext";


export class PrecedencePredicateTransition extends AbstractPredicateTransition {
	public precedence: number;

	constructor( @NotNull target: ATNState, precedence: number) {
		super(target);
		this.precedence = precedence;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.PRECEDENCE;
	}

	@Override
	get isEpsilon(): boolean {
		return true;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return false;
	}

	get predicate(): SemanticContext.PrecedencePredicate {
		return new SemanticContext.PrecedencePredicate(this.precedence);
	}

	@Override
	public toString(): string {
		return this.precedence + " >= _p";
	}
}
