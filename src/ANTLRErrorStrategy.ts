



import { Parser } from "./Parser";
import { Token } from "./Token";
import { RecognitionException } from "./exception/RecognitionException";


export interface ANTLRErrorStrategy {
	
	reset( recognizer: Parser): void;

	
	recoverInline( recognizer: Parser): Token;

	
	recover( recognizer: Parser,  e: RecognitionException): void;

	
	sync( recognizer: Parser): void;

	
	inErrorRecoveryMode( recognizer: Parser): boolean;

	
	reportMatch( recognizer: Parser): void;

	
	reportError(
		 recognizer: Parser,
		 e: RecognitionException): void;
}
