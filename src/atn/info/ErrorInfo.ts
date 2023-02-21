



import { DecisionEventInfo } from "./DecisionEventInfo";
import { NotNull } from "../../Decorators";
import { SimulatorState } from "../state/SimulatorState";
import { TokenStream } from "../../TokenStream";


export class ErrorInfo extends DecisionEventInfo {
	
	constructor(
		decision: number,
		@NotNull state: SimulatorState,
		@NotNull input: TokenStream,
		startIndex: number,
		stopIndex: number) {

		super(decision, state, input, startIndex, stopIndex, state.useContext);
	}
}
