



import { BufferedTokenStream } from "./BufferedTokenStream";
import { NotNull, Override } from "./Decorators";
import { Token } from "./Token";
import { TokenSource } from "./TokenSource";


export class CommonTokenStream extends BufferedTokenStream {
	
	protected channel: number;

	
	constructor(@NotNull tokenSource: TokenSource, channel: number = Token.DEFAULT_CHANNEL) {
		super(tokenSource);
		this.channel = channel;
	}

	@Override
	protected adjustSeekIndex(i: number): number {
		return this.nextTokenOnChannel(i, this.channel);
	}

	@Override
	protected tryLB(k: number): Token | undefined {
		if ((this.p - k) < 0) {
			return undefined;
		}

		let i: number = this.p;
		let n: number = 1;
		
		while (n <= k && i > 0) {
			
			i = this.previousTokenOnChannel(i - 1, this.channel);
			n++;
		}

		if (i < 0) {
			return undefined;
		}

		return this.tokens[i];
	}

	@Override
	public tryLT(k: number): Token | undefined {
		
		this.lazyInit();
		if (k === 0) {
			throw new RangeError("0 is not a valid lookahead index");
		}

		if (k < 0) {
			return this.tryLB(-k);
		}

		let i: number = this.p;
		let n: number = 1; 
		
		while (n < k) {
			
			if (this.sync(i + 1)) {
				i = this.nextTokenOnChannel(i + 1, this.channel);
			}
			n++;
		}

		
		return this.tokens[i];
	}

	
	public getNumberOfOnChannelTokens(): number {
		let n: number = 0;
		this.fill();
		for (let t of this.tokens) {
			if (t.channel === this.channel) {
				n++;
			}

			if (t.type === Token.EOF) {
				break;
			}
		}

		return n;
	}
}
