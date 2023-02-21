


import { EqualityComparator } from "./EqualityComparator";
import { Override } from "../Decorators";
import { Equatable } from "./Stubs";
import { MurmurHash } from "./MurmurHash";
import { ObjectEqualityComparator } from "./ObjectEqualityComparator";


export class ArrayEqualityComparator implements EqualityComparator<Equatable[]> {
	public static readonly INSTANCE: ArrayEqualityComparator = new ArrayEqualityComparator();

	
	@Override
	public hashCode(obj: Equatable[]): number {
		if (obj == null) {
			return 0;
		}

		return MurmurHash.hashCode(obj, 0);
	}

	
	@Override
	public equals(a: Equatable[], b: Equatable[]): boolean {
		if (a == null) {
			return b == null;
		} else if (b == null) {
			return false;
		}

		if (a.length !== b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (!ObjectEqualityComparator.INSTANCE.equals(a[i], b[i])) {
				return false;
			}
		}

		return true;
	}

}
