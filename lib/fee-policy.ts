export type FeeChoice='hold'|'holders'|'developer';
export type FeePolicy={firstDelay:number;votingWindow:number;period:number;executionDelay:number;quorumBps:number;minimumBudget:bigint};
// No default is silently activated. Policy must be approved and installed on-chain.
export function validateFeePolicy(policy:FeePolicy){
 for(const n of [policy.firstDelay,policy.votingWindow,policy.period,policy.executionDelay,policy.quorumBps])if(!Number.isSafeInteger(n))throw new Error('Invalid policy integer');
 if(policy.firstDelay<0||policy.firstDelay>604800||policy.votingWindow<60||policy.votingWindow>604800||policy.executionDelay<0||policy.executionDelay>86400||policy.period<policy.votingWindow+policy.executionDelay||policy.period>2592000||policy.quorumBps<1||policy.quorumBps>10000||policy.minimumBudget<1n||policy.minimumBudget>0xffffffffffffffffn)throw new Error('Invalid fee policy');
 return policy;
}
export function feeVoteOutcome(votes:readonly [bigint,bigint,bigint],eligibleSupply:bigint,quorumBps:number):FeeChoice {
 if(eligibleSupply<=0n||!Number.isInteger(quorumBps)||quorumBps<1||quorumBps>10000||votes.some(value=>value<0n))throw new Error('Invalid tally');
 const turnout=votes.reduce((a,b)=>a+b,0n);if(turnout>eligibleSupply)throw new Error('Votes exceed snapshot');
 if(turnout===0n||turnout*10000n<eligibleSupply*BigInt(quorumBps))return 'hold';
 const winner=votes.findIndex(weight=>weight*2n>turnout);return (['hold','holders','developer'] as const)[winner]??'hold';
}
