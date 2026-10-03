import type {MarketCoin} from './market-data';
export function homeMarketSummary(coins:MarketCoin[],now=Date.now()){
 const available=coins.filter(coin=>coin.marketStatus!=='unavailable'&&coin.updatedAt&&now-Date.parse(coin.updatedAt)<=60000&&typeof coin.volume==='number'&&Number.isFinite(coin.volume)&&coin.volume>=0);
 return {volume:coins.length===0?0:available.length?available.reduce((sum,coin)=>sum+coin.volume!,0):null,
  partial:available.length<coins.length,reporting:available.length,total:coins.length,delayed:available.some(coin=>coin.marketStatus==='stale')};
}
