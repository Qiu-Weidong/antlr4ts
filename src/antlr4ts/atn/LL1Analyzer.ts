

import { NotNull } from "../Decorators";
import { IntervalSet, Array2DHashSet, ObjectEqualityComparator, BitSet } from "../misc";
import { Token } from "../Token";
import { ATN } from "./ATN";
import { ATNConfig } from "./config/ATNConfig";
import { PredictionContext } from "./context/PredictionContext";
import { ATNState } from "./state/ATNState";
import { RuleStopState } from "./state/RuleStopState";
import { AbstractPredicateTransition } from "./transition/AbstractPredicateTransition";
import { NotSetTransition } from "./transition/NotSetTransition";
import { RuleTransition } from "./transition/RuleTransition";
import { Transition } from "./transition/Transition";
import { WildcardTransition } from "./transition/WildcardTransition";





export class LL1Analyzer {
	
	public static readonly HIT_PRED: number = Token.INVALID_TYPE;

	@NotNull
	public atn: ATN;

	constructor(@NotNull atn: ATN) { this.atn = atn; }

	
	public getDecisionLookahead(s: ATNState | undefined): Array<IntervalSet | undefined> | undefined {

		if (s == null) {
			return undefined;
		}

		let look: Array<IntervalSet | undefined> = new Array<IntervalSet>(s.numberOfTransitions);
		for (let alt = 0; alt < s.numberOfTransitions; alt++) {
			let current: IntervalSet | undefined = new IntervalSet();
			look[alt] = current;
			let lookBusy: Array2DHashSet<ATNConfig> = new Array2DHashSet<ATNConfig>(ObjectEqualityComparator.INSTANCE);
			let seeThruPreds: boolean = false; 
			this._LOOK(s.transition(alt).target, undefined, PredictionContext.EMPTY_LOCAL,
				current, lookBusy, new BitSet(), seeThruPreds, false);
			
			
			if (current.size === 0 || current.contains(LL1Analyzer.HIT_PRED)) {
				current = undefined;
				look[alt] = current;
			}
		}
		return look;
	}

	
	
	public LOOK( s: ATNState,  ctx: PredictionContext): IntervalSet;

	
	
	public LOOK( s: ATNState,  ctx: PredictionContext, stopState: ATNState | null): IntervalSet;

	@NotNull
	public LOOK(@NotNull s: ATNState, @NotNull ctx: PredictionContext, stopState?: ATNState | null): IntervalSet {
		if (stopState === undefined) {
			if (s.atn == null) {
				throw new Error("Illegal state");
			}

			stopState = s.atn.ruleToStopState[s.ruleIndex];
		} else if (stopState === null) {
			
			
			stopState = undefined;
		}

		let r: IntervalSet = new IntervalSet();
		let seeThruPreds: boolean = true; 
		let addEOF: boolean = true;
		this._LOOK(s, stopState, ctx, r, new Array2DHashSet<ATNConfig>(), new BitSet(), seeThruPreds, addEOF);
		return r;
	}

	
	protected _LOOK(
		@NotNull s: ATNState,
		stopState: ATNState | undefined | null,
		@NotNull ctx: PredictionContext,
		@NotNull look: IntervalSet,
		@NotNull lookBusy: Array2DHashSet<ATNConfig>,
		@NotNull calledRuleStack: BitSet,
		seeThruPreds: boolean,
		addEOF: boolean): void {

		let c: ATNConfig = ATNConfig.create(s, 0, ctx);
		if (!lookBusy.add(c)) {
			return;
		}

		if (s === stopState) {
			if (PredictionContext.isEmptyLocal(ctx)) {
				look.add(Token.EPSILON);
				return;
			} else if (ctx.isEmpty) {
				if (addEOF) {
					look.add(Token.EOF);
				}

				return;
			}
		}

		if (s instanceof RuleStopState) {
			if (ctx.isEmpty && !PredictionContext.isEmptyLocal(ctx)) {
				if (addEOF) {
					look.add(Token.EOF);
				}

				return;
			}

			let removed: boolean = calledRuleStack.get(s.ruleIndex);
			try {
				calledRuleStack.clear(s.ruleIndex);
				for (let i = 0; i < ctx.size; i++) {
					if (ctx.getReturnState(i) === PredictionContext.EMPTY_FULL_STATE_KEY) {
						continue;
					}

					let returnState: ATNState = this.atn.states[ctx.getReturnState(i)];

					this._LOOK(returnState, stopState, ctx.getParent(i), look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
				}
			}
			finally {
				if (removed) {
					calledRuleStack.set(s.ruleIndex);
				}
			}
		}

		let n: number = s.numberOfTransitions;
		for (let i = 0; i < n; i++) {
			let t: Transition = s.transition(i);
			if (t instanceof RuleTransition) {
				if (calledRuleStack.get(t.ruleIndex)) {
					continue;
				}

				let newContext: PredictionContext = ctx.getChild(t.followState.stateNumber);

				try {
					calledRuleStack.set(t.ruleIndex);
					this._LOOK(t.target, stopState, newContext, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
				}
				finally {
					calledRuleStack.clear(t.ruleIndex);
				}
			}
			else if (t instanceof AbstractPredicateTransition) {
				if (seeThruPreds) {
					this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
				}
				else {
					look.add(LL1Analyzer.HIT_PRED);
				}
			}
			else if (t.isEpsilon) {
				this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
			}
			else if (t instanceof WildcardTransition) {
				look.addAll(IntervalSet.of(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType));
			}
			else {

				let set: IntervalSet | undefined = t.label;
				if (set != null) {
					if (t instanceof NotSetTransition) {
						set = set.complement(IntervalSet.of(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType));
					}
					look.addAll(set);
				}
			}
		}
	}
}
