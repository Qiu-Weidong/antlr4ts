



import { BitSet } from "../../misc/BitSet";
import { DecisionEventInfo } from "./DecisionEventInfo";
import { NotNull } from "../../Decorators";
import { SimulatorState } from "../state/SimulatorState";
import { TokenStream } from "../../TokenStream";


export class AmbiguityInfo extends DecisionEventInfo {
	
	@NotNull
	private ambigAlts: BitSet;

	
	constructor(
		decision: number,
		@NotNull state: SimulatorState,
		@NotNull ambigAlts: BitSet,
		@NotNull input: TokenStream,
		startIndex: number,
		stopIndex: number) {
		super(decision, state, input, startIndex, stopIndex, state.useContext);
		this.ambigAlts = ambigAlts;
	}

	
	@NotNull
	get ambiguousAlternatives(): BitSet {
		return this.ambigAlts;
	}
}
