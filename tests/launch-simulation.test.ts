import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launchSimulationFailure} from '../lib/launch-simulation';

test('Only an explicit fee-balance error is described as insufficient SOL',()=>{
 assert.match(launchSimulationFailure({err:'InsufficientFundsForFee',logs:null}),/insufficient SOL/);
 assert.match(launchSimulationFailure({err:'BlockhashNotFound',logs:null}),/blockhash/);
 const result=launchSimulationFailure({err:{InstructionError:[1,{Custom:6000}]},logs:['Program log: AnchorError occurred. Error Code: TestError. Error Number: 6000. Error Message: private text.']});
 assert.match(result,/Instruction 2: program error 6000 \(TestError\)/);
 assert.doesNotMatch(result,/insufficient|private text/);
 assert.match(result,/No transaction was submitted/);
});
