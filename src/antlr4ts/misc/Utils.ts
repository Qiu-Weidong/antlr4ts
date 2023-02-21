







import { NotNull } from "../Decorators";
import { Equatable } from "./Stubs";
import { IntegerList } from "./IntegerList";

export function escapeWhitespace(s: string, escapeSpaces: boolean): string {
	return escapeSpaces ? s.replace(/ /, "\u00B7") : s
		.replace(/\t/, "\\t")
		.replace(/\n/, "\\n")
		.replace(/\r/, "\\r");
}


export function join(collection: Iterable<any>, separator: string): string {
	let buf = "";
	let first = true;
	for (let current of collection) {
		if (first) {
			first = false;
		} else {
			buf += separator;
		}

		buf += current;
	}

	return buf;
}

export function equals(x: Equatable | undefined, y: Equatable | undefined): boolean {
	if (x === y) {
		return true;
	}

	if (x === undefined || y === undefined) {
		return false;
	}

	return x.equals(y);
}















































































































export function toMap(keys: string[]): Map<string, number> {
	let m: Map<string, number> = new Map<string, number>();
	for (let i = 0; i < keys.length; i++) {
		m.set(keys[i], i);
	}

	return m;
}

export function toCharArray(str: string): Uint16Array;
export function toCharArray(data: IntegerList): Uint16Array;
export function toCharArray(str: string | IntegerList): Uint16Array {
	if (typeof str === "string") {
		let result = new Uint16Array(str.length);
		for (let i = 0; i < str.length; i++) {
			result[i] = str.charCodeAt(i);
		}

		return result;
	} else {
		return str.toCharArray();
	}
}














