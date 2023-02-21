


import { ParseTree } from "./ParseTree";
import { ParseTreeListener } from "./ParseTreeListener";
import { ErrorNode } from "./ErrorNode";
import { TerminalNode } from "./TerminalNode";
import { RuleNode } from "./RuleNode";
import { ParserRuleContext } from "../ParserRuleContext";

export class ParseTreeWalker {
	
	public walk<T extends ParseTreeListener>(listener: T, t: ParseTree): void {
		let nodeStack: ParseTree[] = [];
		let indexStack: number[] = [];

		let currentNode: ParseTree | undefined = t;
		let currentIndex: number = 0;

		while (currentNode) {
			
			if (currentNode instanceof ErrorNode) {
				if (listener.visitErrorNode) {
					listener.visitErrorNode(currentNode);
				}
			} else if (currentNode instanceof TerminalNode) {
				if (listener.visitTerminal) {
					listener.visitTerminal(currentNode);
				}
			} else {
				this.enterRule(listener, currentNode as RuleNode);
			}

			
			if (currentNode.childCount > 0) {
				nodeStack.push(currentNode);
				indexStack.push(currentIndex);
				currentIndex = 0;
				currentNode = currentNode.getChild(0);
				continue;
			}

			
			do {
				
				if (currentNode instanceof RuleNode) {
					this.exitRule(listener, currentNode);
				}

				
				if (nodeStack.length === 0) {
					currentNode = undefined;
					currentIndex = 0;
					break;
				}

				
				let last = nodeStack[nodeStack.length - 1];
				currentIndex++;
				currentNode = currentIndex < last.childCount ? last.getChild(currentIndex) : undefined;
				if (currentNode) {
					break;
				}

				
				currentNode = nodeStack.pop();
				currentIndex = indexStack.pop()!;
			} while (currentNode);
		}
	}

	
	protected enterRule(listener: ParseTreeListener, r: RuleNode): void {
		let ctx = r.ruleContext as ParserRuleContext;
		if (listener.enterEveryRule) {
			listener.enterEveryRule(ctx);
		}

		ctx.enterRule(listener);
	}

	
	protected exitRule(listener: ParseTreeListener, r: RuleNode): void {
		let ctx = r.ruleContext as ParserRuleContext;
		ctx.exitRule(listener);
		if (listener.exitEveryRule) {
			listener.exitEveryRule(ctx);
		}
	}
}

export namespace ParseTreeWalker {
	export const DEFAULT: ParseTreeWalker = new ParseTreeWalker();
}
