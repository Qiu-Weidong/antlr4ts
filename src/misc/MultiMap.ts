



export class MultiMap<K, V> extends Map<K, V[]> {
	constructor() {
		super();
	}

	public map(key: K, value: V): void {
		let elementsForKey = super.get(key);
		if (!elementsForKey) {
			elementsForKey = [] as V[];
			super.set(key, elementsForKey);
		}
		elementsForKey.push(value);
	}

	public getPairs(): Array<[K, V]> {
		let pairs: Array<[K, V]> = [];
		this.forEach((values: V[], key: K) => {
			values.forEach((v) => {
				pairs.push([key, v]);
			});
		});
		return pairs;
	}
}
