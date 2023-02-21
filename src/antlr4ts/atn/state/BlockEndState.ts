



import { ATNState } from "./ATNState";
import { ATNStateType } from "./ATNStateType";
import { BlockStartState } from "./BlockStartState";
import { Override } from "../../Decorators";


export class BlockEndState extends ATNState {
	
	public startState!: BlockStartState;

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.BLOCK_END;
	}
}
