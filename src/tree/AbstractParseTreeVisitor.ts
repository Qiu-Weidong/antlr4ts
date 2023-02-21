

import { ErrorNode } from "./ErrorNode";
import { NotNull, Override } from "../Decorators";
import { ParseTree } from "./ParseTree";
import { ParseTreeVisitor } from "./ParseTreeVisitor";
import { RuleNode } from "./RuleNode";
import { TerminalNode } from "./TerminalNode";

export abstract class AbstractParseTreeVisitor<Result> implements ParseTreeVisitor<Result> {

	@Override
	public visit(@NotNull tree: ParseTree): Result {
		return tree.accept(this);
	}

	
	@Override
	public visitChildren(@NotNull node: RuleNode): Result {
		let result: Result = this.defaultResult();
		let n: number = node.childCount;
		for (let i = 0; i < n; i++) {
			if (!this.shouldVisitNextChild(node, result)) {
				break;
			}

			let c: ParseTree = node.getChild(i);
			let childResult: Result = c.accept(this);
			result = this.aggregateResult(result, childResult);
		}

		return result;
	}

	
	@Override
	public visitTerminal(@NotNull node: TerminalNode): Result {
		return this.defaultResult();
	}

	
	@Override
	public visitErrorNode(@NotNull node: ErrorNode): Result {
		return this.defaultResult();
	}

	
	protected abstract defaultResult(): Result;

	
	protected aggregateResult(aggregate: Result, nextResult: Result): Result {
		return nextResult;
	}

	
	protected shouldVisitNextChild(@NotNull node: RuleNode, currentResult: Result): boolean {
		return true;
	}
}
