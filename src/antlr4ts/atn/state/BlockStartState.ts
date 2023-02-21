



import { BlockEndState } from "./BlockEndState";
import { DecisionState } from "./DecisionState";
import { Override } from "../../Decorators";


export abstract class BlockStartState extends DecisionState {
	
	public endState!: BlockEndState;
}
