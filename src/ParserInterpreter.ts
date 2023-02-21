



import { ATN } from "./atn/ATN";
import { ATNState } from "./atn/state/ATNState";
import { AtomTransition } from "./atn/transition/AtomTransition";
import { BitSet } from "./misc/BitSet";
import { FailedPredicateException } from "./exception/FailedPredicateException";
import { InputMismatchException } from "./exception/InputMismatchException";
import { InterpreterRuleContext } from "./InterpreterRuleContext";
import { NotNull } from "./Decorators";
import { Override } from "./Decorators";
import { Parser } from "./Parser";
import { ParserATNSimulator } from "./atn/ParserATNSimulator";
import { ParserRuleContext } from "./ParserRuleContext";
import { RecognitionException } from "./exception/RecognitionException";
import { Token } from "./Token";
import { TokenStream } from "./TokenStream";
import { Vocabulary } from "./Vocabulary";
import { ATNStateType } from "./atn/state/ATNStateType";
import { DecisionState } from "./atn/state/DecisionState";
import { LoopEndState } from "./atn/state/LoopEndState";
import { RuleStartState } from "./atn/state/RuleStartState";
import { StarLoopEntryState } from "./atn/state/StarLoopEntryState";
import { ActionTransition } from "./atn/transition/ActionTransition";
import { PrecedencePredicateTransition } from "./atn/transition/PrecedencePredicateTransition";
import { PredicateTransition } from "./atn/transition/PredicateTransition";
import { RuleTransition } from "./atn/transition/RuleTransition";
import { Transition } from "./atn/transition/Transition";
import { TransitionType } from "./atn/transition/TransitionType";


export class ParserInterpreter extends Parser {
	protected _grammarFileName: string;
	protected _atn: ATN;
	
	protected pushRecursionContextStates: BitSet;

	protected _ruleNames: string[];
	@NotNull
	private _vocabulary: Vocabulary;

	
	protected readonly _parentContextStack: Array<[ParserRuleContext, number]> = [];

	
	protected overrideDecision: number = -1;
	protected overrideDecisionInputIndex: number = -1;
	protected overrideDecisionAlt: number = -1;
	protected overrideDecisionReached: boolean = false; 

	
	protected _overrideDecisionRoot?: InterpreterRuleContext = undefined;

	protected _rootContext!: InterpreterRuleContext;

	
	constructor( old: ParserInterpreter);
	constructor(
		grammarFileName: string,  vocabulary: Vocabulary,
		ruleNames: string[], atn: ATN, input: TokenStream);
	constructor(
		grammarFileName: ParserInterpreter | string, @NotNull vocabulary?: Vocabulary,
		ruleNames?: string[], atn?: ATN, input?: TokenStream) {
		super(grammarFileName instanceof ParserInterpreter ? grammarFileName.inputStream : input!);
		if (grammarFileName instanceof ParserInterpreter) {
			let old: ParserInterpreter = grammarFileName;
			this._grammarFileName = old._grammarFileName;
			this._atn = old._atn;
			this.pushRecursionContextStates = old.pushRecursionContextStates;
			this._ruleNames = old._ruleNames;
			this._vocabulary = old._vocabulary;
			this.interpreter = new ParserATNSimulator(this._atn, this);
		} else {
			
			vocabulary = vocabulary!;
			ruleNames = ruleNames!;
			atn = atn!;

			this._grammarFileName = grammarFileName;
			this._atn = atn;
			this._ruleNames = ruleNames.slice(0);
			this._vocabulary = vocabulary;

			
			this.pushRecursionContextStates = new BitSet(atn.states.length);
			for (let state of atn.states) {
				if (!(state instanceof StarLoopEntryState)) {
					continue;
				}

				if (state.precedenceRuleDecision) {
					this.pushRecursionContextStates.set(state.stateNumber);
				}
			}

			
			this.interpreter = new ParserATNSimulator(atn, this);
		}
	}

	@Override
	public reset(resetInput?: boolean): void {
		if (resetInput === undefined) {
			super.reset();
		} else {
			super.reset(resetInput);
		}

		this.overrideDecisionReached = false;
		this._overrideDecisionRoot = undefined;
	}

	@Override
	get atn(): ATN {
		return this._atn;
	}

	@Override
	get vocabulary(): Vocabulary {
		return this._vocabulary;
	}

	@Override
	get ruleNames(): string[] {
		return this._ruleNames;
	}

	@Override
	get grammarFileName(): string {
		return this._grammarFileName;
	}

	
	public parse(startRuleIndex: number): ParserRuleContext {
		let startRuleStartState: RuleStartState = this._atn.ruleToStartState[startRuleIndex];

		this._rootContext = this.createInterpreterRuleContext(undefined, ATNState.INVALID_STATE_NUMBER, startRuleIndex);
		if (startRuleStartState.isPrecedenceRule) {
			this.enterRecursionRule(this._rootContext, startRuleStartState.stateNumber, startRuleIndex, 0);
		}
		else {
			this.enterRule(this._rootContext, startRuleStartState.stateNumber, startRuleIndex);
		}

		while (true) {
			let p: ATNState = this.atnState;
			switch (p.stateType) {
			case ATNStateType.RULE_STOP:
				
				if (this._ctx.isEmpty) {
					if (startRuleStartState.isPrecedenceRule) {
						let result: ParserRuleContext = this._ctx;
						let parentContext: [ParserRuleContext, number] = this._parentContextStack.pop() !;
						this.unrollRecursionContexts(parentContext[0]);
						return result;
					}
					else {
						this.exitRule();
						return this._rootContext;
					}
				}

				this.visitRuleStopState(p);
				break;

			default:
				try {
					this.visitState(p);
				}
				catch (e) {
					if (e instanceof RecognitionException) {
						this.state = this._atn.ruleToStopState[p.ruleIndex].stateNumber;
						this.context.exception = e;
						this.errorHandler.reportError(this, e);
						this.recover(e);
					} else {
						throw e;
					}
				}

				break;
			}
		}
	}

	@Override
	public enterRecursionRule(localctx: ParserRuleContext, state: number, ruleIndex: number, precedence: number): void {
		this._parentContextStack.push([this._ctx, localctx.invokingState]);
		super.enterRecursionRule(localctx, state, ruleIndex, precedence);
	}

	protected get atnState(): ATNState {
		return this._atn.states[this.state];
	}

	protected visitState(p: ATNState): void {
		let predictedAlt: number = 1;
		if (p.numberOfTransitions > 1) {
			predictedAlt = this.visitDecisionState(p as DecisionState);
		}

		let transition: Transition = p.transition(predictedAlt - 1);
		switch (transition.serializationType) {
		case TransitionType.EPSILON:
			if (this.pushRecursionContextStates.get(p.stateNumber) &&
				!(transition.target instanceof LoopEndState)) {
				
				
				let parentContext = this._parentContextStack[this._parentContextStack.length - 1];
				let localctx: InterpreterRuleContext =
					this.createInterpreterRuleContext(parentContext[0], parentContext[1], this._ctx.ruleIndex);
				this.pushNewRecursionContext(localctx,
					this._atn.ruleToStartState[p.ruleIndex].stateNumber,
					this._ctx.ruleIndex);
			}
			break;

		case TransitionType.ATOM:
			this.match((transition as AtomTransition)._label);
			break;

		case TransitionType.RANGE:
		case TransitionType.SET:
		case TransitionType.NOT_SET:
			if (!transition.matches(this._input.LA(1), Token.MIN_USER_TOKEN_TYPE, 65535)) {
				this.recoverInline();
			}
			this.matchWildcard();
			break;

		case TransitionType.WILDCARD:
			this.matchWildcard();
			break;

		case TransitionType.RULE:
			let ruleStartState: RuleStartState = transition.target as RuleStartState;
			let ruleIndex: number = ruleStartState.ruleIndex;
			let newctx: InterpreterRuleContext = this.createInterpreterRuleContext(this._ctx, p.stateNumber, ruleIndex);
			if (ruleStartState.isPrecedenceRule) {
				this.enterRecursionRule(newctx, ruleStartState.stateNumber, ruleIndex, (transition as RuleTransition).precedence);
			}
			else {
				this.enterRule(newctx, transition.target.stateNumber, ruleIndex);
			}
			break;

		case TransitionType.PREDICATE:
			let predicateTransition: PredicateTransition = transition as PredicateTransition;
			if (!this.sempred(this._ctx, predicateTransition.ruleIndex, predicateTransition.predIndex)) {
				throw new FailedPredicateException(this);
			}

			break;

		case TransitionType.ACTION:
			let actionTransition: ActionTransition = transition as ActionTransition;
			this.action(this._ctx, actionTransition.ruleIndex, actionTransition.actionIndex);
			break;

		case TransitionType.PRECEDENCE:
			if (!this.precpred(this._ctx, (transition as PrecedencePredicateTransition).precedence)) {
				let precedence = (transition as PrecedencePredicateTransition).precedence;
				throw new FailedPredicateException(this, `precpred(_ctx, ${precedence})`);
			}
			break;

		default:
			throw new Error("UnsupportedOperationException: Unrecognized ATN transition type.");
		}

		this.state = transition.target.stateNumber;
	}

	
	protected visitDecisionState(p: DecisionState): number {
		let predictedAlt: number;
		this.errorHandler.sync(this);
		let decision: number = p.decision;
		if (decision === this.overrideDecision && this._input.index === this.overrideDecisionInputIndex && !this.overrideDecisionReached) {
			predictedAlt = this.overrideDecisionAlt;
			this.overrideDecisionReached = true;
		}
		else {
			predictedAlt = this.interpreter.adaptivePredict(this._input, decision, this._ctx);
		}
		return predictedAlt;
	}

	
	protected createInterpreterRuleContext(
		parent: ParserRuleContext | undefined,
		invokingStateNumber: number,
		ruleIndex: number): InterpreterRuleContext {
		return new InterpreterRuleContext(ruleIndex, parent, invokingStateNumber);
	}

	protected visitRuleStopState(p: ATNState): void {
		let ruleStartState: RuleStartState = this._atn.ruleToStartState[p.ruleIndex];
		if (ruleStartState.isPrecedenceRule) {
			let parentContext: [ParserRuleContext, number] = this._parentContextStack.pop()!;
			this.unrollRecursionContexts(parentContext[0]);
			this.state = parentContext[1];
		}
		else {
			this.exitRule();
		}

		let ruleTransition: RuleTransition = this._atn.states[this.state].transition(0) as RuleTransition;
		this.state = ruleTransition.followState.stateNumber;
	}

	
	public addDecisionOverride(decision: number, tokenIndex: number, forcedAlt: number): void {
		this.overrideDecision = decision;
		this.overrideDecisionInputIndex = tokenIndex;
		this.overrideDecisionAlt = forcedAlt;
	}

	get overrideDecisionRoot(): InterpreterRuleContext | undefined {
		return this._overrideDecisionRoot;
	}

	
	protected recover(e: RecognitionException): void {
		let i: number = this._input.index;
		this.errorHandler.recover(this, e);
		if (this._input.index === i) {
			
			let tok: Token | undefined = e.getOffendingToken();
			if (!tok) {
				throw new Error("Expected exception to have an offending token");
			}

			let source = tok.tokenSource;
			let stream = source !== undefined ? source.inputStream : undefined;
			let sourcePair = { source, stream };

			if (e instanceof InputMismatchException) {
				let expectedTokens = e.expectedTokens;
				if (expectedTokens === undefined) {
					throw new Error("Expected the exception to provide expected tokens");
				}

				let expectedTokenType: number = Token.INVALID_TYPE;
				if (!expectedTokens.isNil) {
					
					expectedTokenType = expectedTokens.minElement;
				}

				let errToken: Token =
					this.tokenFactory.create(sourcePair,
						expectedTokenType, tok.text,
						Token.DEFAULT_CHANNEL,
						-1, -1, 
						tok.line, tok.charPositionInLine);
				this._ctx.addErrorNode(this.createErrorNode(this._ctx, errToken));
			}
			else { 
				let source = tok.tokenSource;
				let errToken: Token =
					this.tokenFactory.create(sourcePair,
						Token.INVALID_TYPE, tok.text,
						Token.DEFAULT_CHANNEL,
						-1, -1, 
						tok.line, tok.charPositionInLine);
				this._ctx.addErrorNode(this.createErrorNode(this._ctx, errToken));
			}
		}
	}

	protected recoverInline(): Token {
		return this._errHandler.recoverInline(this);
	}

	
	get rootContext(): InterpreterRuleContext {
		return this._rootContext;
	}
}
