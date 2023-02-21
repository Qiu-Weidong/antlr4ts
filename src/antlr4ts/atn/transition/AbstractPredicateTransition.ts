

import { ATNState } from "../state/ATNState";
import { Transition } from "./Transition";


export abstract class AbstractPredicateTransition extends Transition {

	constructor(target: ATNState) {
		super(target);
	}

}
