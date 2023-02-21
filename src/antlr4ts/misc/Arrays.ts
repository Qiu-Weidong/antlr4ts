

export namespace Arrays {
	
	export function binarySearch(array: ArrayLike<number>, key: number, fromIndex?: number, toIndex?: number): number {
		return binarySearch0(array, fromIndex !== undefined ? fromIndex : 0, toIndex !== undefined ? toIndex : array.length, key);
	}

	function binarySearch0(array: ArrayLike<number>, fromIndex: number, toIndex: number, key: number): number {
		let low: number = fromIndex;
		let high: number = toIndex - 1;

		while (low <= high) {
			let mid: number = (low + high) >>> 1;
			let midVal: number = array[mid];

			if (midVal < key) {
				low = mid + 1;
			} else if (midVal > key) {
				high = mid - 1;
			} else {
				
				return mid;
			}
		}

		
		return -(low + 1);
	}

	export function toString<T>(array: Iterable<T>) {
		let result = "[";

		let first = true;
		for (let element of array) {
			if (first) {
				first = false;
			} else {
				result += ", ";
			}

			if (element === null) {
				result += "null";
			} else if (element === undefined) {
				result += "undefined";
			} else {
				result += element;
			}
		}

		result += "]";
		return result;
	}
}
