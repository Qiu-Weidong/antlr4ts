



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { Override } from "../../Decorators";


export class LoopEndState extends ATNState {
	
	public loopBackState!: ATNState;

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.LOOP_END;
	}
}
