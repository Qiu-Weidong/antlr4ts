



import { AcceptStateInfo } from "../atn/info/AcceptStateInfo";
import { ATN } from "../atn/ATN";
import { BitSet } from "../misc/BitSet";
import { MurmurHash } from "../misc/MurmurHash";
import { NotNull, Override } from "../Decorators";

import * as assert from "assert";
import { LexerActionExecutor } from "../atn/action/LexerActionExecutor";
import { ATNConfigSet } from "../atn/config/ATNConfigSet";
import { PredictionContext } from "../atn/context/PredictionContext";
import { SemanticContext } from "../atn/context/SemanticContext";


export class DFAState {
	public stateNumber: number = -1;

	@NotNull
	public configs: ATNConfigSet;

	
	@NotNull
	private readonly edges: Map<number, DFAState>;

	private _acceptStateInfo: AcceptStateInfo | undefined;

	
	@NotNull
	private readonly contextEdges: Map<number, DFAState>;

	
	private contextSymbols: BitSet | undefined;

	
	public predicates: DFAState.PredPrediction[] | undefined;

	
	constructor(configs: ATNConfigSet) {
		this.configs = configs;
		this.edges = new Map<number, DFAState>();
		this.contextEdges = new Map<number, DFAState>();
	}

	get isContextSensitive(): boolean {
		return !!this.contextSymbols;
	}

	public isContextSymbol(symbol: number): boolean {
		if (!this.isContextSensitive) {
			return false;
		}

		return this.contextSymbols!.get(symbol);
	}

	public setContextSymbol(symbol: number): void {
		assert(this.isContextSensitive);
		this.contextSymbols!.set(symbol);
	}

	public setContextSensitive(atn: ATN): void {
		assert(!this.configs.isOutermostConfigSet);
		if (this.isContextSensitive) {
			return;
		}

		if (!this.contextSymbols) {
			this.contextSymbols = new BitSet();
		}
	}

	get acceptStateInfo(): AcceptStateInfo | undefined {
		return this._acceptStateInfo;
	}

	set acceptStateInfo(acceptStateInfo: AcceptStateInfo | undefined) {
		this._acceptStateInfo = acceptStateInfo;
	}

	get isAcceptState(): boolean {
		return !!this._acceptStateInfo;
	}

	get prediction(): number {
		if (!this._acceptStateInfo) {
			return ATN.INVALID_ALT_NUMBER;
		}

		return this._acceptStateInfo.prediction;
	}

	get lexerActionExecutor(): LexerActionExecutor | undefined {
		if (!this._acceptStateInfo) {
			return undefined;
		}

		return this._acceptStateInfo.lexerActionExecutor;
	}

	public getTarget(symbol: number): DFAState | undefined {
		return this.edges.get(symbol);
	}

	public setTarget(symbol: number, target: DFAState): void {
		this.edges.set(symbol, target);
	}

	public getEdgeMap(): Map<number, DFAState> {
		return this.edges;
	}

	public getContextTarget(invokingState: number): DFAState | undefined {
		if (invokingState === PredictionContext.EMPTY_FULL_STATE_KEY) {
			invokingState = -1;
		}

		return this.contextEdges.get(invokingState);
	}

	public setContextTarget(invokingState: number, target: DFAState): void {
		if (!this.isContextSensitive) {
			throw new Error("The state is not context sensitive.");
		}

		if (invokingState === PredictionContext.EMPTY_FULL_STATE_KEY) {
			invokingState = -1;
		}

		this.contextEdges.set(invokingState, target);
	}

	public getContextEdgeMap(): Map<number, DFAState> {
		let map = new Map<number, DFAState>(this.contextEdges);
		let existing = map.get(-1);
		if (existing !== undefined) {
			if (map.size === 1) {
				let result = new Map<number, DFAState>();
				result.set(PredictionContext.EMPTY_FULL_STATE_KEY, existing);
				return result;
			}
			else {
				map.delete(-1);
				map.set(PredictionContext.EMPTY_FULL_STATE_KEY, existing);
			}
		}

		return map;
	}

	@Override
	public hashCode(): number {
		let hash: number = MurmurHash.initialize(7);
		hash = MurmurHash.update(hash, this.configs.hashCode());
		hash = MurmurHash.finish(hash, 1);
		return hash;
	}

	
	@Override
	public equals(o: any): boolean {
		
		if (this === o) {
			return true;
		}

		if (!(o instanceof DFAState)) {
			return false;
		}

		let other: DFAState = o;
		let sameSet: boolean = this.configs.equals(other.configs);

		return sameSet;
	}

	@Override
	public toString(): string {
		let buf = "";
		buf += (this.stateNumber) + (":") + (this.configs);
		if (this.isAcceptState) {
			buf += ("=>");
			if (this.predicates) {
				buf += this.predicates;
			}
			else {
				buf += (this.prediction);
			}
		}
		return buf.toString();
	}
}

export namespace DFAState {
	
	export class PredPrediction {
		@NotNull
		public pred: SemanticContext;  
		public alt: number;
		constructor(@NotNull pred: SemanticContext, alt: number) {
			this.alt = alt;
			this.pred = pred;
		}

		@Override
		public toString(): string {
			return "(" + this.pred + ", " + this.alt + ")";
		}
	}
}
