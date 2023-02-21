





import * as assert from "assert";
import { NotNull } from "../Decorators";
import { DFA } from "../dfa";
import { Array2DHashMap, ObjectEqualityComparator, IntervalSet } from "../misc";
import { RuleContext } from "../RuleContext";
import { Token } from "../Token";
import { LexerAction } from "./action/LexerAction";
import { ATNType } from "./ATNType";
import { PredictionContext } from "./context/PredictionContext";
import { LL1Analyzer } from "./LL1Analyzer";
import { ATNState } from "./state/ATNState";
import { DecisionState } from "./state/DecisionState";
import { InvalidState } from "./state/InvalidState";
import { RuleStartState } from "./state/RuleStartState";
import { RuleStopState } from "./state/RuleStopState";
import { TokensStartState } from "./state/TokensStartState";
import { RuleTransition } from "./transition/RuleTransition";


export class ATN {
	@NotNull
	public readonly states: ATNState[] = [];

	
	@NotNull
	public decisionToState: DecisionState[] = [];

	
	public ruleToStartState!: RuleStartState[];

	
	public ruleToStopState!: RuleStopState[];

	@NotNull
	public modeNameToStartState: Map<string, TokensStartState> =
		new Map<string, TokensStartState>();

	
	public grammarType: ATNType;

	
	public maxTokenType: number;

	
	public ruleToTokenType!: Int32Array;

	
	public lexerActions!: LexerAction[];

	@NotNull
	public modeToStartState: TokensStartState[] = [];

	private contextCache: Array2DHashMap<PredictionContext, PredictionContext> =
		new Array2DHashMap<PredictionContext, PredictionContext>(ObjectEqualityComparator.INSTANCE);

	@NotNull
	public decisionToDFA: DFA[] = [];
	@NotNull
	public modeToDFA: DFA[] = [];

	public LL1Table: Map<number, number> = new Map<number, number>();

	
	constructor(@NotNull grammarType: ATNType, maxTokenType: number) {
		this.grammarType = grammarType;
		this.maxTokenType = maxTokenType;
	}

	public clearDFA(): void {
		this.decisionToDFA = new Array<DFA>(this.decisionToState.length);
		for (let i = 0; i < this.decisionToDFA.length; i++) {
			this.decisionToDFA[i] = new DFA(this.decisionToState[i], i);
		}

		this.modeToDFA = new Array<DFA>(this.modeToStartState.length);
		for (let i = 0; i < this.modeToDFA.length; i++) {
			this.modeToDFA[i] = new DFA(this.modeToStartState[i]);
		}

		this.contextCache.clear();
		this.LL1Table.clear();
	}

	get contextCacheSize(): number {
		return this.contextCache.size;
	}

	public getCachedContext(context: PredictionContext): PredictionContext {
		return PredictionContext.getCachedContext(context, this.contextCache, new PredictionContext.IdentityHashMap());
	}

	public getDecisionToDFA(): DFA[] {
		assert(this.decisionToDFA != null && this.decisionToDFA.length === this.decisionToState.length);
		return this.decisionToDFA;
	}

	
	
	public nextTokens(s: ATNState,  ctx: PredictionContext): IntervalSet;

	
	
	public nextTokens( s: ATNState): IntervalSet;

	@NotNull
	public nextTokens(s: ATNState, ctx?: PredictionContext): IntervalSet {
		if (ctx) {
			let anal: LL1Analyzer = new LL1Analyzer(this);
			let next: IntervalSet = anal.LOOK(s, ctx);
			return next;
		} else {
			if (s.nextTokenWithinRule) {
				return s.nextTokenWithinRule;
			}

			s.nextTokenWithinRule = this.nextTokens(s, PredictionContext.EMPTY_LOCAL);
			s.nextTokenWithinRule.setReadonly(true);
			return s.nextTokenWithinRule;
		}
	}

	public addState(state: ATNState): void {
		state.atn = this;
		state.stateNumber = this.states.length;
		this.states.push(state);
	}

	public removeState(@NotNull state: ATNState): void {
		
		let invalidState = new InvalidState();
		invalidState.atn = this;
		invalidState.stateNumber = state.stateNumber;
		this.states[state.stateNumber] = invalidState;
	}

	public defineMode(@NotNull name: string, @NotNull s: TokensStartState): void {
		this.modeNameToStartState.set(name, s);
		this.modeToStartState.push(s);
		this.modeToDFA.push(new DFA(s));
		this.defineDecisionState(s);
	}

	public defineDecisionState(@NotNull s: DecisionState): number {
		this.decisionToState.push(s);
		s.decision = this.decisionToState.length - 1;
		this.decisionToDFA.push(new DFA(s, s.decision));
		return s.decision;
	}

	public getDecisionState(decision: number): DecisionState | undefined {
		if (this.decisionToState.length > 0) {
			return this.decisionToState[decision];
		}
		return undefined;
	}

	get numberOfDecisions(): number {
		return this.decisionToState.length;
	}

	
	@NotNull
	public getExpectedTokens(stateNumber: number, context: RuleContext | undefined): IntervalSet {
		if (stateNumber < 0 || stateNumber >= this.states.length) {
			throw new RangeError("Invalid state number.");
		}

		let ctx: RuleContext | undefined = context;
		let s: ATNState = this.states[stateNumber];
		let following: IntervalSet = this.nextTokens(s);
		if (!following.contains(Token.EPSILON)) {
			return following;
		}

		let expected: IntervalSet = new IntervalSet();
		expected.addAll(following);
		expected.remove(Token.EPSILON);
		while (ctx != null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
			let invokingState: ATNState = this.states[ctx.invokingState];
			let rt: RuleTransition = invokingState.transition(0) as RuleTransition;
			following = this.nextTokens(rt.followState);
			expected.addAll(following);
			expected.remove(Token.EPSILON);
			ctx = ctx._parent;
		}

		if (following.contains(Token.EPSILON)) {
			expected.add(Token.EOF);
		}

		return expected;
	}
}

export namespace ATN {
	export const INVALID_ALT_NUMBER: number = 0;
}
