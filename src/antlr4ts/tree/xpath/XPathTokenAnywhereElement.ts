


import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { Trees } from "../Trees";
import { XPathElement } from "./XPathElement";

export class XPathTokenAnywhereElement extends XPathElement {
	protected tokenType: number;
	constructor(tokenName: string, tokenType: number) {
		super(tokenName);
		this.tokenType = tokenType;
	}

	@Override
	public evaluate(t: ParseTree): ParseTree[] {
		return Trees.findAllTokenNodes(t, this.tokenType);
	}
}
