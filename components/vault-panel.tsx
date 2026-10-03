'use client';
import {useEffect,useState} from 'react';
import {useConnection,useWallet} from '@solana/wallet-adapter-react';
import {Transaction} from '@solana/web3.js';
import {api} from '@/lib/client';
import type {PublicVault,PublicRound} from '@/lib/vault-types';
import {WalletMultiButton} from './wallet-button';
import {PanelSkeleton,SkeletonValue} from './ui/skeleton';
const sol=(lamports:string)=>`${(Number(lamports)/1e9).toLocaleString(undefined,{maximumFractionDigits:9})} SOL`;
const percent=(part:bigint,total:bigint)=>total>0n?`${Number(part*10000n/total)/100}%`:'0%';
const choices=['Keep in vault','Holder rewards','Developer claim'];
export function VaultPanel({mint}:{mint:string}){
 const {publicKey,sendTransaction}=useWallet(),{connection}=useConnection();
 const wallet=publicKey?.toBase58();
 const [data,setData]=useState<PublicVault|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0),[signature,setSignature]=useState('');
 const [before,setBefore]=useState<string|undefined>();
 useEffect(()=>{setBefore(undefined);setData(null);setSignature('');},[mint,wallet]);
 useEffect(()=>{let stopped=false;async function load(){try{const result=await api<PublicVault>(`/api/vault?mint=${mint}${wallet?`&wallet=${wallet}`:''}${before?`&before=${before}`:''}`);if(!stopped){setData(result);setError('');}}catch(e){if(!stopped)setError((e as Error).message);}}void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},15000);return()=>{stopped=true;clearInterval(timer);};},[mint,wallet,refresh,before]);
 async function act(round:PublicRound,action:'vote'|'claim_holder'|'claim_developer',choice?:number){
  if(!wallet||busy)return;setBusy(true);setError('');setSignature('');
  try{
   if(await connection.getGenesisHash()!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')throw new Error('Connect to Solana mainnet before voting or claiming.');
   const prepared=await api<{transaction:string;program:string;blockhash:string;lastValidBlockHeight:number}>('/api/vault',{mint,wallet,round:round.id,action,choice});
   const tx=Transaction.from(Uint8Array.from(atob(prepared.transaction),c=>c.charCodeAt(0)));
   if(tx.feePayer?.toBase58()!==wallet||tx.instructions.length!==1||tx.instructions[0].programId.toBase58()!==prepared.program)throw new Error('Unexpected transaction.');
   const sent=await sendTransaction(tx,connection);setSignature(sent);
   const result=await connection.confirmTransaction({signature:sent,blockhash:prepared.blockhash,lastValidBlockHeight:prepared.lastValidBlockHeight},'finalized');
   if(result.value.err)throw new Error('The transaction failed on Solana.');setRefresh(n=>n+1);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section aria-label="Community fee vault"><div className="haus-tool-heading"><div><h2>Fees & rewards</h2><p>Creator fees collect here. Holders decide how each allocation is used.</p></div></div>
 <p className="haus-footnote">HAUS initially controls emergency pauses, upgrades, and the holder snapshot service. The token developer has no default withdrawal access. Buyback and burn is not available in this release.</p>
 <p className="haus-footnote" style={{overflowWrap:'anywhere'}}>HAUS owner: <SkeletonValue loading={!data&&!error} width="100%">{data?.ownerAuthority??'Not configured'}</SkeletonValue></p>
 <div className="vault-results" aria-busy={!data&&!error}>{error&&<p role="alert">{error}</p>}
 {!data&&!error&&<PanelSkeleton label="Loading fee vault" rows={6}/>}
 {data&&!data.enabled&&<div className="haus-empty"><h3>Vault unavailable</h3><p>{data.reason}</p><p>No rewards or voting results are simulated.</p></div>}
 {data?.enabled&&<><p><strong>Unallocated fees: {sol(data.balance??'0')}</strong></p><a className="text-button" href={`https://solscan.io/account/${data.address}`} target="_blank" rel="noreferrer">View vault</a>
 {!wallet&&<WalletMultiButton/>}
 {data.rounds.length===0&&<p>No fee rounds have opened yet. Fees remain in the vault until the configured time and minimum budget are reached.</p>}
 {data.rounds.map(round=><article key={round.address} className="notice" style={{display:'block'}}><h3>Round {BigInt(round.id)+1n+''} · {sol(round.budget)}</h3><p>{round.finalized?`Result: ${round.outcome==='hold'?'Retained in vault':round.outcome==='holders'?'Holder rewards':'Developer allocation'}`:`Voting closes ${new Date(round.closesAt*1000).toLocaleString()}`}</p>
 <p>Your voting power: {percent(BigInt(round.weight),BigInt(round.eligibleSupply))} of eligible holdings. {round.proofAvailable?'Snapshot verified.':'No eligible holder proof available for this wallet.'}</p>
 <p>Participation: {percent(round.votes.reduce((sum,value)=>sum+BigInt(value),0n),BigInt(round.eligibleSupply))} · Required: {round.quorumBps/100}%</p>
 <ul>{choices.map((label,i)=><li key={label}>{label}: {percent(BigInt(round.votes[i]),round.votes.reduce((sum,value)=>sum+BigInt(value),0n))} of votes cast</li>)}</ul>
 {!round.finalized&&Date.now()<round.closesAt*1000&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{choices.map((label,choice)=><button key={label} className="button secondary" disabled={busy||!wallet||!round.proofAvailable} onClick={()=>void act(round,'vote',choice)}>{label}</button>)}</div>}
 {!round.finalized&&Date.now()>=round.closesAt*1000&&<p>Voting closed. Waiting for on-chain finalization.</p>}
 {round.finalized&&round.outcome!=='hold'&&Date.now()<round.executeAfter*1000&&<p>Claims open {new Date(round.executeAfter*1000).toLocaleString()}.</p>}
 {BigInt(round.claimable)>0n&&<button className="button primary" disabled={busy||!wallet} onClick={()=>void act(round,round.outcome==='holders'?'claim_holder':'claim_developer')}>Claim {sol(round.claimable)}</button>}
 {round.claimed&&<p>Reward already claimed.</p>}
 </article>)}
 <div style={{display:'flex',gap:12}}>{before&&<button className="button secondary" onClick={()=>setBefore(undefined)}>Latest rounds</button>}{data.nextBefore&&<button className="button secondary" onClick={()=>setBefore(data.nextBefore)}>Older rounds</button>}</div>
 </>}
 {data?.enabled&&<p className="haus-footnote">Voting and claims require wallet approval and network fees. A first vote or holder claim also creates an on-chain receipt with a rent cost; very small rewards may cost more to claim than they pay.</p>}</div>
 {signature&&<p><a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noreferrer">View submitted transaction</a>{busy?' · Waiting for finalization…':''}</p>}
 </section>;
}
