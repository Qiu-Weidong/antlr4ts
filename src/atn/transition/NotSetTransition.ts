




import { IntervalSet } from "../../misc";
import { Override, NotNull, Nullable } from "../../Decorators";
import { ATNState } from "../state/ATNState";
import { SetTransition } from "./SetTransition";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";

export class NotSetTransition extends SetTransition {
	constructor(@NotNull target: ATNState, @Nullable set: IntervalSet) {
		super(target, set);
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.NOT_SET;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return symbol >= minVocabSymbol
			&& symbol <= maxVocabSymbol
			&& !super.matches(symbol, minVocabSymbol, maxVocabSymbol);
	}

	@Override
	public toString(): string {
		return "~" + super.toString();
	}
}
