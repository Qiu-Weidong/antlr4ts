



import { NotNull } from "../../Decorators";
import { SimulatorState } from "../state/SimulatorState";
import { TokenStream } from "../../TokenStream";


export class DecisionEventInfo {
	
	public decision: number;

	
	public state: SimulatorState | undefined;

	
	@NotNull
	public input: TokenStream;

	
	public startIndex: number;

	
	public stopIndex: number;

	
	public fullCtx: boolean;

	constructor(
		decision: number,
		state: SimulatorState | undefined,
		@NotNull input: TokenStream,
		startIndex: number,
		stopIndex: number,
		fullCtx: boolean) {

		this.decision = decision;
		this.fullCtx = fullCtx;
		this.stopIndex = stopIndex;
		this.input = input;
		this.startIndex = startIndex;
		this.state = state;
	}
}
