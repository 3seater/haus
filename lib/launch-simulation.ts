import type {SimulatedTransactionResponse} from '@solana/web3.js';

// Report only structured error codes, never raw provider responses or logs.
export function launchSimulationFailure(simulation:Pick<SimulatedTransactionResponse,'err'|'logs'>){
 const error=simulation.err;
 if(error==='InsufficientFundsForFee')return 'Solana reported insufficient SOL for the network fee in the connected wallet. No transaction was submitted.';
 if(error==='BlockhashNotFound')return 'The launch blockhash expired or the RPC node has not caught up. Please try again. No transaction was submitted.';
 let detail='Unknown simulation error';
 if(typeof error==='string')detail=error.replace(/[^A-Za-z0-9_]/g,'').slice(0,80);
 else if(error&&'InstructionError' in error&&Array.isArray(error.InstructionError)){
  const [index,cause]=error.InstructionError;
  detail=`Instruction ${index+1}: ${typeof cause==='string'?cause:typeof cause==='object'&&cause&&'Custom' in cause?`program error ${cause.Custom}`:'instruction rejected'}`;
  const anchorCode=simulation.logs?.map(log=>log.match(/Error Code: ([A-Za-z0-9_]+)\./)?.[1]).find(Boolean);
  if(anchorCode)detail+=` (${anchorCode})`;
 }
 return `Launch simulation failed: ${detail}. No transaction was submitted.`;
}
