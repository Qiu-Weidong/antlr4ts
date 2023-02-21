



import { ATNState } from "../state/ATNState";
import { IntervalSet } from "../../misc/IntervalSet";
import { Override, NotNull } from "../../Decorators";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";


export class AtomTransition extends Transition {
	
	public _label: number;

	constructor(@NotNull target: ATNState, label: number) {
		super(target);
		this._label = label;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.ATOM;
	}

	@Override
	@NotNull
	get label(): IntervalSet {
		return IntervalSet.of(this._label);
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return this._label === symbol;
	}

	@Override
	@NotNull
	public toString(): string {
		return String(this.label);
	}
}
