


import { EqualityComparator } from "./EqualityComparator";
import { Override } from "../Decorators";
import { Equatable } from "./Stubs";


export class ObjectEqualityComparator implements EqualityComparator<Equatable | null | undefined> {
	public static readonly INSTANCE: ObjectEqualityComparator = new ObjectEqualityComparator();

	
	@Override
	public hashCode(obj: Equatable | null | undefined): number {
		if (obj == null) {
			return 0;
		}

		return obj.hashCode();
	}

	
	@Override
	public equals(a: Equatable | null | undefined, b: Equatable | null | undefined): boolean {
		if (a == null) {
			return b == null;
		}

		return a.equals(b);
	}

}
