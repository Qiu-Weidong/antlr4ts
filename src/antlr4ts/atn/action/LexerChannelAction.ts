



import { Lexer } from "../../Lexer";
import { LexerAction } from "./LexerAction";
import { LexerActionType } from "./LexerActionType";
import { MurmurHash } from "../../misc/MurmurHash";
import { NotNull, Override } from "../../Decorators";


export class LexerChannelAction implements LexerAction {
	private readonly _channel: number;

	
	constructor(channel: number) {
		this._channel = channel;
	}

	
	get channel(): number {
		return this._channel;
	}

	
	@Override
	get actionType(): LexerActionType {
		return LexerActionType.CHANNEL;
	}

	
	@Override
	get isPositionDependent(): boolean {
		return false;
	}

	
	@Override
	public execute(@NotNull lexer: Lexer): void {
		lexer.channel = this._channel;
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		hash = MurmurHash.update(hash, this.actionType);
		hash = MurmurHash.update(hash, this._channel);
		return MurmurHash.finish(hash, 2);
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof LexerChannelAction)) {
			return false;
		}

		return this._channel === obj._channel;
	}

	@Override
	public toString(): string {
		return `channel(${this._channel})`;
	}
}
