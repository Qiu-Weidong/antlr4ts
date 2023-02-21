



import { ATN } from "./atn/ATN";
import { Parser } from "./Parser";
import { Recognizer } from "./Recognizer";
import { RuleNode } from "./tree/RuleNode";
import { ParseTree } from "./tree/ParseTree";
import { Interval } from "./misc/Interval";
import { Override } from "./Decorators";
import { Trees } from "./tree/Trees";
import { ParseTreeVisitor } from "./tree/ParseTreeVisitor";
import { ParserRuleContext } from "./ParserRuleContext";


export class RuleContext extends RuleNode {
	public _parent: RuleContext | undefined;
	public invokingState: number;

	constructor();
	constructor(parent: RuleContext | undefined, invokingState: number);
	constructor(parent?: RuleContext, invokingState?: number) {
		super();
		this._parent = parent;
		this.invokingState = invokingState != null ? invokingState : -1;
	}

	public static getChildContext(parent: RuleContext, invokingState: number): RuleContext {
		return new RuleContext(parent, invokingState);
	}

	public depth(): number {
		let n = 0;
		let p: RuleContext | undefined = this;
		while (p) {
			p = p._parent;
			n++;
		}
		return n;
	}

	
	get isEmpty(): boolean {
		return this.invokingState === -1;
	}

	

	@Override
	get sourceInterval(): Interval {
		return Interval.INVALID;
	}

	@Override
	get ruleContext(): RuleContext { return this; }

	@Override
	get parent(): RuleContext | undefined { return this._parent; }

	
	@Override
	public setParent(parent: RuleContext): void {
		this._parent = parent;
	}

	@Override
	get payload(): RuleContext { return this; }

	
	@Override
	get text(): string {
		if (this.childCount === 0) {
			return "";
		}

		let builder = "";
		for (let i = 0; i < this.childCount; i++) {
			builder += this.getChild(i).text;
		}

		return builder.toString();
	}

	get ruleIndex(): number { return -1; }

	
	get altNumber(): number { return ATN.INVALID_ALT_NUMBER; }

	
	set altNumber(altNumber: number) {
		
	}

	@Override
	public getChild(i: number): ParseTree {
		throw new RangeError("i must be greater than or equal to 0 and less than childCount");
	}

	@Override
	get childCount(): number {
		return 0;
	}

	@Override
	public accept<T>(visitor: ParseTreeVisitor<T>): T {
		return visitor.visitChildren(this);
	}

	
	public toStringTree(recog: Parser): string;

	
	public toStringTree(ruleNames: string[] | undefined): string;

	public toStringTree(): string;

	@Override
	public toStringTree(recog?: Parser | string[]): string {
		return Trees.toStringTree(this, recog);
	}

	public toString(): string;
	public toString(recog: Recognizer<any, any> | undefined): string;
	public toString(ruleNames: string[] | undefined): string;

	
	public toString(recog: Recognizer<any, any> | undefined, stop: RuleContext | undefined): string;

	public toString(ruleNames: string[] | undefined, stop: RuleContext | undefined): string;

	public toString(
		arg1?: Recognizer<any, any> | string[],
		stop?: RuleContext)
		: string {
		const ruleNames = (arg1 instanceof Recognizer) ? arg1.ruleNames : arg1;
		stop = stop || ParserRuleContext.emptyContext();

		let buf = "";
		let p: RuleContext | undefined = this;
		buf += ("[");
		while (p && p !== stop) {
			if (!ruleNames) {
				if (!p.isEmpty) {
					buf += (p.invokingState);
				}
			} else {
				let ruleIndex: number = p.ruleIndex;
				let ruleName: string = (ruleIndex >= 0 && ruleIndex < ruleNames.length)
					? ruleNames[ruleIndex] : ruleIndex.toString();
				buf += (ruleName);
			}

			if (p._parent && (ruleNames || !p._parent.isEmpty)) {
				buf += (" ");
			}

			p = p._parent;
		}

		buf += ("]");
		return buf.toString();
	}
}
