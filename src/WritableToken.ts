



import { Token } from "./Token";

export interface WritableToken extends Token {
	text: string | undefined;

	type: number;

	line: number;

	charPositionInLine: number;

	channel: number;

	tokenIndex: number;
}
