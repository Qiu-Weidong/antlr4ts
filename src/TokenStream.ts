



import { Interval } from "./misc/Interval";
import { IntStream } from "./IntStream";
import { RuleContext } from "./RuleContext";
import { Token } from "./Token";
import { TokenSource } from "./TokenSource";


export interface TokenStream extends IntStream {
	
	LT(k: number): Token;

	
	tryLT(k: number): Token | undefined;

	
	
	get(i: number): Token;

	
	
	readonly tokenSource: TokenSource;

	
	
	getText( interval: Interval): string;

	
	
	getText(): string;

	
	
	getText( ctx: RuleContext): string;

	
	
	getTextFromRange(start: any, stop: any): string;
}
