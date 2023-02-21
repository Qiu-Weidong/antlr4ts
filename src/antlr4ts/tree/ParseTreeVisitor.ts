



import { ErrorNode } from "./ErrorNode";
import { ParseTree } from "./ParseTree";
import { RuleNode } from "./RuleNode";
import { TerminalNode } from "./TerminalNode";


export interface ParseTreeVisitor<Result> {

	
	visit( tree: ParseTree): Result;

	
	visitChildren( node: RuleNode): Result;

	
	visitTerminal( node: TerminalNode): Result;

	
	visitErrorNode( node: ErrorNode): Result;

}
