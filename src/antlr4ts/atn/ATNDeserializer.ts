




import { Transition } from "./transition/Transition";
import { TransitionType } from "./transition/TransitionType";
import { UUID } from "../misc/UUID";
import { WildcardTransition } from "./transition/WildcardTransition";
import { NotNull } from "../Decorators";
import { DFA } from "../dfa";
import { IntervalSet, Array2DHashSet, BitSet, Interval } from "../misc";
import { Token } from "../Token";
import { LexerAction } from "./action/LexerAction";
import { LexerActionType } from "./action/LexerActionType";
import { LexerChannelAction } from "./action/LexerChannelAction";
import { LexerCustomAction } from "./action/LexerCustomAction";
import { LexerModeAction } from "./action/LexerModeAction";
import { LexerMoreAction } from "./action/LexerMoreAction";
import { LexerPopModeAction } from "./action/LexerPopModeAction";
import { LexerPushModeAction } from "./action/LexerPushModeAction";
import { LexerSkipAction } from "./action/LexerSkipAction";
import { LexerTypeAction } from "./action/LexerTypeAction";
import { ATN } from "./ATN";
import { ATNDeserializationOptions } from "./ATNDeserializationOptions";
import { ATNType } from "./ATNType";
import { ParserATNSimulator } from "./ParserATNSimulator";
import { ATNState } from "./state/ATNState";
import { ATNStateType } from "./state/ATNStateType";
import { BasicBlockStartState } from "./state/BasicBlockStartState";
import { BasicState } from "./state/BasicState";
import { BlockEndState } from "./state/BlockEndState";
import { BlockStartState } from "./state/BlockStartState";
import { DecisionState } from "./state/DecisionState";
import { InvalidState } from "./state/InvalidState";
import { LoopEndState } from "./state/LoopEndState";
import { PlusBlockStartState } from "./state/PlusBlockStartState";
import { PlusLoopbackState } from "./state/PlusLoopbackState";
import { RuleStartState } from "./state/RuleStartState";
import { RuleStopState } from "./state/RuleStopState";
import { StarBlockStartState } from "./state/StarBlockStartState";
import { StarLoopbackState } from "./state/StarLoopbackState";
import { StarLoopEntryState } from "./state/StarLoopEntryState";
import { TokensStartState } from "./state/TokensStartState";
import { ActionTransition } from "./transition/ActionTransition";
import { AtomTransition } from "./transition/AtomTransition";
import { EpsilonTransition } from "./transition/EpsilonTransition";
import { NotSetTransition } from "./transition/NotSetTransition";
import { PrecedencePredicateTransition } from "./transition/PrecedencePredicateTransition";
import { PredicateTransition } from "./transition/PredicateTransition";
import { RangeTransition } from "./transition/RangeTransition";
import { RuleTransition } from "./transition/RuleTransition";
import { SetTransition } from "./transition/SetTransition";

interface UnicodeDeserializer {
	
	readUnicode(data: Uint16Array, p: number): number;

	
	
	readonly size: number;
}

const enum UnicodeDeserializingMode {
	UNICODE_BMP,
	UNICODE_SMP,
}


export class ATNDeserializer {
	static get SERIALIZED_VERSION(): number {
		
		return 3;
	}

	

	
	private static readonly BASE_SERIALIZED_UUID: UUID = UUID.fromString("E4178468-DF95-44D0-AD87-F22A5D5FB6D3");
	
	private static readonly ADDED_LEXER_ACTIONS: UUID = UUID.fromString("AB35191A-1603-487E-B75A-479B831EAF6D");
	
	private static readonly ADDED_UNICODE_SMP: UUID = UUID.fromString("C23FEA89-0605-4f51-AFB8-058BCAB8C91B");
	
	private static readonly SUPPORTED_UUIDS: UUID[] = [
		ATNDeserializer.BASE_SERIALIZED_UUID,
		ATNDeserializer.ADDED_LEXER_ACTIONS,
		ATNDeserializer.ADDED_UNICODE_SMP,
	];

	
	private static readonly SERIALIZED_UUID: UUID = ATNDeserializer.ADDED_UNICODE_SMP;

	@NotNull
	private readonly deserializationOptions: ATNDeserializationOptions;

	constructor(deserializationOptions?: ATNDeserializationOptions) {
		if (deserializationOptions === undefined) {
			deserializationOptions = ATNDeserializationOptions.defaultOptions;
		}

		this.deserializationOptions = deserializationOptions;
	}

	
	protected static isFeatureSupported(feature: UUID, actualUuid: UUID): boolean {
		let featureIndex: number = ATNDeserializer.SUPPORTED_UUIDS.findIndex((e) => e.equals(feature));
		if (featureIndex < 0) {
			return false;
		}

		return ATNDeserializer.SUPPORTED_UUIDS.findIndex((e) => e.equals(actualUuid)) >= featureIndex;
	}

	private static getUnicodeDeserializer(mode: UnicodeDeserializingMode): UnicodeDeserializer {
		if (mode === UnicodeDeserializingMode.UNICODE_BMP) {
			return {
				readUnicode: (data: Uint16Array, p: number): number => {
					return ATNDeserializer.toInt(data[p]);
				},
				size: 1,
			};
		} else {
			return {
				readUnicode: (data: Uint16Array, p: number): number => {
					return ATNDeserializer.toInt32(data, p);
				},
				size: 2,
			};
		}
	}

	public deserialize(@NotNull data: Uint16Array): ATN {
		data = data.slice(0);

		
		
		
		
		
		
		//
		
		
		for (let i = 1; i < data.length; i++) {
			data[i] = (data[i] - 2) & 0xFFFF;
		}

		let p: number = 0;
		let version: number = ATNDeserializer.toInt(data[p++]);
		if (version !== ATNDeserializer.SERIALIZED_VERSION) {
			let reason = `Could not deserialize ATN with version ${version} (expected ${ATNDeserializer.SERIALIZED_VERSION}).`;
			throw new Error(reason);
		}

		let uuid: UUID = ATNDeserializer.toUUID(data, p);
		p += 8;
		if (ATNDeserializer.SUPPORTED_UUIDS.findIndex((e) => e.equals(uuid)) < 0) {
			let reason = `Could not deserialize ATN with UUID ${uuid} (expected ${ATNDeserializer.SERIALIZED_UUID} or a legacy UUID).`;
			throw new Error(reason);
		}

		let supportsLexerActions: boolean = ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid);

		let grammarType: ATNType = ATNDeserializer.toInt(data[p++]);
		let maxTokenType: number = ATNDeserializer.toInt(data[p++]);
		let atn: ATN = new ATN(grammarType, maxTokenType);

		//
		
		//
		let loopBackStateNumbers: Array<[LoopEndState, number]> = [];
		let endStateNumbers: Array<[BlockStartState, number]> = [];
		let nstates: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < nstates; i++) {
			let stype: ATNStateType = ATNDeserializer.toInt(data[p++]);
			
			if (stype === ATNStateType.INVALID_TYPE) {
				atn.addState(new InvalidState());
				continue;
			}

			let ruleIndex: number = ATNDeserializer.toInt(data[p++]);
			if (ruleIndex === 0xFFFF) {
				ruleIndex = -1;
			}

			let s: ATNState = this.stateFactory(stype, ruleIndex);
			if (stype === ATNStateType.LOOP_END) { 
				let loopBackStateNumber: number = ATNDeserializer.toInt(data[p++]);
				loopBackStateNumbers.push([s as LoopEndState, loopBackStateNumber]);
			}
			else if (s instanceof BlockStartState) {
				let endStateNumber: number = ATNDeserializer.toInt(data[p++]);
				endStateNumbers.push([s, endStateNumber]);
			}
			atn.addState(s);
		}

		
		for (let pair of loopBackStateNumbers) {
			pair[0].loopBackState = atn.states[pair[1]];
		}

		for (let pair of endStateNumbers) {
			pair[0].endState = atn.states[pair[1]] as BlockEndState;
		}

		let numNonGreedyStates: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numNonGreedyStates; i++) {
			let stateNumber: number = ATNDeserializer.toInt(data[p++]);
			(atn.states[stateNumber] as DecisionState).nonGreedy = true;
		}

		let numSllDecisions: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numSllDecisions; i++) {
			let stateNumber: number = ATNDeserializer.toInt(data[p++]);
			(atn.states[stateNumber] as DecisionState).sll = true;
		}

		let numPrecedenceStates: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numPrecedenceStates; i++) {
			let stateNumber: number = ATNDeserializer.toInt(data[p++]);
			(atn.states[stateNumber] as RuleStartState).isPrecedenceRule = true;
		}

		//
		
		//
		let nrules: number = ATNDeserializer.toInt(data[p++]);
		if (atn.grammarType === ATNType.LEXER) {
			atn.ruleToTokenType = new Int32Array(nrules);
		}

		atn.ruleToStartState = new Array<RuleStartState>(nrules);
		for (let i = 0; i < nrules; i++) {
			let s: number = ATNDeserializer.toInt(data[p++]);
			let startState: RuleStartState = atn.states[s] as RuleStartState;
			startState.leftFactored = ATNDeserializer.toInt(data[p++]) !== 0;
			atn.ruleToStartState[i] = startState;
			if (atn.grammarType === ATNType.LEXER) {
				let tokenType: number = ATNDeserializer.toInt(data[p++]);
				if (tokenType === 0xFFFF) {
					tokenType = Token.EOF;
				}

				atn.ruleToTokenType[i] = tokenType;

				if (!ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid)) {
					
					
					let actionIndexIgnored: number = ATNDeserializer.toInt(data[p++]);
					if (actionIndexIgnored === 0xFFFF) {
						actionIndexIgnored = -1;
					}
				}
			}
		}

		atn.ruleToStopState = new Array<RuleStopState>(nrules);
		for (let state of atn.states) {
			if (!(state instanceof RuleStopState)) {
				continue;
			}

			atn.ruleToStopState[state.ruleIndex] = state;
			atn.ruleToStartState[state.ruleIndex].stopState = state;
		}

		//
		
		//
		let nmodes: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < nmodes; i++) {
			let s: number = ATNDeserializer.toInt(data[p++]);
			atn.modeToStartState.push(atn.states[s] as TokensStartState);
		}

		atn.modeToDFA = new Array<DFA>(nmodes);
		for (let i = 0; i < nmodes; i++) {
			atn.modeToDFA[i] = new DFA(atn.modeToStartState[i]);
		}

		//
		
		//
		let sets: IntervalSet[] = [];

		
		p = this.deserializeSets(data, p, sets, ATNDeserializer.getUnicodeDeserializer(UnicodeDeserializingMode.UNICODE_BMP));

		
		
		if (ATNDeserializer.isFeatureSupported(ATNDeserializer.ADDED_UNICODE_SMP, uuid)) {
			p = this.deserializeSets(data, p, sets, ATNDeserializer.getUnicodeDeserializer(UnicodeDeserializingMode.UNICODE_SMP));
		}

		//
		
		//
		let nedges: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < nedges; i++) {
			let src: number = ATNDeserializer.toInt(data[p]);
			let trg: number = ATNDeserializer.toInt(data[p + 1]);
			let ttype: number = ATNDeserializer.toInt(data[p + 2]);
			let arg1: number = ATNDeserializer.toInt(data[p + 3]);
			let arg2: number = ATNDeserializer.toInt(data[p + 4]);
			let arg3: number = ATNDeserializer.toInt(data[p + 5]);
			let trans: Transition = this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
			
			let srcState: ATNState = atn.states[src];
			srcState.addTransition(trans);
			p += 6;
		}

		
		interface T { stopState: number; returnState: number; outermostPrecedenceReturn: number; }
		let returnTransitionsSet = new Array2DHashSet<T>({
			hashCode: (o: T) => o.stopState ^ o.returnState ^ o.outermostPrecedenceReturn,

			equals: (a: T, b: T): boolean => {
				return a.stopState === b.stopState
					&& a.returnState === b.returnState
					&& a.outermostPrecedenceReturn === b.outermostPrecedenceReturn;
			},
		});
		let returnTransitions: T[] = [];
		for (let state of atn.states) {
			let returningToLeftFactored: boolean = state.ruleIndex >= 0 && atn.ruleToStartState[state.ruleIndex].leftFactored;
			for (let i = 0; i < state.numberOfTransitions; i++) {
				let t: Transition = state.transition(i);
				if (!(t instanceof RuleTransition)) {
					continue;
				}

				let ruleTransition: RuleTransition = t;
				let returningFromLeftFactored: boolean = atn.ruleToStartState[ruleTransition.target.ruleIndex].leftFactored;
				if (!returningFromLeftFactored && returningToLeftFactored) {
					continue;
				}

				let outermostPrecedenceReturn: number = -1;
				if (atn.ruleToStartState[ruleTransition.target.ruleIndex].isPrecedenceRule) {
					if (ruleTransition.precedence === 0) {
						outermostPrecedenceReturn = ruleTransition.target.ruleIndex;
					}
				}

				let current = { stopState: ruleTransition.target.ruleIndex, returnState: ruleTransition.followState.stateNumber, outermostPrecedenceReturn };
				if (returnTransitionsSet.add(current)) {
					returnTransitions.push(current);
				}
			}
		}

		
		for (let returnTransition of returnTransitions) {
			let transition = new EpsilonTransition(atn.states[returnTransition.returnState], returnTransition.outermostPrecedenceReturn);
			atn.ruleToStopState[returnTransition.stopState].addTransition(transition);
		}

		for (let state of atn.states) {
			if (state instanceof BlockStartState) {
				
				if (state.endState === undefined) {
					throw new Error("IllegalStateException");
				}

				
				if (state.endState.startState !== undefined) {
					throw new Error("IllegalStateException");
				}

				state.endState.startState = state;
			}

			if (state instanceof PlusLoopbackState) {
				let loopbackState: PlusLoopbackState = state;
				for (let i = 0; i < loopbackState.numberOfTransitions; i++) {
					let target: ATNState = loopbackState.transition(i).target;
					if (target instanceof PlusBlockStartState) {
						target.loopBackState = loopbackState;
					}
				}
			}
			else if (state instanceof StarLoopbackState) {
				let loopbackState: StarLoopbackState = state;
				for (let i = 0; i < loopbackState.numberOfTransitions; i++) {
					let target: ATNState = loopbackState.transition(i).target;
					if (target instanceof StarLoopEntryState) {
						target.loopBackState = loopbackState;
					}
				}
			}
		}

		//
		
		//
		let ndecisions: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 1; i <= ndecisions; i++) {
			let s: number = ATNDeserializer.toInt(data[p++]);
			let decState: DecisionState = atn.states[s] as DecisionState;
			atn.decisionToState.push(decState);
			decState.decision = i - 1;
		}

		//
		
		//
		if (atn.grammarType === ATNType.LEXER) {
			if (supportsLexerActions) {
				atn.lexerActions = new Array<LexerAction>(ATNDeserializer.toInt(data[p++]));
				for (let i = 0; i < atn.lexerActions.length; i++) {
					let actionType: LexerActionType = ATNDeserializer.toInt(data[p++]);
					let data1: number = ATNDeserializer.toInt(data[p++]);
					if (data1 === 0xFFFF) {
						data1 = -1;
					}

					let data2: number = ATNDeserializer.toInt(data[p++]);
					if (data2 === 0xFFFF) {
						data2 = -1;
					}

					let lexerAction: LexerAction = this.lexerActionFactory(actionType, data1, data2);

					atn.lexerActions[i] = lexerAction;
				}
			}
			else {
				
				
				
				let legacyLexerActions: LexerAction[] = [];
				for (let state of atn.states) {
					for (let i = 0; i < state.numberOfTransitions; i++) {
						let transition: Transition = state.transition(i);
						if (!(transition instanceof ActionTransition)) {
							continue;
						}

						let ruleIndex: number = transition.ruleIndex;
						let actionIndex: number = transition.actionIndex;
						let lexerAction: LexerCustomAction = new LexerCustomAction(ruleIndex, actionIndex);
						state.setTransition(i, new ActionTransition(transition.target, ruleIndex, legacyLexerActions.length, false));
						legacyLexerActions.push(lexerAction);
					}
				}

				atn.lexerActions = legacyLexerActions;
			}
		}

		this.markPrecedenceDecisions(atn);

		atn.decisionToDFA = new Array<DFA>(ndecisions);
		for (let i = 0; i < ndecisions; i++) {
			atn.decisionToDFA[i] = new DFA(atn.decisionToState[i], i);
		}

		if (this.deserializationOptions.isVerifyATN) {
			this.verifyATN(atn);
		}

		if (this.deserializationOptions.isGenerateRuleBypassTransitions && atn.grammarType === ATNType.PARSER) {
			atn.ruleToTokenType = new Int32Array(atn.ruleToStartState.length);
			for (let i = 0; i < atn.ruleToStartState.length; i++) {
				atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
			}

			for (let i = 0; i < atn.ruleToStartState.length; i++) {
				let bypassStart: BasicBlockStartState = new BasicBlockStartState();
				bypassStart.ruleIndex = i;
				atn.addState(bypassStart);

				let bypassStop: BlockEndState = new BlockEndState();
				bypassStop.ruleIndex = i;
				atn.addState(bypassStop);

				bypassStart.endState = bypassStop;
				atn.defineDecisionState(bypassStart);

				bypassStop.startState = bypassStart;

				let endState: ATNState | undefined;
				let excludeTransition: Transition | undefined;
				if (atn.ruleToStartState[i].isPrecedenceRule) {
					
					endState = undefined;
					for (let state of atn.states) {
						if (state.ruleIndex !== i) {
							continue;
						}

						if (!(state instanceof StarLoopEntryState)) {
							continue;
						}

						let maybeLoopEndState: ATNState = state.transition(state.numberOfTransitions - 1).target;
						if (!(maybeLoopEndState instanceof LoopEndState)) {
							continue;
						}

						if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
							endState = state;
							break;
						}
					}

					if (!endState) {
						throw new Error("Couldn't identify final state of the precedence rule prefix section.");
					}

					excludeTransition = (endState as StarLoopEntryState).loopBackState.transition(0);
				}
				else {
					endState = atn.ruleToStopState[i];
				}

				
				for (let state of atn.states) {
					for (let i = 0; i < state.numberOfTransitions; i++) {
						let transition = state.transition(i);
						if (transition === excludeTransition) {
							continue;
						}

						if (transition.target === endState) {
							transition.target = bypassStop;
						}
					}
				}

				
				while (atn.ruleToStartState[i].numberOfTransitions > 0) {
					let transition: Transition = atn.ruleToStartState[i].removeTransition(atn.ruleToStartState[i].numberOfTransitions - 1);
					bypassStart.addTransition(transition);
				}

				
				atn.ruleToStartState[i].addTransition(new EpsilonTransition(bypassStart));
				bypassStop.addTransition(new EpsilonTransition(endState));

				let matchState: ATNState = new BasicState();
				atn.addState(matchState);
				matchState.addTransition(new AtomTransition(bypassStop, atn.ruleToTokenType[i]));
				bypassStart.addTransition(new EpsilonTransition(matchState));
			}

			if (this.deserializationOptions.isVerifyATN) {
				
				this.verifyATN(atn);
			}
		}

		if (this.deserializationOptions.isOptimize) {
			while (true) {
				let optimizationCount: number = 0;
				optimizationCount += ATNDeserializer.inlineSetRules(atn);
				optimizationCount += ATNDeserializer.combineChainedEpsilons(atn);
				let preserveOrder: boolean = atn.grammarType === ATNType.LEXER;
				optimizationCount += ATNDeserializer.optimizeSets(atn, preserveOrder);
				if (optimizationCount === 0) {
					break;
				}
			}

			if (this.deserializationOptions.isVerifyATN) {
				
				this.verifyATN(atn);
			}
		}

		ATNDeserializer.identifyTailCalls(atn);

		return atn;
	}

	private deserializeSets(data: Uint16Array, p: number, sets: IntervalSet[], unicodeDeserializer: UnicodeDeserializer): number {
		let nsets: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < nsets; i++) {
			let nintervals: number = ATNDeserializer.toInt(data[p]);
			p++;
			let set: IntervalSet = new IntervalSet();
			sets.push(set);

			let containsEof: boolean = ATNDeserializer.toInt(data[p++]) !== 0;
			if (containsEof) {
				set.add(-1);
			}

			for (let j: number = 0; j < nintervals; j++) {
				let a: number = unicodeDeserializer.readUnicode(data, p);
				p += unicodeDeserializer.size;
				let b: number = unicodeDeserializer.readUnicode(data, p);
				p += unicodeDeserializer.size;
				set.add(a, b);
			}
		}

		return p;
	}

	
	protected markPrecedenceDecisions(@NotNull atn: ATN): void {
		
		let rulePrecedenceDecisions = new Map<number, StarLoopEntryState>();

		for (let state of atn.states) {
			if (!(state instanceof StarLoopEntryState)) {
				continue;
			}

			
			if (atn.ruleToStartState[state.ruleIndex].isPrecedenceRule) {
				let maybeLoopEndState: ATNState = state.transition(state.numberOfTransitions - 1).target;
				if (maybeLoopEndState instanceof LoopEndState) {
					if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
						rulePrecedenceDecisions.set(state.ruleIndex, state);
						state.precedenceRuleDecision = true;
						state.precedenceLoopbackStates = new BitSet(atn.states.length);
					}
				}
			}
		}

		
		
		for (let precedenceDecision of rulePrecedenceDecisions) {
			for (let transition of atn.ruleToStopState[precedenceDecision[0]].getTransitions()) {
				if (transition.serializationType !== TransitionType.EPSILON) {
					continue;
				}

				let epsilonTransition = transition as EpsilonTransition;
				if (epsilonTransition.outermostPrecedenceReturn !== -1) {
					continue;
				}

				precedenceDecision[1].precedenceLoopbackStates.set(transition.target.stateNumber);
			}
		}
	}

	protected verifyATN(atn: ATN): void {
		
		for (let state of atn.states) {
			this.checkCondition(state !== undefined, "ATN states should not be undefined.");
			if (state.stateType === ATNStateType.INVALID_TYPE) {
				continue;
			}

			this.checkCondition(state.onlyHasEpsilonTransitions || state.numberOfTransitions <= 1);

			if (state instanceof PlusBlockStartState) {
				this.checkCondition(state.loopBackState !== undefined);
			}

			if (state instanceof StarLoopEntryState) {
				let starLoopEntryState: StarLoopEntryState = state;
				this.checkCondition(starLoopEntryState.loopBackState !== undefined);
				this.checkCondition(starLoopEntryState.numberOfTransitions === 2);

				if (starLoopEntryState.transition(0).target instanceof StarBlockStartState) {
					this.checkCondition(starLoopEntryState.transition(1).target instanceof LoopEndState);
					this.checkCondition(!starLoopEntryState.nonGreedy);
				}
				else if (starLoopEntryState.transition(0).target instanceof LoopEndState) {
					this.checkCondition(starLoopEntryState.transition(1).target instanceof StarBlockStartState);
					this.checkCondition(starLoopEntryState.nonGreedy);
				}
				else {
					throw new Error("IllegalStateException");
				}
			}

			if (state instanceof StarLoopbackState) {
				this.checkCondition(state.numberOfTransitions === 1);
				this.checkCondition(state.transition(0).target instanceof StarLoopEntryState);
			}

			if (state instanceof LoopEndState) {
				this.checkCondition(state.loopBackState !== undefined);
			}

			if (state instanceof RuleStartState) {
				this.checkCondition(state.stopState !== undefined);
			}

			if (state instanceof BlockStartState) {
				this.checkCondition(state.endState !== undefined);
			}

			if (state instanceof BlockEndState) {
				this.checkCondition(state.startState !== undefined);
			}

			if (state instanceof DecisionState) {
				let decisionState: DecisionState = state;
				this.checkCondition(decisionState.numberOfTransitions <= 1 || decisionState.decision >= 0);
			}
			else {
				this.checkCondition(state.numberOfTransitions <= 1 || state instanceof RuleStopState);
			}
		}
	}

	protected checkCondition(condition: boolean, message?: string): void {
		if (!condition) {
			throw new Error("IllegalStateException: " + message);
		}
	}

	private static inlineSetRules(atn: ATN): number {
		let inlinedCalls: number = 0;

		let ruleToInlineTransition = new Array<Transition | undefined>(atn.ruleToStartState.length);
		for (let i = 0; i < atn.ruleToStartState.length; i++) {
			let startState: RuleStartState = atn.ruleToStartState[i];
			let middleState: ATNState = startState;
			while (middleState.onlyHasEpsilonTransitions
				&& middleState.numberOfOptimizedTransitions === 1
				&& middleState.getOptimizedTransition(0).serializationType === TransitionType.EPSILON) {
				middleState = middleState.getOptimizedTransition(0).target;
			}

			if (middleState.numberOfOptimizedTransitions !== 1) {
				continue;
			}

			let matchTransition: Transition = middleState.getOptimizedTransition(0);
			let matchTarget: ATNState = matchTransition.target;
			if (matchTransition.isEpsilon
				|| !matchTarget.onlyHasEpsilonTransitions
				|| matchTarget.numberOfOptimizedTransitions !== 1
				|| !(matchTarget.getOptimizedTransition(0).target instanceof RuleStopState)) {
				continue;
			}

			switch (matchTransition.serializationType) {
			case TransitionType.ATOM:
			case TransitionType.RANGE:
			case TransitionType.SET:
				ruleToInlineTransition[i] = matchTransition;
				break;

			case TransitionType.NOT_SET:
			case TransitionType.WILDCARD:
				
				continue;

			default:
				continue;
			}
		}

		for (let state of atn.states) {
			if (state.ruleIndex < 0) {
				continue;
			}

			let optimizedTransitions: Transition[] | undefined;
			for (let i = 0; i < state.numberOfOptimizedTransitions; i++) {
				let transition: Transition = state.getOptimizedTransition(i);
				if (!(transition instanceof RuleTransition)) {
					if (optimizedTransitions !== undefined) {
						optimizedTransitions.push(transition);
					}

					continue;
				}

				let ruleTransition: RuleTransition = transition;
				let effective: Transition | undefined = ruleToInlineTransition[ruleTransition.target.ruleIndex];
				if (effective === undefined) {
					if (optimizedTransitions !== undefined) {
						optimizedTransitions.push(transition);
					}

					continue;
				}

				if (optimizedTransitions === undefined) {
					optimizedTransitions = [];
					for (let j = 0; j < i; j++) {
						optimizedTransitions.push(state.getOptimizedTransition(i));
					}
				}

				inlinedCalls++;
				let target: ATNState = ruleTransition.followState;
				let intermediateState: ATNState = new BasicState();
				intermediateState.setRuleIndex(target.ruleIndex);
				atn.addState(intermediateState);
				optimizedTransitions.push(new EpsilonTransition(intermediateState));

				switch (effective.serializationType) {
				case TransitionType.ATOM:
					intermediateState.addTransition(new AtomTransition(target, (effective as AtomTransition)._label));
					break;

				case TransitionType.RANGE:
					intermediateState.addTransition(new RangeTransition(target, (effective as RangeTransition).from, (effective as RangeTransition).to));
					break;

				case TransitionType.SET:
					intermediateState.addTransition(new SetTransition(target, (effective as SetTransition).label));
					break;

				default:
					throw new Error("UnsupportedOperationException");
				}
			}

			if (optimizedTransitions !== undefined) {
				if (state.isOptimized) {
					while (state.numberOfOptimizedTransitions > 0) {
						state.removeOptimizedTransition(state.numberOfOptimizedTransitions - 1);
					}
				}

				for (let transition of optimizedTransitions) {
					state.addOptimizedTransition(transition);
				}
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + inlinedCalls + " rule invocations by inlining sets.");
		}

		return inlinedCalls;
	}

	private static combineChainedEpsilons(atn: ATN): number {
		let removedEdges: number = 0;

		for (let state of atn.states) {
			if (!state.onlyHasEpsilonTransitions || state instanceof RuleStopState) {
				continue;
			}

			let optimizedTransitions: Transition[] | undefined;
			nextTransition:
			for (let i = 0; i < state.numberOfOptimizedTransitions; i++) {
				let transition: Transition = state.getOptimizedTransition(i);
				let intermediate: ATNState = transition.target;
				if (transition.serializationType !== TransitionType.EPSILON
					|| (transition as EpsilonTransition).outermostPrecedenceReturn !== -1
					|| intermediate.stateType !== ATNStateType.BASIC
					|| !intermediate.onlyHasEpsilonTransitions) {
					if (optimizedTransitions !== undefined) {
						optimizedTransitions.push(transition);
					}

					continue nextTransition;
				}

				for (let j = 0; j < intermediate.numberOfOptimizedTransitions; j++) {
					if (intermediate.getOptimizedTransition(j).serializationType !== TransitionType.EPSILON
						|| (intermediate.getOptimizedTransition(j) as EpsilonTransition).outermostPrecedenceReturn !== -1) {
						if (optimizedTransitions !== undefined) {
							optimizedTransitions.push(transition);
						}

						continue nextTransition;
					}
				}

				removedEdges++;
				if (optimizedTransitions === undefined) {
					optimizedTransitions = [];
					for (let j = 0; j < i; j++) {
						optimizedTransitions.push(state.getOptimizedTransition(j));
					}
				}

				for (let j = 0; j < intermediate.numberOfOptimizedTransitions; j++) {
					let target: ATNState = intermediate.getOptimizedTransition(j).target;
					optimizedTransitions.push(new EpsilonTransition(target));
				}
			}

			if (optimizedTransitions !== undefined) {
				if (state.isOptimized) {
					while (state.numberOfOptimizedTransitions > 0) {
						state.removeOptimizedTransition(state.numberOfOptimizedTransitions - 1);
					}
				}

				for (let transition of optimizedTransitions) {
					state.addOptimizedTransition(transition);
				}
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + removedEdges + " transitions by combining chained epsilon transitions.");
		}

		return removedEdges;
	}

	private static optimizeSets(atn: ATN, preserveOrder: boolean): number {
		if (preserveOrder) {
			
			return 0;
		}

		let removedPaths: number = 0;
		let decisions: DecisionState[] = atn.decisionToState;
		for (let decision of decisions) {
			let setTransitions: IntervalSet = new IntervalSet();
			for (let i = 0; i < decision.numberOfOptimizedTransitions; i++) {
				let epsTransition: Transition = decision.getOptimizedTransition(i);
				if (!(epsTransition instanceof EpsilonTransition)) {
					continue;
				}

				if (epsTransition.target.numberOfOptimizedTransitions !== 1) {
					continue;
				}

				let transition: Transition = epsTransition.target.getOptimizedTransition(0);
				if (!(transition.target instanceof BlockEndState)) {
					continue;
				}

				if (transition instanceof NotSetTransition) {
					
					continue;
				}

				if (transition instanceof AtomTransition
					|| transition instanceof RangeTransition
					|| transition instanceof SetTransition) {
					setTransitions.add(i);
				}
			}

			if (setTransitions.size <= 1) {
				continue;
			}

			let optimizedTransitions: Transition[] = [];
			for (let i = 0; i < decision.numberOfOptimizedTransitions; i++) {
				if (!setTransitions.contains(i)) {
					optimizedTransitions.push(decision.getOptimizedTransition(i));
				}
			}

			let blockEndState: ATNState = decision.getOptimizedTransition(setTransitions.minElement).target.getOptimizedTransition(0).target;
			let matchSet: IntervalSet = new IntervalSet();
			for (let interval of setTransitions.intervals) {
				for (let j = interval.a; j <= interval.b; j++) {
					let matchTransition: Transition = decision.getOptimizedTransition(j).target.getOptimizedTransition(0);
					if (matchTransition instanceof NotSetTransition) {
						throw new Error("Not yet implemented.");
					} else {
						matchSet.addAll(matchTransition.label as IntervalSet);
					}
				}
			}

			let newTransition: Transition;
			if (matchSet.intervals.length === 1) {
				if (matchSet.size === 1) {
					newTransition = new AtomTransition(blockEndState, matchSet.minElement);
				} else {
					let matchInterval: Interval = matchSet.intervals[0];
					newTransition = new RangeTransition(blockEndState, matchInterval.a, matchInterval.b);
				}
			} else {
				newTransition = new SetTransition(blockEndState, matchSet);
			}

			let setOptimizedState: ATNState = new BasicState();
			setOptimizedState.setRuleIndex(decision.ruleIndex);
			atn.addState(setOptimizedState);

			setOptimizedState.addTransition(newTransition);
			optimizedTransitions.push(new EpsilonTransition(setOptimizedState));

			removedPaths += decision.numberOfOptimizedTransitions - optimizedTransitions.length;

			if (decision.isOptimized) {
				while (decision.numberOfOptimizedTransitions > 0) {
					decision.removeOptimizedTransition(decision.numberOfOptimizedTransitions - 1);
				}
			}

			for (let transition of optimizedTransitions) {
				decision.addOptimizedTransition(transition);
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + removedPaths + " paths by collapsing sets.");
		}

		return removedPaths;
	}

	private static identifyTailCalls(atn: ATN): void {
		for (let state of atn.states) {
			for (let i = 0; i < state.numberOfTransitions; i++) {
				let transition = state.transition(i);
				if (!(transition instanceof RuleTransition)) {
					continue;
				}

				transition.tailCall = this.testTailCall(atn, transition, false);
				transition.optimizedTailCall = this.testTailCall(atn, transition, true);
			}

			if (!state.isOptimized) {
				continue;
			}

			for (let i = 0; i < state.numberOfOptimizedTransitions; i++) {
				let transition = state.getOptimizedTransition(i);
				if (!(transition instanceof RuleTransition)) {
					continue;
				}

				transition.tailCall = this.testTailCall(atn, transition, false);
				transition.optimizedTailCall = this.testTailCall(atn, transition, true);
			}
		}
	}

	private static testTailCall(atn: ATN, transition: RuleTransition, optimizedPath: boolean): boolean {
		if (!optimizedPath && transition.tailCall) {
			return true;
		}
		if (optimizedPath && transition.optimizedTailCall) {
			return true;
		}

		let reachable: BitSet = new BitSet(atn.states.length);
		let worklist: ATNState[] = [];
		worklist.push(transition.followState);
		while (true) {
			let state = worklist.pop();
			if (!state) {
				break;
			}

			if (reachable.get(state.stateNumber)) {
				continue;
			}

			if (state instanceof RuleStopState) {
				continue;
			}

			if (!state.onlyHasEpsilonTransitions) {
				return false;
			}

			let transitionCount = optimizedPath ? state.numberOfOptimizedTransitions : state.numberOfTransitions;
			for (let i = 0; i < transitionCount; i++) {
				let t = optimizedPath ? state.getOptimizedTransition(i) : state.transition(i);
				if (t.serializationType !== TransitionType.EPSILON) {
					return false;
				}

				worklist.push(t.target);
			}
		}

		return true;
	}

	protected static toInt(c: number): number {
		return c;
	}

	protected static toInt32(data: Uint16Array, offset: number): number {
		return (data[offset] | (data[offset + 1] << 16)) >>> 0;
	}

	protected static toUUID(data: Uint16Array, offset: number): UUID {
		let leastSigBits: number = ATNDeserializer.toInt32(data, offset);
		let lessSigBits: number = ATNDeserializer.toInt32(data, offset + 2);
		let moreSigBits: number = ATNDeserializer.toInt32(data, offset + 4);
		let mostSigBits: number = ATNDeserializer.toInt32(data, offset + 6);
		return new UUID(mostSigBits, moreSigBits, lessSigBits, leastSigBits);
	}

	@NotNull
	protected edgeFactory(
		@NotNull atn: ATN,
		type: TransitionType, src: number, trg: number,
		arg1: number, arg2: number, arg3: number,
		sets: IntervalSet[]): Transition {
		let target: ATNState = atn.states[trg];
		switch (type) {
			case TransitionType.EPSILON: return new EpsilonTransition(target);
			case TransitionType.RANGE:
				if (arg3 !== 0) {
					return new RangeTransition(target, Token.EOF, arg2);
				}
				else {
					return new RangeTransition(target, arg1, arg2);
				}
			case TransitionType.RULE:
				let rt: RuleTransition = new RuleTransition(atn.states[arg1] as RuleStartState, arg2, arg3, target);
				return rt;
			case TransitionType.PREDICATE:
				let pt: PredicateTransition = new PredicateTransition(target, arg1, arg2, arg3 !== 0);
				return pt;
			case TransitionType.PRECEDENCE:
				return new PrecedencePredicateTransition(target, arg1);
			case TransitionType.ATOM:
				if (arg3 !== 0) {
					return new AtomTransition(target, Token.EOF);
				}
				else {
					return new AtomTransition(target, arg1);
				}
			case TransitionType.ACTION:
				let a: ActionTransition = new ActionTransition(target, arg1, arg2, arg3 !== 0);
				return a;
			case TransitionType.SET: return new SetTransition(target, sets[arg1]);
			case TransitionType.NOT_SET: return new NotSetTransition(target, sets[arg1]);
			case TransitionType.WILDCARD: return new WildcardTransition(target);
		}

		throw new Error("The specified transition type is not valid.");
	}

	protected stateFactory(type: ATNStateType, ruleIndex: number): ATNState {
		let s: ATNState;
		switch (type) {
			case ATNStateType.INVALID_TYPE: return new InvalidState();
			case ATNStateType.BASIC: s = new BasicState(); break;
			case ATNStateType.RULE_START: s = new RuleStartState(); break;
			case ATNStateType.BLOCK_START: s = new BasicBlockStartState(); break;
			case ATNStateType.PLUS_BLOCK_START: s = new PlusBlockStartState(); break;
			case ATNStateType.STAR_BLOCK_START: s = new StarBlockStartState(); break;
			case ATNStateType.TOKEN_START: s = new TokensStartState(); break;
			case ATNStateType.RULE_STOP: s = new RuleStopState(); break;
			case ATNStateType.BLOCK_END: s = new BlockEndState(); break;
			case ATNStateType.STAR_LOOP_BACK: s = new StarLoopbackState(); break;
			case ATNStateType.STAR_LOOP_ENTRY: s = new StarLoopEntryState(); break;
			case ATNStateType.PLUS_LOOP_BACK: s = new PlusLoopbackState(); break;
			case ATNStateType.LOOP_END: s = new LoopEndState(); break;
			default:
				let message: string = `The specified state type ${type} is not valid.`;
				throw new Error(message);
		}

		s.ruleIndex = ruleIndex;
		return s;
	}

	protected lexerActionFactory(type: LexerActionType, data1: number, data2: number): LexerAction {
		switch (type) {
		case LexerActionType.CHANNEL:
			return new LexerChannelAction(data1);

		case LexerActionType.CUSTOM:
			return new LexerCustomAction(data1, data2);

		case LexerActionType.MODE:
			return new LexerModeAction(data1);

		case LexerActionType.MORE:
			return LexerMoreAction.INSTANCE;

		case LexerActionType.POP_MODE:
			return LexerPopModeAction.INSTANCE;

		case LexerActionType.PUSH_MODE:
			return new LexerPushModeAction(data1);

		case LexerActionType.SKIP:
			return LexerSkipAction.INSTANCE;

		case LexerActionType.TYPE:
			return new LexerTypeAction(data1);

		default:
			let message: string = `The specified lexer action type ${type} is not valid.`;
			throw new Error(message);
		}
	}
}
