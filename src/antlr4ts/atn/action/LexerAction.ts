



import { Equatable } from "../../misc/Stubs";
import { Lexer } from "../../Lexer";
import { LexerActionType } from "./LexerActionType";


export interface LexerAction extends Equatable {
	
	
	readonly actionType: LexerActionType;

	
	readonly isPositionDependent: boolean;

	
	execute( lexer: Lexer): void;
}
