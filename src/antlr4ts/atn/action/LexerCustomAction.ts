

import { Override, NotNull } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";






export class LexerCustomAction implements LexerAction {
	private readonly _ruleIndex: number;
	private readonly _actionIndex: number;

	
	constructor(ruleIndex: number, actionIndex: number) {
		this._ruleIndex = ruleIndex;
		this._actionIndex = actionIndex;
	}

	
	get ruleIndex(): number {
		return this._ruleIndex;
	}

	
	get actionIndex(): number {
		return this._actionIndex;
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.CUSTOM;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return true;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.action(undefined, this._ruleIndex, this._actionIndex);
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.actionType);
		hash = MurmurHash.update(hash, this._ruleIndex);
		hash = MurmurHash.update(hash, this._actionIndex);
		return MurmurHash.finish(hash, 3);
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerCustomAction)) {
			return false;
		}

		return this._ruleIndex === obj._ruleIndex
			&& this._actionIndex === obj._actionIndex;
	}
}
