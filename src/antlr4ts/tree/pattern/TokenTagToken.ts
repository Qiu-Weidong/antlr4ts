



import { CommonToken } from "../../CommonToken";
import { NotNull, Override } from "../../Decorators";


export class TokenTagToken extends CommonToken {
	
	@NotNull
	private _tokenName: string;
	
	private _label: string | undefined;

	
	constructor(@NotNull tokenName: string, type: number, label?: string) {
		super(type);
		this._tokenName = tokenName;
		this._label = label;
	}

	
	@NotNull
	get tokenName(): string {
		return this._tokenName;
	}

	
	get label(): string | undefined {
		return this._label;
	}

	
	@Override
	get text(): string {
		if (this._label != null) {
			return "<" + this._label + ":" + this._tokenName + ">";
		}

		return "<" + this._tokenName + ">";
	}

	
	@Override
	public toString(): string {
		return this._tokenName + ":" + this.type;
	}
}
