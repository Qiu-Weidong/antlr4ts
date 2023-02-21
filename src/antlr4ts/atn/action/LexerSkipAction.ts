

import { Override, NotNull } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";





export class LexerSkipAction implements LexerAction {
	
	constructor() {
		
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.SKIP;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return false;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.skip();
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
		return "skip";
	}
}

export namespace LexerSkipAction {
	
	export const INSTANCE: LexerSkipAction = new LexerSkipAction();
}
