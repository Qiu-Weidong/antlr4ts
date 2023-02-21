



import { ATNStateType } from "./ATNStateType";
import { DecisionState } from "./DecisionState";
import { Override } from "../../Decorators";


export class PlusLoopbackState extends DecisionState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.PLUS_LOOP_BACK;
	}
}
