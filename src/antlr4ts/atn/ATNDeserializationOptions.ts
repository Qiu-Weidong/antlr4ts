



import { NotNull } from "../Decorators";


export class ATNDeserializationOptions {
	private static _defaultOptions?: ATNDeserializationOptions;

	private readOnly: boolean = false;
	private verifyATN: boolean;
	private generateRuleBypassTransitions: boolean;
	private optimize: boolean;

	constructor(options?: ATNDeserializationOptions) {
		if (options) {
			this.verifyATN = options.verifyATN;
			this.generateRuleBypassTransitions = options.generateRuleBypassTransitions;
			this.optimize = options.optimize;
		} else {
			this.verifyATN = true;
			this.generateRuleBypassTransitions = false;
			this.optimize = true;
		}
	}

	@NotNull
	static get defaultOptions(): ATNDeserializationOptions {
		if (ATNDeserializationOptions._defaultOptions == null) {
			ATNDeserializationOptions._defaultOptions = new ATNDeserializationOptions();
			ATNDeserializationOptions._defaultOptions.makeReadOnly();
		}

		return ATNDeserializationOptions._defaultOptions;
	}

	get isReadOnly(): boolean {
		return this.readOnly;
	}

	public makeReadOnly(): void {
		this.readOnly = true;
	}

	get isVerifyATN(): boolean {
		return this.verifyATN;
	}

	set isVerifyATN(verifyATN: boolean) {
		this.throwIfReadOnly();
		this.verifyATN = verifyATN;
	}

	get isGenerateRuleBypassTransitions(): boolean {
		return this.generateRuleBypassTransitions;
	}

	set isGenerateRuleBypassTransitions(generateRuleBypassTransitions: boolean) {
		this.throwIfReadOnly();
		this.generateRuleBypassTransitions = generateRuleBypassTransitions;
	}

	get isOptimize(): boolean {
		return this.optimize;
	}

	set isOptimize(optimize: boolean) {
		this.throwIfReadOnly();
		this.optimize = optimize;
	}

	protected throwIfReadOnly(): void {
		if (this.isReadOnly) {
			throw new Error("The object is read only.");
		}
	}
}
