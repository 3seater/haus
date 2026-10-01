export function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Missing server configuration: ${name}`); return value; }
export const demo = () => process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
export function live(feature?: 'LAUNCHES_ENABLED') { if (demo() || (feature && process.env[feature] !== 'true')) throw new HttpError(503, 'Live launches are not configured. No transaction has been created.'); }
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
