



import { CharStream } from "./CharStream";
import { IntStream } from "./IntStream";
import { TokenSource } from "./TokenSource";
import { TokenStream } from "./TokenStream";


export interface Token {
	
	readonly text: string | undefined;

	
	readonly type: number;

	
	readonly line: number;

	
	readonly charPositionInLine: number;

	
	readonly channel: number;

	
	readonly tokenIndex: number;

	
	readonly startIndex: number;

	
	readonly stopIndex: number;

	
	readonly tokenSource: TokenSource | undefined;

	
	readonly inputStream: CharStream | undefined;
}

export namespace Token {
	export const INVALID_TYPE: number = 0;

	
	export const EPSILON: number = -2;

	export const MIN_USER_TOKEN_TYPE: number = 1;

	export const EOF: number = IntStream.EOF;

	
	export const DEFAULT_CHANNEL: number = 0;

	
	export const HIDDEN_CHANNEL: number = 1;

	
	export const MIN_USER_CHANNEL_VALUE: number = 2;
}
