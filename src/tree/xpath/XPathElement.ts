


import { Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";

export abstract class XPathElement {
	protected nodeName: string;
	public invert: boolean;

	
	constructor(nodeName: string) {
		this.nodeName = nodeName;
		this.invert = false;
	}

	
	public abstract evaluate(t: ParseTree): ParseTree[];

	@Override
	public toString(): string {
		let inv: string = this.invert ? "!" : "";
		let className: string = Object.constructor.name;
		return className + "[" + inv + this.nodeName + "]";
	}
}
