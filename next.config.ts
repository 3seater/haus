import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
const config: NextConfig = {
  serverExternalPackages: ['@pump-fun/pump-sdk', 'ioredis'],
  devIndicators: false,
  async headers() { return [{ source: '/:path*', headers: [
    {key:'X-Content-Type-Options',value:'nosniff'}, {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'}, {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}
  ]}, { source: '/app/:path*', headers: [
    {key:'X-Frame-Options',value:'SAMEORIGIN'},
    {key:'Content-Security-Policy',value:"frame-ancestors 'self'"}
  ]}]; }
};
export default (phase:string):NextConfig => ({...config,distDir:process.env.HAUS_BUILD_DIR || (phase===PHASE_DEVELOPMENT_SERVER?'.next-dev':'.next')});
