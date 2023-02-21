import { PredictionContext } from "./PredictionContext";
import { PredictionContextCache } from "./PredictionContextCache";


export class ArrayPredictionContext extends PredictionContext {
  public size: number;
  public getReturnState(index: number): number {
    throw new Error("Method not implemented.");
  }
  public findReturnState(returnState: number): number {
    throw new Error("Method not implemented.");
  }
  public getParent(index: number): PredictionContext {
    throw new Error("Method not implemented.");
  }
  protected addEmptyContext(): PredictionContext {
    throw new Error("Method not implemented.");
  }
  protected removeEmptyContext(): PredictionContext {
    throw new Error("Method not implemented.");
  }
  public appendContext(suffix: PredictionContext, contextCache: PredictionContextCache): PredictionContext {
    throw new Error("Method not implemented.");
  }
  public isEmpty: boolean;
  public hasEmpty: boolean;
  public equals(o: any): boolean {
    throw new Error("Method not implemented.");
  }
  


  constructor()
  {
    super(0)
    this.isEmpty = false;
    this.hasEmpty = false;
    this.size = 0;
  }

}




