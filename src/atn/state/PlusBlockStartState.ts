



import { ATNStateType } from "./ATNStateType";
import { BlockStartState } from "./BlockStartState";
import { Override } from "../../Decorators";
import { PlusLoopbackState } from "./PlusLoopbackState";


export class PlusBlockStartState extends BlockStartState {
	
	public loopBackState!: PlusLoopbackState;

	@Override
	get stateType(): ATNStateType {
		return ATNStateType.PLUS_BLOCK_START;
	}
}
