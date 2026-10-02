import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedRequestOrigin as allowed} from '../lib/request-origin';
const configured='http://[::1]:3000';
test('HAUS app aliases accept only same-host HTTPS requests, never tenant origins',()=>{
  assert.equal(allowed('https://apps.haus.fun','https://www.haus.fun','apps.haus.fun','production'),true);
  for(const origin of ['https://frog.haus.fun','https://docs.haus.fun','http://apps.haus.fun','https://apps.haus.fun:444'])assert.equal(allowed(origin,'https://www.haus.fun',new URL(origin).host,'production'),false);
  assert.equal(allowed('https://apps.haus.fun','https://www.haus.fun','app.haus.fun','production'),false);
});
test('Local pilot accepts same-host localhost, IPv4 and IPv6 development origins',()=>{
  for(const host of ['localhost:3000','127.0.0.1:3000','[::1]:3000'])assert.equal(allowed(`http://${host}`,configured,host,'development'),true);
});
test('Origin check rejects other sites, ports, protocols, malformed origins and cross-host requests',()=>{
  for(const origin of [null,'null','https://evil.example','http://localhost.evil.example:3000','http://localhost:3001','https://localhost:3000','http://localhost:3000/path','http://localhost:3000/'])assert.equal(allowed(origin,configured,'localhost:3000','development'),false);
  assert.equal(allowed('http://localhost:3000',configured,'[::1]:3000','development'),false);
});
test('Production and deployed origins remain exact-match only',()=>{
  assert.equal(allowed(configured,configured,'[::1]:3000','production'),true);
  assert.equal(allowed('http://localhost:3000',configured,'localhost:3000','production'),false);
  assert.equal(allowed('http://localhost:3000','https://perks.example','localhost:3000','development'),false);
  assert.equal(allowed('https://perks.example','https://perks.example','perks.example','production'),true);
});
