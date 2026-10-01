import {json} from '@/lib/http';
import {demo} from '@/lib/config';
export async function GET() {
 const configured=['SOLANA_RPC_URL','REDIS_URL','APP_ORIGIN','LAUNCH_ENCRYPTION_KEY'].every(key=>!!process.env[key]) && (process.env.METADATA_PROVIDER==='pump'||!!process.env.PINATA_JWT);
 const enabled=!demo()&&process.env.LAUNCHES_ENABLED==='true'&&configured&&process.env.NEXT_PUBLIC_SOLANA_NETWORK==='mainnet-beta';
 return json({enabled,reason:enabled?'Ready for wallet review.':'Live launches require RPC, metadata storage, Redis, and signing configuration.'});
}
