

import { CharStream } from "../../CharStream";
import { NotNull, Override } from "../../Decorators";
import { Lexer } from "../../Lexer";
import { MurmurHash, ArrayEqualityComparator } from "../../misc";
import { LexerAction } from "./LexerAction";
import { LexerIndexedCustomAction } from "./LexerIndexedCustomAction";






export class LexerActionExecutor {
	@NotNull
	private _lexerActions: LexerAction[];

	
	private cachedHashCode: number;

	
	constructor(@NotNull lexerActions: LexerAction[]) {
		this._lexerActions = lexerActions;

		let hash: number = MurmurHash.initialize();
		for (let lexerAction of lexerActions) {
			hash = MurmurHash.update(hash, lexerAction);
		}

		this.cachedHashCode = MurmurHash.finish(hash, lexerActions.length);
	}

	
	@NotNull
	public static append(lexerActionExecutor: LexerActionExecutor | undefined, @NotNull lexerAction: LexerAction): LexerActionExecutor {
		if (!lexerActionExecutor) {
			return new LexerActionExecutor([lexerAction]);
		}

		let lexerActions = lexerActionExecutor._lexerActions.slice(0);
		lexerActions.push(lexerAction);
		return new LexerActionExecutor(lexerActions);
	}

	
	public fixOffsetBeforeMatch(offset: number): LexerActionExecutor {
		let updatedLexerActions: LexerAction[] | undefined;
		for (let i = 0; i < this._lexerActions.length; i++) {
			if (this._lexerActions[i].isPositionDependent && !(this._lexerActions[i] instanceof LexerIndexedCustomAction)) {
				if (!updatedLexerActions) {
					updatedLexerActions = this._lexerActions.slice(0);
				}

				updatedLexerActions[i] = new LexerIndexedCustomAction(offset, this._lexerActions[i]);
			}
		}

		if (!updatedLexerActions) {
			return this;
		}

		return new LexerActionExecutor(updatedLexerActions);
	}

	
	@NotNull
	get lexerActions(): LexerAction[] {
		return this._lexerActions;
	}

	
	public execute(@NotNull lexer: Lexer, input: CharStream, startIndex: number): void {
		let requiresSeek: boolean = false;
		let stopIndex: number = input.index;
		try {
			for (let lexerAction of this._lexerActions) {
				if (lexerAction instanceof LexerIndexedCustomAction) {
					let offset: number = lexerAction.offset;
					input.seek(startIndex + offset);
					lexerAction = lexerAction.action;
					requiresSeek = (startIndex + offset) !== stopIndex;
				} else if (lexerAction.isPositionDependent) {
					input.seek(stopIndex);
					requiresSeek = false;
				}

				lexerAction.execute(lexer);
			}
		} finally {
			if (requiresSeek) {
				input.seek(stopIndex);
			}
		}
	}

	@Override
	public hashCode(): number {
		return this.cachedHashCode;
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerActionExecutor)) {
			return false;
		}

		return this.cachedHashCode === obj.cachedHashCode
			&& ArrayEqualityComparator.INSTANCE.equals(this._lexerActions, obj._lexerActions);
	}
}
