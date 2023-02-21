



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { Override } from "../../Decorators";


export class RuleStopState extends ATNState {

	@Override
	get nonStopStateNumber(): number {
		return -1;
	}

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.RULE_STOP;
	}

}
