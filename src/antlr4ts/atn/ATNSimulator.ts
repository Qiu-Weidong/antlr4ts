

import { NotNull } from "../Decorators";
import { DFAState } from "../dfa";
import { ATN } from "./ATN";
import { ATNConfigSet } from "./config/ATNConfigSet";
import { PredictionContext } from "./context/PredictionContext";





export abstract class ATNSimulator {
	
	private static _ERROR: DFAState;
	@NotNull
	static get ERROR(): DFAState {
		if (!ATNSimulator._ERROR) {
			ATNSimulator._ERROR = new DFAState(new ATNConfigSet());
			ATNSimulator._ERROR.stateNumber = PredictionContext.EMPTY_FULL_STATE_KEY;
		}

		return ATNSimulator._ERROR;
	}

	@NotNull
	public atn: ATN;

	constructor(@NotNull atn: ATN) {
		this.atn = atn;
	}

	public abstract reset(): void;

	
	public clearDFA(): void {
		this.atn.clearDFA();
	}
}

export namespace ATNSimulator {
	const RULE_VARIANT_DELIMITER: string = "$";
	const RULE_LF_VARIANT_MARKER: string = "$lf$";
	const RULE_NOLF_VARIANT_MARKER: string = "$nolf$";
}
