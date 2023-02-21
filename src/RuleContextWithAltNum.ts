



import { ATN } from "./atn/ATN";
import { Override } from "./Decorators";
import { ParserRuleContext } from "./ParserRuleContext";


export class RuleContextWithAltNum extends ParserRuleContext {
	private _altNumber: number;

	constructor();
	constructor(parent: ParserRuleContext | undefined, invokingStateNumber: number);
	constructor(parent?: ParserRuleContext, invokingStateNumber?: number) {
		if (invokingStateNumber !== undefined) {
			super(parent, invokingStateNumber);
		} else {
			super();
		}

		this._altNumber = ATN.INVALID_ALT_NUMBER;
	}

	@Override
	get altNumber(): number {
		return this._altNumber;
	}

	
	set altNumber(altNum: number) {
		this._altNumber = altNum;
	}
}
