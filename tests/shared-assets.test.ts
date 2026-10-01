import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetFormat,assetName,MAX_ASSET_BYTES} from '../lib/shared-assets';
import {boundedBody} from '../lib/request-body';
test('Asset type comes from bytes, not caller MIME or file extension',()=>{
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(8)]);assert.equal(assetFormat(png).type,'image/png');
 assert.throws(()=>assetFormat(Buffer.from('<svg onload="alert(1)"></svg>')),/Only PNG/);
 assert.throws(()=>assetFormat(Buffer.alloc(MAX_ASSET_BYTES+1)),/under 4 MB/);
 assert.equal(assetName('../../<script>.html','png'),'script.png');
 assert.ok(!assetName('a\r\nContent-Type: text/html','jpg').includes('\n'));
});
test('Request byte limit applies even with no content-length header',async()=>{
 const request=new Request('https://haus.test',{method:'POST',body:'123456'});await assert.rejects(boundedBody(request,5),/too large/);
 assert.equal((await boundedBody(new Request('https://haus.test',{method:'POST',body:'123'}),5)).length,3);
});
