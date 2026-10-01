import {ArrowUpRight,Check} from 'lucide-react';
import type {Coin} from '@/lib/haus-data';
import {money,curveProgress} from '@/lib/token-display';
import {TokenArt} from './token-art';

export function CoinCard({coin,onSelect}:{coin:Coin;onSelect:(coin:Coin)=>void}){
 const progress=coin.graduated?100:curveProgress(coin.progress);
 const percentage=progress===null?'Unavailable':`${Number(progress.toFixed(2))}%`;
 return <button className="coin-card" onClick={()=>onSelect(coin)} aria-label={`Open ${coin.name}, ${coin.ticker}, market cap ${money(coin.cap)}`}>
  <div className="coin-art-wrap"><TokenArt coin={coin}/><span className="coin-enter"><ArrowUpRight size={23}/></span></div>
  <div className="coin-card-copy">
   <div className="coin-title"><h3 title={coin.name}>{coin.name}</h3><span title={coin.ticker}>${coin.ticker}</span></div>
   <div className="coin-marketcap" aria-label={`Market cap: ${money(coin.cap)}`}><b>{money(coin.cap)}</b><span>MC</span></div>
   <div className={`coin-migration ${coin.graduated?'is-migrated':''}`}>
    <div className="migration-label"><span>{coin.graduated?<><Check size={12}/> Graduated</>:'Bonding curve'}</span><b>{percentage}</b></div>
    <div className="migration-track" role="progressbar" aria-label={`${coin.name} migration progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress??undefined} aria-valuetext={coin.graduated?'Graduated':progress===null?'Progress unavailable':`${percentage} complete; ${Number((100-progress).toFixed(2))}% remaining`}><span style={{width:`${progress??0}%`}}/></div>
   </div>
   <div className="coin-meta"><span title={`Contract address: ${coin.mint}`}>{coin.mint.slice(0,5)}…{coin.mint.slice(-4)}</span><time dateTime={coin.createdAt} title={`Launched ${coin.createdAt}`}>{coin.age}</time></div>
  </div>
 </button>;
}
