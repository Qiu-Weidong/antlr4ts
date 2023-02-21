




import * as assert from "assert";
import { CharStream } from "../CharStream";
import { NotNull, Override } from "../Decorators";
import { DFAState, AcceptStateInfo, DFA } from "../dfa";
import { LexerNoViableAltException } from "../exception/LexerNoViableAltException";
import { IntStream } from "../IntStream";
import { Lexer } from "../Lexer";
import { Interval } from "../misc";
import { Token } from "../Token";
import { LexerActionExecutor } from "./action/LexerActionExecutor";
import { ATN } from "./ATN";
import { ATNSimulator } from "./ATNSimulator";
import { ATNConfig } from "./config/ATNConfig";
import { ATNConfigSet } from "./config/ATNConfigSet";
import { OrderedATNConfigSet } from "./config/OrderedATNConfigSet";
import { PredictionContext } from "./context/PredictionContext";
import { ATNState } from "./state/ATNState";
import { RuleStopState } from "./state/RuleStopState";
import { ActionTransition } from "./transition/ActionTransition";
import { PredicateTransition } from "./transition/PredicateTransition";
import { RuleTransition } from "./transition/RuleTransition";
import { Transition } from "./transition/Transition";
import { TransitionType } from "./transition/TransitionType";


export class LexerATNSimulator extends ATNSimulator {
	public optimize_tail_calls: boolean = true;

	protected recog: Lexer | undefined;

	
	protected startIndex: number = -1;

	
	private _line: number = 1;

	
	private _charPositionInLine: number = 0;

	protected mode: number = Lexer.DEFAULT_MODE;

	
	@NotNull
	protected prevAccept: LexerATNSimulator.SimState = new LexerATNSimulator.SimState();

	constructor( atn: ATN);
	constructor( atn: ATN, recog: Lexer | undefined);
	constructor(@NotNull atn: ATN, recog?: Lexer) {
		super(atn);
		this.recog = recog;
	}

	public copyState(@NotNull simulator: LexerATNSimulator): void {
		this._charPositionInLine = simulator.charPositionInLine;
		this._line = simulator._line;
		this.mode = simulator.mode;
		this.startIndex = simulator.startIndex;
	}

	public match(@NotNull input: CharStream, mode: number): number {
		this.mode = mode;
		let mark: number = input.mark();
		try {
			this.startIndex = input.index;
			this.prevAccept.reset();
			let s0: DFAState | undefined = this.atn.modeToDFA[mode].s0;
			if (s0 == null) {
				return this.matchATN(input);
			}
			else {
				return this.execATN(input, s0);
			}
		}
		finally {
			input.release(mark);
		}
	}

	@Override
	public reset(): void {
		this.prevAccept.reset();
		this.startIndex = -1;
		this._line = 1;
		this._charPositionInLine = 0;
		this.mode = Lexer.DEFAULT_MODE;
	}

	protected matchATN(@NotNull input: CharStream): number {
		let startState: ATNState = this.atn.modeToStartState[this.mode];

		if (LexerATNSimulator.debug) {
			console.log(`matchATN mode ${this.mode} start: ${startState}`);
		}

		let old_mode: number = this.mode;

		let s0_closure: ATNConfigSet = this.computeStartState(input, startState);
		let suppressEdge: boolean = s0_closure.hasSemanticContext;
		if (suppressEdge) {
			s0_closure.hasSemanticContext = false;
		}

		let next: DFAState = this.addDFAState(s0_closure);
		if (!suppressEdge) {
			let dfa = this.atn.modeToDFA[this.mode];
			if (!dfa.s0) {
				dfa.s0 = next;
			} else {
				next = dfa.s0;
			}
		}

		let predict: number = this.execATN(input, next);

		if (LexerATNSimulator.debug) {
			console.log(`DFA after matchATN: ${this.atn.modeToDFA[old_mode].toLexerString()}`);
		}

		return predict;
	}

	protected execATN(@NotNull input: CharStream, @NotNull ds0: DFAState): number {
		
		if (LexerATNSimulator.debug) {
			console.log(`start state closure=${ds0.configs}`);
		}

		if (ds0.isAcceptState) {
			
			this.captureSimState(this.prevAccept, input, ds0);
		}

		let t: number = input.LA(1);
		
		let s: DFAState = ds0; 

		while (true) { 
			if (LexerATNSimulator.debug) {
				console.log(`execATN loop starting closure: ${s.configs}`);
			}

			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			let target: DFAState | undefined = this.getExistingTargetState(s, t);
			if (target == null) {
				target = this.computeTargetState(input, s, t);
			}

			if (target === ATNSimulator.ERROR) {
				break;
			}

			
			
			
			
			if (t !== IntStream.EOF) {
				this.consume(input);
			}

			if (target.isAcceptState) {
				this.captureSimState(this.prevAccept, input, target);
				if (t === IntStream.EOF) {
					break;
				}
			}

			t = input.LA(1);
			s = target; 
		}

		return this.failOrAccept(this.prevAccept, input, s.configs, t);
	}

	
	protected getExistingTargetState(@NotNull s: DFAState, t: number): DFAState | undefined {
		let target: DFAState | undefined = s.getTarget(t);
		if (LexerATNSimulator.debug && target != null) {
			console.log("reuse state " + s.stateNumber +
				" edge to " + target.stateNumber);
		}

		return target;
	}

	
	@NotNull
	protected computeTargetState(@NotNull input: CharStream, @NotNull s: DFAState, t: number): DFAState {
		let reach: ATNConfigSet = new OrderedATNConfigSet();

		
		
		this.getReachableConfigSet(input, s.configs, reach, t);

		if (reach.isEmpty) { 
			if (!reach.hasSemanticContext) {
				
				
				this.addDFAEdge(s, t, ATNSimulator.ERROR);
			}

			
			return ATNSimulator.ERROR;
		}

		
		return this.addDFAEdge(s, t, reach);
	}

	protected failOrAccept(
		prevAccept: LexerATNSimulator.SimState, input: CharStream,
		reach: ATNConfigSet, t: number): number {
		if (prevAccept.dfaState != null) {
			let lexerActionExecutor: LexerActionExecutor | undefined = prevAccept.dfaState.lexerActionExecutor;
			this.accept(input, lexerActionExecutor, this.startIndex,
				prevAccept.index, prevAccept.line, prevAccept.charPos);
			return prevAccept.dfaState.prediction;
		}
		else {
			
			if (t === IntStream.EOF && input.index === this.startIndex) {
				return Token.EOF;
			}

			throw new LexerNoViableAltException(this.recog, input, this.startIndex, reach);
		}
	}

	
	protected getReachableConfigSet(@NotNull input: CharStream, @NotNull closure: ATNConfigSet, @NotNull reach: ATNConfigSet, t: number): void {
		
		
		let skipAlt: number = ATN.INVALID_ALT_NUMBER;
		for (let c of closure) {
			let currentAltReachedAcceptState: boolean = c.alt === skipAlt;
			if (currentAltReachedAcceptState && c.hasPassedThroughNonGreedyDecision) {
				continue;
			}

			if (LexerATNSimulator.debug) {
				console.log(`testing ${this.getTokenName(t)} at ${c.toString(this.recog, true)}`);
			}

			let n: number = c.state.numberOfOptimizedTransitions;
			for (let ti = 0; ti < n; ti++) {               
				let trans: Transition = c.state.getOptimizedTransition(ti);
				let target: ATNState | undefined = this.getReachableTarget(trans, t);
				if (target != null) {
					let lexerActionExecutor: LexerActionExecutor | undefined = c.lexerActionExecutor;
					let config: ATNConfig;
					if (lexerActionExecutor != null) {
						lexerActionExecutor = lexerActionExecutor.fixOffsetBeforeMatch(input.index - this.startIndex);
						config = c.transform(target, true, lexerActionExecutor);
					} else {
						assert(c.lexerActionExecutor == null);
						config = c.transform(target, true);
					}

					let treatEofAsEpsilon: boolean = t === IntStream.EOF;
					if (this.closure(input, config, reach, currentAltReachedAcceptState, true, treatEofAsEpsilon)) {
						
						
						skipAlt = c.alt;
						break;
					}
				}
			}
		}
	}

	protected accept(
		@NotNull input: CharStream, lexerActionExecutor: LexerActionExecutor | undefined,
		startIndex: number, index: number, line: number, charPos: number): void {
		if (LexerATNSimulator.debug) {
			console.log(`ACTION ${lexerActionExecutor}`);
		}

		
		input.seek(index);
		this._line = line;
		this._charPositionInLine = charPos;

		if (lexerActionExecutor != null && this.recog != null) {
			lexerActionExecutor.execute(this.recog, input, startIndex);
		}
	}

	protected getReachableTarget(trans: Transition, t: number): ATNState | undefined {
		if (trans.matches(t, Lexer.MIN_CHAR_VALUE, Lexer.MAX_CHAR_VALUE)) {
			return trans.target;
		}

		return undefined;
	}

	@NotNull
	protected computeStartState(
		@NotNull input: CharStream,
		@NotNull p: ATNState): ATNConfigSet {
		let initialContext: PredictionContext = PredictionContext.EMPTY_FULL;
		let configs: ATNConfigSet = new OrderedATNConfigSet();
		for (let i = 0; i < p.numberOfTransitions; i++) {
			let target: ATNState = p.transition(i).target;
			let c: ATNConfig = ATNConfig.create(target, i + 1, initialContext);
			this.closure(input, c, configs, false, false, false);
		}
		return configs;
	}

	
	protected closure(@NotNull input: CharStream, @NotNull config: ATNConfig, @NotNull configs: ATNConfigSet, currentAltReachedAcceptState: boolean, speculative: boolean, treatEofAsEpsilon: boolean): boolean {
		if (LexerATNSimulator.debug) {
			console.log("closure(" + config.toString(this.recog, true) + ")");
		}

		if (config.state instanceof RuleStopState) {
			if (LexerATNSimulator.debug) {
				if (this.recog != null) {
					console.log(`closure at ${this.recog.ruleNames[config.state.ruleIndex]} rule stop ${config}`);
				}
				else {
					console.log(`closure at rule stop ${config}`);
				}
			}

			let context: PredictionContext = config.context;
			if (context.isEmpty) {
				configs.add(config);
				return true;
			}
			else if (context.hasEmpty) {
				configs.add(config.transform(config.state, true, PredictionContext.EMPTY_FULL));
				currentAltReachedAcceptState = true;
			}

			for (let i = 0; i < context.size; i++) {
				let returnStateNumber: number = context.getReturnState(i);
				if (returnStateNumber === PredictionContext.EMPTY_FULL_STATE_KEY) {
					continue;
				}

				let newContext: PredictionContext = context.getParent(i); 
				let returnState: ATNState = this.atn.states[returnStateNumber];
				let c: ATNConfig = config.transform(returnState, false, newContext);
				currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
			}

			return currentAltReachedAcceptState;
		}

		
		if (!config.state.onlyHasEpsilonTransitions) {
			if (!currentAltReachedAcceptState || !config.hasPassedThroughNonGreedyDecision) {
				configs.add(config);
			}
		}

		let p: ATNState = config.state;
		for (let i = 0; i < p.numberOfOptimizedTransitions; i++) {
			let t: Transition = p.getOptimizedTransition(i);
			let c: ATNConfig | undefined = this.getEpsilonTarget(input, config, t, configs, speculative, treatEofAsEpsilon);
			if (c != null) {
				currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
			}
		}

		return currentAltReachedAcceptState;
	}

	
	protected getEpsilonTarget(
		@NotNull input: CharStream,
		@NotNull config: ATNConfig,
		@NotNull t: Transition,
		@NotNull configs: ATNConfigSet,
		speculative: boolean,
		treatEofAsEpsilon: boolean): ATNConfig | undefined {
		let c: ATNConfig | undefined;

		switch (t.serializationType) {
		case TransitionType.RULE:
			let ruleTransition: RuleTransition = t as RuleTransition;
			if (this.optimize_tail_calls && ruleTransition.optimizedTailCall && !config.context.hasEmpty) {
				c = config.transform(t.target, true);
			}
			else {
				let newContext: PredictionContext = config.context.getChild(ruleTransition.followState.stateNumber);
				c = config.transform(t.target, true, newContext);
			}

			break;

		case TransitionType.PRECEDENCE:
			throw new Error("Precedence predicates are not supported in lexers.");

		case TransitionType.PREDICATE:
			
			let pt: PredicateTransition = t as PredicateTransition;
			if (LexerATNSimulator.debug) {
				console.log("EVAL rule " + pt.ruleIndex + ":" + pt.predIndex);
			}
			configs.hasSemanticContext = true;
			if (this.evaluatePredicate(input, pt.ruleIndex, pt.predIndex, speculative)) {
				c = config.transform(t.target, true);
			}
			else {
				c = undefined;
			}

			break;

		case TransitionType.ACTION:
			if (config.context.hasEmpty) {
				
				//
				
				
				
				
				
				
				
				
				
				
				let lexerActionExecutor: LexerActionExecutor = LexerActionExecutor.append(config.lexerActionExecutor, this.atn.lexerActions[(t as ActionTransition).actionIndex]);
				c = config.transform(t.target, true, lexerActionExecutor);
				break;
			}
			else {
				
				c = config.transform(t.target, true);
				break;
			}

		case TransitionType.EPSILON:
			c = config.transform(t.target, true);
			break;

		case TransitionType.ATOM:
		case TransitionType.RANGE:
		case TransitionType.SET:
			if (treatEofAsEpsilon) {
				if (t.matches(IntStream.EOF, Lexer.MIN_CHAR_VALUE, Lexer.MAX_CHAR_VALUE)) {
					c = config.transform(t.target, false);
					break;
				}
			}

			c = undefined;
			break;

		default:
			c = undefined;
			break;
		}

		return c;
	}

	
	protected evaluatePredicate(@NotNull input: CharStream, ruleIndex: number, predIndex: number, speculative: boolean): boolean {
		
		if (this.recog == null) {
			return true;
		}

		if (!speculative) {
			return this.recog.sempred(undefined, ruleIndex, predIndex);
		}

		let savedCharPositionInLine: number = this._charPositionInLine;
		let savedLine: number = this._line;
		let index: number = input.index;
		let marker: number = input.mark();
		try {
			this.consume(input);
			return this.recog.sempred(undefined, ruleIndex, predIndex);
		}
		finally {
			this._charPositionInLine = savedCharPositionInLine;
			this._line = savedLine;
			input.seek(index);
			input.release(marker);
		}
	}

	protected captureSimState(
		@NotNull settings: LexerATNSimulator.SimState,
		@NotNull input: CharStream,
		@NotNull dfaState: DFAState): void {
		settings.index = input.index;
		settings.line = this._line;
		settings.charPos = this._charPositionInLine;
		settings.dfaState = dfaState;
	}

	
	protected addDFAEdge( p: DFAState, t: number,  q: ATNConfigSet): DFAState;
	protected addDFAEdge( p: DFAState, t: number,  q: DFAState): void;
	protected addDFAEdge(p: DFAState, t: number, q: ATNConfigSet | DFAState): DFAState | void {
		if (q instanceof ATNConfigSet) {
			
			let suppressEdge: boolean = q.hasSemanticContext;
			if (suppressEdge) {
				q.hasSemanticContext = false;
			}

			
			let to: DFAState = this.addDFAState(q);

			if (suppressEdge) {
				return to;
			}

			this.addDFAEdge(p, t, to);
			return to;
		} else {
			if (LexerATNSimulator.debug) {
				console.log("EDGE " + p + " -> " + q + " upon " + String.fromCharCode(t));
			}

			if (p != null) {
				p.setTarget(t, q);
			}
		}
	}

	
	@NotNull
	protected addDFAState(@NotNull configs: ATNConfigSet): DFAState {
		
		assert(!configs.hasSemanticContext);

		let proposed: DFAState = new DFAState(configs);
		let existing: DFAState | undefined = this.atn.modeToDFA[this.mode].states.get(proposed);
		if (existing != null) {
			return existing;
		}

		configs.optimizeConfigs(this);
		let newState: DFAState = new DFAState(configs.clone(true));

		let firstConfigWithRuleStopState: ATNConfig | undefined;
		for (let c of configs) {
			if (c.state instanceof RuleStopState) {
				firstConfigWithRuleStopState = c;
				break;
			}
		}

		if (firstConfigWithRuleStopState != null) {
			let prediction: number = this.atn.ruleToTokenType[firstConfigWithRuleStopState.state.ruleIndex];
			let lexerActionExecutor: LexerActionExecutor | undefined = firstConfigWithRuleStopState.lexerActionExecutor;
			newState.acceptStateInfo = new AcceptStateInfo(prediction, lexerActionExecutor);
		}

		return this.atn.modeToDFA[this.mode].addState(newState);
	}

	@NotNull
	public getDFA(mode: number): DFA {
		return this.atn.modeToDFA[mode];
	}

	
	@NotNull
	public getText(@NotNull input: CharStream): string {
		
		return input.getText(Interval.of(this.startIndex, input.index - 1));
	}

	get line(): number {
		return this._line;
	}

	set line(line: number) {
		this._line = line;
	}

	get charPositionInLine(): number {
		return this._charPositionInLine;
	}

	set charPositionInLine(charPositionInLine: number) {
		this._charPositionInLine = charPositionInLine;
	}

	public consume(@NotNull input: CharStream): void {
		let curChar: number = input.LA(1);
		if (curChar === "\n".charCodeAt(0)) {
			this._line++;
			this._charPositionInLine = 0;
		} else {
			this._charPositionInLine++;
		}
		input.consume();
	}

	@NotNull
	public getTokenName(t: number): string {
		if (t === -1) {
			return "EOF";
		}
		
		return "'" + String.fromCharCode(t) + "'";
	}
}

export namespace LexerATNSimulator {
	export const debug: boolean = false;
	export const dfa_debug: boolean = false;

	
	export class SimState {
		public index: number = -1;
		public line: number = 0;
		public charPos: number = -1;
		public dfaState?: DFAState;

		public reset(): void {
			this.index = -1;
			this.line = 0;
			this.charPos = -1;
			this.dfaState = undefined;
		}
	}
}
