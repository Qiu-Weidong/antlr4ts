



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { Override } from "../../Decorators";


export class BasicState extends ATNState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.BASIC;
	}

}
