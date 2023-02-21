


import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { TerminalNode } from "../TerminalNode";
import { Trees } from "../Trees";
import { XPathElement } from "./XPathElement";

export class XPathTokenElement extends XPathElement {
	protected tokenType: number;
	constructor(tokenName: string, tokenType: number) {
		super(tokenName);
		this.tokenType = tokenType;
	}

	@Override
	public evaluate(t: ParseTree): ParseTree[] {
		
		let nodes: ParseTree[] = [];
		for (let c of Trees.getChildren(t)) {
			if (c instanceof TerminalNode) {
				if ((c.symbol.type === this.tokenType && !this.invert) ||
					(c.symbol.type !== this.tokenType && this.invert)) {
					nodes.push(c);
				}
			}
		}
		return nodes;
	}
}
