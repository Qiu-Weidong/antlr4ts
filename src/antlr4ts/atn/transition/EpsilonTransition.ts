




import { NotNull, Override } from "../../Decorators";
import { ATNState } from "../state/ATNState";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";

export class EpsilonTransition extends Transition {

	private _outermostPrecedenceReturn: number;

	constructor(@NotNull target: ATNState, outermostPrecedenceReturn: number = -1) {
		super(target);
		this._outermostPrecedenceReturn = outermostPrecedenceReturn;
	}

	
	get outermostPrecedenceReturn(): number {
		return this._outermostPrecedenceReturn;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.EPSILON;
	}

	@Override
	get isEpsilon(): boolean {
		return true;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return false;
	}

	@Override
	@NotNull
	public toString(): string {
		return "epsilon";
	}
}
