



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { Override } from "../../Decorators";
import { RuleStopState } from "./RuleStopState";

export class RuleStartState extends ATNState {
	
	public stopState!: RuleStopState;
	public isPrecedenceRule: boolean = false;
	public leftFactored: boolean = false;

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.RULE_START;
	}
}
