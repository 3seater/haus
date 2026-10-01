const {spawn}=require('node:child_process');
const {mkdirSync,writeFileSync}=require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
let child,stopping=false,wake;
const healthFile='.haus-data/worker-health.json';
mkdirSync('.haus-data',{recursive:true});
const record=(status,extra={})=>writeFileSync(healthFile,JSON.stringify({status,updatedAt:new Date().toISOString(),...extra}));
const stop=()=>{stopping=true;child?.kill('SIGTERM');wake?.();};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
(async()=>{
 while(!stopping){
  if(process.env.HAUS_WORKER_ENABLED!=='true'){
   record('disabled');console.log('HAUS fee worker is disabled pending deployment and configuration.');
  }else{
   record('running');
   const code=await new Promise(resolve=>{child=spawn(process.execPath,['.worker-build/scripts/fee-worker.js','--execute'],{stdio:'inherit'});child.on('error',()=>resolve(-1));child.on('exit',resolve);});
   record(code===0?'ok':'failed',{exitCode:code});
  }
  if(!stopping)await new Promise(resolve=>{const timer=setTimeout(resolve,15000);wake=()=>{clearTimeout(timer);resolve();};});
  wake=undefined;
 }
 record('stopped');
})().catch(()=>{record('failed');process.exitCode=1;});
