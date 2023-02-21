



import { ATNStateType } from "./ATNStateType";
import { BitSet } from "../../misc/BitSet";
import { DecisionState } from "./DecisionState";
import { Override } from "../../Decorators";
import { StarLoopbackState } from "./StarLoopbackState";

export class StarLoopEntryState extends DecisionState {
	
	public loopBackState!: StarLoopbackState;

	
	public precedenceRuleDecision: boolean = false;

	
	public precedenceLoopbackStates: BitSet = new BitSet();

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.STAR_LOOP_ENTRY;
	}
}
