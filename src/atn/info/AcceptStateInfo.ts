



import { LexerActionExecutor } from "../action/LexerActionExecutor";


export class AcceptStateInfo {
	private readonly _prediction: number;
	private readonly _lexerActionExecutor?: LexerActionExecutor;

	constructor(prediction: number);
	constructor(prediction: number, lexerActionExecutor: LexerActionExecutor | undefined);
	constructor(prediction: number, lexerActionExecutor?: LexerActionExecutor) {
		this._prediction = prediction;
		this._lexerActionExecutor = lexerActionExecutor;
	}

	
	get prediction(): number {
		return this._prediction;
	}

	
	get lexerActionExecutor(): LexerActionExecutor | undefined {
		return this._lexerActionExecutor;
	}
}
