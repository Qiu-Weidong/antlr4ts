



import { NotNull, Override } from "./Decorators";
import { Token } from "./Token";
import { Vocabulary } from "./Vocabulary";


export class VocabularyImpl implements Vocabulary {
	
	@NotNull
	public static readonly EMPTY_VOCABULARY: VocabularyImpl = new VocabularyImpl([], [], []);

	@NotNull
	private readonly literalNames: Array<string | undefined>;
	@NotNull
	private readonly symbolicNames: Array<string | undefined>;
	@NotNull
	private readonly displayNames: Array<string | undefined>;

	private _maxTokenType: number;

	
	constructor(literalNames: Array<string | undefined>, symbolicNames: Array<string | undefined>, displayNames: Array<string | undefined>) {
		this.literalNames = literalNames;
		this.symbolicNames = symbolicNames;
		this.displayNames = displayNames;
		
		this._maxTokenType =
			Math.max(this.displayNames.length,
				Math.max(this.literalNames.length, this.symbolicNames.length)) - 1;
	}

	@Override
	get maxTokenType(): number {
		return this._maxTokenType;
	}

	@Override
	public getLiteralName(tokenType: number): string | undefined {
		if (tokenType >= 0 && tokenType < this.literalNames.length) {
			return this.literalNames[tokenType];
		}

		return undefined;
	}

	@Override
	public getSymbolicName(tokenType: number): string | undefined {
		if (tokenType >= 0 && tokenType < this.symbolicNames.length) {
			return this.symbolicNames[tokenType];
		}

		if (tokenType === Token.EOF) {
			return "EOF";
		}

		return undefined;
	}

	@Override
	@NotNull
	public getDisplayName(tokenType: number): string {
		if (tokenType >= 0 && tokenType < this.displayNames.length) {
			let displayName = this.displayNames[tokenType];
			if (displayName) {
				return displayName;
			}
		}

		let literalName = this.getLiteralName(tokenType);
		if (literalName) {
			return literalName;
		}

		let symbolicName = this.getSymbolicName(tokenType);
		if (symbolicName) {
			return symbolicName;
		}

		return String(tokenType);
	}
}
