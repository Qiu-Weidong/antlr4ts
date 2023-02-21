


import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { TerminalNode } from "../TerminalNode";
import { Trees } from "../Trees";
import { XPath } from "./XPath";
import { XPathElement } from "./XPathElement";

export class XPathWildcardAnywhereElement extends XPathElement {
	constructor() {
		super(XPath.WILDCARD);
	}

	@Override
	public evaluate(t: ParseTree): ParseTree[] {
		if (this.invert) {
			
			return [];
		}
		return Trees.getDescendants(t);
	}
}
