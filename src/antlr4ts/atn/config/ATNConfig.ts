



import { Array2DHashMap } from "../../misc/Array2DHashMap";
import { ATNState } from "../state/ATNState";


import * as assert from "assert";
import { NotNull, Override } from "../../Decorators";
import { ObjectEqualityComparator, MurmurHash } from "../../misc";
import { Equatable } from "../../misc/Stubs";
import { Recognizer } from "../../Recognizer";
import { LexerActionExecutor } from "../action/LexerActionExecutor";
import { PredictionContext } from "../context/PredictionContext";
import { PredictionContextCache } from "../context/PredictionContextCache";
import { SemanticContext } from "../context/SemanticContext";
import { DecisionState } from "../state/DecisionState";


const SUPPRESS_PRECEDENCE_FILTER: number = 0x80000000;


export class ATNConfig implements Equatable {
	
	@NotNull
	private _state: ATNState;

	
	private altAndOuterContextDepth: number;

	
	@NotNull
	private _context: PredictionContext;

	constructor( state: ATNState, alt: number,  context: PredictionContext);
	constructor( state: ATNState,  c: ATNConfig,  context: PredictionContext);

	constructor(@NotNull state: ATNState, altOrConfig: number | ATNConfig, @NotNull context: PredictionContext) {
		if (typeof altOrConfig === "number") {
			assert((altOrConfig & 0xFFFFFF) === altOrConfig);
			this._state = state;
			this.altAndOuterContextDepth = altOrConfig;
			this._context = context;
		} else {
			this._state = state;
			this.altAndOuterContextDepth = altOrConfig.altAndOuterContextDepth;
			this._context = context;
		}
	}

	public static create( state: ATNState, alt: number, context: PredictionContext): ATNConfig;

	public static create( state: ATNState, alt: number, context: PredictionContext,  semanticContext: SemanticContext): ATNConfig;

	public static create( state: ATNState, alt: number, context: PredictionContext,  semanticContext: SemanticContext, lexerActionExecutor: LexerActionExecutor | undefined): ATNConfig;

	public static create(@NotNull state: ATNState, alt: number, context: PredictionContext, @NotNull semanticContext: SemanticContext = SemanticContext.NONE, lexerActionExecutor?: LexerActionExecutor): ATNConfig {
		if (semanticContext !== SemanticContext.NONE) {
			if (lexerActionExecutor != null) {
				return new ActionSemanticContextATNConfig(lexerActionExecutor, semanticContext, state, alt, context, false);
			}
			else {
				return new SemanticContextATNConfig(semanticContext, state, alt, context);
			}
		}
		else if (lexerActionExecutor != null) {
			return new ActionATNConfig(lexerActionExecutor, state, alt, context, false);
		}
		else {
			return new ATNConfig(state, alt, context);
		}
	}

	
	@NotNull
	get state(): ATNState {
		return this._state;
	}

	
	get alt(): number {
		return this.altAndOuterContextDepth & 0x00FFFFFF;
	}

	@NotNull
	get context(): PredictionContext {
		return this._context;
	}

	set context(@NotNull context: PredictionContext) {
		this._context = context;
	}

	get reachesIntoOuterContext(): boolean {
		return this.outerContextDepth !== 0;
	}

	
	get outerContextDepth(): number {
		return (this.altAndOuterContextDepth >>> 24) & 0x7F;
	}

	set outerContextDepth(outerContextDepth: number) {
		assert(outerContextDepth >= 0);
		
		outerContextDepth = Math.min(outerContextDepth, 0x7F);
		this.altAndOuterContextDepth = ((outerContextDepth << 24) | (this.altAndOuterContextDepth & ~0x7F000000) >>> 0);
	}

	get lexerActionExecutor(): LexerActionExecutor | undefined {
		return undefined;
	}

	@NotNull
	get semanticContext(): SemanticContext {
		return SemanticContext.NONE;
	}

	get hasPassedThroughNonGreedyDecision(): boolean {
		return false;
	}

	@Override
	public clone(): ATNConfig {
		return this.transform(this.state, false);
	}

	public transform( state: ATNState, checkNonGreedy: boolean): ATNConfig;
	public transform( state: ATNState, checkNonGreedy: boolean,  semanticContext: SemanticContext): ATNConfig;
	public transform( state: ATNState, checkNonGreedy: boolean, context: PredictionContext): ATNConfig;
	public transform( state: ATNState, checkNonGreedy: boolean, lexerActionExecutor: LexerActionExecutor): ATNConfig;
	public transform( state: ATNState, checkNonGreedy: boolean, arg2?: SemanticContext | PredictionContext | LexerActionExecutor): ATNConfig {
		if (arg2 == null) {
			return this.transformImpl(state, this._context, this.semanticContext, checkNonGreedy, this.lexerActionExecutor);
		} else if (arg2 instanceof PredictionContext) {
			return this.transformImpl(state, arg2, this.semanticContext, checkNonGreedy, this.lexerActionExecutor);
		} else if (arg2 instanceof SemanticContext) {
			return this.transformImpl(state, this._context, arg2, checkNonGreedy, this.lexerActionExecutor);
		} else {
			return this.transformImpl(state, this._context, this.semanticContext, checkNonGreedy, arg2);
		}
	}

	private transformImpl(@NotNull state: ATNState, context: PredictionContext, @NotNull semanticContext: SemanticContext, checkNonGreedy: boolean, lexerActionExecutor: LexerActionExecutor | undefined): ATNConfig {
		let passedThroughNonGreedy: boolean = checkNonGreedy && ATNConfig.checkNonGreedyDecision(this, state);
		if (semanticContext !== SemanticContext.NONE) {
			if (lexerActionExecutor != null || passedThroughNonGreedy) {
				return new ActionSemanticContextATNConfig(lexerActionExecutor, semanticContext, state, this, context, passedThroughNonGreedy);
			}
			else {
				return new SemanticContextATNConfig(semanticContext, state, this, context);
			}
		}
		else if (lexerActionExecutor != null || passedThroughNonGreedy) {
			return new ActionATNConfig(lexerActionExecutor, state, this, context, passedThroughNonGreedy);
		}
		else {
			return new ATNConfig(state, this, context);
		}
	}

	private static checkNonGreedyDecision(source: ATNConfig, target: ATNState): boolean {
		return source.hasPassedThroughNonGreedyDecision
			|| target instanceof DecisionState && target.nonGreedy;
	}

	public appendContext(context: number, contextCache: PredictionContextCache): ATNConfig;
	public appendContext(context: PredictionContext, contextCache: PredictionContextCache): ATNConfig;
	public appendContext(context: number | PredictionContext, contextCache: PredictionContextCache): ATNConfig {
		if (typeof context === "number") {
			let appendedContext: PredictionContext = this.context.appendSingleContext(context, contextCache);
			let result: ATNConfig = this.transform(this.state, false, appendedContext);
			return result;
		} else {
			let appendedContext: PredictionContext = this.context.appendContext(context, contextCache);
			let result: ATNConfig = this.transform(this.state, false, appendedContext);
			return result;
		}
	}

	
	public contains(subconfig: ATNConfig): boolean {
		if (this.state.stateNumber !== subconfig.state.stateNumber
			|| this.alt !== subconfig.alt
			|| !this.semanticContext.equals(subconfig.semanticContext)) {
			return false;
		}

		let leftWorkList: PredictionContext[] = [];
		let rightWorkList: PredictionContext[] = [];
		leftWorkList.push(this.context);
		rightWorkList.push(subconfig.context);
		while (true) {
			let left = leftWorkList.pop();
			let right = rightWorkList.pop();
			if (!left || !right) {
				break;
			}

			if (left === right) {
				return true;
			}

			if (left.size < right.size) {
				return false;
			}

			if (right.isEmpty) {
				return left.hasEmpty;
			} else {
				for (let i = 0; i < right.size; i++) {
					let index: number = left.findReturnState(right.getReturnState(i));
					if (index < 0) {
						
						return false;
					}

					leftWorkList.push(left.getParent(index));
					rightWorkList.push(right.getParent(i));
				}
			}
		}

		return false;
	}

	get isPrecedenceFilterSuppressed(): boolean {
		return (this.altAndOuterContextDepth & SUPPRESS_PRECEDENCE_FILTER) !== 0;
	}

	set isPrecedenceFilterSuppressed(value: boolean) {
		if (value) {
			this.altAndOuterContextDepth |= SUPPRESS_PRECEDENCE_FILTER;
		}
		else {
			this.altAndOuterContextDepth &= ~SUPPRESS_PRECEDENCE_FILTER;
		}
	}

	
	@Override
	public equals(o: any): boolean {
		if (this === o) {
			return true;
		} else if (!(o instanceof ATNConfig)) {
			return false;
		}

		return this.state.stateNumber === o.state.stateNumber
			&& this.alt === o.alt
			&& this.reachesIntoOuterContext === o.reachesIntoOuterContext
			&& this.context.equals(o.context)
			&& this.semanticContext.equals(o.semanticContext)
			&& this.isPrecedenceFilterSuppressed === o.isPrecedenceFilterSuppressed
			&& this.hasPassedThroughNonGreedyDecision === o.hasPassedThroughNonGreedyDecision
			&& ObjectEqualityComparator.INSTANCE.equals(this.lexerActionExecutor, o.lexerActionExecutor);
	}

	@Override
	public hashCode(): number {
		let hashCode: number = MurmurHash.initialize(7);
		hashCode = MurmurHash.update(hashCode, this.state.stateNumber);
		hashCode = MurmurHash.update(hashCode, this.alt);
		hashCode = MurmurHash.update(hashCode, this.reachesIntoOuterContext ? 1 : 0);
		hashCode = MurmurHash.update(hashCode, this.context);
		hashCode = MurmurHash.update(hashCode, this.semanticContext);
		hashCode = MurmurHash.update(hashCode, this.hasPassedThroughNonGreedyDecision ? 1 : 0);
		hashCode = MurmurHash.update(hashCode, this.lexerActionExecutor);
		hashCode = MurmurHash.finish(hashCode, 7);
		return hashCode;
	}

	
	public toDotString(): string {
		let builder = "";
		builder += ("digraph G {\n");
		builder += ("rankdir=LR;\n");

		let visited = new Array2DHashMap<PredictionContext, number>(PredictionContext.IdentityEqualityComparator.INSTANCE);
		let workList: PredictionContext[] = [];
		function getOrAddContext(context: PredictionContext): number {
			let newNumber = visited.size;
			let result = visited.putIfAbsent(context, newNumber);
			if (result != null) {
				
				return result;
			}

			workList.push(context);
			return newNumber;
		}

		workList.push(this.context);
		visited.put(this.context, 0);
		while (true) {
			let current = workList.pop();
			if (!current) {
				break;
			}

			for (let i = 0; i < current.size; i++) {
				builder += ("  s") + (getOrAddContext(current));
				builder += ("->");
				builder += ("s") + (getOrAddContext(current.getParent(i)));
				builder += ("[label=\"") + (current.getReturnState(i)) + ("\"];\n");
			}
		}

		builder += ("}\n");
		return builder.toString();
	}

	public toString(): string;
	public toString(recog: Recognizer<any, any> | undefined, showAlt: boolean): string;
	public toString(recog: Recognizer<any, any> | undefined, showAlt: boolean, showContext: boolean): string;
	public toString(recog?: Recognizer<any, any>, showAlt?: boolean, showContext?: boolean): string {
		
		if (showContext == null) {
			showContext = showAlt != null;
		}

		if (showAlt == null) {
			showAlt = true;
		}

		let buf = "";
		
		
		
		
		
		
		
		let contexts: string[];
		if (showContext) {
			contexts = this.context.toStrings(recog, this.state.stateNumber);
		}
		else {
			contexts = ["?"];
		}

		let first: boolean = true;
		for (let contextDesc of contexts) {
			if (first) {
				first = false;
			}
			else {
				buf += (", ");
			}

			buf += ("(");
			buf += (this.state);
			if (showAlt) {
				buf += (",");
				buf += (this.alt);
			}
			if (this.context) {
				buf += (",");
				buf += (contextDesc);
			}
			if (this.semanticContext !== SemanticContext.NONE) {
				buf += (",");
				buf += (this.semanticContext);
			}
			if (this.reachesIntoOuterContext) {
				buf += (",up=") + (this.outerContextDepth);
			}
			buf += (")");
		}
		return buf.toString();
	}
}


class SemanticContextATNConfig extends ATNConfig {
	@NotNull
	private _semanticContext: SemanticContext;

	constructor(semanticContext: SemanticContext,  state: ATNState, alt: number, context: PredictionContext);
	constructor(semanticContext: SemanticContext,  state: ATNState,  c: ATNConfig, context: PredictionContext);
	constructor(semanticContext: SemanticContext, @NotNull state: ATNState, @NotNull altOrConfig: number | ATNConfig, context: PredictionContext) {
		if (typeof altOrConfig === "number") {
			super(state, altOrConfig, context);
		} else {
			super(state, altOrConfig, context);
		}

		this._semanticContext = semanticContext;
	}

	@Override
	get semanticContext(): SemanticContext {
		return this._semanticContext;
	}

}


class ActionATNConfig extends ATNConfig {
	private _lexerActionExecutor?: LexerActionExecutor;
	private passedThroughNonGreedyDecision: boolean;

	constructor(lexerActionExecutor: LexerActionExecutor | undefined,  state: ATNState, alt: number, context: PredictionContext, passedThroughNonGreedyDecision: boolean);
	constructor(lexerActionExecutor: LexerActionExecutor | undefined,  state: ATNState,  c: ATNConfig, context: PredictionContext, passedThroughNonGreedyDecision: boolean);
	constructor(lexerActionExecutor: LexerActionExecutor | undefined, @NotNull state: ATNState, @NotNull altOrConfig: number | ATNConfig, context: PredictionContext, passedThroughNonGreedyDecision: boolean) {
		if (typeof altOrConfig === "number") {
			super(state, altOrConfig, context);
		} else {
			super(state, altOrConfig, context);
			if (altOrConfig.semanticContext !== SemanticContext.NONE) {
				throw new Error("Not supported");
			}
		}

		this._lexerActionExecutor = lexerActionExecutor;
		this.passedThroughNonGreedyDecision = passedThroughNonGreedyDecision;
	}

	@Override
	get lexerActionExecutor(): LexerActionExecutor | undefined {
		return this._lexerActionExecutor;
	}

	@Override
	get hasPassedThroughNonGreedyDecision(): boolean {
		return this.passedThroughNonGreedyDecision;
	}
}


class ActionSemanticContextATNConfig extends SemanticContextATNConfig {
	private _lexerActionExecutor?: LexerActionExecutor;
	private passedThroughNonGreedyDecision: boolean;

	constructor(lexerActionExecutor: LexerActionExecutor | undefined,  semanticContext: SemanticContext,  state: ATNState, alt: number, context: PredictionContext, passedThroughNonGreedyDecision: boolean);
	constructor(lexerActionExecutor: LexerActionExecutor | undefined,  semanticContext: SemanticContext,  state: ATNState,  c: ATNConfig, context: PredictionContext, passedThroughNonGreedyDecision: boolean);
	constructor(lexerActionExecutor: LexerActionExecutor | undefined, @NotNull semanticContext: SemanticContext, @NotNull state: ATNState, altOrConfig: number | ATNConfig, context: PredictionContext, passedThroughNonGreedyDecision: boolean) {
		if (typeof altOrConfig === "number") {
			super(semanticContext, state, altOrConfig, context);
		} else {
			super(semanticContext, state, altOrConfig, context);
		}

		this._lexerActionExecutor = lexerActionExecutor;
		this.passedThroughNonGreedyDecision = passedThroughNonGreedyDecision;
	}

	@Override
	get lexerActionExecutor(): LexerActionExecutor | undefined {
		return this._lexerActionExecutor;
	}

	@Override
	get hasPassedThroughNonGreedyDecision(): boolean {
		return this.passedThroughNonGreedyDecision;
	}
}
