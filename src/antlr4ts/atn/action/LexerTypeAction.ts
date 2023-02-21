

import { Override, NotNull } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";





export class LexerTypeAction implements LexerAction {
	private readonly _type: number;

	
	constructor(type: number) {
		this._type = type;
	}

	
	get type(): number {
		return this._type;
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.TYPE;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return false;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.type = this._type;
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.actionType);
		hash = MurmurHash.update(hash, this._type);
		return MurmurHash.finish(hash, 2);
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerTypeAction)) {
			return false;
		}

		return this._type === obj._type;
	}

	@Override
	public toString(): string {
		return `type(${this._type})`;
	}
}
