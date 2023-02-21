


import { MultiMap } from "../../misc/MultiMap";
import { NotNull, Override } from "../../Decorators";
import { ParseTree } from "../ParseTree";
import { ParseTreePattern } from "./ParseTreePattern";


export class ParseTreeMatch {
	
	private _tree: ParseTree;

	
	private _pattern: ParseTreePattern;

	
	private _labels: MultiMap<string, ParseTree>;

	
	private _mismatchedNode?: ParseTree;

	
	constructor(
		@NotNull tree: ParseTree,
		@NotNull pattern: ParseTreePattern,
		@NotNull labels: MultiMap<string, ParseTree>,
		mismatchedNode: ParseTree | undefined) {
		if (!tree) {
			throw new Error("tree cannot be null");
		}

		if (!pattern) {
			throw new Error("pattern cannot be null");
		}

		if (!labels) {
			throw new Error("labels cannot be null");
		}

		this._tree = tree;
		this._pattern = pattern;
		this._labels = labels;
		this._mismatchedNode = mismatchedNode;
	}

	
	public get(label: string): ParseTree | undefined {
		let parseTrees = this._labels.get(label);
		if (!parseTrees || parseTrees.length === 0) {
			return undefined;
		}

		return parseTrees[parseTrees.length - 1]; 
	}

	
	@NotNull
	public getAll(@NotNull label: string): ParseTree[] {
		const nodes = this._labels.get(label);
		if (!nodes) {
			return [];
		}
		return nodes;
	}

	
	@NotNull
	get labels(): MultiMap<string, ParseTree> {
		return this._labels;
	}

	
	get mismatchedNode(): ParseTree | undefined {
		return this._mismatchedNode;
	}

	
	get succeeded(): boolean {
		return !this._mismatchedNode;
	}

	
	@NotNull
	get pattern(): ParseTreePattern {
		return this._pattern;
	}

	
	@NotNull
	get tree(): ParseTree {
		return this._tree;
	}

	
	@Override
	public toString(): string {
		return `Match ${
			this.succeeded ? "succeeded" : "failed"}; found ${
			this.labels.size} labels`;
	}
}
