



import { ANTLRErrorStrategy } from "./ANTLRErrorStrategy";
import { ATN } from "./atn/ATN";
import { ATNState } from "./atn/state/ATNState";
import { FailedPredicateException } from "./exception/FailedPredicateException";
import { InputMismatchException } from "./exception/InputMismatchException";
import { IntervalSet } from "./misc/IntervalSet";
import { Parser } from "./Parser";
import { ParserRuleContext } from "./ParserRuleContext";
import { RecognitionException } from "./exception/RecognitionException";
import { RuleContext } from "./RuleContext";
import { TokenStream } from "./TokenStream";
import { Token } from "./Token";
import { TokenFactory } from "./TokenFactory";
import { TokenSource } from "./TokenSource";
import { Vocabulary } from "./Vocabulary";
import { Override, NotNull } from "./Decorators";
import { PredictionContext } from "./atn/context/PredictionContext";
import { ATNStateType } from "./atn/state/ATNStateType";
import { RuleTransition } from "./atn/transition/RuleTransition";
import { NoViableAltException } from "./exception/NoViableAltException";


export class DefaultErrorStrategy implements ANTLRErrorStrategy {
	
	protected errorRecoveryMode: boolean = false;

	
	protected lastErrorIndex: number = -1;

	protected lastErrorStates?: IntervalSet;

	
	protected nextTokensContext?: ParserRuleContext;

	
	protected nextTokensState: number = ATNState.INVALID_STATE_NUMBER;

	
	@Override
	public reset(recognizer: Parser): void {
		this.endErrorCondition(recognizer);
	}

	
	protected beginErrorCondition(@NotNull recognizer: Parser): void {
		this.errorRecoveryMode = true;
	}

	
	@Override
	public inErrorRecoveryMode(recognizer: Parser): boolean {
		return this.errorRecoveryMode;
	}

	
	protected endErrorCondition(@NotNull recognizer: Parser): void {
		this.errorRecoveryMode = false;
		this.lastErrorStates = undefined;
		this.lastErrorIndex = -1;
	}

	
	@Override
	public reportMatch(recognizer: Parser): void {
		this.endErrorCondition(recognizer);
	}

	
	@Override
	public reportError(
		recognizer: Parser,
		e: RecognitionException): void {
		
		
		if (this.inErrorRecoveryMode(recognizer)) {

			return; 
		}
		this.beginErrorCondition(recognizer);
		if (e instanceof NoViableAltException) {
			this.reportNoViableAlternative(recognizer, e);
		}
		else if (e instanceof InputMismatchException) {
			this.reportInputMismatch(recognizer, e);
		}
		else if (e instanceof FailedPredicateException) {
			this.reportFailedPredicate(recognizer, e);
		}
		else {
			console.error(`unknown recognition error type: ${e}`);
			this.notifyErrorListeners(recognizer, e.toString(), e);
		}
	}

	protected notifyErrorListeners(@NotNull recognizer: Parser, message: string, e: RecognitionException): void {
		let offendingToken: Token | null | undefined = e.getOffendingToken(recognizer);
		if (offendingToken === undefined) {
			
			
			offendingToken = null;
		}

		recognizer.notifyErrorListeners(message, offendingToken, e);
	}

	
	@Override
	public recover(recognizer: Parser, e: RecognitionException): void {





		if (this.lastErrorIndex === recognizer.inputStream.index &&
			this.lastErrorStates &&
			this.lastErrorStates.contains(recognizer.state)) {
			
			
			
			



			recognizer.consume();
		}
		this.lastErrorIndex = recognizer.inputStream.index;
		if (!this.lastErrorStates) {
			this.lastErrorStates = new IntervalSet();
		}
		this.lastErrorStates.add(recognizer.state);
		let followSet: IntervalSet = this.getErrorRecoverySet(recognizer);
		this.consumeUntil(recognizer, followSet);
	}

	
	@Override
	public sync(recognizer: Parser): void {
		let s: ATNState = recognizer.interpreter.atn.states[recognizer.state];

		
		if (this.inErrorRecoveryMode(recognizer)) {
			return;
		}

		let tokens: TokenStream = recognizer.inputStream;
		let la: number = tokens.LA(1);

		
		let nextTokens: IntervalSet = recognizer.atn.nextTokens(s);
		if (nextTokens.contains(la)) {
			
			this.nextTokensContext = undefined;
			this.nextTokensState = ATNState.INVALID_STATE_NUMBER;
			return;
		}

		if (nextTokens.contains(Token.EPSILON)) {
			if (this.nextTokensContext === undefined) {
				
				
				this.nextTokensContext = recognizer.context;
				this.nextTokensState = recognizer.state;
			}

			return;
		}

		switch (s.stateType) {
		case ATNStateType.BLOCK_START:
		case ATNStateType.STAR_BLOCK_START:
		case ATNStateType.PLUS_BLOCK_START:
		case ATNStateType.STAR_LOOP_ENTRY:
			
			if (this.singleTokenDeletion(recognizer)) {
				return;
			}

			throw new InputMismatchException(recognizer);

		case ATNStateType.PLUS_LOOP_BACK:
		case ATNStateType.STAR_LOOP_BACK:

			this.reportUnwantedToken(recognizer);
			let expecting: IntervalSet = recognizer.getExpectedTokens();
			let whatFollowsLoopIterationOrRule: IntervalSet =
				expecting.or(this.getErrorRecoverySet(recognizer));
			this.consumeUntil(recognizer, whatFollowsLoopIterationOrRule);
			break;

		default:
			
			break;
		}
	}

	
	protected reportNoViableAlternative(
		@NotNull recognizer: Parser,
		@NotNull e: NoViableAltException): void {
		let tokens: TokenStream = recognizer.inputStream;
		let input: string;
		if (tokens) {
			if (e.startToken.type === Token.EOF) {
				input = "<EOF>";
			} else {
				input = tokens.getTextFromRange(e.startToken, e.getOffendingToken());
			}
		}
		else {
			input = "<unknown input>";
		}
		let msg: string = "no viable alternative at input " + this.escapeWSAndQuote(input);
		this.notifyErrorListeners(recognizer, msg, e);
	}

	
	protected reportInputMismatch(
		@NotNull recognizer: Parser,
		@NotNull e: InputMismatchException): void {
		let expected = e.expectedTokens;
		let expectedString = expected ? expected.toStringVocabulary(recognizer.vocabulary) : "";
		let msg: string = "mismatched input " + this.getTokenErrorDisplay(e.getOffendingToken(recognizer)) +
			" expecting " + expectedString;
		this.notifyErrorListeners(recognizer, msg, e);
	}

	
	protected reportFailedPredicate(
		@NotNull recognizer: Parser,
		@NotNull e: FailedPredicateException): void {
		let ruleName: string = recognizer.ruleNames[recognizer.context.ruleIndex];
		let msg: string = "rule " + ruleName + " " + e.message;
		this.notifyErrorListeners(recognizer, msg, e);
	}

	
	protected reportUnwantedToken(@NotNull recognizer: Parser): void {
		if (this.inErrorRecoveryMode(recognizer)) {
			return;
		}

		this.beginErrorCondition(recognizer);

		let t: Token = recognizer.currentToken;
		let tokenName: string = this.getTokenErrorDisplay(t);
		let expecting: IntervalSet = this.getExpectedTokens(recognizer);
		let msg: string = "extraneous input " + tokenName + " expecting " +
			expecting.toStringVocabulary(recognizer.vocabulary);
		recognizer.notifyErrorListeners(msg, t, undefined);
	}

	
	protected reportMissingToken(@NotNull recognizer: Parser): void {
		if (this.inErrorRecoveryMode(recognizer)) {
			return;
		}

		this.beginErrorCondition(recognizer);

		let t: Token = recognizer.currentToken;
		let expecting: IntervalSet = this.getExpectedTokens(recognizer);
		let msg: string = "missing " + expecting.toStringVocabulary(recognizer.vocabulary) +
			" at " + this.getTokenErrorDisplay(t);

		recognizer.notifyErrorListeners(msg, t, undefined);
	}

	
	@Override
	public recoverInline(recognizer: Parser): Token {
		
		let matchedSymbol = this.singleTokenDeletion(recognizer);
		if (matchedSymbol) {
			
			
			recognizer.consume();
			return matchedSymbol;
		}

		
		if (this.singleTokenInsertion(recognizer)) {
			return this.getMissingSymbol(recognizer);
		}

		
		if (this.nextTokensContext === undefined) {
			throw new InputMismatchException(recognizer);
		} else {
			throw new InputMismatchException(recognizer, this.nextTokensState, this.nextTokensContext);
		}
	}

	
	protected singleTokenInsertion(@NotNull recognizer: Parser): boolean {
		let currentSymbolType: number = recognizer.inputStream.LA(1);
		
		
		
		let currentState = recognizer.interpreter.atn.states[recognizer.state];
		let next: ATNState = currentState.transition(0).target;
		let atn: ATN = recognizer.interpreter.atn;
		let expectingAtLL2: IntervalSet = atn.nextTokens(next, PredictionContext.fromRuleContext(atn, recognizer.context));

		if (expectingAtLL2.contains(currentSymbolType)) {
			this.reportMissingToken(recognizer);
			return true;
		}
		return false;
	}

	
	protected singleTokenDeletion(@NotNull recognizer: Parser): Token | undefined {
		let nextTokenType: number = recognizer.inputStream.LA(2);
		let expecting: IntervalSet = this.getExpectedTokens(recognizer);
		if (expecting.contains(nextTokenType)) {
			this.reportUnwantedToken(recognizer);
			
			recognizer.consume(); 
			
			let matchedSymbol: Token = recognizer.currentToken;
			this.reportMatch(recognizer);  
			return matchedSymbol;
		}
		return undefined;
	}

	
	@NotNull
	protected getMissingSymbol(@NotNull recognizer: Parser): Token {
		let currentSymbol: Token = recognizer.currentToken;
		let expecting: IntervalSet = this.getExpectedTokens(recognizer);
		let expectedTokenType: number = Token.INVALID_TYPE;
		if (!expecting.isNil) {
			
			expectedTokenType = expecting.minElement;
		}

		let tokenText: string;
		if (expectedTokenType === Token.EOF) {
			tokenText = "<missing EOF>";
		} else {
			tokenText = "<missing " + recognizer.vocabulary.getDisplayName(expectedTokenType) + ">";
		}
		let current: Token = currentSymbol;
		let lookback = recognizer.inputStream.tryLT(-1);
		if (current.type === Token.EOF && lookback != null) {
			current = lookback;
		}

		return this.constructToken(recognizer.inputStream.tokenSource, expectedTokenType, tokenText, current);
	}

	protected constructToken(
		tokenSource: TokenSource,
		expectedTokenType: number,
		tokenText: string,
		current: Token): Token {
		let factory: TokenFactory = tokenSource.tokenFactory;
		let x = current.tokenSource;
		let stream = x ? x.inputStream : undefined;

		return factory.create(
			{ source: tokenSource, stream },
			expectedTokenType, tokenText,
			Token.DEFAULT_CHANNEL,
			-1, -1,
			current.line, current.charPositionInLine);
	}

	@NotNull
	protected getExpectedTokens(@NotNull recognizer: Parser): IntervalSet {
		return recognizer.getExpectedTokens();
	}

	
	protected getTokenErrorDisplay(t: Token | undefined): string {
		if (!t) {
			return "<no token>";
		}
		let s = this.getSymbolText(t);
		if (!s) {
			if (this.getSymbolType(t) === Token.EOF) {
				s = "<EOF>";
			} else {
				s = `<${this.getSymbolType(t)}>`;
			}
		}
		return this.escapeWSAndQuote(s);
	}

	protected getSymbolText(@NotNull symbol: Token): string | undefined {
		return symbol.text;
	}

	protected getSymbolType(@NotNull symbol: Token): number {
		return symbol.type;
	}

	@NotNull
	protected escapeWSAndQuote(@NotNull s: string): string {

		s = s.replace("\n", "\\n");
		s = s.replace("\r", "\\r");
		s = s.replace("\t", "\\t");
		return "'" + s + "'";
	}

	
	@NotNull
	protected getErrorRecoverySet(@NotNull recognizer: Parser): IntervalSet {
		let atn: ATN = recognizer.interpreter.atn;
		let ctx: RuleContext | undefined = recognizer.context;
		let recoverSet: IntervalSet = new IntervalSet();
		while (ctx && ctx.invokingState >= 0) {
			
			let invokingState: ATNState = atn.states[ctx.invokingState];
			let rt = invokingState.transition(0) as RuleTransition;
			let follow: IntervalSet = atn.nextTokens(rt.followState);
			recoverSet.addAll(follow);
			ctx = ctx._parent;
		}
		recoverSet.remove(Token.EPSILON);

		return recoverSet;
	}

	
	protected consumeUntil(@NotNull recognizer: Parser, @NotNull set: IntervalSet): void {

		let ttype: number = recognizer.inputStream.LA(1);
		while (ttype !== Token.EOF && !set.contains(ttype)) {
			

			recognizer.consume();
			ttype = recognizer.inputStream.LA(1);
		}
	}
}
