



export namespace IntStream {
	
	export const EOF: number = -1;

	
	export const UNKNOWN_SOURCE_NAME: string = "<unknown>";
}


export interface IntStream {
	
	consume(): void;

	
	LA(i: number): number;

	
	mark(): number;

	
	release(marker: number): void;

	
	readonly index: number;

	
	seek(index: number): void;

	
	readonly size: number;

	
	
	readonly sourceName: string;
}
