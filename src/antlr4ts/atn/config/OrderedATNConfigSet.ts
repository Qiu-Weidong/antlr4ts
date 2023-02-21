



import { ATNConfig } from "./ATNConfig";
import { ATNConfigSet } from "./ATNConfigSet";
import { Override } from "../../Decorators";


export class OrderedATNConfigSet extends ATNConfigSet {

	constructor();
	constructor(set: ATNConfigSet, readonly: boolean);
	constructor(set?: ATNConfigSet, readonly?: boolean) {
		if (set != null && readonly != null) {
			super(set, readonly);
		} else {
			super();
		}
	}

	@Override
	public clone(readonly: boolean): ATNConfigSet {
		let copy: OrderedATNConfigSet = new OrderedATNConfigSet(this, readonly);
		if (!readonly && this.isReadOnly) {
			copy.addAll(this);
		}

		return copy;
	}

	@Override
	protected getKey(e: ATNConfig): { state: number, alt: number } {
		
		return { state: 0, alt: e.hashCode() };
	}

	@Override
	protected canMerge(left: ATNConfig, leftKey: { state: number, alt: number }, right: ATNConfig): boolean {
		return left.equals(right);
	}

}
