




import { NotNull } from "../../Decorators";
import { IntervalSet } from "../../misc";
import { ATNState } from "../state/ATNState";
import { TransitionType } from "./TransitionType";


export abstract class Transition {
	public static readonly serializationNames: string[] = [
		"INVALID",
		"EPSILON",
		"RANGE",
		"RULE",
		"PREDICATE",
		"ATOM",
		"ACTION",
		"SET",
		"NOT_SET",
		"WILDCARD",
		"PRECEDENCE",
	];

	
	
	
	
	
	
	
	
	
	
	
	
	
	

	
	@NotNull
	public target: ATNState;

	constructor(@NotNull target: ATNState) {
		if (target == null) {
			throw new Error("target cannot be null.");
		}

		this.target = target;
	}

	public abstract readonly serializationType: TransitionType;

	
	get isEpsilon(): boolean {
		return false;
	}

	get label(): IntervalSet | undefined {
		return undefined;
	}

	public abstract matches(symbol: number, minVocabSymbol: number, maxVocabSymbol: number): boolean;
}
