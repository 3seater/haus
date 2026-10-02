// Every UI piece is an editable SVG shape or text node; no screenshots.
module.exports=async function articleCover({word,svg,grid}){
 const K='#191919',P='#f2a8cd',paper='#f4f0e9',line='#d1ccc5',muted='#76716d';
 const text=(s,x,y,size=12,fill=K,weight=400)=>`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${s.replaceAll('&','&amp;')}</text>`;
 const rect=(x,y,w,h,fill,stroke='none',r=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
 const path=(d,c=K,sw=1.3)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const mark=(x,y,s)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z" fill="${K}"/>`;
 const monitor=(x,y)=>`<g transform="translate(${x} ${y})">${rect(0,0,17,12,'none',K,1)}${path('M8.5 12V17M4 17H13')}</g>`;
 const arrow=(x,y)=>`<g transform="translate(${x} ${y})">${path('M0 9L9 0M0 0H9V9')}</g>`;
 function panel(id,x,y,w,h,angle,body){return `<g id="${id}" data-name="${id}" transform="translate(${x} ${y}) rotate(${angle} ${w/2} ${h/2})">${rect(0,0,w,h,paper,line,4)}${rect(1,1,w-2,29,'#f5f3f0','none',4)}${path(`M0 30H${w}`,line,1)}<g fill="${muted}" opacity=".35"><circle cx="14" cy="15" r="2"/><circle cx="22" cy="15" r="2"/><circle cx="30" cy="15" r="2"/></g>${text('apps.haus.fun',w/2-35,19,9,muted)}${body}</g>`;}
 let launch=word('bold','CREATE TOKEN',24,55,224,36,K)+text('Launch on Pump.fun. Your holders build its home.',24,114,10,muted)+path('M338 60L348 70M348 60L338 70');
 launch+=text('Token name',24,149,10)+text('Ticker',202,149,10)+rect(24,159,162,37,'#faf7f1',line)+rect(202,159,154,37,'#faf7f1',line)+text('HAUS',36,182,11,muted)+text('HAUS',214,182,11,muted);
 launch+=text('The story',24,225,10)+rect(24,236,332,77,'#faf7f1',line)+text('A short description of the token',36,258,11,muted);
 launch+=`<rect x="24" y="333" width="332" height="85" rx="3" fill="#faf7f1" stroke="${muted}" stroke-dasharray="3 3"/>`+rect(39,349,51,51,'#f8d4e5',K)+path('M53 376L62 367L73 380M54 363H77V386H53V363')+text('Choose an image',105,367,11,K,600)+text('PNG, JPEG or WebP · up to 4 MB',105,387,9,muted);
 let community=rect(24,48,92,29,K)+text('Overview',43,67,11,paper)+text('Website',139,67,11,muted)+text('DEX tools',234,67,11,muted)+text('Pitches',330,67,11,muted)+text('Assets',414,67,11,muted)+text('Chart',492,67,11,muted);
 community+=rect(24,95,642,178,P,K,0)+word('bold','THE HOLDERS',48,121,267,44,K)+word('bold','ARE THE DEVS.',48,169,267,44,K)+rect(48,231,129,26,K)+text('Build its home',64,248,10,paper,600)+arrow(154,239)+mark(480,112,.51);
 community+=rect(24,289,313,73,'#eee9df',line,0)+monitor(43,302)+text('Website studio',72,317,12,K,600)+arrow(307,307)+rect(353,289,313,73,'#eee9df',line,0)+text('Community pitches',377,318,12,K,600)+arrow(636,307);
 let studio=text('Website studio',24,66,18,K,600)+rect(512,46,91,29,'none',line)+text('Export HTML',528,65,10)+path('M498 51V64M494 60L498 64L502 60');
 studio+=rect(24,91,156,297,'#ede8e1',line)+rect(192,91,412,297,'#f8f5ee',line)+rect(33,101,57,24,K)+text('Design',44,117,9,paper)+text('Identity',103,117,9,muted)+rect(33,139,138,29,'#faf7f1',line)+text('Find your style…',42,157,9,muted);
 for(let i=0;i<4;i++){let x=34+(i%2)*72,y=184+Math.floor(i/2)*101;studio+=rect(x,y,64,88,i===1?P:'#f4f0e9',i===0?K:line,2)+text('YOUR',x+7,y+19,10,K,700)+text('PEOPLE.',x+7,y+32,10,K,700)+rect(x+7,y+40,50,36,i===1?'#191919':'#d8d7c9');}
 studio+=rect(193,92,410,26,'#e9e5db','none',0)+text('Preview',209,109,9,muted)+text('Desktop',518,109,8,muted)+text('Mobile',563,109,8,muted)+text('A HOME FOR PEOPLE WHO BUILD.',219,148,8,muted)+text('Haus is',219,188,33,K,700)+text('built by us.',219,226,33,K,700)+rect(219,249,191,125,'#191919');
 let chat=rect(20,50,260,42,K,'none',0)+path('M35 64H46V74H39L35 77V64',paper)+text('Team chat',58,76,13,paper)+path('M256 67L261 72L266 67',paper)+rect(20,92,260,250,'#eee8df',line,0)+text('No messages yet.',109,220,11,muted)+rect(20,354,260,34,K)+text('Verify to chat',116,376,10,paper)+path('M96 367V363Q101 358 106 363V367M94 367H108V377H94Z',paper,1);
 return svg(1500,600,'What is Haus — editable product UI',grid()+`<g opacity=".035">${word('scribble','Haus',-360,-40,1870,1100,K)}</g>`+
 panel('token-creation',64,101,380,440,-5,launch)+panel('holder-workspace',486,4,690,386,4,community)+panel('website-studio',538,365,628,414,-4,studio)+panel('team-chat',1220,183,300,410,5,chat));
};
