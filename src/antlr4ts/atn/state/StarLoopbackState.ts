



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { Override } from "../../Decorators";
import { StarLoopEntryState } from "./StarLoopEntryState";

export class StarLoopbackState extends ATNState {
	get loopEntryState(): StarLoopEntryState {
		return this.transition(0).target as StarLoopEntryState;
	}

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.STAR_LOOP_BACK;
	}
}
