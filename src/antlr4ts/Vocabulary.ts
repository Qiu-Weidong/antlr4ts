




export interface Vocabulary {

	
	readonly maxTokenType: number;

	
	getLiteralName(tokenType: number): string | undefined;

	
	getSymbolicName(tokenType: number): string | undefined;

	
	
	getDisplayName(tokenType: number): string;

}
