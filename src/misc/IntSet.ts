




export interface IntSet {
	
	add(el: number): void;

	
	
	addAll( set: IntSet): IntSet;

	
	and(a: IntSet): IntSet;

	
	complement(elements: IntSet): IntSet;

	
	
	or( a: IntSet): IntSet;

	
	
	subtract( a: IntSet): IntSet;

	
	readonly size: number;

	
	readonly isNil: boolean;

	
	
	equals(obj: any): boolean;

	
	contains(el: number): boolean;

	
	remove(el: number): void;

	
	
	toArray(): number[];

	
	
	toString(): string;
}
