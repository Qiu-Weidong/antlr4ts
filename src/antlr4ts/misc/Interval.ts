



import { Override } from "../Decorators";
import { Equatable } from "./Stubs";

const INTERVAL_POOL_MAX_VALUE: number = 1000;


export class Interval implements Equatable {
	private static _INVALID: Interval = new Interval(-1, -2);
	static get INVALID(): Interval {
		return Interval._INVALID;
	}

	private static readonly cache: Interval[] = new Array<Interval>(INTERVAL_POOL_MAX_VALUE + 1);

	
	constructor(public a: number, public b: number) {
	}

	
	public static of(a: number, b: number): Interval {
		
		if (a !== b || a < 0 || a > INTERVAL_POOL_MAX_VALUE) {
			return new Interval(a, b);
		}

		if (Interval.cache[a] == null) {
			Interval.cache[a] = new Interval(a, a);
		}

		return Interval.cache[a];
	}

	
	get length(): number {
		if (this.b < this.a) {
			return 0;
		}

		return this.b - this.a + 1;
	}

	@Override
	public equals(o: any): boolean {
		if (o === this) {
			return true;
		}
		else if (!(o instanceof Interval)) {
			return false;
		}

		return this.a === o.a && this.b === o.b;
	}

	@Override
	public hashCode(): number {
		let hash: number = 23;
		hash = hash * 31 + this.a;
		hash = hash * 31 + this.b;
		return hash;
	}

	
	public startsBeforeDisjoint(other: Interval): boolean {
		return this.a < other.a && this.b < other.a;
	}

	
	public startsBeforeNonDisjoint(other: Interval): boolean {
		return this.a <= other.a && this.b >= other.a;
	}

	
	public startsAfter(other: Interval): boolean {
		return this.a > other.a;
	}

	
	public startsAfterDisjoint(other: Interval): boolean {
		return this.a > other.b;
	}

	
	public startsAfterNonDisjoint(other: Interval): boolean {
		return this.a > other.a && this.a <= other.b; 
	}

	
	public disjoint(other: Interval): boolean {
		return this.startsBeforeDisjoint(other) || this.startsAfterDisjoint(other);
	}

	
	public adjacent(other: Interval): boolean {
		return this.a === other.b + 1 || this.b === other.a - 1;
	}

	public properlyContains(other: Interval): boolean {
		return other.a >= this.a && other.b <= this.b;
	}

	
	public union(other: Interval): Interval {
		return Interval.of(Math.min(this.a, other.a), Math.max(this.b, other.b));
	}

	
	public intersection(other: Interval): Interval {
		return Interval.of(Math.max(this.a, other.a), Math.min(this.b, other.b));
	}

	
	public differenceNotProperlyContained(other: Interval): Interval | undefined {
		let diff: Interval | undefined;
		if (other.startsBeforeNonDisjoint(this)) {
			
			diff = Interval.of(Math.max(this.a, other.b + 1), this.b);
		} else if (other.startsAfterNonDisjoint(this)) {
			
			diff = Interval.of(this.a, other.a - 1);
		}

		return diff;
	}

	@Override
	public toString(): string {
		return this.a + ".." + this.b;
	}
}
