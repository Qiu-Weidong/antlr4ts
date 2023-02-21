


import { Equatable } from "./Stubs";


export namespace MurmurHash {

	const DEFAULT_SEED: number = 0;

	
	export function initialize(seed: number = DEFAULT_SEED): number {
		return seed;
	}

	
	export function update(hash: number, value: number | string | Equatable | null | undefined): number {
		const c1: number = 0xCC9E2D51;
		const c2: number = 0x1B873593;
		const r1: number = 15;
		const r2: number = 13;
		const m: number = 5;
		const n: number = 0xE6546B64;

		if (value == null) {
			value = 0;
		} else if (typeof value === "string") {
			value = hashString(value);
		} else if (typeof value === "object") {
			value = value.hashCode();
		}

		let k: number = value;
		k = Math.imul(k, c1);
		k = (k << r1) | (k >>> (32 - r1));
		k = Math.imul(k, c2);

		hash = hash ^ k;
		hash = (hash << r2) | (hash >>> (32 - r2));
		hash = Math.imul(hash, m) + n;

		return hash & 0xFFFFFFFF;
	}


	
	export function finish(hash: number, numberOfWords: number): number {
		hash = hash ^ (numberOfWords * 4);
		hash = hash ^ (hash >>> 16);
		hash = Math.imul(hash, 0x85EBCA6B);
		hash = hash ^ (hash >>> 13);
		hash = Math.imul(hash, 0xC2B2AE35);
		hash = hash ^ (hash >>> 16);
		return hash;
	}

	
	export function hashCode<T extends number | string | Equatable>(data: Iterable<T>, seed: number = DEFAULT_SEED): number {
		let hash: number = initialize(seed);
		let length = 0;
		for (let value of data) {
			hash = update(hash, value);
			length++;
		}

		hash = finish(hash, length);
		return hash;
	}

	
	function hashString(str: string): number {
		let len = str.length;
		if (len === 0) {
			return 0;
		}

		let hash = 0;
		for (let i = 0; i < len; i++) {
			let c = str.charCodeAt(i);
			hash = (((hash << 5) >>> 0) - hash) + c;
			hash |= 0;
		}

		return hash;
	}
}
