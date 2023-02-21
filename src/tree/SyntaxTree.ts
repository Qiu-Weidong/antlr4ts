



import { Tree } from "./Tree";
import { Interval } from "../misc/Interval";


export interface SyntaxTree extends Tree {
	
	
	readonly sourceInterval: Interval;
}
