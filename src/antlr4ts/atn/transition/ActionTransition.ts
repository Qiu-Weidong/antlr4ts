




import { NotNull, Override } from "../../Decorators";
import { ATNState } from "../state/ATNState";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";

export class ActionTransition extends Transition {
	public ruleIndex: number;
	public actionIndex: number;
	public isCtxDependent: boolean;  

	constructor(@NotNull target: ATNState, ruleIndex: number, actionIndex: number = -1, isCtxDependent: boolean = false) {
		super(target);
		this.ruleIndex = ruleIndex;
		this.actionIndex = actionIndex;
		this.isCtxDependent = isCtxDependent;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.ACTION;
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
	public toString(): string {
		return "action_" + this.ruleIndex + ":" + this.actionIndex;
	}
}
