

import { CodePointBuffer } from "./CodePointBuffer";
import { CodePointCharStream } from "./CodePointCharStream";
import { IntStream } from "./IntStream";




export namespace CharStreams {

  export function fromString(s: string): CodePointCharStream;


  export function fromString(s: string, sourceName: string): CodePointCharStream;
  export function fromString(s: string, sourceName?: string): CodePointCharStream {
    if (sourceName === undefined || sourceName.length === 0) {
      sourceName = IntStream.UNKNOWN_SOURCE_NAME;
    }



    let codePointBufferBuilder: CodePointBuffer.Builder = CodePointBuffer.builder(s.length);



    let cb: Uint16Array = new Uint16Array(s.length);
    for (let i = 0; i < s.length; i++) {
      cb[i] = s.charCodeAt(i);
    }

    codePointBufferBuilder.append(cb);
    return CodePointCharStream.fromBuffer(codePointBufferBuilder.build(), sourceName);
  }

























































}
