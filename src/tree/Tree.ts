




export interface Tree {
	
	readonly parent: Tree | undefined;

	
	readonly payload: { text?: string };

	
	getChild(i: number): Tree;

	
	readonly childCount: number;

	
	toStringTree(): string;
}
