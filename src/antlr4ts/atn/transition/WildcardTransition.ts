




import { NotNull, Override } from "../../Decorators";
import { ATNState } from "../state/ATNState";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";

export class WildcardTransition extends Transition {
	constructor(@NotNull target: ATNState) {
		super(target);
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.WILDCARD;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
	}

	@Override
	@NotNull
	public toString(): string {
		return ".";
	}
}
