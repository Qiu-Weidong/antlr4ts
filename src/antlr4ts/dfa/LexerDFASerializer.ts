



import { DFA } from "./DFA";
import { DFASerializer } from "./DFASerializer";
import { NotNull, Override } from "../Decorators";
import { VocabularyImpl } from "../VocabularyImpl";

export class LexerDFASerializer extends DFASerializer {
	constructor( @NotNull dfa: DFA) {
		super(dfa, VocabularyImpl.EMPTY_VOCABULARY);
	}

	@Override
	@NotNull
	protected getEdgeLabel(i: number): string {
		return "'" + String.fromCodePoint(i) + "'";
	}
}
