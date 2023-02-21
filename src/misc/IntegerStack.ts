



import { IntegerList } from "./IntegerList";


export class IntegerStack extends IntegerList {

	constructor(arg?: number | IntegerStack) {
		super(arg);
	}

	public push(value: number): void {
		this.add(value);
	}

	public pop(): number {
		return this.removeAt(this.size - 1);
	}

	public peek(): number {
		return this.get(this.size - 1);
	}

}
