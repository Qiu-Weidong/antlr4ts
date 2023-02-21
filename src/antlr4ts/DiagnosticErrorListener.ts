



import { ATNConfig } from "./atn/config/ATNConfig";
import { BitSet } from "./misc/BitSet";
import { DFA } from "./dfa/DFA";
import { Parser } from "./Parser";
import { ParserErrorListener } from "./ParserErrorListener";
import { RecognitionException } from "./exception/RecognitionException";
import { Recognizer } from "./Recognizer";
import { Token } from "./Token";
import { Override, NotNull } from "./Decorators";
import { Interval } from "./misc/Interval";
import { ATNConfigSet } from "./atn/config/ATNConfigSet";
import { SimulatorState } from "./atn/state/SimulatorState";


export class DiagnosticErrorListener implements ParserErrorListener {

	
	constructor(protected exactOnly: boolean = true) {
		this.exactOnly = exactOnly;
	}

	@Override
	public syntaxError<T extends Token>(
		
		recognizer: Recognizer<T, any>,
		offendingSymbol: T | undefined,
		line: number,
		charPositionInLine: number,
		
		msg: string,
		e: RecognitionException | undefined): void
	{
		
	}

	@Override
	public reportAmbiguity(
		@NotNull recognizer: Parser,
		@NotNull dfa: DFA,
		startIndex: number,
		stopIndex: number,
		exact: boolean,
		ambigAlts: BitSet | undefined,
		@NotNull configs: ATNConfigSet): void {
		if (this.exactOnly && !exact) {
			return;
		}

		let decision: string = this.getDecisionDescription(recognizer, dfa);
		let conflictingAlts: BitSet = this.getConflictingAlts(ambigAlts, configs);
		let text: string = recognizer.inputStream.getText(Interval.of(startIndex, stopIndex));
		let message: string = `reportAmbiguity d=${decision}: ambigAlts=${conflictingAlts}, input='${text}'`;
		recognizer.notifyErrorListeners(message);
	}

	@Override
	public reportAttemptingFullContext(
		@NotNull recognizer: Parser,
		@NotNull dfa: DFA,
		startIndex: number,
		stopIndex: number,
		conflictingAlts: BitSet | undefined,
		@NotNull conflictState: SimulatorState): void {
		let format: string = "reportAttemptingFullContext d=%s, input='%s'";
		let decision: string = this.getDecisionDescription(recognizer, dfa);
		let text: string = recognizer.inputStream.getText(Interval.of(startIndex, stopIndex));
		let message: string = `reportAttemptingFullContext d=${decision}, input='${text}'`;
		recognizer.notifyErrorListeners(message);
	}

	@Override
	public reportContextSensitivity(
		@NotNull recognizer: Parser,
		@NotNull dfa: DFA,
		startIndex: number,
		stopIndex: number,
		prediction: number,
		@NotNull acceptState: SimulatorState): void {
		let format: string = "reportContextSensitivity d=%s, input='%s'";
		let decision: string = this.getDecisionDescription(recognizer, dfa);
		let text: string = recognizer.inputStream.getText(Interval.of(startIndex, stopIndex));
		let message: string = `reportContextSensitivity d=${decision}, input='${text}'`;
		recognizer.notifyErrorListeners(message);
	}

	protected getDecisionDescription(
		@NotNull recognizer: Parser,
		@NotNull dfa: DFA): string {
		let decision: number = dfa.decision;
		let ruleIndex: number = dfa.atnStartState.ruleIndex;

		let ruleNames: string[] = recognizer.ruleNames;
		if (ruleIndex < 0 || ruleIndex >= ruleNames.length) {
			return decision.toString();
		}

		let ruleName: string = ruleNames[ruleIndex];
		if (!ruleName) {
			return decision.toString();
		}

		return `${decision} (${ruleName})`;
	}

	
	@NotNull
	protected getConflictingAlts(reportedAlts: BitSet | undefined, @NotNull configs: ATNConfigSet): BitSet {
		if (reportedAlts != null) {
			return reportedAlts;
		}

		let result: BitSet = new BitSet();
		for (let config of configs) {
			result.set(config.alt);
		}

		return result;
	}
}
