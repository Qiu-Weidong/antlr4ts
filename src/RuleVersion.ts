



import { Parser } from "./Parser";
import { ParserRuleContext } from "./ParserRuleContext";


export function RuleVersion(version: number) {

	return <T extends ParserRuleContext>(target: Parser, propertyKey: PropertyKey, propertyDescriptor: TypedPropertyDescriptor<(...args: any[]) => T>) => {
		
	};

}
