



import { CharStreams } from "../../CharStreams";
import { CommonTokenStream } from "../../CommonTokenStream";
import { LexerNoViableAltException } from "../../LexerNoViableAltException";
import { Parser } from "../../Parser";
import { ParserRuleContext } from "../../ParserRuleContext";
import { ParseTree } from "../ParseTree";
import { Token } from "../../Token";
import { XPathElement } from "./XPathElement";
import { XPathLexer } from "./XPathLexer";
import { XPathLexerErrorListener } from "./XPathLexerErrorListener";
import { XPathRuleAnywhereElement } from "./XPathRuleAnywhereElement";
import { XPathRuleElement } from "./XPathRuleElement";
import { XPathTokenAnywhereElement } from "./XPathTokenAnywhereElement";
import { XPathTokenElement } from "./XPathTokenElement";
import { XPathWildcardAnywhereElement } from "./XPathWildcardAnywhereElement";
import { XPathWildcardElement } from "./XPathWildcardElement";


export class XPath {
	public static readonly WILDCARD: string = "*"; 
	public static readonly NOT: string = "!"; 	   

	protected path: string;
	protected elements: XPathElement[];
	protected parser: Parser;

	constructor(parser: Parser, path: string) {
		this.parser = parser;
		this.path = path;
		this.elements = this.split(path);
		
	}

	

	public split(path: string): XPathElement[] {
		let lexer = new XPathLexer(CharStreams.fromString(path));
		lexer.recover = (e: LexerNoViableAltException) => { throw e; };

		lexer.removeErrorListeners();
		lexer.addErrorListener(new XPathLexerErrorListener());
		let tokenStream = new CommonTokenStream(lexer);
		try {
			tokenStream.fill();
		}
		catch (e) {
			if (e instanceof LexerNoViableAltException) {
				let pos: number = lexer.charPositionInLine;
				let msg: string = "Invalid tokens or characters at index " + pos + " in path '" + path + "' -- " + e.message;
				throw new RangeError(msg);
			}
			throw e;
		}

		let tokens: Token[] = tokenStream.getTokens();
		
		let elements: XPathElement[] = [];
		let n: number = tokens.length;
		let i: number = 0;
		loop:
		while (i < n) {
			let el: Token = tokens[i];
			let next: Token | undefined;
			switch (el.type) {
				case XPathLexer.ROOT:
				case XPathLexer.ANYWHERE:
					let anywhere: boolean = el.type === XPathLexer.ANYWHERE;
					i++;
					next = tokens[i];
					let invert: boolean = next.type === XPathLexer.BANG;
					if (invert) {
						i++;
						next = tokens[i];
					}
					let pathElement: XPathElement = this.getXPathElement(next, anywhere);
					pathElement.invert = invert;
					elements.push(pathElement);
					i++;
					break;

				case XPathLexer.TOKEN_REF:
				case XPathLexer.RULE_REF:
				case XPathLexer.WILDCARD:
					elements.push(this.getXPathElement(el, false));
					i++;
					break;

				case Token.EOF:
					break loop;

				default:
					throw new Error("Unknowth path element " + el);
			}
		}
		return elements;
	}

	
	protected getXPathElement(wordToken: Token, anywhere: boolean): XPathElement {
		if (wordToken.type === Token.EOF) {
			throw new Error("Missing path element at end of path");
		}

		let word = wordToken.text;
		if (word == null) {
			throw new Error("Expected wordToken to have text content.");
		}

		let ttype: number = this.parser.getTokenType(word);
		let ruleIndex: number = this.parser.getRuleIndex(word);
		switch (wordToken.type) {
			case XPathLexer.WILDCARD:
				return anywhere ?
					new XPathWildcardAnywhereElement() :
					new XPathWildcardElement();
			case XPathLexer.TOKEN_REF:
			case XPathLexer.STRING:
				if (ttype === Token.INVALID_TYPE) {
					throw new Error(word + " at index " +
						wordToken.startIndex +
						" isn't a valid token name");
				}
				return anywhere ?
					new XPathTokenAnywhereElement(word, ttype) :
					new XPathTokenElement(word, ttype);
			default:
				if (ruleIndex === -1) {
					throw new Error(word + " at index " +
						wordToken.startIndex +
						" isn't a valid rule name");
				}
				return anywhere ?
					new XPathRuleAnywhereElement(word, ruleIndex) :
					new XPathRuleElement(word, ruleIndex);
		}
	}

	public static findAll(tree: ParseTree, xpath: string, parser: Parser): Set<ParseTree> {
		let p: XPath = new XPath(parser, xpath);
		return p.evaluate(tree);
	}

	
	public evaluate(t: ParseTree): Set<ParseTree> {
		let dummyRoot = new ParserRuleContext();
		dummyRoot.addChild(t as ParserRuleContext);

		let work = new Set<ParseTree>([dummyRoot]);

		let i: number = 0;
		while (i < this.elements.length) {
			let next = new Set<ParseTree>();
			for (let node of work) {
				if (node.childCount > 0) {
					
					
					
					let matching = this.elements[i].evaluate(node);
					matching.forEach(next.add, next);
				}
			}
			i++;
			work = next;
		}

		return work;
	}
}
