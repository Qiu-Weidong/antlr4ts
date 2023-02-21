



import { ATNStateType } from "./ATNStateType";
import { BlockStartState } from "./BlockStartState";
import { Override } from "../../Decorators";


export class BasicBlockStartState extends BlockStartState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.BLOCK_START;
	}

}
