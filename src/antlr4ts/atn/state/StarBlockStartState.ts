



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { BlockStartState } from "./BlockStartState";
import { Override } from "../../Decorators";


export class StarBlockStartState extends BlockStartState {

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.STAR_BLOCK_START;
	}
}
