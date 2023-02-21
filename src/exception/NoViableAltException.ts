import { ATNConfigSet } from "../atn/config/ATNConfigSet";
import { NotNull } from "../Decorators";
import { Parser } from "../Parser";
import { ParserRuleContext } from "../ParserRuleContext";
import { Recognizer } from "../Recognizer";
import { Token } from "../Token";
import { TokenStream } from "../TokenStream";
import { RecognitionException } from "./RecognitionException";




export class NoViableAltException extends RecognitionException {
	

	
	private _deadEndConfigs?: ATNConfigSet;

	
	@NotNull
	private _startToken: Token;

	constructor( recognizer: Parser);
	constructor(
		
		recognizer: Recognizer<Token, any>,
		
		input: TokenStream,
		
		startToken: Token,
		
		offendingToken: Token,
		deadEndConfigs: ATNConfigSet | undefined,
		
		ctx: ParserRuleContext);

	constructor(
		recognizer: Recognizer<Token, any>,
		input?: TokenStream,
		startToken?: Token,
		offendingToken?: Token,
		deadEndConfigs?: ATNConfigSet,
		ctx?: ParserRuleContext) {
		if (recognizer instanceof Parser) {
			if (input === undefined) {
				input = recognizer.inputStream;
			}

			if (startToken === undefined) {
				startToken = recognizer.currentToken;
			}

			if (offendingToken === undefined) {
				offendingToken = recognizer.currentToken;
			}

			if (ctx === undefined) {
				ctx = recognizer.context;
			}
		}

		super(recognizer, input, ctx);
		this._deadEndConfigs = deadEndConfigs;
		this._startToken = startToken as Token;
		this.setOffendingToken(recognizer, offendingToken);
	}

	get startToken(): Token {
		return this._startToken;
	}

	get deadEndConfigs(): ATNConfigSet | undefined {
		return this._deadEndConfigs;
	}

}
