



import { Interval } from "./misc/Interval";
import { IntStream } from "./IntStream";


export interface CharStream extends IntStream {
	
	
	getText( interval: Interval): string;
}
