

import { Override, NotNull } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";





export class LexerModeAction implements LexerAction {
	private readonly _mode: number;

	
	constructor(mode: number) {
		this._mode = mode;
	}

	
	get mode(): number {
		return this._mode;
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.MODE;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return false;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.mode(this._mode);
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.actionType);
		hash = MurmurHash.update(hash, this._mode);
		return MurmurHash.finish(hash, 2);
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerModeAction)) {
			return false;
		}

		return this._mode === obj._mode;
	}

	@Override
	public toString(): string {
		return `mode(${this._mode})`;
	}
}
