



import { Override } from "./Decorators";
import { ParserRuleContext } from "./ParserRuleContext";


export class InterpreterRuleContext extends ParserRuleContext {
	
	private _ruleIndex: number;

	constructor(ruleIndex: number);

	
	constructor(ruleIndex: number, parent: ParserRuleContext | undefined, invokingStateNumber: number);

	constructor(ruleIndex: number, parent?: ParserRuleContext, invokingStateNumber?: number) {
		if (invokingStateNumber !== undefined) {
			super(parent, invokingStateNumber);
		} else {
			super();
		}

		this._ruleIndex = ruleIndex;
	}

	@Override
	get ruleIndex(): number {
		return this._ruleIndex;
	}
}
