



import { ATNState } from "../state/ATNState";
import { IntervalSet } from "../../misc/IntervalSet";
import { Override, NotNull, Nullable } from "../../Decorators";
import { Token } from "../../Token";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";


export class SetTransition extends Transition {
	@NotNull
	public set: IntervalSet;

	
	constructor(@NotNull target: ATNState, @Nullable set: IntervalSet) {
		super(target);
		if (set == null) {
			set = IntervalSet.of(Token.INVALID_TYPE);
		}

		this.set = set;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.SET;
	}

	@Override
	@NotNull
	get label(): IntervalSet {
		return this.set;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return this.set.contains(symbol);
	}

	@Override
	@NotNull
	public toString(): string {
		return this.set.toString();
	}
}
