

import { Override, NotNull } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";






export class LexerPopModeAction implements LexerAction {
	
	constructor() {
		
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.POP_MODE;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return false;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.popMode();
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.actionType);
		return MurmurHash.finish(hash, 1);
	}

	@Override
	public equals(obj: any): boolean {
		return obj === this;
	}

	@Override
	public toString(): string {
		return "popMode";
	}
}

export namespace LexerPopModeAction {
	
	export const INSTANCE: LexerPopModeAction = new LexerPopModeAction();
}
