

import * as assert from "assert";
import { CharStream } from "./CharStream";
import { CodePointBuffer } from "./CodePointBuffer";
import { IntStream } from "./IntStream";
import { Interval } from "./misc/Interval";
import { Override } from "./Decorators";


export class CodePointCharStream implements CharStream {
	private readonly _array: Uint8Array | Uint16Array | Int32Array;
	private readonly _size: number;
	private readonly _name: string;

	private _position: number;

	
	
	protected constructor(array: Uint8Array | Uint16Array | Int32Array, position: number, remaining: number, name: string) {
		
		assert(position === 0);
		this._array = array;
		this._size = remaining;
		this._name = name;
		this._position = 0;
	}

	public get internalStorage(): Uint8Array | Uint16Array | Int32Array {
		return this._array;
	}

	
	public static fromBuffer(codePointBuffer: CodePointBuffer): CodePointCharStream;

	
	public static fromBuffer(codePointBuffer: CodePointBuffer, name: string): CodePointCharStream;
	public static fromBuffer(codePointBuffer: CodePointBuffer, name?: string): CodePointCharStream {
		if (name === undefined || name.length === 0) {
			name = IntStream.UNKNOWN_SOURCE_NAME;
		}

		
		//
		
		
		
		//
		
		
		
		
		return new CodePointCharStream(
			codePointBuffer.array(),
			codePointBuffer.position,
			codePointBuffer.remaining,
			name);
	}

	@Override
	public consume(): void {
		if (this._size - this._position === 0) {
			assert(this.LA(1) === IntStream.EOF);
			throw new RangeError("cannot consume EOF");
		}

		this._position++;
	}

	@Override
	public get index(): number {
		return this._position;
	}

	@Override
	public get size(): number {
		return this._size;
	}

	
	@Override
	public mark(): number {
		return -1;
	}

	@Override
	public release(marker: number): void {
		
	}

	@Override
	public seek(index: number): void {
		this._position = index;
	}

	@Override
	public get sourceName(): string {
		return this._name;
	}

	@Override
	public toString(): string {
		return this.getText(Interval.of(0, this.size - 1));
	}

	@Override
	public LA(i: number): number {
		let offset: number;
		switch (Math.sign(i)) {
			case -1:
				offset = this.index + i;
				if (offset < 0) {
					return IntStream.EOF;
				}

				return this._array[offset];

			case 0:
				
				return 0;

			case 1:
				offset = this.index + i - 1;
				if (offset >= this.size) {
					return IntStream.EOF;
				}

				return this._array[offset];
		}

		throw new RangeError("Not reached");
	}

	
	@Override
	public getText(interval: Interval): string {
		const startIdx: number = Math.min(interval.a, this.size);
		const len: number = Math.min(interval.b - interval.a + 1, this.size - startIdx);

		if (this._array instanceof Int32Array) {
			return String.fromCodePoint(...Array.from(this._array.subarray(startIdx, startIdx + len)));
		} else {
			return String.fromCharCode(...Array.from(this._array.subarray(startIdx, startIdx + len)));
		}
	}
}
