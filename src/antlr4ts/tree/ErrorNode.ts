
import { Override } from "../Decorators";
import { ParseTreeVisitor } from "./ParseTreeVisitor";
import { TerminalNode } from "./TerminalNode";
import { Token } from "../Token";

export class ErrorNode extends TerminalNode {
	constructor(token: Token) {
		super(token);
	}

	@Override
	public accept<T>(visitor: ParseTreeVisitor<T>): T {
		return visitor.visitErrorNode(this);
	}
}
