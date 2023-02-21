

import * as Character from "../../misc/Character";
import { ATNState } from "../state/ATNState";
import { AtomTransition } from "./AtomTransition";
import { IntervalSet } from "../../misc/IntervalSet";
import { RangeTransition } from "./RangeTransition";
import { SetTransition } from "./SetTransition";
import { Transition } from "./Transition";




export function createWithCodePoint(target: ATNState, codePoint: number): Transition {
	if (Character.isSupplementaryCodePoint(codePoint)) {
		return new SetTransition(target, IntervalSet.of(codePoint));
	}
	else {
		return new AtomTransition(target, codePoint);
	}
}


export function createWithCodePointRange(target: ATNState, codePointFrom: number, codePointTo: number): Transition {
	if (Character.isSupplementaryCodePoint(codePointFrom) || Character.isSupplementaryCodePoint(codePointTo)) {
		return new SetTransition(target, IntervalSet.of(codePointFrom, codePointTo));
	}
	else {
		return new RangeTransition(target, codePointFrom, codePointTo);
	}
}
