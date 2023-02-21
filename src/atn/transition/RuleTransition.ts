




import { NotNull, Override } from "../../Decorators";
import { ATNState } from "../state/ATNState";
import { RuleStartState } from "../state/RuleStartState";
import { Transition } from "./Transition";
import { TransitionType } from "./TransitionType";


export class RuleTransition extends Transition {
	
	public ruleIndex: number;      

	public precedence: number;

	
	@NotNull
	public followState: ATNState;

	public tailCall: boolean = false;
	public optimizedTailCall: boolean = false;

	constructor(@NotNull ruleStart: RuleStartState, ruleIndex: number, precedence: number, @NotNull followState: ATNState) {
		super(ruleStart);
		this.ruleIndex = ruleIndex;
		this.precedence = precedence;
		this.followState = followState;
	}

	@Override
	get serializationType(): TransitionType {
		return TransitionType.RULE;
	}

	@Override
	get isEpsilon(): boolean {
		return true;
	}

	@Override
	public matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean {
		return false;
	}
}
