



import { Arrays } from "./Arrays";
import { NotNull, Override } from "../Decorators";
import { JavaCollection } from "./Stubs";

const EMPTY_DATA: Int32Array = new Int32Array(0);

const INITIAL_SIZE: number = 4;
const MAX_ARRAY_SIZE: number = (((1 << 31) >>> 0) - 1) - 8;


export class IntegerList {
	@NotNull
	private _data: Int32Array;

	private _size: number;

	constructor(arg?: number | IntegerList | Iterable<number>) {
		if (!arg) {
			this._data = EMPTY_DATA;
			this._size = 0;
		} else if (arg instanceof IntegerList) {
			this._data = arg._data.slice(0);
			this._size = arg._size;
		} else if (typeof arg === "number") {
			if (arg === 0) {
				this._data = EMPTY_DATA;
				this._size = 0;
			} else {
				this._data = new Int32Array(arg);
				this._size = 0;
			}
		} else {
			
			this._data = EMPTY_DATA;
			this._size = 0;
			for (let value of arg) {
				this.add(value);
			}
		}
	}

	public add(value: number): void {
		if (this._data.length === this._size) {
			this.ensureCapacity(this._size + 1);
		}

		this._data[this._size] = value;
		this._size++;
	}

	public addAll(list: number[] | IntegerList | JavaCollection<number>): void {
		if (Array.isArray(list)) {
			this.ensureCapacity(this._size + list.length);
			this._data.subarray(this._size, this._size + list.length).set(list);
			this._size += list.length;
		} else if (list instanceof IntegerList) {
			this.ensureCapacity(this._size + list._size);
			this._data.subarray(this._size, this._size + list.size).set(list._data);
			this._size += list._size;
		} else {
			
			this.ensureCapacity(this._size + list.size);
			let current: number = 0;
			for (let xi of list) {
				this._data[this._size + current] = xi;
				current++;
			}

			this._size += list.size;
		}
	}

	public get(index: number): number {
		if (index < 0 || index >= this._size) {
			throw RangeError();
		}

		return this._data[index];
	}

	public contains(value: number): boolean {
		for (let i = 0; i < this._size; i++) {
			if (this._data[i] === value) {
				return true;
			}
		}

		return false;
	}

	public set(index: number, value: number): number {
		if (index < 0 || index >= this._size) {
			throw RangeError();
		}

		let previous: number = this._data[index];
		this._data[index] = value;
		return previous;
	}

	public removeAt(index: number): number {
		let value: number = this.get(index);
		this._data.copyWithin(index, index + 1, this._size);
		this._data[this._size - 1] = 0;
		this._size--;
		return value;
	}

	public removeRange(fromIndex: number, toIndex: number): void {
		if (fromIndex < 0 || toIndex < 0 || fromIndex > this._size || toIndex > this._size) {
			throw RangeError();
		}

		if (fromIndex > toIndex) {
			throw RangeError();
		}

		this._data.copyWithin(toIndex, fromIndex, this._size);
		this._data.fill(0, this._size - (toIndex - fromIndex), this._size);
		this._size -= (toIndex - fromIndex);
	}

	get isEmpty(): boolean {
		return this._size === 0;
	}

	get size(): number {
		return this._size;
	}

	public trimToSize(): void {
		if (this._data.length === this._size) {
			return;
		}

		this._data = this._data.slice(0, this._size);
	}

	public clear(): void {
		this._data.fill(0, 0, this._size);
		this._size = 0;
	}

	public toArray(): number[] {
		if (this._size === 0) {
			return [];
		}

		return Array.from(this._data.subarray(0, this._size));
	}

	public sort(): void {
		this._data.subarray(0, this._size).sort();
	}

	
	@Override
	public equals(o: any): boolean {
		if (o === this) {
			return true;
		}

		if (!(o instanceof IntegerList)) {
			return false;
		}

		if (this._size !== o._size) {
			return false;
		}

		for (let i = 0; i < this._size; i++) {
			if (this._data[i] !== o._data[i]) {
				return false;
			}
		}

		return true;
	}

	
	@Override
	public hashCode(): number {
		let hashCode: number = 1;
		for (let i = 0; i < this._size; i++) {
			hashCode = 31 * hashCode + this._data[i];
		}

		return hashCode;
	}

	
	@Override
	public toString(): string {
		return this._data.toString();
	}

	public binarySearch(key: number, fromIndex?: number, toIndex?: number): number {
		if (fromIndex === undefined) {
			fromIndex = 0;
		}

		if (toIndex === undefined) {
			toIndex = this._size;
		}

		if (fromIndex < 0 || toIndex < 0 || fromIndex > this._size || toIndex > this._size) {
			throw new RangeError();
		}

		if (fromIndex > toIndex) {
			throw new RangeError();
		}

		return Arrays.binarySearch(this._data, key, fromIndex, toIndex);
	}

	private ensureCapacity(capacity: number): void {
		if (capacity < 0 || capacity > MAX_ARRAY_SIZE) {
			throw new RangeError();
		}

		let newLength: number;
		if (this._data.length === 0) {
			newLength = INITIAL_SIZE;
		} else {
			newLength = this._data.length;
		}

		while (newLength < capacity) {
			newLength = newLength * 2;
			if (newLength < 0 || newLength > MAX_ARRAY_SIZE) {
				newLength = MAX_ARRAY_SIZE;
			}
		}

		let tmp = new Int32Array(newLength);
		tmp.set(this._data);
		this._data = tmp;
	}

	
	public toCharArray(): Uint16Array {
		
		let resultArray: Uint16Array = new Uint16Array(this._size);
		let resultIdx = 0;
		let calculatedPreciseResultSize = false;
		for (let i = 0; i < this._size; i++) {
			let codePoint = this._data[i];
			if (codePoint >= 0 && codePoint < 0x10000) {
				resultArray[resultIdx] = codePoint;
				resultIdx++;
				continue;
			}

			
			if (!calculatedPreciseResultSize) {
				let newResultArray = new Uint16Array(this.charArraySize());
				newResultArray.set(resultArray, 0);
				resultArray = newResultArray;
				calculatedPreciseResultSize = true;
			}

			
			let pair = String.fromCodePoint(codePoint);
			resultArray[resultIdx] = pair.charCodeAt(0);
			resultArray[resultIdx + 1] = pair.charCodeAt(1);
			resultIdx += 2;
		}
		return resultArray;
	}

	private charArraySize(): number {
		let result = 0;
		for (let i = 0; i < this._size; i++) {
			result += this._data[i] >= 0x10000 ? 2 : 1;
		}
		return result;
	}
}
