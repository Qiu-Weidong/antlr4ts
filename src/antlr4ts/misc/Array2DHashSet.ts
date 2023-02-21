



import * as assert from "assert";
import { DefaultEqualityComparator } from "./DefaultEqualityComparator";
import { EqualityComparator } from "./EqualityComparator";
import { NotNull, Nullable, Override, SuppressWarnings } from "../Decorators";
import { JavaCollection, JavaSet } from "./Stubs";
import { ObjectEqualityComparator } from "./ObjectEqualityComparator";
import { MurmurHash } from "./MurmurHash";







const INITAL_CAPACITY: number = 16; 
const LOAD_FACTOR: number = 0.75;

export class Array2DHashSet<T extends { toString(): string; }> implements JavaSet<T> {
	@NotNull
	protected comparator: EqualityComparator<T>;

	protected buckets: Array<T[] | undefined>;

	
	protected n: number = 0;

	protected threshold: number = Math.floor(INITAL_CAPACITY * LOAD_FACTOR); 

	constructor(comparator?: EqualityComparator<T>, initialCapacity?: number);
	constructor(set: Array2DHashSet<T>);
	constructor(
		comparatorOrSet?: EqualityComparator<T> | Array2DHashSet<T>,
		initialCapacity: number = INITAL_CAPACITY) {

		if (comparatorOrSet instanceof Array2DHashSet) {
			this.comparator = comparatorOrSet.comparator;
			this.buckets = comparatorOrSet.buckets.slice(0);
			for (let i = 0; i < this.buckets.length; i++) {
				let bucket = this.buckets[i];
				if (bucket) {
					this.buckets[i] = bucket.slice(0);
				}
			}

			this.n = comparatorOrSet.n;
			this.threshold = comparatorOrSet.threshold;
		} else {
			this.comparator = comparatorOrSet || DefaultEqualityComparator.INSTANCE;
			this.buckets = this.createBuckets(initialCapacity);
		}
	}

	
	public getOrAdd(o: T): T {
		if (this.n > this.threshold) {
			this.expand();
		}
		return this.getOrAddImpl(o);
	}

	protected getOrAddImpl(o: T): T {
		let b: number = this.getBucket(o);
		let bucket = this.buckets[b];

		
		if (!bucket) {
			bucket = [o];
			this.buckets[b] = bucket;
			this.n++;
			return o;
		}

		
		for (let existing of bucket) {
			if (this.comparator.equals(existing, o)) {
				return existing; 
			}
		}

		
		bucket.push(o);
		this.n++;
		return o;
	}

	public get(o: T): T | undefined {
		if (o == null) {
			return o;
		}
		let b: number = this.getBucket(o);
		let bucket = this.buckets[b];
		if (!bucket) {
			
			return undefined;
		}

		for (let e of bucket) {
			if (this.comparator.equals(e, o)) {
				return e;
			}
		}

		return undefined;
	}

	protected getBucket(o: T): number {
		let hash: number = this.comparator.hashCode(o);
		let b: number = hash & (this.buckets.length - 1); 
		return b;
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize();
		for (let bucket of this.buckets) {
			if (bucket == null) {
				continue;
			}
			for (let o of bucket) {
				if (o == null) {
					break;
				}
				hash = MurmurHash.update(hash, this.comparator.hashCode(o));
			}
		}

		hash = MurmurHash.finish(hash, this.size);
		return hash;
	}

	@Override
	public equals(o: any): boolean {
		if (o === this) {
			return true;
		}
		if (!(o instanceof Array2DHashSet)) {
			return false;
		}
		if (o.size !== this.size) {
			return false;
		}
		let same: boolean = this.containsAll(o);
		return same;
	}

	protected expand(): void {
		let old = this.buckets;
		let newCapacity: number = this.buckets.length * 2;
		let newTable: Array<T[] | undefined> = this.createBuckets(newCapacity);
		this.buckets = newTable;
		this.threshold = Math.floor(newCapacity * LOAD_FACTOR);

		
		let oldSize: number = this.size;
		for (let bucket of old) {
			if (!bucket) {
				continue;
			}

			for (let o of bucket) {
				let b: number = this.getBucket(o);
				let newBucket: T[] | undefined = this.buckets[b];
				if (!newBucket) {
					newBucket = [];
					this.buckets[b] = newBucket;
				}

				newBucket.push(o);
			}
		}

		assert(this.n === oldSize);
	}

	@Override
	public add(t: T): boolean {
		let existing: T = this.getOrAdd(t);
		return existing === t;
	}

	@Override
	get size(): number {
		return this.n;
	}

	@Override
	get isEmpty(): boolean {
		return this.n === 0;
	}

	@Override
	public contains(o: any): boolean {
		return this.containsFast(this.asElementType(o));
	}

	public containsFast(@Nullable obj: T): boolean {
		if (obj == null) {
			return false;
		}

		return this.get(obj) != null;
	}

	@Override
	public *[Symbol.iterator](): IterableIterator<T> {
		yield* this.toArray();
	}

	@Override
	public toArray(): T[] {
		const a = new Array<T>(this.size);

		
		let i: number = 0; 
		for (let bucket of this.buckets) {
			if (bucket == null) {
				continue;
			}

			for (let o of bucket) {
				if (o == null) {
					break;
				}
				a[i++] = o;
			}
		}
		return a;
	}

	@Override
	public containsAll(collection: JavaCollection<T>): boolean {
		if (collection instanceof Array2DHashSet) {
			let s = collection as any as Array2DHashSet<T>;
			for (let bucket of s.buckets) {
				if (bucket == null) {
					continue;
				}
				for (let o of bucket) {
					if (o == null) {
						break;
					}
					if (!this.containsFast(this.asElementType(o))) {
						return false;
					}
				}
			}
		}
		else {
			for (let o of collection) {
				if (!this.containsFast(this.asElementType(o))) {
					return false;
				}
			}
		}
		return true;
	}

	@Override
	public addAll(c: Iterable<T>): boolean {
		let changed: boolean = false;

		for (let o of c) {
			let existing: T = this.getOrAdd(o);
			if (existing !== o) {
				changed = true;
			}
		}
		return changed;
	}

	@Override
	public clear(): void {
		this.buckets = this.createBuckets(INITAL_CAPACITY);
		this.n = 0;
		this.threshold = Math.floor(INITAL_CAPACITY * LOAD_FACTOR);
	}

	@Override
	public toString(): string {
		if (this.size === 0) {
			return "{}";
		}

		let buf = "{";
		let first: boolean = true;
		for (let bucket of this.buckets) {
			if (bucket == null) {
				continue;
			}
			for (let o of bucket) {
				if (o == null) {
					break;
				}
				if (first) {
					first = false;
				} else {
					buf += ", ";
				}
				buf += o.toString();
			}
		}
		buf += "}";
		return buf;
	}

	public toTableString(): string {
		let buf = "";
		for (let bucket of this.buckets) {
			if (bucket == null) {
				buf += "null\n";
				continue;
			}
			buf += "[";
			let first: boolean = true;
			for (let o of bucket) {
				if (first) {
					first = false;
				} else {
					buf += " ";
				}
				if (o == null) {
					buf += "_";
				} else {
					buf += o.toString();
				}
			}
			buf += "]\n";
		}
		return buf;
	}

	
	@SuppressWarnings("unchecked")
	protected asElementType(o: any): T {
		return o as T;
	}

	
	@SuppressWarnings("unchecked")
	protected createBuckets(capacity: number): Array<T[] | undefined> {
		return new Array<T[]>(capacity);
	}
}
