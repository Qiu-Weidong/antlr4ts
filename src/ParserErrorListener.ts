


import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { BitSet } from "./misc/BitSet";
import { DFA } from "./dfa/DFA";
import { Parser } from "./Parser";
import { Token } from "./Token";
import * as Stubs from "./misc/Stubs";
import * as Exception from "./exception/RecognitionException";
import { ATNConfigSet } from "./atn/config/ATNConfigSet";
import { SimulatorState } from "./atn/state/SimulatorState";


export interface ParserErrorListener extends ANTLRErrorListener<Token> {
	
	reportAmbiguity?: (
		
		recognizer: Parser,
		
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		exact: boolean,
		ambigAlts: BitSet | undefined,
		
		configs: ATNConfigSet) => void;

	
	reportAttemptingFullContext?: (
		
		recognizer: Parser,
		
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		conflictingAlts: BitSet | undefined,
		
		conflictState: SimulatorState) => void;

	
	reportContextSensitivity?: (
		
		recognizer: Parser,
		
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		prediction: number,
		
		acceptState: SimulatorState) => void;
}
