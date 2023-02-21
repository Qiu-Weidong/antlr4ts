



import { ATNState } from "./ATNState";

export abstract class DecisionState extends ATNState {
	public decision: number = -1;
	public nonGreedy: boolean = false;
	public sll: boolean = false;
}
