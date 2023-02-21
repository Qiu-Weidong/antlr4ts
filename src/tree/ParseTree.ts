



import { Parser } from "../Parser";
import { ParseTreeVisitor } from "./ParseTreeVisitor";
import { RuleContext } from "../RuleContext";
import { SyntaxTree } from "./SyntaxTree";


export interface ParseTree extends SyntaxTree {
	
	
	readonly parent: ParseTree | undefined;

	
	setParent(parent: RuleContext): void;

	
	getChild(i: number): ParseTree;

	
	accept<T>(visitor: ParseTreeVisitor<T>): T;

	
	readonly text: string;

	
	toStringTree(parser?: Parser): string;
}
