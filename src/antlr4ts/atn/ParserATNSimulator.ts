





import * as assert from "assert";
import { NotNull, Override, Nullable } from "../Decorators";
import { DFA, DFAState, AcceptStateInfo } from "../dfa";
import { NoViableAltException } from "../exception/NoViableAltException";
import { IntStream } from "../IntStream";
import { Interval, BitSet, IntegerList, Arrays, Array2DHashSet, ObjectEqualityComparator } from "../misc";
import { Parser } from "../Parser";
import { ParserRuleContext } from "../ParserRuleContext";
import { RuleContext } from "../RuleContext";
import { Token } from "../Token";
import { TokenStream } from "../TokenStream";
import { Vocabulary } from "../Vocabulary";
import { VocabularyImpl } from "../VocabularyImpl";
import { ATN } from "./ATN";
import { ATNSimulator } from "./ATNSimulator";
import { ATNConfig } from "./config/ATNConfig";
import { ATNConfigSet } from "./config/ATNConfigSet";
import { PredictionContext } from "./context/PredictionContext";
import { PredictionContextCache } from "./context/PredictionContextCache";
import { SemanticContext } from "./context/SemanticContext";
import { ConflictInfo } from "./info/ConflictInfo";
import { PredictionMode } from "./PredictionMode";
import { ATNState } from "./state/ATNState";
import { ATNStateType } from "./state/ATNStateType";
import { DecisionState } from "./state/DecisionState";
import { RuleStopState } from "./state/RuleStopState";
import { SimulatorState } from "./state/SimulatorState";
import { StarLoopEntryState } from "./state/StarLoopEntryState";
import { ActionTransition } from "./transition/ActionTransition";
import { AtomTransition } from "./transition/AtomTransition";
import { EpsilonTransition } from "./transition/EpsilonTransition";
import { NotSetTransition } from "./transition/NotSetTransition";
import { PrecedencePredicateTransition } from "./transition/PrecedencePredicateTransition";
import { PredicateTransition } from "./transition/PredicateTransition";
import { RuleTransition } from "./transition/RuleTransition";
import { SetTransition } from "./transition/SetTransition";
import { Transition } from "./transition/Transition";
import { TransitionType } from "./transition/TransitionType";

const MAX_SHORT_VALUE = 0xFFFF;
const MIN_INTEGER_VALUE = -((1 << 31) >>> 0);


export class ParserATNSimulator extends ATNSimulator {
	public static debug: boolean = false;
	public static dfa_debug: boolean = false;
	public static retry_debug: boolean = false;

	@NotNull
	private predictionMode: PredictionMode = PredictionMode.LL;
	public force_global_context: boolean = false;
	public always_try_local_context: boolean = true;

	
	public enable_global_context_dfa: boolean = false;
	public optimize_unique_closure: boolean = true;
	public optimize_ll1: boolean = true;
	public optimize_tail_calls: boolean = true;
	public tail_call_preserves_sll: boolean = true;
	public treat_sllk1_conflict_as_ambiguity: boolean = false;

	protected _parser: Parser;

	
	public reportAmbiguities: boolean = false;

	
	protected userWantsCtxSensitive: boolean = true;

	private dfa?: DFA;

	constructor(@NotNull atn: ATN, parser: Parser) {
		super(atn);
		this._parser = parser;
	}

	@NotNull
	public getPredictionMode(): PredictionMode {
		return this.predictionMode;
	}

	public setPredictionMode(@NotNull predictionMode: PredictionMode): void {
		this.predictionMode = predictionMode;
	}

	@Override
	public reset(): void {
		
	}

	public adaptivePredict( input: TokenStream, decision: number, outerContext: ParserRuleContext | undefined): number;
	public adaptivePredict( input: TokenStream, decision: number, outerContext: ParserRuleContext | undefined, useContext: boolean): number;
	public adaptivePredict(
		@NotNull input: TokenStream,
		decision: number,
		outerContext: ParserRuleContext | undefined,
		useContext?: boolean): number {
		if (useContext === undefined) {
			useContext = false;
		}

		let dfa: DFA = this.atn.decisionToDFA[decision];
		assert(dfa != null);
		if (this.optimize_ll1 && !dfa.isPrecedenceDfa && !dfa.isEmpty) {
			let ll_1: number = input.LA(1);
			if (ll_1 >= 0 && ll_1 <= 0xFFFF) {
				let key: number = ((decision << 16) >>> 0) + ll_1;
				let alt: number | undefined = this.atn.LL1Table.get(key);
				if (alt != null) {
					return alt;
				}
			}
		}

		this.dfa = dfa;

		if (this.force_global_context) {
			useContext = true;
		}
		else if (!this.always_try_local_context) {
			useContext = useContext || dfa.isContextSensitive;
		}

		this.userWantsCtxSensitive = useContext || (this.predictionMode !== PredictionMode.SLL && outerContext != null && !this.atn.decisionToState[decision].sll);
		if (outerContext == null) {
			outerContext = ParserRuleContext.emptyContext();
		}

		let state: SimulatorState | undefined;
		if (!dfa.isEmpty) {
			state = this.getStartState(dfa, input, outerContext, useContext);
		}

		if (state == null) {
			if (outerContext == null) {
				outerContext = ParserRuleContext.emptyContext();
			}
			if (ParserATNSimulator.debug) {
				console.log("ATN decision " + dfa.decision +
					" exec LA(1)==" + this.getLookaheadName(input) +
					", outerContext=" + outerContext.toString(this._parser));
			}

			state = this.computeStartState(dfa, outerContext, useContext);
		}

		let m: number = input.mark();
		let index: number = input.index;
		try {
			let alt: number = this.execDFA(dfa, input, index, state);
			if (ParserATNSimulator.debug) {
				console.log("DFA after predictATN: " + dfa.toString(this._parser.vocabulary, this._parser.ruleNames));
			}
			return alt;
		}
		finally {
			this.dfa = undefined;
			input.seek(index);
			input.release(m);
		}
	}

	protected getStartState(
		@NotNull dfa: DFA,
		@NotNull input: TokenStream,
		@NotNull outerContext: ParserRuleContext,
		useContext: boolean): SimulatorState | undefined {

		if (!useContext) {
			if (dfa.isPrecedenceDfa) {
				
				
				let state: DFAState | undefined = dfa.getPrecedenceStartState(this._parser.precedence, false);
				if (state == null) {
					return undefined;
				}

				return new SimulatorState(outerContext, state, false, outerContext);
			}
			else {
				if (dfa.s0 == null) {
					return undefined;
				}

				return new SimulatorState(outerContext, dfa.s0, false, outerContext);
			}
		}

		if (!this.enable_global_context_dfa) {
			return undefined;
		}

		let remainingContext: ParserRuleContext | undefined = outerContext;
		assert(outerContext != null);
		let s0: DFAState | undefined;
		if (dfa.isPrecedenceDfa) {
			s0 = dfa.getPrecedenceStartState(this._parser.precedence, true);
		}
		else {
			s0 = dfa.s0full;
		}

		while (remainingContext != null && s0 != null && s0.isContextSensitive) {
			remainingContext = this.skipTailCalls(remainingContext);
			s0 = s0.getContextTarget(this.getReturnState(remainingContext));
			if (remainingContext.isEmpty) {
				assert(s0 == null || !s0.isContextSensitive);
			}
			else {
				remainingContext = remainingContext.parent;
			}
		}

		if (s0 == null) {
			return undefined;
		}

		return new SimulatorState(outerContext, s0, useContext, remainingContext);
	}

	protected execDFA(
		@NotNull dfa: DFA,
		@NotNull input: TokenStream, startIndex: number,
		@NotNull state: SimulatorState): number {
		let outerContext: ParserRuleContext = state.outerContext;
		if (ParserATNSimulator.dfa_debug) {
			console.log("DFA decision " + dfa.decision +
				" exec LA(1)==" + this.getLookaheadName(input) +
				", outerContext=" + outerContext.toString(this._parser));
		}
		if (ParserATNSimulator.dfa_debug) {
			console.log(dfa.toString(this._parser.vocabulary, this._parser.ruleNames));
		}
		let s: DFAState = state.s0;

		let t: number = input.LA(1);
		let remainingOuterContext: ParserRuleContext | undefined = state.remainingOuterContext;

		while (true) {
			if (ParserATNSimulator.dfa_debug) {
				console.log("DFA state " + s.stateNumber + " LA(1)==" + this.getLookaheadName(input));
			}
			if (state.useContext) {
				while (s.isContextSymbol(t)) {
					let next: DFAState | undefined;
					if (remainingOuterContext != null) {
						remainingOuterContext = this.skipTailCalls(remainingOuterContext);
						next = s.getContextTarget(this.getReturnState(remainingOuterContext));
					}

					if (next == null) {
						
						let initialState: SimulatorState = new SimulatorState(state.outerContext, s, state.useContext, remainingOuterContext);
						return this.execATN(dfa, input, startIndex, initialState);
					}

					assert(remainingOuterContext != null);
					remainingOuterContext = remainingOuterContext.parent;
					s = next;
				}
			}

			if (this.isAcceptState(s, state.useContext)) {
				if (s.predicates != null) {
					if (ParserATNSimulator.dfa_debug) {
						console.log("accept " + s);
					}
				}
				else {
					if (ParserATNSimulator.dfa_debug) {
						console.log("accept; predict " + s.prediction + " in state " + s.stateNumber);
					}
				}

				
				
				
				
				break;
			}

			
			assert(!this.isAcceptState(s, state.useContext));

			
			let target: DFAState | undefined = this.getExistingTargetState(s, t);
			if (target == null) {
				if (ParserATNSimulator.dfa_debug && t >= 0) {
					console.log("no edge for " + this._parser.vocabulary.getDisplayName(t));
				}
				let alt: number;
				if (ParserATNSimulator.dfa_debug) {
					let interval: Interval = Interval.of(startIndex, this._parser.inputStream.index);
					console.log("ATN exec upon " +
						this._parser.inputStream.getText(interval) +
						" at DFA state " + s.stateNumber);
				}

				let initialState: SimulatorState = new SimulatorState(outerContext, s, state.useContext, remainingOuterContext);
				alt = this.execATN(dfa, input, startIndex, initialState);
				if (ParserATNSimulator.dfa_debug) {
					console.log("back from DFA update, alt=" + alt + ", dfa=\n" + dfa.toString(this._parser.vocabulary, this._parser.ruleNames));
					
				}
				
				if (ParserATNSimulator.dfa_debug) {
					console.log("DFA decision " + dfa.decision +
						" predicts " + alt);
				}
				return alt; 
			}
			else if (target === ATNSimulator.ERROR) {
				let errorState: SimulatorState = new SimulatorState(outerContext, s, state.useContext, remainingOuterContext);
				return this.handleNoViableAlt(input, startIndex, errorState);
			}
			s = target;
			if (!this.isAcceptState(s, state.useContext) && t !== IntStream.EOF) {
				input.consume();
				t = input.LA(1);
			}
		}





		if (!state.useContext && s.configs.conflictInfo != null) {
			if (dfa.atnStartState instanceof DecisionState) {
				if (!this.userWantsCtxSensitive ||
					(!s.configs.dipsIntoOuterContext && s.configs.isExactConflict) ||
					(this.treat_sllk1_conflict_as_ambiguity && input.index === startIndex)) {
					
					
					
					
				}
				else {
					assert(!state.useContext);

					
					
					
					let conflictingAlts: BitSet | undefined;
					let predicates: DFAState.PredPrediction[] | undefined = s.predicates;
					if (predicates != null) {
						let conflictIndex: number = input.index;
						if (conflictIndex !== startIndex) {
							input.seek(startIndex);
						}

						conflictingAlts = this.evalSemanticContext(predicates, outerContext, true);
						if (conflictingAlts.cardinality() === 1) {
							return conflictingAlts.nextSetBit(0);
						}

						if (conflictIndex !== startIndex) {
							
							
							input.seek(conflictIndex);
						}
					}

					if (this.reportAmbiguities) {
						let conflictState: SimulatorState = new SimulatorState(outerContext, s, state.useContext, remainingOuterContext);
						this.reportAttemptingFullContext(dfa, conflictingAlts, conflictState, startIndex, input.index);
					}

					input.seek(startIndex);
					return this.adaptivePredict(input, dfa.decision, outerContext, true);
				}
			}
		}

		
		
		let predicates: DFAState.PredPrediction[] | undefined = s.predicates;
		if (predicates != null) {
			let stopIndex: number = input.index;
			if (startIndex !== stopIndex) {
				input.seek(startIndex);
			}

			let alts: BitSet = this.evalSemanticContext(predicates, outerContext, this.reportAmbiguities && this.predictionMode === PredictionMode.LL_EXACT_AMBIG_DETECTION);
			switch (alts.cardinality()) {
			case 0:
				throw this.noViableAlt(input, outerContext, s.configs, startIndex);

			case 1:
				return alts.nextSetBit(0);

			default:
				
				
				if (startIndex !== stopIndex) {
					input.seek(stopIndex);
				}

				this.reportAmbiguity(dfa, s, startIndex, stopIndex, s.configs.isExactConflict, alts, s.configs);
				return alts.nextSetBit(0);
			}
		}

		if (ParserATNSimulator.dfa_debug) {
			console.log("DFA decision " + dfa.decision +
				" predicts " + s.prediction);
		}
		return s.prediction;
	}

	
	protected isAcceptState(state: DFAState, useContext: boolean): boolean {
		if (!state.isAcceptState) {
			return false;
		}

		if (state.configs.conflictingAlts == null) {
			
			return true;
		}

		
		if (useContext && this.predictionMode === PredictionMode.LL_EXACT_AMBIG_DETECTION) {
			return state.configs.isExactConflict;
		}

		return true;
	}

	
	protected execATN(
		@NotNull dfa: DFA,
		@NotNull input: TokenStream, startIndex: number,
		@NotNull initialState: SimulatorState): number {
		if (ParserATNSimulator.debug) {
			console.log("execATN decision " + dfa.decision + " exec LA(1)==" + this.getLookaheadName(input));
		}

		let outerContext: ParserRuleContext = initialState.outerContext;
		let useContext: boolean = initialState.useContext;

		let t: number = input.LA(1);

		let previous: SimulatorState = initialState;

		let contextCache: PredictionContextCache = new PredictionContextCache();
		while (true) { 
			let nextState: SimulatorState | undefined = this.computeReachSet(dfa, previous, t, contextCache);
			if (nextState == null) {
				this.setDFAEdge(previous.s0, input.LA(1), ATNSimulator.ERROR);
				return this.handleNoViableAlt(input, startIndex, previous);
			}

			let D: DFAState = nextState.s0;

			
			assert(D.isAcceptState || D.prediction === ATN.INVALID_ALT_NUMBER);
			
			assert(D.isAcceptState || D.configs.conflictInfo == null);

			if (this.isAcceptState(D, useContext)) {
				let conflictingAlts: BitSet | undefined = D.configs.conflictingAlts;
				let predictedAlt: number = conflictingAlts == null ? D.prediction : ATN.INVALID_ALT_NUMBER;
				if (predictedAlt !== ATN.INVALID_ALT_NUMBER) {
					if (this.optimize_ll1
						&& input.index === startIndex
						&& !dfa.isPrecedenceDfa
						&& nextState.outerContext === nextState.remainingOuterContext
						&& dfa.decision >= 0
						&& !D.configs.hasSemanticContext) {
						if (t >= 0 && t <= MAX_SHORT_VALUE) {
							let key: number = ((dfa.decision << 16) >>> 0) + t;
							this.atn.LL1Table.set(key, predictedAlt);
						}
					}

					if (useContext && this.always_try_local_context) {
						this.reportContextSensitivity(dfa, predictedAlt, nextState, startIndex, input.index);
					}
				}

				predictedAlt = D.prediction;


				let attemptFullContext: boolean = conflictingAlts != null && this.userWantsCtxSensitive;
				if (attemptFullContext) {
					
					
					attemptFullContext = !useContext
						&& (D.configs.dipsIntoOuterContext || !D.configs.isExactConflict)
						&& (!this.treat_sllk1_conflict_as_ambiguity || input.index !== startIndex);
				}

				if (D.configs.hasSemanticContext) {
					let predPredictions: DFAState.PredPrediction[] | undefined = D.predicates;
					if (predPredictions != null) {
						let conflictIndex: number = input.index;
						if (conflictIndex !== startIndex) {
							input.seek(startIndex);
						}

						
						conflictingAlts = this.evalSemanticContext(predPredictions, outerContext, attemptFullContext || this.reportAmbiguities);
						switch (conflictingAlts.cardinality()) {
						case 0:
							throw this.noViableAlt(input, outerContext, D.configs, startIndex);

						case 1:
							return conflictingAlts.nextSetBit(0);

						default:
							break;
						}

						if (conflictIndex !== startIndex) {
							
							
							input.seek(conflictIndex);
						}
					}
				}

				if (!attemptFullContext) {
					if (conflictingAlts != null) {
						if (this.reportAmbiguities && conflictingAlts.cardinality() > 1) {
							this.reportAmbiguity(dfa, D, startIndex, input.index, D.configs.isExactConflict, conflictingAlts, D.configs);
						}

						predictedAlt = conflictingAlts.nextSetBit(0);
					}

					return predictedAlt;
				}
				else {
					assert(!useContext);
					assert(this.isAcceptState(D, false));

					if (ParserATNSimulator.debug) {
						console.log("RETRY with outerContext=" + outerContext);
					}
					let fullContextState: SimulatorState = this.computeStartState(dfa, outerContext, true);
					if (this.reportAmbiguities) {
						this.reportAttemptingFullContext(dfa, conflictingAlts, nextState, startIndex, input.index);
					}

					input.seek(startIndex);
					return this.execATN(dfa, input, startIndex, fullContextState);
				}
			}

			previous = nextState;

			if (t !== IntStream.EOF) {
				input.consume();
				t = input.LA(1);
			}
		}
	}

	
	protected handleNoViableAlt(@NotNull input: TokenStream, startIndex: number, @NotNull previous: SimulatorState): number {
		if (previous.s0 != null) {
			let alts: BitSet = new BitSet();
			let maxAlt: number = 0;
			for (let config of previous.s0.configs) {
				if (config.reachesIntoOuterContext || config.state instanceof RuleStopState) {
					alts.set(config.alt);
					maxAlt = Math.max(maxAlt, config.alt);
				}
			}

			switch (alts.cardinality()) {
			case 0:
				break;

			case 1:
				return alts.nextSetBit(0);

			default:
				if (!previous.s0.configs.hasSemanticContext) {
					
					
					return alts.nextSetBit(0);
				}

				
				let filteredConfigs: ATNConfigSet = new ATNConfigSet();
				for (let config of previous.s0.configs) {
					if (config.reachesIntoOuterContext || config.state instanceof RuleStopState) {
						filteredConfigs.add(config);
					}
				}

				
				let altToPred: SemanticContext[] | undefined = this.getPredsForAmbigAlts(alts, filteredConfigs, maxAlt);
				if (altToPred != null) {
					let predicates: DFAState.PredPrediction[] | undefined = this.getPredicatePredictions(alts, altToPred);
					if (predicates != null) {
						let stopIndex: number = input.index;
						try {
							input.seek(startIndex);
							let filteredAlts: BitSet = this.evalSemanticContext(predicates, previous.outerContext, false);
							if (!filteredAlts.isEmpty) {
								return filteredAlts.nextSetBit(0);
							}
						}
						finally {
							input.seek(stopIndex);
						}
					}
				}

				return alts.nextSetBit(0);
			}
		}

		throw this.noViableAlt(input, previous.outerContext, previous.s0.configs, startIndex);
	}

	protected computeReachSet(dfa: DFA, previous: SimulatorState, t: number, contextCache: PredictionContextCache): SimulatorState | undefined {
		let useContext: boolean = previous.useContext;
		let remainingGlobalContext: ParserRuleContext | undefined = previous.remainingOuterContext;

		let s: DFAState = previous.s0;
		if (useContext) {
			while (s.isContextSymbol(t)) {
				let next: DFAState | undefined;
				if (remainingGlobalContext != null) {
					remainingGlobalContext = this.skipTailCalls(remainingGlobalContext);
					next = s.getContextTarget(this.getReturnState(remainingGlobalContext));
				}

				if (next == null) {
					break;
				}

				assert(remainingGlobalContext != null);
				remainingGlobalContext = remainingGlobalContext.parent;
				s = next;
			}
		}

		assert(!this.isAcceptState(s, useContext));
		if (this.isAcceptState(s, useContext)) {
			return new SimulatorState(previous.outerContext, s, useContext, remainingGlobalContext);
		}

		let s0: DFAState = s;

		let target: DFAState | undefined = this.getExistingTargetState(s0, t);
		if (target == null) {
			let result: [DFAState, ParserRuleContext | undefined] = this.computeTargetState(dfa, s0, remainingGlobalContext, t, useContext, contextCache);
			target = result[0];
			remainingGlobalContext = result[1];
		}

		if (target === ATNSimulator.ERROR) {
			return undefined;
		}

		assert(!useContext || !target.configs.dipsIntoOuterContext);
		return new SimulatorState(previous.outerContext, target, useContext, remainingGlobalContext);
	}

	
	protected getExistingTargetState(@NotNull s: DFAState, t: number): DFAState | undefined {
		return s.getTarget(t);
	}

	
	@NotNull
	protected computeTargetState(@NotNull dfa: DFA, @NotNull s: DFAState, remainingGlobalContext: ParserRuleContext | undefined, t: number, useContext: boolean, contextCache: PredictionContextCache): [DFAState, ParserRuleContext | undefined] {
		let closureConfigs: ATNConfig[] = s.configs.toArray();
		let contextElements: IntegerList | undefined;
		let reach: ATNConfigSet = new ATNConfigSet();
		let stepIntoGlobal: boolean;
		do {
			let hasMoreContext: boolean = !useContext || remainingGlobalContext != null;
			if (!hasMoreContext) {
				reach.isOutermostConfigSet = true;
			}

			let reachIntermediate: ATNConfigSet = new ATNConfigSet();

			
			let skippedStopStates: ATNConfig[] | undefined;

			for (let c of closureConfigs) {
				if (ParserATNSimulator.debug) {
					console.log("testing " + this.getTokenName(t) + " at " + c.toString());
				}

				if (c.state instanceof RuleStopState) {
					assert(c.context.isEmpty);
					if (useContext && !c.reachesIntoOuterContext || t === IntStream.EOF) {
						if (skippedStopStates == null) {
							skippedStopStates = [];
						}

						skippedStopStates.push(c);
					}

					continue;
				}

				let n: number = c.state.numberOfOptimizedTransitions;
				for (let ti = 0; ti < n; ti++) {               
					let trans: Transition = c.state.getOptimizedTransition(ti);
					let target: ATNState | undefined = this.getReachableTarget(c, trans, t);
					if (target != null) {
						reachIntermediate.add(c.transform(target, false), contextCache);
					}
				}
			}

			
			if (this.optimize_unique_closure && skippedStopStates == null && t !== Token.EOF && reachIntermediate.uniqueAlt !== ATN.INVALID_ALT_NUMBER) {
				reachIntermediate.isOutermostConfigSet = reach.isOutermostConfigSet;
				reach = reachIntermediate;
				break;
			}

			
			let collectPredicates: boolean = false;
			let treatEofAsEpsilon: boolean = t === Token.EOF;
			this.closure(reachIntermediate, reach, collectPredicates, hasMoreContext, contextCache, treatEofAsEpsilon);
			stepIntoGlobal = reach.dipsIntoOuterContext;

			if (t === IntStream.EOF) {
				
				reach = this.removeAllConfigsNotInRuleStopState(reach, contextCache);
			}

			
			if (skippedStopStates != null && (!useContext || !PredictionMode.hasConfigInRuleStopState(reach))) {
				assert(skippedStopStates.length > 0);
				for (let c of skippedStopStates) {
					reach.add(c, contextCache);
				}
			}

			if (useContext && stepIntoGlobal) {
				reach.clear();

				
				remainingGlobalContext = remainingGlobalContext as ParserRuleContext;

				remainingGlobalContext = this.skipTailCalls(remainingGlobalContext);
				let nextContextElement: number = this.getReturnState(remainingGlobalContext);
				if (contextElements == null) {
					contextElements = new IntegerList();
				}

				if (remainingGlobalContext.isEmpty) {
					remainingGlobalContext = undefined;
				} else {
					remainingGlobalContext = remainingGlobalContext.parent;
				}

				contextElements.add(nextContextElement);
				if (nextContextElement !== PredictionContext.EMPTY_FULL_STATE_KEY) {
					for (let i = 0; i < closureConfigs.length; i++) {
						closureConfigs[i] = closureConfigs[i].appendContext(nextContextElement, contextCache);
					}
				}
			}
		} while (useContext && stepIntoGlobal);

		if (reach.isEmpty) {
			this.setDFAEdge(s, t, ATNSimulator.ERROR);
			return [ATNSimulator.ERROR, remainingGlobalContext];
		}

		let result: DFAState = this.addDFAEdge(dfa, s, t, contextElements, reach, contextCache);
		return [result, remainingGlobalContext];
	}

	
	@NotNull
	protected removeAllConfigsNotInRuleStopState(@NotNull configs: ATNConfigSet, contextCache: PredictionContextCache): ATNConfigSet {
		if (PredictionMode.allConfigsInRuleStopStates(configs)) {
			return configs;
		}

		let result: ATNConfigSet = new ATNConfigSet();
		for (let config of configs) {
			if (!(config.state instanceof RuleStopState)) {
				continue;
			}

			result.add(config, contextCache);
		}

		return result;
	}

	@NotNull
	protected computeStartState(
		dfa: DFA,
		globalContext: ParserRuleContext,
		useContext: boolean): SimulatorState {
		let s0: DFAState | undefined =
			dfa.isPrecedenceDfa ? dfa.getPrecedenceStartState(this._parser.precedence, useContext) :
				useContext ? dfa.s0full :
					dfa.s0;

		if (s0 != null) {
			if (!useContext) {
				return new SimulatorState(globalContext, s0, useContext, globalContext);
			}

			s0.setContextSensitive(this.atn);
		}

		let decision: number = dfa.decision;
		
		let p: ATNState = dfa.atnStartState;

		let previousContext: number = 0;
		let remainingGlobalContext: ParserRuleContext | undefined = globalContext;
		let initialContext: PredictionContext = useContext ? PredictionContext.EMPTY_FULL : PredictionContext.EMPTY_LOCAL; 
		let contextCache: PredictionContextCache = new PredictionContextCache();
		if (useContext) {
			if (!this.enable_global_context_dfa) {
				while (remainingGlobalContext != null) {
					if (remainingGlobalContext.isEmpty) {
						previousContext = PredictionContext.EMPTY_FULL_STATE_KEY;
						remainingGlobalContext = undefined;
					}
					else {
						previousContext = this.getReturnState(remainingGlobalContext);
						initialContext = initialContext.appendSingleContext(previousContext, contextCache);
						remainingGlobalContext = remainingGlobalContext.parent;
					}
				}
			}

			while (s0 != null && s0.isContextSensitive && remainingGlobalContext != null) {
				let next: DFAState | undefined;
				remainingGlobalContext = this.skipTailCalls(remainingGlobalContext);
				if (remainingGlobalContext.isEmpty) {
					next = s0.getContextTarget(PredictionContext.EMPTY_FULL_STATE_KEY);
					previousContext = PredictionContext.EMPTY_FULL_STATE_KEY;
					remainingGlobalContext = undefined;
				}
				else {
					previousContext = this.getReturnState(remainingGlobalContext);
					next = s0.getContextTarget(previousContext);
					initialContext = initialContext.appendSingleContext(previousContext, contextCache);
					remainingGlobalContext = remainingGlobalContext.parent;
				}

				if (next == null) {
					break;
				}

				s0 = next;
			}
		}

		if (s0 != null && !s0.isContextSensitive) {
			return new SimulatorState(globalContext, s0, useContext, remainingGlobalContext);
		}

		let configs: ATNConfigSet = new ATNConfigSet();
		while (true) {
			let reachIntermediate: ATNConfigSet = new ATNConfigSet();
			let n: number = p.numberOfTransitions;
			for (let ti = 0; ti < n; ti++) {
				
				let target: ATNState = p.transition(ti).target;
				reachIntermediate.add(ATNConfig.create(target, ti + 1, initialContext));
			}

			let hasMoreContext: boolean = remainingGlobalContext != null;
			if (!hasMoreContext) {
				configs.isOutermostConfigSet = true;
			}

			let collectPredicates: boolean = true;
			this.closure(reachIntermediate, configs, collectPredicates, hasMoreContext, contextCache, false);
			let stepIntoGlobal: boolean = configs.dipsIntoOuterContext;

			let next: DFAState;
			if (useContext && !this.enable_global_context_dfa) {
				s0 = this.addDFAState(dfa, configs, contextCache);
				break;
			}
			else if (s0 == null) {
				if (!dfa.isPrecedenceDfa) {
					next = this.addDFAState(dfa, configs, contextCache);
					if (useContext) {
						if (!dfa.s0full) {
							dfa.s0full = next;
						} else {
							next = dfa.s0full;
						}
					} else {
						if (!dfa.s0) {
							dfa.s0 = next;
						} else {
							next = dfa.s0;
						}
					}
				}
				else {
					
					configs = this.applyPrecedenceFilter(configs, globalContext, contextCache);
					next = this.addDFAState(dfa, configs, contextCache);
					dfa.setPrecedenceStartState(this._parser.precedence, useContext, next);
				}
			}
			else {
				if (dfa.isPrecedenceDfa) {
					configs = this.applyPrecedenceFilter(configs, globalContext, contextCache);
				}

				next = this.addDFAState(dfa, configs, contextCache);
				s0.setContextTarget(previousContext, next);
			}

			s0 = next;

			if (!useContext || !stepIntoGlobal) {
				break;
			}

			
			next.setContextSensitive(this.atn);

			
			remainingGlobalContext = remainingGlobalContext as ParserRuleContext;

			configs.clear();
			remainingGlobalContext = this.skipTailCalls(remainingGlobalContext);
			let nextContextElement: number = this.getReturnState(remainingGlobalContext);

			if (remainingGlobalContext.isEmpty) {
				remainingGlobalContext = undefined;
			} else {
				remainingGlobalContext = remainingGlobalContext.parent;
			}

			if (nextContextElement !== PredictionContext.EMPTY_FULL_STATE_KEY) {
				initialContext = initialContext.appendSingleContext(nextContextElement, contextCache);
			}

			previousContext = nextContextElement;
		}

		return new SimulatorState(globalContext, s0, useContext, remainingGlobalContext);
	}

	
	@NotNull
	protected applyPrecedenceFilter(@NotNull configs: ATNConfigSet, globalContext: ParserRuleContext, contextCache: PredictionContextCache): ATNConfigSet {
		let statesFromAlt1: Map<number, PredictionContext> = new Map<number, PredictionContext>();
		let configSet: ATNConfigSet = new ATNConfigSet();
		for (let config of configs) {
			
			if (config.alt !== 1) {
				continue;
			}

			let updatedContext: SemanticContext | undefined = config.semanticContext.evalPrecedence(this._parser, globalContext);
			if (updatedContext == null) {
				
				continue;
			}

			statesFromAlt1.set(config.state.stateNumber, config.context);
			if (updatedContext !== config.semanticContext) {
				configSet.add(config.transform(config.state, false, updatedContext), contextCache);
			}
			else {
				configSet.add(config, contextCache);
			}
		}

		for (let config of configs) {
			if (config.alt === 1) {
				
				continue;
			}

			if (!config.isPrecedenceFilterSuppressed) {
				
				let context: PredictionContext | undefined = statesFromAlt1.get(config.state.stateNumber);
				if (context != null && context.equals(config.context)) {
					
					continue;
				}
			}

			configSet.add(config, contextCache);
		}

		return configSet;
	}

	protected getReachableTarget(@NotNull source: ATNConfig, @NotNull trans: Transition, ttype: number): ATNState | undefined {
		if (trans.matches(ttype, 0, this.atn.maxTokenType)) {
			return trans.target;
		}

		return undefined;
	}

	
	protected predicateDFAState(
		D: DFAState,
		configs: ATNConfigSet,
		nalts: number): DFAState.PredPrediction[] | undefined {
		let conflictingAlts: BitSet | undefined = this.getConflictingAltsFromConfigSet(configs);
		if (!conflictingAlts) {
			throw new Error("This unhandled scenario is intended to be unreachable, but I'm currently not sure of why we know that's the case.");
		}

		if (ParserATNSimulator.debug) {
			console.log("predicateDFAState " + D);
		}
		let altToPred: SemanticContext[] | undefined = this.getPredsForAmbigAlts(conflictingAlts, configs, nalts);
		
		let predPredictions: DFAState.PredPrediction[] | undefined;
		if (altToPred != null) {
			
			
			predPredictions = this.getPredicatePredictions(conflictingAlts, altToPred);
			D.predicates = predPredictions;
		}
		return predPredictions;
	}

	protected getPredsForAmbigAlts(
		@NotNull ambigAlts: BitSet,
		@NotNull configs: ATNConfigSet,
		nalts: number): SemanticContext[] | undefined {
		

		
		let altToPred: Array<SemanticContext | undefined> | undefined = new Array<SemanticContext>(nalts + 1);
		let n: number = altToPred.length;
		for (let c of configs) {
			if (ambigAlts.get(c.alt)) {
				altToPred[c.alt] = SemanticContext.or(altToPred[c.alt], c.semanticContext);
			}
		}

		let nPredAlts: number = 0;
		for (let i = 0; i < n; i++) {
			if (altToPred[i] == null) {
				altToPred[i] = SemanticContext.NONE;
			}
			else if (altToPred[i] !== SemanticContext.NONE) {
				nPredAlts++;
			}
		}

		
		let result: SemanticContext[] | undefined = altToPred as SemanticContext[];

		
		if (nPredAlts === 0) {
			result = undefined;
		}
		if (ParserATNSimulator.debug) {
			console.log("getPredsForAmbigAlts result " + (result ? Arrays.toString(result) : "undefined"));
		}
		return result;
	}

	protected getPredicatePredictions(ambigAlts: BitSet | undefined, altToPred: SemanticContext[]): DFAState.PredPrediction[] | undefined {
		let pairs: DFAState.PredPrediction[] = [];
		let containsPredicate: boolean = false;
		for (let i = 1; i < altToPred.length; i++) {
			let pred: SemanticContext = altToPred[i];

			
			assert(pred != null);

			
			
			
			
			
			if (ambigAlts != null && ambigAlts.get(i) && pred === SemanticContext.NONE) {
				pairs.push(new DFAState.PredPrediction(pred, i));
			}
			else if (pred !== SemanticContext.NONE) {
				containsPredicate = true;
				pairs.push(new DFAState.PredPrediction(pred, i));
			}
		}

		if (!containsPredicate) {
			return undefined;
		}


		return pairs;
	}

	
	protected evalSemanticContext(
		@NotNull predPredictions: DFAState.PredPrediction[],
		outerContext: ParserRuleContext,
		complete: boolean): BitSet {
		let predictions: BitSet = new BitSet();
		for (let pair of predPredictions) {
			if (pair.pred === SemanticContext.NONE) {
				predictions.set(pair.alt);
				if (!complete) {
					break;
				}

				continue;
			}

			let evaluatedResult: boolean = this.evalSemanticContextImpl(pair.pred, outerContext, pair.alt);
			if (ParserATNSimulator.debug || ParserATNSimulator.dfa_debug) {
				console.log("eval pred " + pair + "=" + evaluatedResult);
			}

			if (evaluatedResult) {
				if (ParserATNSimulator.debug || ParserATNSimulator.dfa_debug) {
					console.log("PREDICT " + pair.alt);
				}
				predictions.set(pair.alt);
				if (!complete) {
					break;
				}
			}
		}

		return predictions;
	}

	
	protected evalSemanticContextImpl(@NotNull pred: SemanticContext, parserCallStack: ParserRuleContext, alt: number): boolean {
		return pred.eval(this._parser, parserCallStack);
	}

	

	protected closure(
		sourceConfigs: ATNConfigSet,
		@NotNull configs: ATNConfigSet,
		collectPredicates: boolean,
		hasMoreContext: boolean,
		@Nullable contextCache: PredictionContextCache,
		treatEofAsEpsilon: boolean): void {
		if (contextCache == null) {
			contextCache = PredictionContextCache.UNCACHED;
		}

		let currentConfigs: ATNConfigSet = sourceConfigs;
		let closureBusy: Array2DHashSet<ATNConfig> = new Array2DHashSet<ATNConfig>(ObjectEqualityComparator.INSTANCE);
		while (currentConfigs.size > 0) {
			let intermediate: ATNConfigSet = new ATNConfigSet();
			for (let config of currentConfigs) {
				this.closureImpl(config, configs, intermediate, closureBusy, collectPredicates, hasMoreContext, contextCache, 0, treatEofAsEpsilon);
			}

			currentConfigs = intermediate;
		}
	}

	protected closureImpl(
		@NotNull config: ATNConfig,
		@NotNull configs: ATNConfigSet,
		@Nullable intermediate: ATNConfigSet,
		@NotNull closureBusy: Array2DHashSet<ATNConfig>,
		collectPredicates: boolean,
		hasMoreContexts: boolean,
		@NotNull contextCache: PredictionContextCache,
		depth: number,
		treatEofAsEpsilon: boolean): void {
		if (ParserATNSimulator.debug) {
			console.log("closure(" + config.toString(this._parser, true) + ")");
		}

		if (config.state instanceof RuleStopState) {
			
			if (!config.context.isEmpty) {
				let hasEmpty: boolean = config.context.hasEmpty;
				let nonEmptySize: number = config.context.size - (hasEmpty ? 1 : 0);
				for (let i = 0; i < nonEmptySize; i++) {
					let newContext: PredictionContext = config.context.getParent(i); 
					let returnState: ATNState = this.atn.states[config.context.getReturnState(i)];
					let c: ATNConfig = ATNConfig.create(returnState, config.alt, newContext, config.semanticContext);
					
					
					
					c.outerContextDepth = config.outerContextDepth;
					c.isPrecedenceFilterSuppressed = config.isPrecedenceFilterSuppressed;
					assert(depth > MIN_INTEGER_VALUE);
					this.closureImpl(c, configs, intermediate, closureBusy, collectPredicates, hasMoreContexts, contextCache, depth - 1, treatEofAsEpsilon);
				}

				if (!hasEmpty || !hasMoreContexts) {
					return;
				}

				config = config.transform(config.state, false, PredictionContext.EMPTY_LOCAL);
			}
			else if (!hasMoreContexts) {
				configs.add(config, contextCache);
				return;
			}
			else {
				
				if (ParserATNSimulator.debug) {
					console.log("FALLING off rule " +
						this.getRuleName(config.state.ruleIndex));
				}

				if (config.context === PredictionContext.EMPTY_FULL) {
					
					config = config.transform(config.state, false, PredictionContext.EMPTY_LOCAL);
				}
				else if (!config.reachesIntoOuterContext && PredictionContext.isEmptyLocal(config.context)) {
					
					configs.add(config, contextCache);
				}
			}
		}

		let p: ATNState = config.state;
		
		if (!p.onlyHasEpsilonTransitions) {
			configs.add(config, contextCache);
			
			
			if (ParserATNSimulator.debug) {
				console.log("added config " + configs);
			}
		}

		for (let i = 0; i < p.numberOfOptimizedTransitions; i++) {
			
			
			
			if (i === 0
				&& p.stateType === ATNStateType.STAR_LOOP_ENTRY
				&& (p as StarLoopEntryState).precedenceRuleDecision
				&& !config.context.hasEmpty) {

				let precedenceDecision = p as StarLoopEntryState;

				
				
				
				
				let suppress: boolean = true;
				for (let j: number = 0; j < config.context.size; j++) {
					if (!precedenceDecision.precedenceLoopbackStates.get(config.context.getReturnState(j))) {
						suppress = false;
						break;
					}
				}

				if (suppress) {
					continue;
				}
			}

			let t: Transition = p.getOptimizedTransition(i);
			let continueCollecting: boolean =
				!(t instanceof ActionTransition) && collectPredicates;
			let c: ATNConfig | undefined = this.getEpsilonTarget(config, t, continueCollecting, depth === 0, contextCache, treatEofAsEpsilon);
			if (c != null) {
				if (t instanceof RuleTransition) {
					if (intermediate != null && !collectPredicates) {
						intermediate.add(c, contextCache);
						continue;
					}
				}

				let newDepth: number = depth;
				if (config.state instanceof RuleStopState) {
					
					
					
					
					

					if (this.dfa != null && this.dfa.isPrecedenceDfa) {
						let outermostPrecedenceReturn: number = (t as EpsilonTransition).outermostPrecedenceReturn;
						if (outermostPrecedenceReturn === this.dfa.atnStartState.ruleIndex) {
							c.isPrecedenceFilterSuppressed = true;
						}
					}

					c.outerContextDepth = c.outerContextDepth + 1;

					if (!closureBusy.add(c)) {
						
						continue;
					}

					assert(newDepth > MIN_INTEGER_VALUE);
					newDepth--;
					if (ParserATNSimulator.debug) {
						console.log("dips into outer ctx: " + c);
					}
				}
				else if (t instanceof RuleTransition) {
					if (this.optimize_tail_calls && t.optimizedTailCall && (!this.tail_call_preserves_sll || !PredictionContext.isEmptyLocal(config.context))) {
						assert(c.context === config.context);
						if (newDepth === 0) {
							
							
							newDepth--;
							if (!this.tail_call_preserves_sll && PredictionContext.isEmptyLocal(config.context)) {
								
								c.outerContextDepth = c.outerContextDepth + 1;
							}
						}
					}
					else {
						
						if (newDepth >= 0) {
							newDepth++;
						}
					}
				}
				else {
					if (!t.isEpsilon && !closureBusy.add(c)) {
						
						continue;
					}
				}

				this.closureImpl(c, configs, intermediate, closureBusy, continueCollecting, hasMoreContexts, contextCache, newDepth, treatEofAsEpsilon);
			}
		}
	}

	@NotNull
	public getRuleName(index: number): string {
		if (this._parser != null && index >= 0) {
			return this._parser.ruleNames[index];
		}
		return "<rule " + index + ">";
	}

	protected getEpsilonTarget(@NotNull config: ATNConfig, @NotNull t: Transition, collectPredicates: boolean, inContext: boolean, contextCache: PredictionContextCache, treatEofAsEpsilon: boolean): ATNConfig | undefined {
		switch (t.serializationType) {
		case TransitionType.RULE:
			return this.ruleTransition(config, t as RuleTransition, contextCache);

		case TransitionType.PRECEDENCE:
			return this.precedenceTransition(config, t as PrecedencePredicateTransition, collectPredicates, inContext);

		case TransitionType.PREDICATE:
			return this.predTransition(config, t as PredicateTransition, collectPredicates, inContext);

		case TransitionType.ACTION:
			return this.actionTransition(config, t as ActionTransition);

		case TransitionType.EPSILON:
			return config.transform(t.target, false);

		case TransitionType.ATOM:
		case TransitionType.RANGE:
		case TransitionType.SET:
			
			
			if (treatEofAsEpsilon) {
				if (t.matches(Token.EOF, 0, 1)) {
					return config.transform(t.target, false);
				}
			}

			return undefined;

		default:
			return undefined;
		}
	}

	@NotNull
	protected actionTransition(@NotNull config: ATNConfig, @NotNull t: ActionTransition): ATNConfig {
		if (ParserATNSimulator.debug) {
			console.log("ACTION edge " + t.ruleIndex + ":" + t.actionIndex);
		}
		return config.transform(t.target, false);
	}

	@Nullable
	protected precedenceTransition(
		@NotNull config: ATNConfig,
		@NotNull pt: PrecedencePredicateTransition,
		collectPredicates: boolean,
		inContext: boolean): ATNConfig {
		if (ParserATNSimulator.debug) {
			console.log("PRED (collectPredicates=" + collectPredicates + ") " +
				pt.precedence + ">=_p" +
				", ctx dependent=true");
			if (this._parser != null) {
				console.log("context surrounding pred is " +
					this._parser.getRuleInvocationStack());
			}
		}

		let c: ATNConfig;
		if (collectPredicates && inContext) {
			let newSemCtx: SemanticContext = SemanticContext.and(config.semanticContext, pt.predicate);
			c = config.transform(pt.target, false, newSemCtx);
		}
		else {
			c = config.transform(pt.target, false);
		}

		if (ParserATNSimulator.debug) {
			console.log("config from pred transition=" + c);
		}
		return c;
	}

	@Nullable
	protected predTransition(
		@NotNull config: ATNConfig,
		@NotNull pt: PredicateTransition,
		collectPredicates: boolean,
		inContext: boolean): ATNConfig {
		if (ParserATNSimulator.debug) {
			console.log("PRED (collectPredicates=" + collectPredicates + ") " +
				pt.ruleIndex + ":" + pt.predIndex +
				", ctx dependent=" + pt.isCtxDependent);
			if (this._parser != null) {
				console.log("context surrounding pred is " +
					this._parser.getRuleInvocationStack());
			}
		}

		let c: ATNConfig;
		if (collectPredicates &&
			(!pt.isCtxDependent || (pt.isCtxDependent && inContext))) {
			let newSemCtx: SemanticContext = SemanticContext.and(config.semanticContext, pt.predicate);
			c = config.transform(pt.target, false, newSemCtx);
		}
		else {
			c = config.transform(pt.target, false);
		}

		if (ParserATNSimulator.debug) {
			console.log("config from pred transition=" + c);
		}
		return c;
	}

	@NotNull
	protected ruleTransition(@NotNull config: ATNConfig, @NotNull t: RuleTransition, @Nullable contextCache: PredictionContextCache): ATNConfig {
		if (ParserATNSimulator.debug) {
			console.log("CALL rule " + this.getRuleName(t.target.ruleIndex) +
				", ctx=" + config.context);
		}

		let returnState: ATNState = t.followState;
		let newContext: PredictionContext;

		if (this.optimize_tail_calls && t.optimizedTailCall && (!this.tail_call_preserves_sll || !PredictionContext.isEmptyLocal(config.context))) {
			newContext = config.context;
		}
		else if (contextCache != null) {
			newContext = contextCache.getChild(config.context, returnState.stateNumber);
		}
		else {
			newContext = config.context.getChild(returnState.stateNumber);
		}

		return config.transform(t.target, false, newContext);
	}

	private static STATE_ALT_SORT_COMPARATOR: (o1: ATNConfig, o2: ATNConfig) => number =
		(o1: ATNConfig, o2: ATNConfig): number => {
			let diff: number = o1.state.nonStopStateNumber - o2.state.nonStopStateNumber;
			if (diff !== 0) {
				return diff;
			}

			diff = o1.alt - o2.alt;
			if (diff !== 0) {
				return diff;
			}

			return 0;
		}

	private isConflicted(@NotNull configset: ATNConfigSet, contextCache: PredictionContextCache): ConflictInfo | undefined {
		if (configset.uniqueAlt !== ATN.INVALID_ALT_NUMBER || configset.size <= 1) {
			return undefined;
		}

		let configs: ATNConfig[] = configset.toArray();
		configs.sort(ParserATNSimulator.STATE_ALT_SORT_COMPARATOR);

		let exact: boolean = !configset.dipsIntoOuterContext;
		let alts: BitSet = new BitSet();
		let minAlt: number = configs[0].alt;
		alts.set(minAlt);

		

		
		
		
		let currentState: number = configs[0].state.nonStopStateNumber;
		for (let config of configs) {
			let stateNumber: number = config.state.nonStopStateNumber;
			if (stateNumber !== currentState) {
				if (config.alt !== minAlt) {
					return undefined;
				}

				currentState = stateNumber;
			}
		}

		let representedAlts: BitSet;
		if (exact) {
			currentState = configs[0].state.nonStopStateNumber;

			
			representedAlts = new BitSet();
			let maxAlt: number = minAlt;
			for (let config of configs) {
				if (config.state.nonStopStateNumber !== currentState) {
					break;
				}

				let alt: number = config.alt;
				representedAlts.set(alt);
				maxAlt = alt;
			}

			
			currentState = configs[0].state.nonStopStateNumber;
			let currentAlt: number = minAlt;
			for (let config of configs) {
				let stateNumber: number = config.state.nonStopStateNumber;
				let alt: number = config.alt;
				if (stateNumber !== currentState) {
					if (currentAlt !== maxAlt) {
						exact = false;
						break;
					}

					currentState = stateNumber;
					currentAlt = minAlt;
				}
				else if (alt !== currentAlt) {
					if (alt !== representedAlts.nextSetBit(currentAlt + 1)) {
						exact = false;
						break;
					}

					currentAlt = alt;
				}
			}
		}

		currentState = configs[0].state.nonStopStateNumber;
		let firstIndexCurrentState: number = 0;
		let lastIndexCurrentStateMinAlt: number = 0;
		let joinedCheckContext: PredictionContext = configs[0].context;
		for (let i = 1; i < configs.length; i++) {
			let config: ATNConfig = configs[i];
			if (config.alt !== minAlt) {
				break;
			}

			if (config.state.nonStopStateNumber !== currentState) {
				break;
			}

			lastIndexCurrentStateMinAlt = i;
			joinedCheckContext = contextCache.join(joinedCheckContext, configs[i].context);
		}

		for (let i = lastIndexCurrentStateMinAlt + 1; i < configs.length; i++) {
			let config: ATNConfig = configs[i];
			let state: ATNState = config.state;
			alts.set(config.alt);
			if (state.nonStopStateNumber !== currentState) {
				currentState = state.nonStopStateNumber;
				firstIndexCurrentState = i;
				lastIndexCurrentStateMinAlt = i;
				joinedCheckContext = config.context;
				for (let j = firstIndexCurrentState + 1; j < configs.length; j++) {
					let config2: ATNConfig = configs[j];
					if (config2.alt !== minAlt) {
						break;
					}

					if (config2.state.nonStopStateNumber !== currentState) {
						break;
					}

					lastIndexCurrentStateMinAlt = j;
					joinedCheckContext = contextCache.join(joinedCheckContext, config2.context);
				}

				i = lastIndexCurrentStateMinAlt;
				continue;
			}

			let joinedCheckContext2: PredictionContext = config.context;
			let currentAlt: number = config.alt;
			let lastIndexCurrentStateCurrentAlt: number = i;
			for (let j = lastIndexCurrentStateCurrentAlt + 1; j < configs.length; j++) {
				let config2: ATNConfig = configs[j];
				if (config2.alt !== currentAlt) {
					break;
				}

				if (config2.state.nonStopStateNumber !== currentState) {
					break;
				}

				lastIndexCurrentStateCurrentAlt = j;
				joinedCheckContext2 = contextCache.join(joinedCheckContext2, config2.context);
			}

			i = lastIndexCurrentStateCurrentAlt;

			let check: PredictionContext = contextCache.join(joinedCheckContext, joinedCheckContext2);
			if (!joinedCheckContext.equals(check)) {
				return undefined;
			}

			
			exact = exact && joinedCheckContext.equals(joinedCheckContext2);
		}

		return new ConflictInfo(alts, exact);
	}

	protected getConflictingAltsFromConfigSet(configs: ATNConfigSet): BitSet | undefined {
		let conflictingAlts: BitSet | undefined = configs.conflictingAlts;
		if (conflictingAlts == null && configs.uniqueAlt !== ATN.INVALID_ALT_NUMBER) {
			conflictingAlts = new BitSet();
			conflictingAlts.set(configs.uniqueAlt);
		}

		return conflictingAlts;
	}

	@NotNull
	public getTokenName(t: number): string {
		if (t === Token.EOF) {
			return "EOF";
		}

		let vocabulary: Vocabulary = this._parser != null ? this._parser.vocabulary : VocabularyImpl.EMPTY_VOCABULARY;
		let displayName: string = vocabulary.getDisplayName(t);
		if (displayName === String(t)) {
			return displayName;
		}

		return displayName + "<" + t + ">";
	}

	public getLookaheadName(input: TokenStream): string {
		return this.getTokenName(input.LA(1));
	}

	public dumpDeadEndConfigs(@NotNull nvae: NoViableAltException): void {
		console.log("dead end configs: ");
		let deadEndConfigs = nvae.deadEndConfigs;
		if (!deadEndConfigs) {
			return;
		}

		for (let c of deadEndConfigs) {
			let trans: string = "no edges";
			if (c.state.numberOfOptimizedTransitions > 0) {
				let t: Transition = c.state.getOptimizedTransition(0);
				if (t instanceof AtomTransition) {
					trans = "Atom " + this.getTokenName(t._label);
				}
				else if (t instanceof SetTransition) {
					let not: boolean = t instanceof NotSetTransition;
					trans = (not ? "~" : "") + "Set " + t.set.toString();
				}
			}
			console.log(c.toString(this._parser, true) + ":" + trans);
		}
	}

	@NotNull
	protected noViableAlt(
		@NotNull input: TokenStream,
		@NotNull outerContext: ParserRuleContext,
		@NotNull configs: ATNConfigSet,
		startIndex: number): NoViableAltException {
		return new NoViableAltException(this._parser, input,
			input.get(startIndex),
			input.LT(1),
			configs, outerContext);
	}

	protected getUniqueAlt(@NotNull configs: Iterable<ATNConfig>): number {
		let alt: number = ATN.INVALID_ALT_NUMBER;
		for (let c of configs) {
			if (alt === ATN.INVALID_ALT_NUMBER) {
				alt = c.alt; 
			}
			else if (c.alt !== alt) {
				return ATN.INVALID_ALT_NUMBER;
			}
		}
		return alt;
	}

	protected configWithAltAtStopState(@NotNull configs: Iterable<ATNConfig>, alt: number): boolean {
		for (let c of configs) {
			if (c.alt === alt) {
				if (c.state instanceof RuleStopState) {
					return true;
				}
			}
		}
		return false;
	}

	@NotNull
	protected addDFAEdge(
		@NotNull dfa: DFA,
		@NotNull fromState: DFAState,
		t: number,
		contextTransitions: IntegerList | undefined,
		@NotNull toConfigs: ATNConfigSet,
		contextCache: PredictionContextCache): DFAState {
		assert(contextTransitions == null || contextTransitions.isEmpty || dfa.isContextSensitive);

		let from: DFAState = fromState;
		let to: DFAState = this.addDFAState(dfa, toConfigs, contextCache);

		if (contextTransitions != null) {
			for (let context of contextTransitions.toArray()) {
				if (context === PredictionContext.EMPTY_FULL_STATE_KEY) {
					if (from.configs.isOutermostConfigSet) {
						continue;
					}
				}

				from.setContextSensitive(this.atn);
				from.setContextSymbol(t);
				let next: DFAState | undefined = from.getContextTarget(context);
				if (next != null) {
					from = next;
					continue;
				}

				next = this.addDFAContextState(dfa, from.configs, context, contextCache);
				assert(context !== PredictionContext.EMPTY_FULL_STATE_KEY || next.configs.isOutermostConfigSet);
				from.setContextTarget(context, next);
				from = next;
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("EDGE " + from + " -> " + to + " upon " + this.getTokenName(t));
		}
		this.setDFAEdge(from, t, to);
		if (ParserATNSimulator.debug) {
			console.log("DFA=\n" + dfa.toString(this._parser != null ? this._parser.vocabulary : VocabularyImpl.EMPTY_VOCABULARY, this._parser != null ? this._parser.ruleNames : undefined));
		}
		return to;
	}

	protected setDFAEdge(@Nullable p: DFAState, t: number, @Nullable q: DFAState): void {
		if (p != null) {
			p.setTarget(t, q);
		}
	}

	
	@NotNull
	protected addDFAContextState(@NotNull dfa: DFA, @NotNull configs: ATNConfigSet, returnContext: number, contextCache: PredictionContextCache): DFAState {
		if (returnContext !== PredictionContext.EMPTY_FULL_STATE_KEY) {
			let contextConfigs: ATNConfigSet = new ATNConfigSet();
			for (let config of configs) {
				contextConfigs.add(config.appendContext(returnContext, contextCache));
			}

			return this.addDFAState(dfa, contextConfigs, contextCache);
		}
		else {
			assert(!configs.isOutermostConfigSet, "Shouldn't be adding a duplicate edge.");
			configs = configs.clone(true);
			configs.isOutermostConfigSet = true;
			return this.addDFAState(dfa, configs, contextCache);
		}
	}

	
	@NotNull
	protected addDFAState(@NotNull dfa: DFA, @NotNull configs: ATNConfigSet, contextCache: PredictionContextCache): DFAState {
		let enableDfa: boolean = this.enable_global_context_dfa || !configs.isOutermostConfigSet;
		if (enableDfa) {
			if (!configs.isReadOnly) {
				configs.optimizeConfigs(this);
			}

			let proposed: DFAState = this.createDFAState(dfa, configs);
			let existing: DFAState | undefined = dfa.states.get(proposed);
			if (existing != null) {
				return existing;
			}
		}

		if (!configs.isReadOnly) {
			if (configs.conflictInfo == null) {
				configs.conflictInfo = this.isConflicted(configs, contextCache);
			}
		}

		let newState: DFAState = this.createDFAState(dfa, configs.clone(true));
		
		let decisionState: DecisionState = this.atn.getDecisionState(dfa.decision) as DecisionState;
		let predictedAlt: number = this.getUniqueAlt(configs);
		if (predictedAlt !== ATN.INVALID_ALT_NUMBER) {
			newState.acceptStateInfo = new AcceptStateInfo(predictedAlt);
		} else if (configs.conflictingAlts != null) {
			let conflictingAlts = configs.conflictingAlts;
			if (conflictingAlts) {
				newState.acceptStateInfo = new AcceptStateInfo(conflictingAlts.nextSetBit(0));
			}
		}

		if (newState.isAcceptState && configs.hasSemanticContext) {
			this.predicateDFAState(newState, configs, decisionState.numberOfTransitions);
		}

		if (!enableDfa) {
			return newState;
		}

		let added: DFAState = dfa.addState(newState);
		if (ParserATNSimulator.debug && added === newState) {
			console.log("adding new DFA state: " + newState);
		}
		return added;
	}

	@NotNull
	protected createDFAState(@NotNull dfa: DFA, @NotNull configs: ATNConfigSet): DFAState {
		return new DFAState(configs);
	}

	protected reportAttemptingFullContext(@NotNull dfa: DFA, conflictingAlts: BitSet | undefined, @NotNull conflictState: SimulatorState, startIndex: number, stopIndex: number): void {
		if (ParserATNSimulator.debug || ParserATNSimulator.retry_debug) {
			let interval: Interval = Interval.of(startIndex, stopIndex);
			console.log("reportAttemptingFullContext decision=" + dfa.decision + ":" + conflictState.s0.configs +
				", input=" + this._parser.inputStream.getText(interval));
		}
		if (this._parser != null) {
			let listener = this._parser.getErrorListenerDispatch();
			if (listener.reportAttemptingFullContext) {
				listener.reportAttemptingFullContext(this._parser, dfa, startIndex, stopIndex, conflictingAlts, conflictState);
			}
		}
	}

	protected reportContextSensitivity(@NotNull dfa: DFA, prediction: number, @NotNull acceptState: SimulatorState, startIndex: number, stopIndex: number): void {
		if (ParserATNSimulator.debug || ParserATNSimulator.retry_debug) {
			let interval: Interval = Interval.of(startIndex, stopIndex);
			console.log("reportContextSensitivity decision=" + dfa.decision + ":" + acceptState.s0.configs +
				", input=" + this._parser.inputStream.getText(interval));
		}
		if (this._parser != null) {
			let listener = this._parser.getErrorListenerDispatch();
			if (listener.reportContextSensitivity) {
				listener.reportContextSensitivity(this._parser, dfa, startIndex, stopIndex, prediction, acceptState);
			}
		}
	}

	
	protected reportAmbiguity(
		@NotNull dfa: DFA,
		D: DFAState,  
		startIndex: number,
		stopIndex: number,
		exact: boolean,
		@NotNull ambigAlts: BitSet,
		@NotNull configs: ATNConfigSet) 
	{
		if (ParserATNSimulator.debug || ParserATNSimulator.retry_debug) {
			let interval: Interval = Interval.of(startIndex, stopIndex);
			console.log("reportAmbiguity " +
				ambigAlts + ":" + configs +
				", input=" + this._parser.inputStream.getText(interval));
		}
		if (this._parser != null) {
			let listener = this._parser.getErrorListenerDispatch();
			if (listener.reportAmbiguity) {
				listener.reportAmbiguity(this._parser, dfa, startIndex, stopIndex, exact, ambigAlts, configs);
			}
		}
	}

	protected getReturnState(context: RuleContext): number {
		if (context.isEmpty) {
			return PredictionContext.EMPTY_FULL_STATE_KEY;
		}

		let state: ATNState = this.atn.states[context.invokingState];
		let transition: RuleTransition = state.transition(0) as RuleTransition;
		return transition.followState.stateNumber;
	}

	protected skipTailCalls(context: ParserRuleContext): ParserRuleContext {
		if (!this.optimize_tail_calls) {
			return context;
		}

		while (!context.isEmpty) {
			let state: ATNState = this.atn.states[context.invokingState];
			assert(state.numberOfTransitions === 1 && state.transition(0).serializationType === TransitionType.RULE);
			let transition: RuleTransition = state.transition(0) as RuleTransition;
			if (!transition.tailCall) {
				break;
			}

			
			
			context = context.parent as ParserRuleContext;
		}

		return context;
	}

	
	get parser(): Parser {
		return this._parser;
	}
}
