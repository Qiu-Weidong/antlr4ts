




export interface EqualityComparator<T> {

	
	hashCode(obj: T): number;

	
	equals(a: T, b: T): boolean;

}
