



import { RuleContext } from "../RuleContext";
import { ParseTree } from "./ParseTree";
import { ParseTreeVisitor } from "./ParseTreeVisitor";
import { Parser } from "../Parser";
import { Interval } from "../misc/Interval";

export abstract class RuleNode implements ParseTree {
	public abstract readonly ruleContext: RuleContext;

	
	public abstract readonly parent: RuleNode | undefined;

	public abstract setParent(parent: RuleContext): void;

	public abstract getChild(i: number): ParseTree;

	public abstract accept<T>(visitor: ParseTreeVisitor<T>): T;

	public abstract readonly text: string;

	public abstract toStringTree(parser?: Parser | undefined): string;

	public abstract readonly sourceInterval: Interval;

	public abstract readonly payload: any;

	public abstract readonly childCount: number;
}
