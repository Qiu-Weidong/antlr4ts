


import { ErrorNode } from "./tree/ErrorNode";
import { Interval } from "./misc/Interval";
import { Override } from "./Decorators";
import { Parser } from "./Parser";
import { ParseTree } from "./tree/ParseTree";
import { ParseTreeListener } from "./tree/ParseTreeListener";
import { RecognitionException } from "./exception/RecognitionException";
import { RuleContext } from "./RuleContext";
import { TerminalNode } from "./tree/TerminalNode";
import { Token } from "./Token";


export class ParserRuleContext extends RuleContext {
	private static readonly EMPTY: ParserRuleContext = new ParserRuleContext();

	
	public children?: ParseTree[];

	


	public _start!: Token;
	public _stop: Token | undefined;

	
	public exception?: RecognitionException;

	constructor();
	constructor(parent: ParserRuleContext | undefined, invokingStateNumber: number);
	constructor(parent?: ParserRuleContext, invokingStateNumber?: number) {
		if (invokingStateNumber == null) {
			super();
		} else {
			super(parent, invokingStateNumber);
		}
	}

	public static emptyContext(): ParserRuleContext {
		return ParserRuleContext.EMPTY;
	}

	
	public copyFrom(ctx: ParserRuleContext): void {
		this._parent = ctx._parent;
		this.invokingState = ctx.invokingState;

		this._start = ctx._start;
		this._stop = ctx._stop;

		
		if (ctx.children) {
			this.children = [];
			
			for (let child of ctx.children) {
				if (child instanceof ErrorNode) {
					this.addChild(child);
				}
			}
		}
	}

	

	public enterRule(listener: ParseTreeListener): void {
		
	}
	public exitRule(listener: ParseTreeListener): void {
		
	}

	
	public addAnyChild<T extends ParseTree>(t: T): T {
		if (!this.children) {
			this.children = [t];
		} else {
			this.children.push(t);
		}

		return t;
	}

	
	public addChild(t: TerminalNode): void;
	public addChild(ruleInvocation: RuleContext): void;
	public addChild(t: TerminalNode | RuleContext | Token): TerminalNode | void {
		let result: TerminalNode | void;
		if (t instanceof TerminalNode) {
			t.setParent(this);
			this.addAnyChild(t);
			return;
		} else if (t instanceof RuleContext) {
			
			this.addAnyChild(t);
			return;
		} else {
			
			t = new TerminalNode(t);
			this.addAnyChild(t);
			t.setParent(this);
			return t;
		}
	}

	
	public addErrorNode(errorNode: ErrorNode): ErrorNode;

	public addErrorNode(node: ErrorNode | Token): ErrorNode {
		if (node instanceof ErrorNode) {
			const errorNode: ErrorNode = node;
			errorNode.setParent(this);
			return this.addAnyChild(errorNode);
		} else {
			
			const badToken: Token = node;
			let t = new ErrorNode(badToken);
			this.addAnyChild(t);
			t.setParent(this);
			return t;
		}
	}






	
	public removeLastChild(): void {
		if (this.children) {
			this.children.pop();
		}
	}

	@Override
	
	get parent(): ParserRuleContext | undefined {
		let parent = super.parent;
		if (parent === undefined || parent instanceof ParserRuleContext) {
			return parent as ParserRuleContext; 
		}

		throw new TypeError("Invalid parent type for ParserRuleContext");
	}

	public getChild(i: number): ParseTree;
	public getChild<T extends ParseTree>(i: number, ctxType: { new (...args: any[]): T; }): T;
	
	public getChild<T extends ParseTree>(i: number, ctxType?: { new (...args: any[]): T; }): ParseTree {
		if (!this.children || i < 0 || i >= this.children.length) {
			throw new RangeError("index parameter must be between >= 0 and <= number of children.");
		}

		if (ctxType == null) {
			return this.children[i];
		}

		let result = this.tryGetChild(i, ctxType);
		if (result === undefined) {
			throw new Error("The specified node does not exist");
		}

		return result;
	}

	public tryGetChild<T extends ParseTree>(i: number, ctxType: { new (...args: any[]): T; }): T | undefined {
		if (!this.children || i < 0 || i >= this.children.length) {
			return undefined;
		}

		let j: number = -1; 
		for (let o of this.children) {
			if (o instanceof ctxType) {
				j++;
				if (j === i) {
					return o;
				}
			}
		}

		return undefined;
	}

	public getToken(ttype: number, i: number): TerminalNode {
		let result = this.tryGetToken(ttype, i);
		if (result === undefined) {
			throw new Error("The specified token does not exist");
		}

		return result;
	}

	public tryGetToken(ttype: number, i: number): TerminalNode | undefined {
		if (!this.children || i < 0 || i >= this.children.length) {
			return undefined;
		}

		let j: number = -1; 
		for (let o of this.children) {
			if (o instanceof TerminalNode) {
				let symbol: Token = o.symbol;
				if (symbol.type === ttype) {
					j++;
					if (j === i) {
						return o;
					}
				}
			}
		}

		return undefined;
	}

	public getTokens(ttype: number): TerminalNode[] {
		let tokens: TerminalNode[] = [];

		if (!this.children) {
			return tokens;
		}

		for (let o of this.children) {
			if (o instanceof TerminalNode) {
				let symbol = o.symbol;
				if (symbol.type === ttype) {
					tokens.push(o);
				}
			}
		}

		return tokens;
	}

	get ruleContext(): this {
		return this;
	}

	
	public getRuleContext<T extends ParserRuleContext>(i: number, ctxType: { new (...args: any[]): T; }): T {
		return this.getChild(i, ctxType);
	}

	public tryGetRuleContext<T extends ParserRuleContext>(i: number, ctxType: { new (...args: any[]): T; }): T | undefined {
		return this.tryGetChild(i, ctxType);
	}

	public getRuleContexts<T extends ParserRuleContext>(ctxType: { new (...args: any[]): T; }): T[] {
		let contexts: T[] = [];
		if (!this.children) {
			return contexts;
		}

		for (let o of this.children) {
			if (o instanceof ctxType) {
				contexts.push(o);
			}
		}

		return contexts;
	}

	@Override
	get childCount() {
		return this.children ? this.children.length : 0;
	}

	@Override
	get sourceInterval(): Interval {
		if (!this._start) {
			return Interval.INVALID;
		}
		if (!this._stop || this._stop.tokenIndex < this._start.tokenIndex) {
			return Interval.of(this._start.tokenIndex, this._start.tokenIndex - 1); 
		}
		return Interval.of(this._start.tokenIndex, this._stop.tokenIndex);
	}

	
	get start(): Token { return this._start; }
	
	get stop(): Token | undefined { return this._stop; }

	
	public toInfoString(recognizer: Parser): string {
		let rules: string[] =
			recognizer.getRuleInvocationStack(this).reverse();
		return "ParserRuleContext" + rules + "{" +
			"start=" + this._start +
			", stop=" + this._stop +
			"}";
	}
}
