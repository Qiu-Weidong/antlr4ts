

import * as assert from "assert";
import * as util from "util";
import { MurmurHash } from "./MurmurHash";


const EMPTY_DATA: Uint16Array = new Uint16Array(0);


function getIndex(bitNumber: number) {
	return bitNumber >>> 4;
}



function unIndex(n: number) {
	return n * 16;
}


function findLSBSet(word: number) {
	let bit = 1;
	for (let i = 0; i < 16; i++) {
		if ((word & bit) !== 0) {
			return i;
		}
		bit = (bit << 1) >>> 0;
	}
	throw new RangeError("No specified bit found");
}

function findMSBSet(word: number) {
	let bit = (1 << 15) >>> 0;
	for (let i = 15; i >= 0; i--) {
		if ((word & bit) !== 0) {
			return i;
		}
		bit = bit >>> 1;
	}
	throw new RangeError("No specified bit found");
}


function bitsFor(fromBit: number, toBit: number): number {
	fromBit &= 0xF;
	toBit &= 0xF;
	if (fromBit === toBit) {
		return (1 << fromBit) >>> 0;
	}
	return ((0xFFFF >>> (15 - toBit)) ^ (0xFFFF >>> (16 - fromBit)));
}


const POP_CNT: Uint8Array = new Uint8Array(65536);
for (let i = 0; i < 16; i++) {
	const stride = (1 << i) >>> 0;
	let index = 0;
	while (index < POP_CNT.length) {
		
		index += stride;

		
		for (let j = 0; j < stride; j++) {
			POP_CNT[index]++;
			index++;
		}
	}
}

export class BitSet implements Iterable<number>{
	private data: Uint16Array;

	
	constructor();

	
	constructor(nbits: number);

	
	constructor(numbers: Iterable<number>);

	
	constructor(arg?: number | Iterable<number>) {
		if (!arg) {
			
			this.data = EMPTY_DATA;
		} else if (typeof arg === "number") {
			if (arg < 0) {
				throw new RangeError("nbits cannot be negative");
			} else {
				this.data = new Uint16Array(getIndex(arg - 1) + 1);
			}
		} else {
			if (arg instanceof BitSet) {
				this.data = arg.data.slice(0); 
			} else {
				let max = -1;
				for (let v of arg) {
					if (max < v) {
						max = v;
					}
				}
				this.data = new Uint16Array(getIndex(max - 1) + 1);
				for (let v of arg) {
					this.set(v);
				}
			}
		}
	}

	
	public and(set: BitSet): void {
		const data = this.data;
		const other = set.data;
		const words = Math.min(data.length, other.length);

		let lastWord = -1;	

		for (let i = 0; i < words; i++) {
			let value = data[i] &= other[i];
			if (value !== 0) {
				lastWord = i;
			}
		}

		if (lastWord === -1) {
			this.data = EMPTY_DATA;
		}

		if (lastWord < data.length - 1) {
			this.data = data.slice(0, lastWord + 1);
		}
	}

	
	public andNot(set: BitSet): void {
		const data = this.data;
		const other = set.data;
		const words = Math.min(data.length, other.length);

		let lastWord = -1;	

		for (let i = 0; i < words; i++) {
			let value = data[i] &= (other[i] ^ 0xFFFF);
			if (value !== 0) {
				lastWord = i;
			}
		}

		if (lastWord === -1) {
			this.data = EMPTY_DATA;
		}

		if (lastWord < data.length - 1) {
			this.data = data.slice(0, lastWord + 1);
		}
	}


	
	public cardinality(): number {
		if (this.isEmpty) {
			return 0;
		}
		const data = this.data;
		const length = data.length;
		let result = 0;

		for (let i = 0; i < length; i++) {
			result += POP_CNT[data[i]];
		}

		return result;
	}

	
	public clear(): void;

	
	public clear(bitIndex: number): void;

	
	public clear(fromIndex: number, toIndex: number): void;
	public clear(fromIndex?: number, toIndex?: number): void {
		if (fromIndex == null) {
			this.data.fill(0);
		} else if (toIndex == null) {
			this.set(fromIndex, false);
		} else {
			this.set(fromIndex, toIndex, false);
		}
	}

	
	public flip(bitIndex: number): void;

	
	public flip(fromIndex: number, toIndex: number): void;
	public flip(fromIndex: number, toIndex?: number): void {
		if (toIndex == null) {
			toIndex = fromIndex;
		}
		if (fromIndex < 0 || toIndex < fromIndex) {
			throw new RangeError();
		}

		let word = getIndex(fromIndex);
		const lastWord = getIndex(toIndex);

		if (word === lastWord) {
			this.data[word] ^= bitsFor(fromIndex, toIndex);
		} else {
			this.data[word++] ^= bitsFor(fromIndex, 15);
			while (word < lastWord) {
				this.data[word++] ^= 0xFFFF;
			}
			this.data[word++] ^= bitsFor(0, toIndex);
		}
	}

	
	public get(bitIndex: number): boolean;

	
	public get(fromIndex: number, toIndex: number): BitSet;
	public get(fromIndex: number, toIndex?: number): boolean | BitSet {
		if (toIndex === undefined) {
			return !!(this.data[getIndex(fromIndex)] & bitsFor(fromIndex, fromIndex));
		} else {
			
			let result = new BitSet(toIndex + 1);
			for (let i = fromIndex; i <= toIndex; i++) {
				result.set(i, this.get(i));
			}
			return result;
		}
	}

	
	public intersects(set: BitSet): boolean {
		let smallerLength = Math.min(this.length(), set.length());
		if (smallerLength === 0) {
			return false;
		}

		let bound = getIndex(smallerLength - 1);
		for (let i = 0; i <= bound; i++) {
			if ((this.data[i] & set.data[i]) !== 0) {
				return true;
			}
		}

		return false;
	}

	
	get isEmpty(): boolean {
		return this.length() === 0;
	}

	
	public length(): number {
		if (!this.data.length) {
			return 0;
		}
		return this.previousSetBit(unIndex(this.data.length) - 1) + 1;
	}

	
	public nextClearBit(fromIndex: number): number {
		if (fromIndex < 0) {
			throw new RangeError("fromIndex cannot be negative");
		}

		const data = this.data;
		const length = data.length;
		let word = getIndex(fromIndex);
		if (word > length) {
			return -1;
		}

		let ignore = 0xFFFF ^ bitsFor(fromIndex, 15);

		if ((data[word] | ignore) === 0xFFFF) {
			word++;
			ignore = 0;
			for (; word < length; word++) {
				if (data[word] !== 0xFFFF) {
					break;
				}
			}
			if (word === length) {
				
				return -1;
			}
		}
		return unIndex(word) + findLSBSet((data[word] | ignore) ^ 0xFFFF);
	}

	
	public nextSetBit(fromIndex: number): number {
		if (fromIndex < 0) {
			throw new RangeError("fromIndex cannot be negative");
		}

		const data = this.data;
		const length = data.length;
		let word = getIndex(fromIndex);
		if (word > length) {
			return -1;
		}
		let mask = bitsFor(fromIndex, 15);

		if ((data[word] & mask) === 0) {
			word++;
			mask = 0xFFFF;
			for (; word < length; word++) {
				if (data[word] !== 0) {
					break;
				}
			}
			if (word >= length) {
				return -1;
			}
		}
		return unIndex(word) + findLSBSet(data[word] & mask);
	}

	
	public or(set: BitSet): void {
		const data = this.data;
		const other = set.data;
		const minWords = Math.min(data.length, other.length);
		const words = Math.max(data.length, other.length);
		const dest = data.length === words ? data : new Uint16Array(words);

		let lastWord = -1;

		

		for (let i = 0; i < minWords; i++) {
			let value = dest[i] = data[i] | other[i];
			if (value !== 0) {
				lastWord = i;
			}
		}

		

		const longer = data.length > other.length ? data : other;
		for (let i = minWords; i < words; i++) {
			let value = dest[i] = longer[i];
			if (value !== 0) {
				lastWord = i;
			}
		}

		if (lastWord === -1) {
			this.data = EMPTY_DATA;
		} else if (dest.length === lastWord + 1) {
			this.data = dest;
		} else {
			this.data = dest.slice(0, lastWord);
		}
	}

	
	public previousClearBit(fromIndex: number): number {
		if (fromIndex < 0) {
			throw new RangeError("fromIndex cannot be negative");
		}

		const data = this.data;
		const length = data.length;
		let word = getIndex(fromIndex);
		if (word >= length) {
			word = length - 1;
		}

		let ignore = 0xFFFF ^ bitsFor(0, fromIndex);

		if ((data[word] | ignore) === 0xFFFF) {
			ignore = 0;
			word--;
			for (; word >= 0; word--) {
				if (data[word] !== 0xFFFF) {
					break;
				}
			}
			if (word < 0) {
				
				return -1;
			}
		}
		return unIndex(word) + findMSBSet((data[word] | ignore) ^ 0xFFFF);
	}


	
	public previousSetBit(fromIndex: number): number {
		if (fromIndex < 0) {
			throw new RangeError("fromIndex cannot be negative");
		}

		const data = this.data;
		const length = data.length;
		let word = getIndex(fromIndex);
		if (word >= length) {
			word = length - 1;
		}

		let mask = bitsFor(0, fromIndex);

		if ((data[word] & mask) === 0) {
			word--;
			mask = 0xFFFF;
			for (; word >= 0; word--) {
				if (data[word] !== 0) {
					break;
				}
			}
			if (word < 0) {
				return -1;
			}
		}
		return unIndex(word) + findMSBSet(data[word] & mask);
	}

	
	public set(bitIndex: number): void;

	
	public set(bitIndex: number, value: boolean): void;

	
	public set(fromIndex: number, toIndex: number): void;

	
	public set(fromIndex: number, toIndex: number, value: boolean): void;
	public set(fromIndex: number, toIndex?: boolean | number, value?: boolean): void {
		if (toIndex === undefined) {
			toIndex = fromIndex;
			value = true;
		} else if (typeof toIndex === "boolean") {
			value = toIndex;
			toIndex = fromIndex;
		}

		if (value === undefined) {
			value = true;
		}

		if (fromIndex < 0 || fromIndex > toIndex) {
			throw new RangeError();
		}

		let word = getIndex(fromIndex);
		let lastWord = getIndex(toIndex);

		if (value && lastWord >= this.data.length) {
			
			let temp = new Uint16Array(lastWord + 1);
			this.data.forEach((value, index) => temp[index] = value);
			this.data = temp;
		} else if (!value) {
			
			if (word >= this.data.length) {
				
				return;
			}
			if (lastWord >= this.data.length) {
				
				lastWord = this.data.length - 1;
				toIndex = this.data.length * 16 - 1;
			}
		}

		if (word === lastWord) {
			this._setBits(word, value, bitsFor(fromIndex, toIndex));
		} else {
			this._setBits(word++, value, bitsFor(fromIndex, 15));
			while (word < lastWord) {
				this.data[word++] = value ? 0xFFFF : 0;
			}
			this._setBits(word, value, bitsFor(0, toIndex));
		}
	}

	private _setBits(word: number, value: boolean, mask: number) {
		if (value) {
			this.data[word] |= mask;
		} else {
			this.data[word] &= 0xFFFF ^ mask;
		}
	}

	
	get size(): number {
		return this.data.byteLength * 8;
	}

	
	
	
	

	
	
	
	

	public hashCode(): number {
		return MurmurHash.hashCode(this.data, 22);
	}

	
	public equals(obj: any): boolean {
		if (obj === this) {
			return true;
		} else if (!(obj instanceof BitSet)) {
			return false;
		}

		const len = this.length();

		if (len !== obj.length()) {
			return false;
		}

		if (len === 0) {
			return true;
		}

		let bound = getIndex(len - 1);
		for (let i = 0; i <= bound; i++) {
			if (this.data[i] !== obj.data[i]) {
				return false;
			}
		}

		return true;
	}

	
	public toString(): string {
		let result = "{";

		let first = true;
		for (let i = this.nextSetBit(0); i >= 0; i = this.nextSetBit(i + 1)) {
			if (first) {
				first = false;
			} else {
				result += ", ";
			}

			result += i;
		}

		result += "}";
		return result;
	}

	
	
	
	
	
	

	
	public xor(set: BitSet): void {
		const data = this.data;
		const other = set.data;
		const minWords = Math.min(data.length, other.length);
		const words = Math.max(data.length, other.length);
		const dest = data.length === words ? data : new Uint16Array(words);

		let lastWord = -1;

		

		for (let i = 0; i < minWords; i++) {
			let value = dest[i] = data[i] ^ other[i];
			if (value !== 0) {
				lastWord = i;
			}
		}

		

		const longer = data.length > other.length ? data : other;
		for (let i = minWords; i < words; i++) {
			let value = dest[i] = longer[i];
			if (value !== 0) {
				lastWord = i;
			}
		}

		if (lastWord === -1) {
			this.data = EMPTY_DATA;
		} else if (dest.length === lastWord + 1) {
			this.data = dest;
		} else {
			this.data = dest.slice(0, lastWord + 1);
		}
	}

	public clone() {
		return new BitSet(this);
	}

	public [Symbol.iterator](): IterableIterator<number> {
		return new BitSetIterator(this.data);
	}

	
	public [(util.inspect as any).custom](): string {
		return "BitSet " + this.toString();
	}
}

class BitSetIterator implements IterableIterator<number>{
	private index = 0;
	private mask = 0xFFFF;

	constructor(private data: Uint16Array) { }

	public next() {
		while (this.index < this.data.length) {
			const bits = this.data[this.index] & this.mask;
			if (bits !== 0) {
				const bitNumber = unIndex(this.index) + findLSBSet(bits);
				this.mask = bitsFor(bitNumber + 1, 15);
				return { done: false, value: bitNumber };
			}
			this.index++;
			this.mask = 0xFFFF;
		}
		return { done: true, value: -1 };
	}

	public [Symbol.iterator](): IterableIterator<number> { return this; }
}
