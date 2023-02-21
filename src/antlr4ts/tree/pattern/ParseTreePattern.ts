


import { NotNull } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { ParseTreeMatch } from "./ParseTreeMatch";
import { ParseTreePatternMatcher } from "./ParseTreePatternMatcher";
// import { XPath } from "../xpath/XPath";


export class ParseTreePattern {
	
	private _patternRuleIndex: number;

	
	@NotNull
	private _pattern: string;

	
	@NotNull
	private _patternTree: ParseTree;

	
	@NotNull
	private _matcher: ParseTreePatternMatcher;

	
	constructor(
		@NotNull matcher: ParseTreePatternMatcher,
		@NotNull pattern: string,
		patternRuleIndex: number,
		@NotNull patternTree: ParseTree) {
		this._matcher = matcher;
		this._patternRuleIndex = patternRuleIndex;
		this._pattern = pattern;
		this._patternTree = patternTree;
	}

	
	@NotNull
	public match(@NotNull tree: ParseTree): ParseTreeMatch {
		return this._matcher.match(tree, this);
	}

	
	public matches(@NotNull tree: ParseTree): boolean {
		return this._matcher.match(tree, this).succeeded;
	}

	
	@NotNull
	public findAll(@NotNull tree: ParseTree, @NotNull xpath: string): ParseTreeMatch[] {
		// let subtrees: Set<ParseTree> = XPath.findAll(tree, xpath, this._matcher.parser);
		let matches: ParseTreeMatch[] = [];
		// for (let t of subtrees) {
		// 	let match: ParseTreeMatch = this.match(t);
		// 	if (match.succeeded) {
		// 		matches.push(match);
		// 	}
		// }
		return matches;
	}

	
	@NotNull
	get matcher(): ParseTreePatternMatcher {
		return this._matcher;
	}

	
	@NotNull
	get pattern(): string {
		return this._pattern;
	}

	
	get patternRuleIndex(): number {
		return this._patternRuleIndex;
	}

	
	@NotNull
	get patternTree(): ParseTree {
		return this._patternTree;
	}
}
