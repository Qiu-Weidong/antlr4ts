



import { Arrays } from "../misc/Arrays";
import { ATN } from "../atn/ATN";
import { CommonToken } from "../CommonToken";
import { ErrorNode } from "./ErrorNode";
import { Interval } from "../misc/Interval";
import { NotNull } from "../Decorators";
import { Parser } from "../Parser";
import { ParserRuleContext } from "../ParserRuleContext";
import { ParseTree } from "./ParseTree";
import { RuleContext } from "../RuleContext";
import { RuleNode } from "./RuleNode";
import { TerminalNode } from "./TerminalNode";
import { Token } from "../Token";
import { Tree } from "./Tree";
import * as Utils from "../misc/Utils";


export class Trees {
	
	public static toStringTree( t: Tree): string;

	
	public static toStringTree( t: Tree, recog: Parser | undefined): string;

	
	public static toStringTree( t: Tree,  ruleNames: string[] | undefined): string;

	public static toStringTree( t: Tree, arg2?: Parser | string[]): string;
	public static toStringTree(@NotNull t: Tree, arg2?: Parser | string[]): string {
		let ruleNames: string[] | undefined;
		if (arg2 instanceof Parser) {
			ruleNames = arg2.ruleNames;
		} else {
			ruleNames = arg2;
		}

		let s: string = Utils.escapeWhitespace(this.getNodeText(t, ruleNames), false);
		if (t.childCount === 0) {
			return s;
		}
		let buf = "";
		buf += ("(");
		s = Utils.escapeWhitespace(this.getNodeText(t, ruleNames), false);
		buf += (s);
		buf += (" ");
		for (let i = 0; i < t.childCount; i++) {
			if (i > 0) {
				buf += (" ");
			}
			buf += (this.toStringTree(t.getChild(i), ruleNames));
		}
		buf += (")");
		return buf;
	}

	public static getNodeText( t: Tree, recog: Parser | undefined): string;
	public static getNodeText( t: Tree, ruleNames: string[] | undefined): string;
	public static getNodeText(t: Tree, arg2: Parser | string[] | undefined): string {
		let ruleNames: string[] | undefined;
		if (arg2 instanceof Parser) {
			ruleNames = arg2.ruleNames;
		} else if (arg2) {
			ruleNames = arg2;
		} else {
			
			let payload = t.payload;
			if (typeof payload.text === "string") {
				return payload.text;
			}
			return t.payload.toString();
		}

		if (t instanceof RuleNode) {
			let ruleContext: RuleContext = t.ruleContext;
			let ruleIndex: number = ruleContext.ruleIndex;
			let ruleName: string = ruleNames[ruleIndex];
			let altNumber: number = ruleContext.altNumber;
			if (altNumber !== ATN.INVALID_ALT_NUMBER) {
				return ruleName + ":" + altNumber;
			}
			return ruleName;
		}
		else if (t instanceof ErrorNode) {
			return t.toString();
		}
		else if (t instanceof TerminalNode) {
			let symbol = t.symbol;
			return symbol.text || "";
		}
		throw new TypeError("Unexpected node type");
	}

	
	public static getChildren(t: ParseTree): ParseTree[];
	public static getChildren(t: Tree): Tree[];
	public static getChildren(t: Tree): Tree[] {
		let kids: Tree[] = [];
		for (let i = 0; i < t.childCount; i++) {
			kids.push(t.getChild(i));
		}
		return kids;
	}

	
	public static getAncestors(t: ParseTree): ParseTree[];
	public static getAncestors(t: Tree): Tree[];
	@NotNull
	public static getAncestors(@NotNull t: Tree): Tree[] {
		let ancestors: Tree[] = [];
		let p = t.parent;
		while (p) {
			ancestors.unshift(p); 
			p = p.parent;
		}
		return ancestors;
	}

	
	public static isAncestorOf(t: Tree, u: Tree): boolean {
		if (!t || !u || !t.parent) {
			return false;
		}
		let p = u.parent;
		while (p) {
			if (t === p) {
				return true;
			}
			p = p.parent;
		}
		return false;
	}

	public static findAllTokenNodes(t: ParseTree, ttype: number): ParseTree[] {
		return Trees.findAllNodes(t, ttype, true);
	}

	public static findAllRuleNodes(t: ParseTree, ruleIndex: number): ParseTree[] {
		return Trees.findAllNodes(t, ruleIndex, false);
	}

	public static findAllNodes(t: ParseTree, index: number, findTokens: boolean): ParseTree[] {
		let nodes: ParseTree[] = [];
		Trees._findAllNodes(t, index, findTokens, nodes);
		return nodes;
	}

	public static _findAllNodes(t: ParseTree, index: number, findTokens: boolean, nodes: ParseTree[]): void {
		
		if (findTokens && t instanceof TerminalNode) {
			if (t.symbol.type === index) {
				nodes.push(t);
			}
		}
		else if (!findTokens && t instanceof ParserRuleContext) {
			if (t.ruleIndex === index) {
				nodes.push(t);
			}
		}
		
		for (let i = 0; i < t.childCount; i++) {
			Trees._findAllNodes(t.getChild(i), index, findTokens, nodes);
		}
	}

	
	public static getDescendants(t: ParseTree): ParseTree[] {
		let nodes: ParseTree[] = [];

		function recurse(e: ParseTree): void {
			nodes.push(e);
			const n = e.childCount;
			for (let i = 0; i < n; i++) {
				recurse(e.getChild(i));
			}
		}

		recurse(t);
		return nodes;
	}

	
	public static getRootOfSubtreeEnclosingRegion(
		@NotNull t: ParseTree,
		startTokenIndex: number, 
		stopTokenIndex: number, 
	): ParserRuleContext | undefined {
		let n: number = t.childCount;
		for (let i = 0; i < n; i++) {
			let child: ParseTree = t.getChild(i);
			let r = Trees.getRootOfSubtreeEnclosingRegion(child, startTokenIndex, stopTokenIndex);
			if (r) {
				return r;
			}
		}
		if (t instanceof ParserRuleContext) {
			let stopToken = t.stop;
			if (startTokenIndex >= t.start.tokenIndex && 
				(stopToken == null || stopTokenIndex <= stopToken.tokenIndex)) {
				
				return t;
			}
		}
		return undefined;
	}

	
	public static stripChildrenOutOfRange(
		t: ParserRuleContext,
		root: ParserRuleContext,
		startIndex: number,
		stopIndex: number): void {
		if (!t) {
			return;
		}
		let count = t.childCount;
		for (let i = 0; i < count; i++) {
			let child = t.getChild(i);
			let range: Interval = child.sourceInterval;
			if (child instanceof ParserRuleContext && (range.b < startIndex || range.a > stopIndex)) {
				if (Trees.isAncestorOf(child, root)) { 
					let abbrev: CommonToken = new CommonToken(Token.INVALID_TYPE, "...");
					t.children![i] = new TerminalNode(abbrev); 
				}
			}
		}
	}

	
	public static findNodeSuchThat(t: ParseTree, pred: (tree: ParseTree) => boolean): ParseTree | undefined;
	public static findNodeSuchThat(t: Tree, pred: (tree: Tree) => boolean): Tree | undefined;
	public static findNodeSuchThat(t: Tree, pred: (tree: ParseTree) => boolean): Tree | undefined {
		
		if (pred(t as ParseTree)) {
			return t;
		}

		let n: number =  t.childCount;
		for (let i = 0 ; i < n ; i++){
			let u = Trees.findNodeSuchThat(t.getChild(i), pred as (tree: Tree) => boolean);
			if (u !== undefined) {
				return u;
			}
		}

		return undefined;
	}
}
