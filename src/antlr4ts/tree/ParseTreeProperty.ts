



import { ParseTree } from "./ParseTree";


export class ParseTreeProperty<V> {
	private _symbol: symbol;

	constructor(name: string = "ParseTreeProperty") {
		this._symbol = Symbol(name);
	}

	public get(node: ParseTree): V {
		return (node as any)[this._symbol] as V;
	}

	public set(node: ParseTree, value: V): void {
		(node as any)[this._symbol] = value;
	}

	public removeFrom(node: ParseTree): V {
		let result = (node as any)[this._symbol] as V;
		delete (node as any)[this._symbol];
		return result;
	}
}
