



import { AmbiguityInfo } from "./AmbiguityInfo";
import { ContextSensitivityInfo } from "./ContextSensitivityInfo";
import { ErrorInfo } from "./ErrorInfo";
import { LookaheadEventInfo } from "./LookaheadEventInfo";
import { Override } from "../../Decorators";
import { PredicateEvalInfo } from "./PredicateEvalInfo";


export class DecisionInfo {
	
	public decision: number;

	
	public invocations: number = 0;

	
	public timeInPrediction: number = 0;

	
	public SLL_TotalLook: number = 0;

	
	public SLL_MinLook: number = 0;

	
	public SLL_MaxLook: number = 0;

	
	public SLL_MaxLookEvent?: LookaheadEventInfo;

	
	public LL_TotalLook: number = 0;

	
	public LL_MinLook: number = 0;

	
	public LL_MaxLook: number = 0;

	
	public LL_MaxLookEvent?: LookaheadEventInfo;

	
	public contextSensitivities: ContextSensitivityInfo[] = [];

	
	public errors: ErrorInfo[] = [];

	
	public ambiguities: AmbiguityInfo[] = [];

	
	public predicateEvals: PredicateEvalInfo[] = [];

	
	public SLL_ATNTransitions: number = 0;

	
	public SLL_DFATransitions: number = 0;

	
	public LL_Fallback: number = 0;

	
	public LL_ATNTransitions: number = 0;

	
	public LL_DFATransitions: number = 0;

	
	constructor(decision: number) {
		this.decision = decision;
	}

	@Override
	public toString(): string {
		return "{" +
			"decision=" + this.decision +
			", contextSensitivities=" + this.contextSensitivities.length +
			", errors=" + this.errors.length +
			", ambiguities=" + this.ambiguities.length +
			", SLL_lookahead=" + this.SLL_TotalLook +
			", SLL_ATNTransitions=" + this.SLL_ATNTransitions +
			", SLL_DFATransitions=" + this.SLL_DFATransitions +
			", LL_Fallback=" + this.LL_Fallback +
			", LL_lookahead=" + this.LL_TotalLook +
			", LL_ATNTransitions=" + this.LL_ATNTransitions +
			"}";
	}
}
