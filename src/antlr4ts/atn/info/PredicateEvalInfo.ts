



import { DecisionEventInfo } from "./DecisionEventInfo";
import { NotNull } from "../../Decorators";
import { SimulatorState } from "../state/SimulatorState";
import { TokenStream } from "../../TokenStream";
import { SemanticContext } from "../context/SemanticContext";


export class PredicateEvalInfo extends DecisionEventInfo {
	
	public semctx: SemanticContext;
	
	public predictedAlt: number;
	
	public evalResult: boolean;

	
	constructor(
		@NotNull state: SimulatorState,
		decision: number,
		@NotNull input: TokenStream,
		startIndex: number,
		stopIndex: number,
		@NotNull semctx: SemanticContext,
		evalResult: boolean,
		predictedAlt: number) {

		super(decision, state, input, startIndex, stopIndex, state.useContext);
		this.semctx = semctx;
		this.evalResult = evalResult;
		this.predictedAlt = predictedAlt;
	}
}
