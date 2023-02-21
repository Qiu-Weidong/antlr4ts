



import { Array2DHashSet } from "../misc/Array2DHashSet";
import { ATN } from "../atn/ATN";
import { ATNState } from "../atn/state/ATNState";
import { DFASerializer } from "./DFASerializer";
import { DFAState } from "./DFAState";
import { LexerDFASerializer } from "./LexerDFASerializer";
import { NotNull } from "../Decorators";
import { ObjectEqualityComparator } from "../misc/ObjectEqualityComparator";
import { Token } from "../Token";
import { Vocabulary } from "../Vocabulary";
import { VocabularyImpl } from "../VocabularyImpl";
import { ATNConfigSet } from "../atn/config/ATNConfigSet";
import { DecisionState } from "../atn/state/DecisionState";
import { StarLoopEntryState } from "../atn/state/StarLoopEntryState";
import { TokensStartState } from "../atn/state/TokensStartState";

export class DFA {
	
	@NotNull
	public readonly states: Array2DHashSet<DFAState> = new Array2DHashSet<DFAState>(ObjectEqualityComparator.INSTANCE);

	public s0: DFAState | undefined;

	public s0full: DFAState | undefined;

	public readonly decision: number;

	
	@NotNull
	public atnStartState: ATNState;
	
	@NotNull
	public atn: ATN;

	private nextStateNumber: number = 0;

	
	private precedenceDfa: boolean;

	
	constructor(atnStartState: TokensStartState);
	
	constructor(atnStartState: DecisionState, decision: number);
	constructor(@NotNull atnStartState: ATNState, decision: number = 0) {
		if (!atnStartState.atn) {
			throw new Error("The ATNState must be associated with an ATN");
		}

		this.atnStartState = atnStartState;
		this.atn = atnStartState.atn;
		this.decision = decision;

		
		
		
		
		let isPrecedenceDfa: boolean = false;
		if (atnStartState instanceof StarLoopEntryState) {
			if (atnStartState.precedenceRuleDecision) {
				isPrecedenceDfa = true;
				this.s0 = new DFAState(new ATNConfigSet());
				this.s0full = new DFAState(new ATNConfigSet());
			}
		}

		this.precedenceDfa = isPrecedenceDfa;
	}

	
	get isPrecedenceDfa(): boolean {
		return this.precedenceDfa;
	}

	
	public getPrecedenceStartState(precedence: number, fullContext: boolean): DFAState | undefined {
		if (!this.isPrecedenceDfa) {
			throw new Error("Only precedence DFAs may contain a precedence start state.");
		}

		
		if (fullContext) {
			return (this.s0full as DFAState).getTarget(precedence);
		}
		else {
			return (this.s0 as DFAState).getTarget(precedence);
		}
	}

	
	public setPrecedenceStartState(precedence: number, fullContext: boolean, startState: DFAState): void {
		if (!this.isPrecedenceDfa) {
			throw new Error("Only precedence DFAs may contain a precedence start state.");
		}

		if (precedence < 0) {
			return;
		}

		if (fullContext) {
			
			(this.s0full as DFAState).setTarget(precedence, startState);
		}
		else {
			
			(this.s0 as DFAState).setTarget(precedence, startState);
		}
	}

	get isEmpty(): boolean {
		if (this.isPrecedenceDfa) {
			
			return this.s0!.getEdgeMap().size === 0 && this.s0full!.getEdgeMap().size === 0;
		}

		return this.s0 == null && this.s0full == null;
	}

	get isContextSensitive(): boolean {
		if (this.isPrecedenceDfa) {
			
			return (this.s0full as DFAState).getEdgeMap().size > 0;
		}

		return this.s0full != null;
	}

	public addState(state: DFAState): DFAState {
		state.stateNumber = this.nextStateNumber++;
		return this.states.getOrAdd(state);
	}

	public toString(): string;
	public toString( vocabulary: Vocabulary): string;
	public toString( vocabulary: Vocabulary, ruleNames: string[] | undefined): string;
	public toString(vocabulary?: Vocabulary, ruleNames?: string[]): string {
		if (!vocabulary) {
			vocabulary = VocabularyImpl.EMPTY_VOCABULARY;
		}

		if (!this.s0) {
			return "";
		}

		let serializer: DFASerializer;
		if (ruleNames) {
			serializer = new DFASerializer(this, vocabulary, ruleNames, this.atnStartState.atn);
		} else {
			serializer = new DFASerializer(this, vocabulary);
		}

		return serializer.toString();
	}

	public toLexerString(): string {
		if (!this.s0) {
			return "";
		}

		let serializer: DFASerializer = new LexerDFASerializer(this);
		return serializer.toString();
	}
}
