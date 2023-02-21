



import { CharStream } from "./CharStream";
import { Token } from "./Token";
import { TokenFactory } from "./TokenFactory";


export interface TokenSource {
	
	
	nextToken(): Token;

	
	readonly line: number;

	
	readonly charPositionInLine: number;

	
	readonly inputStream: CharStream | undefined;

	
	
	readonly sourceName: string;

	
	
	tokenFactory: TokenFactory;
}
