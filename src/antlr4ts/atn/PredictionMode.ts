

import { Override } from "../Decorators";
import { Array2DHashMap, BitSet, EqualityComparator, MurmurHash } from "../misc";
import { ATNConfig } from "./config/ATNConfig";
import { ATNConfigSet } from "./config/ATNConfigSet";
import { RuleStopState } from "./state/RuleStopState";






export enum PredictionMode {
	
	SLL,
	
	LL,
	
	LL_EXACT_AMBIG_DETECTION,
}

export namespace PredictionMode {
	
	
	class AltAndContextMap extends Array2DHashMap<ATNConfig, BitSet> {
		constructor() {
			super(AltAndContextConfigEqualityComparator.INSTANCE);
		}
	}

	class AltAndContextConfigEqualityComparator implements EqualityComparator<ATNConfig> {
		public static readonly INSTANCE: AltAndContextConfigEqualityComparator = new AltAndContextConfigEqualityComparator();

		private AltAndContextConfigEqualityComparator() {
			
		}

		
		@Override
		public hashCode(o: ATNConfig): number {
			let hashCode: number = MurmurHash.initialize(7);
			hashCode = MurmurHash.update(hashCode, o.state.stateNumber);
			hashCode = MurmurHash.update(hashCode, o.context);
			hashCode = MurmurHash.finish(hashCode, 2);
			return hashCode;
		}

		@Override
		public equals(a: ATNConfig, b: ATNConfig): boolean {
			if (a === b) {
				return true;
			}
			if (a == null || b == null) {
				return false;
			}
			return a.state.stateNumber === b.state.stateNumber
				&& a.context.equals(b.context);
		}
	}

	
	export function hasConfigInRuleStopState(configs: ATNConfigSet): boolean {
		for (let c of configs) {
			if (c.state instanceof RuleStopState) {
				return true;
			}
		}

		return false;
	}

	
	export function allConfigsInRuleStopStates( configs: ATNConfigSet): boolean {
		for (let config of configs) {
			if (!(config.state instanceof RuleStopState)) {
				return false;
			}
		}

		return true;
	}
}
