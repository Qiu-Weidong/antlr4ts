

import { EqualityComparator } from "./EqualityComparator";
import { Override } from "../Decorators";
import { Equatable } from "./Stubs";
import { MurmurHash } from "./MurmurHash";
import { ObjectEqualityComparator } from "./ObjectEqualityComparator";


export class DefaultEqualityComparator implements EqualityComparator<any> {
	public static readonly INSTANCE: DefaultEqualityComparator = new DefaultEqualityComparator();

	
	@Override
	public hashCode(obj: any): number {
		if (obj == null) {
			return 0;
		} else if (typeof obj === "string" || typeof obj === "number") {
			return MurmurHash.hashCode([obj]);
		} else {
			return ObjectEqualityComparator.INSTANCE.hashCode(obj as Equatable);
		}
	}

	
	@Override
	public equals(a: any, b: any): boolean {
		if (a == null) {
			return b == null;
		} else if (typeof a === "string" || typeof a === "number") {
			return a === b;
		} else {
			return ObjectEqualityComparator.INSTANCE.equals(a as Equatable, b as Equatable);
		}
	}
}
