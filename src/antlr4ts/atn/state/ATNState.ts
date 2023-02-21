



import { ATN } from "../ATN";
import { ATNStateType } from "./ATNStateType";
import { IntervalSet } from "../../misc/IntervalSet";
import { Override } from "../../Decorators";
import { Transition } from "../transition/Transition";

const INITIAL_NUM_TRANSITIONS: number = 4;


export abstract class ATNState {

	
	public atn?: ATN;

	public stateNumber: number = ATNState.INVALID_STATE_NUMBER;

	public ruleIndex: number = 0;  

	public epsilonOnlyTransitions: boolean = false;

	
	protected transitions: Transition[] = [];

	protected optimizedTransitions: Transition[] = this.transitions;

	
	public nextTokenWithinRule?: IntervalSet;

	
	public getStateNumber(): number {
		return this.stateNumber;
	}

	
	get nonStopStateNumber(): number {
		return this.getStateNumber();
	}

	@Override
	public hashCode(): number {
		return this.stateNumber;
	}

	@Override
	public equals(o: any): boolean {
		
		if (o instanceof ATNState) {
			return this.stateNumber === o.stateNumber;
		}

		return false;
	}

	get isNonGreedyExitState(): boolean {
		return false;
	}

	@Override
	public toString(): string {
		return String(this.stateNumber);
	}

	public getTransitions(): Transition[] {
		return this.transitions.slice(0);
	}

	get numberOfTransitions(): number {
		return this.transitions.length;
	}

	public addTransition(e: Transition, index?: number): void {
		if (this.transitions.length === 0) {
			this.epsilonOnlyTransitions = e.isEpsilon;
		}
		else if (this.epsilonOnlyTransitions !== e.isEpsilon) {
			this.epsilonOnlyTransitions = false;
			throw new Error("ATN state " + this.stateNumber + " has both epsilon and non-epsilon transitions.");
		}

		this.transitions.splice(index !== undefined ? index : this.transitions.length, 0, e);
	}

	public transition(i: number): Transition {
		return this.transitions[i];
	}

	public setTransition(i: number, e: Transition): void {
		this.transitions[i] = e;
	}

	public removeTransition(index: number): Transition {
		return this.transitions.splice(index, 1)[0];
	}

	public abstract readonly stateType: ATNStateType;

	get onlyHasEpsilonTransitions(): boolean {
		return this.epsilonOnlyTransitions;
	}

	public setRuleIndex(ruleIndex: number): void {
		this.ruleIndex = ruleIndex;
	}

	get isOptimized(): boolean {
		return this.optimizedTransitions !== this.transitions;
	}

	get numberOfOptimizedTransitions(): number {
		return this.optimizedTransitions.length;
	}

	public getOptimizedTransition(i: number): Transition {
		return this.optimizedTransitions[i];
	}

	public addOptimizedTransition(e: Transition): void {
		if (!this.isOptimized) {
			this.optimizedTransitions = new Array<Transition>();
		}

		this.optimizedTransitions.push(e);
	}

	public setOptimizedTransition(i: number, e: Transition): void {
		if (!this.isOptimized) {
			throw new Error("This ATNState is not optimized.");
		}

		this.optimizedTransitions[i] = e;
	}

	public removeOptimizedTransition(i: number): void {
		if (!this.isOptimized) {
			throw new Error("This ATNState is not optimized.");
		}

		this.optimizedTransitions.splice(i, 1);
	}
}

export namespace ATNState {
	export const INVALID_STATE_NUMBER: number = -1;
}
