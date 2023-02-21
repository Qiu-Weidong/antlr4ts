



import { CharStream } from "./CharStream";
import { Token } from "./Token";
import { TokenSource } from "./TokenSource";


export interface TokenFactory {
	
	
	create(
		
		source: { source?: TokenSource, stream?: CharStream },
		type: number,
		text: string | undefined,
		channel: number,
		start: number,
		stop: number,
		line: number,
		charPositionInLine: number): Token;

	
	
	createSimple(type: number, text: string): Token;
}
