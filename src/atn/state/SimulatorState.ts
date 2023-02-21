



import { DFAState } from "../../dfa/DFAState";
import { NotNull } from "../../Decorators";
import { ParserRuleContext } from "../../ParserRuleContext";


export class SimulatorState {
	public outerContext: ParserRuleContext;

	public s0: DFAState;

	public useContext: boolean;
	public remainingOuterContext: ParserRuleContext | undefined;

	constructor(outerContext: ParserRuleContext, @NotNull s0: DFAState, useContext: boolean, remainingOuterContext: ParserRuleContext | undefined) {
		this.outerContext = outerContext != null ? outerContext : ParserRuleContext.emptyContext();
		this.s0 = s0;
		this.useContext = useContext;
		this.remainingOuterContext = remainingOuterContext;
	}
}
