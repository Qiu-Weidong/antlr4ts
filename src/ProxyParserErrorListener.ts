


import { ANTLRErrorListener } from "./ANTLRErrorListener";
import { BitSet } from "./misc/BitSet";
import { DFA } from "./dfa/DFA";
import { Parser } from "./Parser";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";
import { ProxyErrorListener } from "./ProxyErrorListener";
import { ParserErrorListener } from "./ParserErrorListener";
import { Token } from "./Token";
import { Override } from "./Decorators";
import { ATNConfigSet } from "./atn/config/ATNConfigSet";
import { SimulatorState } from "./atn/state/SimulatorState";


export class ProxyParserErrorListener extends ProxyErrorListener<Token, ParserErrorListener>
	implements ParserErrorListener {

	constructor(delegates: ParserErrorListener[]) {
		super(delegates);
	}

	@Override
	public reportAmbiguity(
		recognizer: Parser,
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		exact: boolean,
		ambigAlts: BitSet | undefined,
		configs: ATNConfigSet): void {
		this.getDelegates()
			.forEach((listener) => {
				if (listener.reportAmbiguity) {
					listener.reportAmbiguity(
						recognizer,
						dfa,
						startIndex,
						stopIndex,
						exact,
						ambigAlts,
						configs);
				}

			});
	}

	@Override
	public reportAttemptingFullContext(
		recognizer: Parser,
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		conflictingAlts: BitSet | undefined,
		conflictState: SimulatorState): void {
		this.getDelegates()
			.forEach((listener) => {
				if (listener.reportAttemptingFullContext) {
					listener.reportAttemptingFullContext(
						recognizer,
						dfa,
						startIndex,
						stopIndex,
						conflictingAlts,
						conflictState);
				}
			});
	}

	@Override
	public reportContextSensitivity(
		recognizer: Parser,
		dfa: DFA,
		startIndex: number,
		stopIndex: number,
		prediction: number,
		acceptState: SimulatorState): void {
		this.getDelegates()
			.forEach((listener) => {
				if (listener.reportContextSensitivity) {
					listener.reportContextSensitivity(
						recognizer,
						dfa,
						startIndex,
						stopIndex,
						prediction,
						acceptState);
				}
			});
	}
}
