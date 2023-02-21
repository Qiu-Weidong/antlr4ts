



import { Interval } from "./misc/Interval";
import { Override } from "./Decorators";
import { Token } from "./Token";
import { TokenStream } from "./TokenStream";



export class TokenStreamRewriter {
	public static readonly DEFAULT_PROGRAM_NAME: string =  "default";
	public static readonly PROGRAM_INIT_SIZE: number =  100;
	public static readonly MIN_TOKEN_INDEX: number =  0;

	
	protected tokens: TokenStream;

	
	protected programs: Map<string, RewriteOperation[]>;

	
	protected lastRewriteTokenIndexes: Map<string, number>;

	constructor(tokens: TokenStream)  {
		this.tokens = tokens;
		this.programs = new Map<string, RewriteOperation[]>();
		this.programs.set(TokenStreamRewriter.DEFAULT_PROGRAM_NAME, []);
		this.lastRewriteTokenIndexes = new Map<string, number>();
	}

	public getTokenStream(): TokenStream {
		return this.tokens;
	}

	public rollback(instructionIndex: number): void;
	
	public rollback(instructionIndex: number, programName: string): void;
	public rollback(instructionIndex: number, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		let is: RewriteOperation[] | undefined =  this.programs.get(programName);
		if ( is != null ) {
			this.programs.set(programName, is.slice(TokenStreamRewriter.MIN_TOKEN_INDEX, instructionIndex));
		}
	}

	public deleteProgram(): void;

	
	public deleteProgram(programName: string): void;
	public deleteProgram(programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		this.rollback(TokenStreamRewriter.MIN_TOKEN_INDEX, programName);
	}

	public insertAfter(t: Token, text: {}): void;
	public insertAfter(index: number, text: {}): void;
	public insertAfter(t: Token, text: {}, programName: string): void;
	public insertAfter(index: number, text: {}, programName: string): void;
	public insertAfter(tokenOrIndex: Token | number, text: {}, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		let index: number;
		if (typeof tokenOrIndex === "number") {
			index = tokenOrIndex;
		} else {
			index = tokenOrIndex.tokenIndex;
		}

		
		let rewrites: RewriteOperation[] = this.getProgram(programName);
		let op = new InsertAfterOp(this.tokens, index, rewrites.length, text);
		rewrites.push(op);
	}

	public insertBefore(t: Token, text: {}): void;
	public insertBefore(index: number, text: {}): void;
	public insertBefore(t: Token, text: {}, programName: string): void;
	public insertBefore(index: number, text: {}, programName: string): void;
	public insertBefore(tokenOrIndex: Token | number, text: {}, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		let index: number;
		if (typeof tokenOrIndex === "number") {
			index = tokenOrIndex;
		} else {
			index = tokenOrIndex.tokenIndex;
		}

		let rewrites: RewriteOperation[] = this.getProgram(programName);
		let op: RewriteOperation = new InsertBeforeOp(this.tokens, index, rewrites.length, text);
		rewrites.push(op);
	}

	public replaceSingle(index: number, text: {}): void;
	public replaceSingle(indexT: Token, text: {}): void;
	public replaceSingle(index: Token | number, text: {}): void {
		if (typeof index === "number") {
			this.replace(index, index, text);
		} else {
			this.replace(index, index, text);
		}
	}

	public replace(from: number, to: number, text: {}): void;

	public replace(from: Token, to: Token, text: {}): void;

	public replace(from: number, to: number, text: {}, programName: string): void;

	public replace(from: Token, to: Token, text: {}, programName: string): void;

	public replace(from: Token | number, to: Token | number, text: {}, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		if (typeof from !== "number") {
			from = from.tokenIndex;
		}

		if (typeof to !== "number") {
			to = to.tokenIndex;
		}

		if ( from > to || from < 0 || to < 0 || to >= this.tokens.size ) {
			throw new RangeError(`replace: range invalid: ${from}..${to}(size=${this.tokens.size})`);
		}

		let rewrites: RewriteOperation[] = this.getProgram(programName);
		let op: RewriteOperation =  new ReplaceOp(this.tokens, from, to, rewrites.length, text);
		rewrites.push(op);
	}

	public delete(index: number): void;

	public delete(from: number, to: number): void;

	public delete(indexT: Token): void;

	public delete(from: Token, to: Token): void;

	public delete(from: number, to: number, programName: string): void;

	public delete(from: Token, to: Token, programName: string): void;

	public delete(from: Token | number, to?: Token | number, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): void {
		if (to === undefined) {
			to = from;
		}

		if (typeof from === "number") {
			this.replace(from, to as number, "", programName);
		} else {
			this.replace(from, to as Token, "", programName);
		}
	}

	protected getLastRewriteTokenIndex(): number;

	protected getLastRewriteTokenIndex(programName: string): number;

	protected getLastRewriteTokenIndex(programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): number {
		let I: number | undefined = this.lastRewriteTokenIndexes.get(programName);
		if ( I == null ) {
			return -1;
		}

		return I;
	}

	protected setLastRewriteTokenIndex(programName: string, i: number): void {
		this.lastRewriteTokenIndexes.set(programName, i);
	}

	protected getProgram(name: string): RewriteOperation[] {
		let is: RewriteOperation[] | undefined = this.programs.get(name);
		if ( is == null ) {
			is = this.initializeProgram(name);
		}

		return is;
	}

	private initializeProgram(name: string): RewriteOperation[] {
		let is: RewriteOperation[] = [];
		this.programs.set(name, is);
		return is;
	}

	
	public getText(): string;

	
	public getText(programName: string): string;

	
	public getText(interval: Interval): string;

	public getText(interval: Interval, programName: string): string;

	public getText(intervalOrProgram?: Interval | string, programName: string = TokenStreamRewriter.DEFAULT_PROGRAM_NAME): string {
		let interval: Interval;
		if (intervalOrProgram instanceof Interval) {
			interval = intervalOrProgram;
		} else {
			interval = Interval.of(0, this.tokens.size - 1);
		}

		if (typeof intervalOrProgram === "string") {
			programName = intervalOrProgram;
		}

		let rewrites: RewriteOperation[] | undefined = this.programs.get(programName);
		let start: number =  interval.a;
		let stop: number =  interval.b;

		
		if ( stop > this.tokens.size - 1 ) {
			stop = this.tokens.size - 1;
		}
		if ( start < 0 ) {
			start = 0;
		}

		if ( rewrites == null || rewrites.length === 0 ) {
			return this.tokens.getText(interval); 
		}

		let buf: string[] = [];

		
		let indexToOp: Map<number, RewriteOperation> = this.reduceToSingleOperationPerIndex(rewrites);

		
		let i: number =  start;
		while ( i <= stop && i < this.tokens.size ) {
			let op: RewriteOperation | undefined =  indexToOp.get(i);
			indexToOp.delete(i); 
			let t: Token = this.tokens.get(i);
			if ( op == null ) {
				
				if ( t.type !== Token.EOF ) {
					buf.push(String(t.text));
				}
				i++; 
			}
			else {
				i = op.execute(buf); 
			}
		}

		
		
		
		if ( stop === this.tokens.size - 1 ) {
			
			
			for (let op of indexToOp.values()) {
				if ( op.index >= this.tokens.size - 1 ) {
					buf.push(op.text.toString());
				}
			}
		}

		return buf.join("");
	}

	
	protected reduceToSingleOperationPerIndex(rewrites: Array<RewriteOperation | undefined>): Map<number, RewriteOperation> {
		

		
		for (let i = 0; i < rewrites.length; i++) {
			let op: RewriteOperation | undefined = rewrites[i];
			if ( op == null ) {
				continue;
			}
			if ( !(op instanceof ReplaceOp) ) {
				continue;
			}
			let rop: ReplaceOp = op;
			
			let inserts: InsertBeforeOp[] = this.getKindOfOps(rewrites, InsertBeforeOp, i);
			for (let iop of inserts) {
				if ( iop.index === rop.index ) {
					
					
					rewrites[iop.instructionIndex] = undefined;
					rop.text = iop.text.toString() + (rop.text != null ? rop.text.toString() : "");
				}
				else if ( iop.index > rop.index && iop.index <= rop.lastIndex ) {
					
					rewrites[iop.instructionIndex] = undefined;
				}
			}
			
			let prevReplaces: ReplaceOp[] = this.getKindOfOps(rewrites, ReplaceOp, i);
			for (let prevRop of prevReplaces) {
				if ( prevRop.index >= rop.index && prevRop.lastIndex <= rop.lastIndex ) {
					
					rewrites[prevRop.instructionIndex] = undefined;
					continue;
				}
				
				let disjoint: boolean =
					prevRop.lastIndex < rop.index || prevRop.index > rop.lastIndex;
				
				
				if ( prevRop.text == null && rop.text == null && !disjoint ) {
					
					rewrites[prevRop.instructionIndex] = undefined; 
					rop.index = Math.min(prevRop.index, rop.index);
					rop.lastIndex = Math.max(prevRop.lastIndex, rop.lastIndex);
					
				}
				else if ( !disjoint ) {
					throw new Error(`replace op boundaries of ${rop} overlap with previous ${prevRop}`);
				}
			}
		}

		
		for (let i = 0; i < rewrites.length; i++) {
			let op: RewriteOperation | undefined = rewrites[i];
			if ( op == null ) {
				continue;
			}
			if ( !(op instanceof InsertBeforeOp) ) {
				continue;
			}
			let iop: InsertBeforeOp =  op;
			
			let prevInserts: InsertBeforeOp[] = this.getKindOfOps(rewrites, InsertBeforeOp, i);
			for (let prevIop of prevInserts) {
				if ( prevIop.index === iop.index ) {
					if (prevIop instanceof InsertAfterOp) {
						iop.text = this.catOpText(prevIop.text, iop.text);
						rewrites[prevIop.instructionIndex] = undefined;
					}
					else if (prevIop instanceof InsertBeforeOp) { 
						
						
						iop.text = this.catOpText(iop.text, prevIop.text);
						
						rewrites[prevIop.instructionIndex] = undefined;
					}
				}
			}
			
			let prevReplaces: ReplaceOp[] = this.getKindOfOps(rewrites, ReplaceOp, i);
			for (let rop of prevReplaces) {
				if ( iop.index === rop.index ) {
					rop.text = this.catOpText(iop.text, rop.text);
					rewrites[i] = undefined;	
					continue;
				}
				if ( iop.index >= rop.index && iop.index <= rop.lastIndex ) {
					throw new Error(`insert op ${iop} within boundaries of previous ${rop}`);
				}
			}
		}
		
		let m: Map<number, RewriteOperation> =  new Map<number, RewriteOperation>();
		for (let op of rewrites) {
			if ( op == null ) {
				
				continue;
			}
			if ( m.get(op.index) != null ) {
				throw new Error("should only be one op per index");
			}
			m.set(op.index, op);
		}
		
		return m;
	}

	protected catOpText(a: {}, b: {}): string {
		let x: string =  "";
		let y: string =  "";
		if ( a != null ) {
			x = a.toString();
		}
		if ( b != null ) {
			y = b.toString();
		}
		return x + y;
	}

	
	protected getKindOfOps<T extends RewriteOperation>(rewrites: Array<RewriteOperation | undefined>, kind: {new(...args: any[]): T}, before: number): T[] {
		let ops: T[] = [];
		for (let i = 0; i < before && i < rewrites.length; i++) {
			let op: RewriteOperation | undefined =  rewrites[i];
			if ( op == null ) {
				
				continue;
			}
			if ( op instanceof kind ) {
				ops.push(op);
			}
		}
		return ops;
	}
}



export class RewriteOperation {
	protected readonly tokens: TokenStream;
	
	public readonly instructionIndex: number;
	
	public index: number;
	public text: {};

	constructor(tokens: TokenStream, index: number, instructionIndex: number);
	constructor(tokens: TokenStream, index: number, instructionIndex: number, text: {});
	constructor(tokens: TokenStream, index: number, instructionIndex: number, text?: {}) {
		this.tokens = tokens;
		this.instructionIndex = instructionIndex;
		this.index = index;
		this.text = text === undefined ? "" : text;
	}

	
	public execute(buf: string[]): number {
		return this.index;
	}

	@Override
	public toString(): string {
		let opName: string = this.constructor.name;
		let $index = opName.indexOf("$");
		opName = opName.substring($index + 1, opName.length);
		return "<" + opName + "@" + this.tokens.get(this.index) +
				":\"" + this.text + "\">";
	}
}

class InsertBeforeOp extends RewriteOperation {
	constructor(tokens: TokenStream, index: number, instructionIndex: number, text: {}) {
		super(tokens, index, instructionIndex, text);
	}

	@Override
	public execute(buf: string[]): number {
		buf.push(this.text.toString());
		if ( this.tokens.get(this.index).type !== Token.EOF ) {
			buf.push(String(this.tokens.get(this.index).text));
		}
		return this.index + 1;
	}
}


class InsertAfterOp extends InsertBeforeOp {
	constructor(tokens: TokenStream, index: number, instructionIndex: number, text: {}) {
		super(tokens, index + 1, instructionIndex, text); 
	}
}


class ReplaceOp extends RewriteOperation {
	public lastIndex: number;
	constructor(tokens: TokenStream, from: number, to: number, instructionIndex: number, text: {}) {
		super(tokens, from, instructionIndex, text);
		this.lastIndex = to;
	}

	@Override
	public execute(buf: string[]): number {
		if ( this.text != null ) {
			buf.push(this.text.toString());
		}
		return this.lastIndex + 1;
	}

	@Override
	public toString(): string {
		if ( this.text == null ) {
			return "<DeleteOp@" + this.tokens.get(this.index) +
					".." + this.tokens.get(this.lastIndex) + ">";
		}
		return "<ReplaceOp@" + this.tokens.get(this.index) +
				".." + this.tokens.get(this.lastIndex) + ":\"" + this.text + "\">";
	}
}
