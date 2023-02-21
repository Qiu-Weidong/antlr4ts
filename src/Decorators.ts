

export function NotNull(
	target: any,
	propertyKey: PropertyKey,
	propertyDescriptor?: PropertyDescriptor | number) {
	
}

export function Nullable(
	target: any,
	propertyKey: PropertyKey,
	propertyDescriptor?: PropertyDescriptor | number) {
	
}

export function Override(
	target: any,
	propertyKey: PropertyKey,
	propertyDescriptor?: PropertyDescriptor) {
	
}

export function SuppressWarnings(options: string) {
	return (target: any, propertyKey: PropertyKey, descriptor?: PropertyDescriptor) => {
		
	};
}
