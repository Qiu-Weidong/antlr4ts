



import { ErrorNode } from "./ErrorNode";
import { ParserRuleContext } from "../ParserRuleContext";
import { TerminalNode } from "./TerminalNode";


export interface ParseTreeListener {
	visitTerminal?: ( node: TerminalNode) => void;
	visitErrorNode?: ( node: ErrorNode) => void;
	enterEveryRule?: ( ctx: ParserRuleContext) => void;
	exitEveryRule?: ( ctx: ParserRuleContext) => void;
}
