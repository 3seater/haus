'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,Plus,Menu,X,Wallet} from 'lucide-react';
import {HausMark} from './haus-mark';
import {ThemeToggle} from './theme-toggle';
import {HeroStats} from './hero-stats';
import {CtaField} from './cta-field';
import './home-page.css';
import {ScrollWalkthrough,ScrollType,BuildHausCTA} from './home-motion';

const questions=[
 ['What is HAUS?','A home for token communities on Solana. Discover coins, open a shared workspace, and help build the website and identity around a token.'],
 ['Do I need a wallet to explore?','No. Browse tokens and market information first. A compatible Solana wallet and proof of holdings are required for holder-only community actions.'],
 ['What can holders build?','A website with its own artwork, links, and meme gallery. Choose a design, save a draft, export the HTML, or pitch it to the community. Verified holders can vote on pitches, publish a winning site and share downloadable artwork.'],
 ['How will creator fees work?','Current launches route creator rewards to the HAUS operator wallet, not the launching user. A future vault system is planned. Holders would vote on keeping funds there, making SOL rewards claimable, allocating them to the creator, or buying back and burning tokens. This system is not live yet.'],
 ['Can I launch a token today?','Open the app to check launch availability, enter your token details and review the transaction in your wallet. Creator rewards go to the HAUS operator wallet. You need SOL for creation and network costs.'],
 ['Is HAUS a trading platform?','HAUS helps you discover tokens and follow their markets. Trading links take you to external services such as Pump.fun. Tokens can lose value; holding one does not guarantee rewards.'],
];
export function HomePage({appUrl,docsUrl='/docs'}:{appUrl:string;docsUrl?:string}){
 const [menu,setMenu]=useState(false);
 const pageRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('home-motion-in');observer.unobserve(entry.target);}},{threshold:.15});
  pageRef.current?.querySelectorAll('.home-vault-plan').forEach(node=>observer.observe(node));
  return()=>observer.disconnect();
 },[]);

 return <div className="home-site" ref={pageRef}>
 <a className="home-skip" href="#home-main">Skip to content</a>
 <header className="home-header"><div className="home-header-inner"><a href="/" className="brand" aria-label="HAUS home"><HausMark/><span>haus</span></a><nav className={menu?'home-nav open':'home-nav'} aria-label="Homepage navigation">{[['How it works','#how'],['The vault','#vault'],['FAQ','#faq']].map(([label,url])=><a key={url} href={url} onClick={()=>setMenu(false)}>{label}</a>)}</nav><ThemeToggle/><a className="button primary home-open" href={appUrl}>Open app <ArrowUpRight size={17}/></a><button className="home-menu" aria-label={menu?'Close menu':'Open menu'} aria-expanded={menu} onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</button></div></header>
 <main id="home-main">
 <section className="home-hero-section"><CtaField/><div className="home-hero home-wrap">
  <div className="home-hero-copy"><h1>EVERY COIN<br/><span className="hero-second-line">NEEDS A <span className="hero-haus-word">Haus.</span></span></h1><p>A coin brings people together.<br/>Give them somewhere to build.</p><div className="home-actions"><a className="button dark" href={appUrl}>Build your haus <ArrowUpRight size={18}/></a><a className="home-text-link" href="#how">Meet HAUS <ArrowRight size={16}/></a></div><div className="home-hero-note"><svg viewBox="0 0 32 26" width="20" height="17" fill="currentColor" aria-hidden="true"><path d="M6 1h25l-5 5H1zM1 10h25l5 5H6zM6 19h25l-5 5H1z"/></svg>Built on Solana</div></div>
  <HeroStats/>
 </div></section>
 <ScrollWalkthrough/><ScrollType/>
 <section id="vault" className="home-vault"><div className="home-wrap home-vault-grid"><div><h2>THE VAULT</h2><p>Planned for HAUS launches: creator fees collect in a dedicated vault for each token. Launching a coin alone does not give its creator withdrawal rights.</p><p>Holders would vote on how to use those funds. Until a vote approves an allocation, fees stay in the vault.</p><p>Current launches send creator rewards to the HAUS operator wallet. Vault routing is a future feature and will not automatically change existing launches.</p><a className="home-text-link" href={docsUrl}>Read the vault roadmap <ArrowUpRight size={17}/></a></div><div className="home-vault-plan"><div className="home-vault-source"><Wallet size={23}/><span>Creator rewards</span><ArrowRight size={18}/><b>Token vault</b></div><div className="home-vault-options">{[['01','Keep in the vault'],['02','Holder SOL claims'],['03','Creator allocation'],['04','Buy back & burn']].map(([n,label])=><div key={n}><span>{n}</span><b>{label}</b><ArrowUpRight size={16}/></div>)}</div><p>Planned voting outcomes. Vault automation and buybacks are not live. Voting rules are still being finalized.</p></div></div></section>
 <section id="faq" className="home-wrap home-faq"><div><h2>QUESTIONS</h2><a className="home-text-link" href={docsUrl}>Read the docs <ArrowUpRight size={17}/></a></div><div className="home-faq-list">{questions.map(([question,answer])=><details key={question}><summary>{question}<Plus size={18}/></summary><p>{answer}</p></details>)}</div></section>
 <BuildHausCTA appUrl={appUrl} docsUrl={docsUrl}/>
 </main><footer className="home-footer home-wrap"><div className="home-footer-top"><a className="brand" href="/" aria-label="HAUS home"><HausMark/><span>haus</span></a><p>Your coin. Built by its holders.</p><nav aria-label="Footer"><a href={appUrl}>Open app <ArrowUpRight size={14}/></a><a href="#how">How it works</a><a href={docsUrl}>Docs</a></nav></div></footer>
 </div>;
}
