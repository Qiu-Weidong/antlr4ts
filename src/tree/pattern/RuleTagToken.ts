



import { CharStream } from "../../CharStream";
import { NotNull, Override } from "../../Decorators";
import { Token } from "../../Token";
import { TokenSource } from "../../TokenSource";


export class RuleTagToken implements Token {
	
	private _ruleName: string;
	
	private bypassTokenType: number;
	
	private _label?: string;

	
	constructor(@NotNull ruleName: string, bypassTokenType: number, label?: string) {
		if (ruleName == null || ruleName.length === 0) {
			throw new Error("ruleName cannot be null or empty.");
		}

		this._ruleName = ruleName;
		this.bypassTokenType = bypassTokenType;
		this._label = label;
	}

	
	@NotNull
	get ruleName(): string {
		return this._ruleName;
	}

	
	get label(): string | undefined {
		return this._label;
	}

	
	@Override
	get channel(): number {
		return Token.DEFAULT_CHANNEL;
	}

	
	@Override
	get text(): string {
		if (this._label != null) {
			return "<" + this._label + ":" + this._ruleName + ">";
		}

		return "<" + this._ruleName + ">";
	}

	
	@Override
	get type(): number {
		return this.bypassTokenType;
	}

	
	@Override
	get line(): number {
		return 0;
	}

	
	@Override
	get charPositionInLine(): number {
		return -1;
	}

	
	@Override
	get tokenIndex(): number {
		return -1;
	}

	
	@Override
	get startIndex(): number {
		return -1;
	}

	
	@Override
	get stopIndex(): number {
		return -1;
	}

	
	@Override
	get tokenSource(): TokenSource | undefined {
		return undefined;
	}

	
	@Override
	get inputStream(): CharStream | undefined {
		return undefined;
	}

	
	@Override
	public toString(): string {
		return this._ruleName + ":" + this.bypassTokenType;
	}
}
