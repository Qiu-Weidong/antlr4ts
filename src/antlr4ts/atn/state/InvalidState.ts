

import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { BasicState } from "./BasicState";
import { Override } from "../../Decorators";


export class InvalidState extends BasicState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.INVALID_TYPE;
	}

}
