



import { BitSet } from "../../misc/BitSet";
import { Override } from "../../Decorators";
import * as Utils from "../../misc/Utils";


export class ConflictInfo {
	private _conflictedAlts: BitSet;

	private exact: boolean;

	constructor(conflictedAlts: BitSet, exact: boolean) {
		this._conflictedAlts = conflictedAlts;
		this.exact = exact;
	}

	
	get conflictedAlts(): BitSet {
		return this._conflictedAlts;
	}

	
	get isExact(): boolean {
		return this.exact;
	}

	@Override
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof ConflictInfo)) {
			return false;
		}

		return this.isExact === obj.isExact
			&& Utils.equals(this.conflictedAlts, obj.conflictedAlts);
	}

	@Override
	public hashCode(): number {
		return this.conflictedAlts.hashCode();
	}
}
