



import { DecisionInfo } from "./DecisionInfo";
import { DFA } from "../../dfa/DFA";
import { NotNull } from "../../Decorators";
import { ProfilingATNSimulator } from "../ProfilingATNSimulator";


export class ParseInfo {
	protected atnSimulator: ProfilingATNSimulator;

	constructor(@NotNull atnSimulator: ProfilingATNSimulator) {
		this.atnSimulator = atnSimulator;
	}

	
	@NotNull
	public getDecisionInfo(): DecisionInfo[] {
		return this.atnSimulator.getDecisionInfo();
	}

	
	@NotNull
	public getLLDecisions(): number[] {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let LL: number[] = [];
		for (let i = 0; i < decisions.length; i++) {
			let fallBack: number = decisions[i].LL_Fallback;
			if (fallBack > 0) {
				LL.push(i);
			}
		}

		return LL;
	}

	
	public getTotalTimeInPrediction(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let t: number = 0;
		for (let decision of decisions) {
			t += decision.timeInPrediction;
		}

		return t;
	}

	
	public getTotalSLLLookaheadOps(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let k: number = 0;
		for (let decision of decisions) {
			k += decision.SLL_TotalLook;
		}

		return k;
	}

	
	public getTotalLLLookaheadOps(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let k: number = 0;
		for (let decision of decisions) {
			k += decision.LL_TotalLook;
		}

		return k;
	}

	
	public getTotalSLLATNLookaheadOps(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let k: number = 0;
		for (let decision of decisions) {
			k += decision.SLL_ATNTransitions;
		}

		return k;
	}

	
	public getTotalLLATNLookaheadOps(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let k: number = 0;
		for (let decision of decisions) {
			k += decision.LL_ATNTransitions;
		}

		return k;
	}

	
	public getTotalATNLookaheadOps(): number {
		let decisions: DecisionInfo[] = this.atnSimulator.getDecisionInfo();
		let k: number = 0;
		for (let decision of decisions) {
			k += decision.SLL_ATNTransitions;
			k += decision.LL_ATNTransitions;
		}

		return k;
	}

	
	public getDFASize(): number;

	
	public getDFASize(decision: number): number;

	public getDFASize(decision?: number): number {
		if (decision) {
			let decisionToDFA: DFA = this.atnSimulator.atn.decisionToDFA[decision];
			return decisionToDFA.states.size;
		} else {
			let n: number = 0;
			let decisionToDFA: DFA[] = this.atnSimulator.atn.decisionToDFA;
			for (let i = 0; i < decisionToDFA.length; i++) {
				n += this.getDFASize(i);
			}

			return n;
		}
	}
}
