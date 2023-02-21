



import { Chunk } from "./Chunk";
import { NotNull, Override } from "../../Decorators";


export class TagChunk extends Chunk {
	
	private _tag: string;
	
	private _label?: string;

	
	constructor(tag: string, label?: string) {
		super();

		if (tag == null || tag.length === 0) {
			throw new Error("tag cannot be null or empty");
		}

		this._tag = tag;
		this._label = label;
	}

	
	@NotNull
	get tag(): string {
		return this._tag;
	}

	
	get label(): string | undefined {
		return this._label;
	}

	
	@Override
	public toString(): string {
		if (this._label != null) {
			return this._label + ":" + this._tag;
		}

		return this._tag;
	}
}
