


import { ParserRuleContext } from "../../ParserRuleContext";
import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { Trees } from "../Trees";
import { XPathElement } from "./XPathElement";

export class XPathRuleElement extends XPathElement {
	protected ruleIndex: number;
	constructor(ruleName: string, ruleIndex: number) {
		super(ruleName);
		this.ruleIndex = ruleIndex;
	}

	@Override
	public evaluate(t: ParseTree): ParseTree[] {
		
		let nodes: ParseTree[] = [];
		for (let c of Trees.getChildren(t)) {
			if (c instanceof ParserRuleContext) {
				if ((c.ruleIndex === this.ruleIndex && !this.invert) ||
					(c.ruleIndex !== this.ruleIndex && this.invert)) {
					nodes.push(c);
				}
			}
		}
		return nodes;
	}
}
