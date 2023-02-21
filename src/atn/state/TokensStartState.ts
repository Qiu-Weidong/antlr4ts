



import { ATNStateType } from "./ATNStateType";
import { DecisionState } from "./DecisionState";
import { Override } from "../../Decorators";


export class TokensStartState extends DecisionState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.TOKEN_START;
	}
}
