



import { Chunk } from "./Chunk";
import { NotNull, Override } from "../../Decorators";


export class TextChunk extends Chunk {
	
	@NotNull
	private _text: string;

	
	constructor(@NotNull text: string) {
		super();

		if (text == null) {
			throw new Error("text cannot be null");
		}

		this._text = text;
	}

	
	@NotNull
	get text(): string {
		return this._text;
	}

	
	@Override
	public toString(): string {
		return "'" + this._text + "'";
	}
}
