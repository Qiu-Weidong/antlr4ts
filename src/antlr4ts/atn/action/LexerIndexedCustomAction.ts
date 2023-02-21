



import { Lexer } from "../../Lexer";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";
import { MurmurHash } from "../../misc/MurmurHash";
import { NotNull, Override } from "../../Decorators";


export class LexerIndexedCustomAction implements LexerAction {
	private readonly _offset: number;
	private readonly _action: LexerAction;

	
	constructor(offset: number, @NotNull action: LexerAction) {
		this._offset = offset;
		this._action = action;
	}

	
	get offset(): number {
		return this._offset;
	}

	
	@NotNull
	get action(): LexerAction {
		return this._action;
	}

	
	@Override
	get actionType(): LexerActionType {
		return this._action.actionType;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return true;
	}

	
	@Override
	public execute(lexer: Lexer): void {
		
		this._action.execute(lexer);
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this._offset);
		hash = MurmurHash.update(hash, this._action);
		return MurmurHash.finish(hash, 2);
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerIndexedCustomAction)) {
			return false;
		}

		return this._offset === obj._offset
			&& this._action.equals(obj._action);
	}
}
