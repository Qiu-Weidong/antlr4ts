

import { Override, NotNull } from "../../Decorators";
import { MurmurHash, Array2DHashSet, ObjectEqualityComparator, ArrayEqualityComparator } from "../../misc";
import { Comparable, Equatable } from "../../misc/Stubs";
import { Recognizer } from "../../Recognizer";
import { RuleContext } from "../../RuleContext";
import * as Utils from '../../misc/Utils';





function max<T extends Comparable<T>>(items: Iterable<T>): T | undefined {
	let result: T | undefined;
	for (let current of items) {
		if (result === undefined) {
			result = current;
			continue;
		}

		let comparison = result.compareTo(current);
		if (comparison < 0) {
			result = current;
		}
	}

	return result;
}

function min<T extends Comparable<T>>(items: Iterable<T>): T | undefined {
	let result: T | undefined;
	for (let current of items) {
		if (result === undefined) {
			result = current;
			continue;
		}

		let comparison = result.compareTo(current);
		if (comparison > 0) {
			result = current;
		}
	}

	return result;
}


export abstract class SemanticContext implements Equatable {
	private static _NONE: SemanticContext;

	
	static get NONE(): SemanticContext {
		if (SemanticContext._NONE === undefined) {
			SemanticContext._NONE = new SemanticContext.Predicate();
		}

		return SemanticContext._NONE;
	}

	
	public abstract eval<T>(parser: Recognizer<T, any>, parserCallStack: RuleContext): boolean;

	
	public evalPrecedence(parser: Recognizer<any, any>, parserCallStack: RuleContext): SemanticContext | undefined {
		return this;
	}

	public abstract hashCode(): number;

	public abstract equals(obj: any): boolean;

	public static and(a: SemanticContext | undefined, b: SemanticContext): SemanticContext {
		if (!a || a === SemanticContext.NONE) {
			return b;
		}
		if (b === SemanticContext.NONE) {
			return a;
		}
		let result: SemanticContext.AND = new SemanticContext.AND(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		}

		return result;
	}

	
	public static or(a: SemanticContext | undefined, b: SemanticContext): SemanticContext {
		if (!a) {
			return b;
		}

		if (a === SemanticContext.NONE || b === SemanticContext.NONE) {
			return SemanticContext.NONE;
		}
		let result: SemanticContext.OR = new SemanticContext.OR(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		}

		return result;
	}
}

export namespace SemanticContext {
	
	const AND_HASHCODE = 40363613;
	
	const OR_HASHCODE = 486279973;

	function filterPrecedencePredicates(collection: SemanticContext[]): SemanticContext.PrecedencePredicate[] {
		let result: SemanticContext.PrecedencePredicate[] = [];
		for (let i = 0; i < collection.length; i++) {
			let context: SemanticContext = collection[i];
			if (context instanceof SemanticContext.PrecedencePredicate) {
				result.push(context);

				
				collection.splice(i, 1);
				i--;
			}
		}

		return result;
	}

	export class Predicate extends SemanticContext {
		public ruleIndex: number;
		public predIndex: number;
		public isCtxDependent: boolean;   

		constructor();
		constructor(ruleIndex: number, predIndex: number, isCtxDependent: boolean);

		constructor(ruleIndex: number = -1, predIndex: number = -1, isCtxDependent: boolean = false) {
			super();
			this.ruleIndex = ruleIndex;
			this.predIndex = predIndex;
			this.isCtxDependent = isCtxDependent;
		}

		@Override
		public eval<T>(parser: Recognizer<T, any>, parserCallStack: RuleContext): boolean {
			let localctx: RuleContext | undefined = this.isCtxDependent ? parserCallStack : undefined;
			return parser.sempred(localctx, this.ruleIndex, this.predIndex);
		}

		@Override
		public hashCode(): number {
			let hashCode: number = MurmurHash.initialize();
			hashCode = MurmurHash.update(hashCode, this.ruleIndex);
			hashCode = MurmurHash.update(hashCode, this.predIndex);
			hashCode = MurmurHash.update(hashCode, this.isCtxDependent ? 1 : 0);
			hashCode = MurmurHash.finish(hashCode, 3);
			return hashCode;
		}

		@Override
		public equals(obj: any): boolean {
			if (!(obj instanceof Predicate)) {
				return false;
			}
			if (this === obj) {
				return true;
			}
			return this.ruleIndex === obj.ruleIndex &&
				this.predIndex === obj.predIndex &&
				this.isCtxDependent === obj.isCtxDependent;
		}

		@Override
		public toString(): string {
			return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
		}
	}

	export class PrecedencePredicate extends SemanticContext implements Comparable<PrecedencePredicate> {
		public precedence: number;

		constructor(precedence: number) {
			super();
			this.precedence = precedence;
		}

		@Override
		public eval<T>(parser: Recognizer<T, any>, parserCallStack: RuleContext): boolean {
			return parser.precpred(parserCallStack, this.precedence);
		}

		@Override
		public evalPrecedence(parser: Recognizer<any, any>, parserCallStack: RuleContext): SemanticContext | undefined {
			if (parser.precpred(parserCallStack, this.precedence)) {
				return SemanticContext.NONE;
			}
			else {
				return undefined;
			}
		}

		@Override
		public compareTo(o: PrecedencePredicate): number {
			return this.precedence - o.precedence;
		}

		@Override
		public hashCode(): number {
			let hashCode: number = 1;
			hashCode = 31 * hashCode + this.precedence;
			return hashCode;
		}

		@Override
		public equals(obj: any): boolean {
			if (!(obj instanceof PrecedencePredicate)) {
				return false;
			}

			if (this === obj) {
				return true;
			}

			return this.precedence === obj.precedence;
		}

		@Override
		
		public toString(): string {
			return "{" + this.precedence + ">=prec}?";
		}
	}

	
	export abstract class Operator extends SemanticContext {
		
		
		public abstract readonly operands: Iterable<SemanticContext>;
	}

	
	export class AND extends Operator {
		public opnds: SemanticContext[];

		constructor(@NotNull a: SemanticContext, @NotNull b: SemanticContext) {
			super();

			let operands: Array2DHashSet<SemanticContext> = new Array2DHashSet<SemanticContext>(ObjectEqualityComparator.INSTANCE);
			if (a instanceof AND) {
				operands.addAll(a.opnds);
			} else {
				operands.add(a);
			}

			if (b instanceof AND) {
				operands.addAll(b.opnds);
			} else {
				operands.add(b);
			}

			this.opnds = operands.toArray();
			let precedencePredicates: PrecedencePredicate[] = filterPrecedencePredicates(this.opnds);

			
			let reduced = min(precedencePredicates);
			if (reduced) {
				this.opnds.push(reduced);
			}
		}

		@Override
		get operands(): Iterable<SemanticContext> {
			return this.opnds;
		}

		@Override
		public equals(obj: any): boolean {
			if (this === obj) {
				return true;
			}
			if (!(obj instanceof AND)) {
				return false;
			}
			return ArrayEqualityComparator.INSTANCE.equals(this.opnds, obj.opnds);
		}

		@Override
		public hashCode(): number {
			return MurmurHash.hashCode(this.opnds, AND_HASHCODE);
		}

		
		@Override
		public eval<T>(parser: Recognizer<T, any>, parserCallStack: RuleContext): boolean {
			for (let opnd of this.opnds) {
				if (!opnd.eval(parser, parserCallStack)) {
					return false;
				}
			}

			return true;
		}

		@Override
		public evalPrecedence(parser: Recognizer<any, any>, parserCallStack: RuleContext): SemanticContext | undefined {
			let differs: boolean = false;
			let operands: SemanticContext[] = [];
			for (let context of this.opnds) {
				let evaluated: SemanticContext | undefined = context.evalPrecedence(parser, parserCallStack);
				differs = differs || (evaluated !== context);
				if (evaluated == null) {
					
					return undefined;
				}
				else if (evaluated !== SemanticContext.NONE) {
					
					operands.push(evaluated);
				}
			}

			if (!differs) {
				return this;
			}

			if (operands.length === 0) {
				
				return SemanticContext.NONE;
			}

			let result: SemanticContext = operands[0];
			for (let i = 1; i < operands.length; i++) {
				result = SemanticContext.and(result, operands[i]);
			}

			return result;
		}

		@Override
		public toString(): string {
			return Utils.join(this.opnds, "&&");
		}
	}

	
	export class OR extends Operator {
		public opnds: SemanticContext[];

		constructor(@NotNull a: SemanticContext, @NotNull b: SemanticContext) {
			super();

			let operands: Array2DHashSet<SemanticContext> = new Array2DHashSet<SemanticContext>(ObjectEqualityComparator.INSTANCE);
			if (a instanceof OR) {
				operands.addAll(a.opnds);
			} else {
				operands.add(a);
			}

			if (b instanceof OR) {
				operands.addAll(b.opnds);
			} else {
				operands.add(b);
			}

			this.opnds = operands.toArray();
			let precedencePredicates: PrecedencePredicate[] = filterPrecedencePredicates(this.opnds);

			
			let reduced = max(precedencePredicates);
			if (reduced) {
				this.opnds.push(reduced);
			}
		}

		@Override
		get operands(): Iterable<SemanticContext> {
			return this.opnds;
		}

		@Override
		public equals(obj: any): boolean {
			if (this === obj) {
				return true;
			}
			if (!(obj instanceof OR)) {
				return false;
			}
			return ArrayEqualityComparator.INSTANCE.equals(this.opnds, obj.opnds);
		}

		@Override
		public hashCode(): number {
			return MurmurHash.hashCode(this.opnds, OR_HASHCODE);
		}

		
		@Override
		public eval<T>(parser: Recognizer<T, any>, parserCallStack: RuleContext): boolean {
			for (let opnd of this.opnds) {
				if (opnd.eval(parser, parserCallStack)) {
					return true;
				}
			}

			return false;
		}

		@Override
		public evalPrecedence(parser: Recognizer<any, any>, parserCallStack: RuleContext): SemanticContext | undefined {
			let differs: boolean = false;
			let operands: SemanticContext[] = [];
			for (let context of this.opnds) {
				let evaluated: SemanticContext | undefined = context.evalPrecedence(parser, parserCallStack);
				differs = differs || (evaluated !== context);
				if (evaluated === SemanticContext.NONE) {
					
					return SemanticContext.NONE;
				} else if (evaluated) {
					
					operands.push(evaluated);
				}
			}

			if (!differs) {
				return this;
			}

			if (operands.length === 0) {
				
				return undefined;
			}

			let result: SemanticContext = operands[0];
			for (let i = 1; i < operands.length; i++) {
				result = SemanticContext.or(result, operands[i]);
			}

			return result;
		}

		@Override
		public toString(): string {
			return Utils.join(this.opnds, "||");
		}
	}
}
