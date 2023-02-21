




export class ParseCancellationException extends Error {
	
	public readonly stack?: string;

	constructor(public cause: Error) {
		super(cause.message);
		this.stack = cause.stack;
	}

	public getCause(): Error {
		return this.cause;
	}
}
