import { Connection } from '@solana/web3.js';
import { required } from './config';
let connection: Connection;
export const rpc = () => connection ??= new Connection(required('SOLANA_RPC_URL'), 'finalized');
