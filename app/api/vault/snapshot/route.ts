import {PublicKey} from '@solana/web3.js';
import {route,json} from '@/lib/http';
import {HttpError} from '@/lib/config';
import {rpc} from '@/lib/solana';
import {decodeRound} from '@/lib/vault-addresses';
import {readSnapshot} from '@/lib/snapshot-store';
import {snapshotManifestHash} from '@/lib/reward-snapshot';
export const GET=route(async request=>{
 let round:PublicKey,program:PublicKey;
 try{round=new PublicKey(new URL(request.url).searchParams.get('round')!);program=new PublicKey(process.env.HAUS_VAULT_PROGRAM_ID!);}catch{throw new HttpError(400,'Invalid round or unavailable vault deployment.');}
 const account=await rpc().getAccountInfo(round,'finalized');
 if(!account?.owner.equals(program))throw new HttpError(404,'Round not found.');
 const state=decodeRound(account.data),snapshot=await readSnapshot(round.toBase58());
 if(snapshot.round!==round.toBase58()||snapshot.root!==state.root||snapshotManifestHash(snapshot)!==state.manifestHash)throw new HttpError(503,'Snapshot verification failed.');
 return json(snapshot);
});
