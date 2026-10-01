import {HttpError} from './config';
export async function boundedBody(request:Request,max:number){
 if(Number(request.headers.get('content-length'))>max)throw new HttpError(413,'Request too large.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new HttpError(413,'Request too large.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export async function boundedJson(request:Request,max:number){return JSON.parse(new TextDecoder().decode(await boundedBody(request,max)));}
