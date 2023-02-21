



import { BailErrorStrategy } from "../../BailErrorStrategy";
import { CharStreams } from "../../CharStreams";
import { Chunk } from "./Chunk";
import { CommonTokenStream } from "../../CommonTokenStream";
import { Lexer } from "../../Lexer";
import { ListTokenSource } from "../../ListTokenSource";
import { MultiMap } from "../../misc/MultiMap";
import { NotNull } from "../../Decorators";
import { ParseCancellationException } from "../../misc/ParseCancellationException";
import { Parser } from "../../Parser";
import { ParserInterpreter } from "../../ParserInterpreter";
import { ParserRuleContext } from "../../ParserRuleContext";
import { ParseTree } from "../ParseTree";
import { ParseTreeMatch } from "./ParseTreeMatch";
import { ParseTreePattern } from "./ParseTreePattern";
import { RecognitionException } from "../../exception/RecognitionException";
import { RuleNode } from "../RuleNode";
import { RuleTagToken } from "./RuleTagToken";
import { TagChunk } from "./TagChunk";
import { TerminalNode } from "../TerminalNode";
import { TextChunk } from "./TextChunk";
import { Token } from "../../Token";
import { TokenTagToken } from "./TokenTagToken";


export class ParseTreePatternMatcher {
	
	private _lexer: Lexer;

	
	private _parser: Parser;

	protected start = "<";
	protected stop = ">";
	protected escape = "\\"; 

	
	protected escapeRE = /\\/g;

	
	constructor(lexer: Lexer, parser: Parser) {
		this._lexer = lexer;
		this._parser = parser;
	}

	
	public setDelimiters(start: string, stop: string, escapeLeft: string): void {
		if (!start) {
			throw new Error("start cannot be null or empty");
		}

		if (!stop) {
			throw new Error("stop cannot be null or empty");
		}

		this.start = start;
		this.stop = stop;
		this.escape = escapeLeft;
		this.escapeRE = new RegExp(escapeLeft.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
	}

	
	public matches(tree: ParseTree, pattern: string, patternRuleIndex: number): boolean;

	
	public matches(tree: ParseTree, pattern: ParseTreePattern): boolean;

	public matches(tree: ParseTree, pattern: string | ParseTreePattern, patternRuleIndex: number = 0): boolean {
		if (typeof pattern === "string") {
			let p: ParseTreePattern = this.compile(pattern, patternRuleIndex);
			return this.matches(tree, p);
		} else {
			let labels = new MultiMap<string, ParseTree>();
			let mismatchedNode = this.matchImpl(tree, pattern.patternTree, labels);
			return !mismatchedNode;
		}
	}

	
	public match(tree: ParseTree, pattern: string, patternRuleIndex: number): ParseTreeMatch;

	
	public match(tree: ParseTree, pattern: ParseTreePattern): ParseTreeMatch;

	
	@NotNull
	public match(tree: ParseTree, @NotNull pattern: string | ParseTreePattern, patternRuleIndex: number = 0): ParseTreeMatch {
		if (typeof pattern === "string") {
			let p: ParseTreePattern = this.compile(pattern, patternRuleIndex);
			return this.match(tree, p);
		} else {
			let labels = new MultiMap<string, ParseTree>();
			let mismatchedNode = this.matchImpl(tree, pattern.patternTree, labels);
			return new ParseTreeMatch(tree, pattern, labels, mismatchedNode);
		}
	}

	
	public compile(pattern: string, patternRuleIndex: number): ParseTreePattern {
		let tokenList = this.tokenize(pattern);
		let tokenSrc = new ListTokenSource(tokenList);
		let tokens = new CommonTokenStream(tokenSrc);
		const parser = this._parser;

		let parserInterp = new ParserInterpreter(
			parser.grammarFileName,
			parser.vocabulary,
			parser.ruleNames,
			parser.getATNWithBypassAlts(),
			tokens);

		let tree: ParseTree;
		try {
			parserInterp.errorHandler = new BailErrorStrategy();
			tree = parserInterp.parse(patternRuleIndex);

		} catch (e) {
			if (e instanceof ParseCancellationException) {
				throw e.getCause();
			} else if (e instanceof RecognitionException) {
				throw e;
			} else if (e instanceof Error) {
				throw new ParseTreePatternMatcher.CannotInvokeStartRule(e);
			} else {
				throw e;
			}
		}

		
		if (tokens.LA(1) !== Token.EOF) {
			throw new ParseTreePatternMatcher.StartRuleDoesNotConsumeFullPattern();
		}

		return new ParseTreePattern(this, pattern, patternRuleIndex, tree);
	}

	
	@NotNull
	get lexer(): Lexer {
		return this._lexer;
	}

	
	@NotNull
	get parser(): Parser {
		return this._parser;
	}

	

	
	protected matchImpl(
		@NotNull tree: ParseTree,
		@NotNull patternTree: ParseTree,
		@NotNull labels: MultiMap<string, ParseTree>): ParseTree | undefined {
		if (!tree) {
			throw new TypeError("tree cannot be null");
		}

		if (!patternTree) {
			throw new TypeError("patternTree cannot be null");
		}

		
		if (tree instanceof TerminalNode && patternTree instanceof TerminalNode) {
			let mismatchedNode: ParseTree | undefined;
			
			if (tree.symbol.type === patternTree.symbol.type) {
				if (patternTree.symbol instanceof TokenTagToken) { 
					let tokenTagToken = patternTree.symbol;
					
					labels.map(tokenTagToken.tokenName, tree);
					const l = tokenTagToken.label;
					if (l) {
						labels.map(l, tree);
					}
				}
				else if (tree.text === patternTree.text) {
					
				}
				else {
					
					if (!mismatchedNode) {
						mismatchedNode = tree;
					}
				}
			}
			else {
				if (!mismatchedNode) {
					mismatchedNode = tree;
				}
			}

			return mismatchedNode;
		}

		if (tree instanceof ParserRuleContext
			&& patternTree instanceof ParserRuleContext) {
			let mismatchedNode: ParseTree | undefined;
			
			let ruleTagToken = this.getRuleTagToken(patternTree);
			if (ruleTagToken) {
				let m: ParseTreeMatch;
				if (tree.ruleContext.ruleIndex === patternTree.ruleContext.ruleIndex) {
					
					labels.map(ruleTagToken.ruleName, tree);
					const l = ruleTagToken.label;
					if (l) {
						labels.map(l, tree);
					}
				}
				else {
					if (!mismatchedNode) {
						mismatchedNode = tree;
					}
				}

				return mismatchedNode;
			}

			
			if (tree.childCount !== patternTree.childCount) {
				if (!mismatchedNode) {
					mismatchedNode = tree;
				}

				return mismatchedNode;
			}

			let n: number = tree.childCount;
			for (let i = 0; i < n; i++) {
				let childMatch = this.matchImpl(tree.getChild(i), patternTree.getChild(i), labels);
				if (childMatch) {
					return childMatch;
				}
			}

			return mismatchedNode;
		}

		
		return tree;
	}

	
	protected getRuleTagToken(t: ParseTree): RuleTagToken | undefined {
		if (t instanceof RuleNode) {
			if (t.childCount === 1 && t.getChild(0) instanceof TerminalNode) {
				let c = t.getChild(0) as TerminalNode;
				if (c.symbol instanceof RuleTagToken) {

					return c.symbol;
				}
			}
		}
		return undefined;
	}

	public tokenize(pattern: string): Token[] {
		
		let chunks = this.split(pattern);

		
		let tokens: Token[] = [];

		for (let chunk of chunks) {
			if (chunk instanceof TagChunk) {
				let tagChunk = chunk;
				const firstChar = tagChunk.tag.substr(0, 1);
				
				if (firstChar === firstChar.toUpperCase()) {
					let ttype: number = this._parser.getTokenType(tagChunk.tag);
					if (ttype === Token.INVALID_TYPE) {
						throw new Error("Unknown token " + tagChunk.tag + " in pattern: " + pattern);
					}
					let t: TokenTagToken = new TokenTagToken(tagChunk.tag, ttype, tagChunk.label);
					tokens.push(t);
				}
				else if (firstChar === firstChar.toLowerCase()) {
					let ruleIndex: number = this._parser.getRuleIndex(tagChunk.tag);
					if (ruleIndex === -1) {
						throw new Error("Unknown rule " + tagChunk.tag + " in pattern: " + pattern);
					}
					let ruleImaginaryTokenType: number = this._parser.getATNWithBypassAlts().ruleToTokenType[ruleIndex];
					tokens.push(new RuleTagToken(tagChunk.tag, ruleImaginaryTokenType, tagChunk.label));
				}
				else {
					throw new Error("invalid tag: " + tagChunk.tag + " in pattern: " + pattern);
				}
			}
			else {
				let textChunk = chunk as TextChunk;
				this._lexer.inputStream = CharStreams.fromString(textChunk.text);
				let t: Token = this._lexer.nextToken();
				while (t.type !== Token.EOF) {
					tokens.push(t);
					t = this._lexer.nextToken();
				}
			}
		}


		return tokens;
	}

	
	public split(pattern: string): Chunk[] {
		let p: number = 0;
		let n: number = pattern.length;
		let chunks: Chunk[] = [];
		let buf: "";
		
		let starts: number[] = [];
		let stops: number[] = [];
		while (p < n) {
			if (p === pattern.indexOf(this.escape + this.start, p)) {
				p += this.escape.length + this.start.length;
			}
			else if (p === pattern.indexOf(this.escape + this.stop, p)) {
				p += this.escape.length + this.stop.length;
			}
			else if (p === pattern.indexOf(this.start, p)) {
				starts.push(p);
				p += this.start.length;
			}
			else if (p === pattern.indexOf(this.stop, p)) {
				stops.push(p);
				p += this.stop.length;
			}
			else {
				p++;
			}
		}




		if (starts.length > stops.length) {
			throw new Error("unterminated tag in pattern: " + pattern);
		}

		if (starts.length < stops.length) {
			throw new Error("missing start tag in pattern: " + pattern);
		}

		let ntags: number = starts.length;
		for (let i = 0; i < ntags; i++) {
			if (starts[i] >= stops[i]) {
				throw new Error("tag delimiters out of order in pattern: " + pattern);
			}
		}

		
		if (ntags === 0) {
			let text: string = pattern.substring(0, n);
			chunks.push(new TextChunk(text));
		}

		if (ntags > 0 && starts[0] > 0) { 
			let text: string = pattern.substring(0, starts[0]);
			chunks.push(new TextChunk(text));
		}
		for (let i = 0; i < ntags; i++) {
			
			let tag: string = pattern.substring(starts[i] + this.start.length, stops[i]);
			let ruleOrToken: string = tag;
			let label: string | undefined;
			let colon: number = tag.indexOf(":");
			if (colon >= 0) {
				label = tag.substring(0, colon);
				ruleOrToken = tag.substring(colon + 1, tag.length);
			}
			chunks.push(new TagChunk(ruleOrToken, label));
			if (i + 1 < ntags) {
				
				let text: string = pattern.substring(stops[i] + this.stop.length, starts[i + 1]);
				chunks.push(new TextChunk(text));
			}
		}
		if (ntags > 0) {
			let afterLastTag: number = stops[ntags - 1] + this.stop.length;
			if (afterLastTag < n) { 
				let text: string = pattern.substring(afterLastTag, n);
				chunks.push(new TextChunk(text));
			}
		}

		
		for (let i = 0; i < chunks.length; i++) {
			let c: Chunk = chunks[i];
			if (c instanceof TextChunk) {
				let unescaped: string = c.text.replace(this.escapeRE, "");
				if (unescaped.length < c.text.length) {
					chunks[i] = new TextChunk(unescaped);
				}
			}
		}

		return chunks;
	}
}

export namespace ParseTreePatternMatcher {
	export class CannotInvokeStartRule extends Error {
		public constructor(public error: Error) {
			super(`CannotInvokeStartRule: ${error}`);
		}
	}

	
	
	export class StartRuleDoesNotConsumeFullPattern extends Error {
		constructor() {
			super("StartRuleDoesNotConsumeFullPattern");
		}
	}
}
