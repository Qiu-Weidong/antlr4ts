


import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { TerminalNode } from "../TerminalNode";
import { Trees } from "../Trees";
import { XPath } from "./XPath";
import { XPathElement } from "./XPathElement";

export class XPathWildcardElement extends XPathElement {
	constructor() {
		super(XPath.WILDCARD);
	}

	@Override
	public evaluate(t: ParseTree): ParseTree[] {
		let kids: ParseTree[] = [];
		if (this.invert) {
			
			return kids;
		}
		for (let c of Trees.getChildren(t)) {
			kids.push(c);
		}
		return kids;
	}
}
