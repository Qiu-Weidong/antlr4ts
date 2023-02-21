



import { DecisionEventInfo } from "./DecisionEventInfo";
import { NotNull } from "../../Decorators";
import { SimulatorState } from "../state/SimulatorState";
import { TokenStream } from "../../TokenStream";


export class LookaheadEventInfo extends DecisionEventInfo {
	
	public predictedAlt: number;

	
	constructor(
		decision: number,
		state: SimulatorState | undefined,
		predictedAlt: number,
		@NotNull input: TokenStream,
		startIndex: number,
		stopIndex: number,
		fullCtx: boolean) {

		super(decision, state, input, startIndex, stopIndex, fullCtx);
		this.predictedAlt = predictedAlt;
	}
}
