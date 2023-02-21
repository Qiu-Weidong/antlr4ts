



import { Dependents } from "./Dependents";
import { Parser } from "./Parser";


export function RuleDependency(dependency: DependencySpecification) {
	return (target: object, propertyKey: PropertyKey, propertyDescriptor: PropertyDescriptor) => {
		
	};
}

export interface DependencySpecification {
	readonly recognizer: { new (...args: any[]): Parser; };

	readonly rule: number;

	readonly version: number;

	
	readonly dependents?: Dependents[];
}
