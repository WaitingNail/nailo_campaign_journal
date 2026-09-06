(() => {
  "use strict";
  const __modules = Object.create(null);
  __modules["./model.js"] = (() => {
const SYSTEMS={dnd:{name:'Dungeons & Dragons',short:'D&D',icon:'swords',color:'#be9656'},coc:{name:'Call of Cthulhu',short:'CoC',icon:'moon',color:'#8d7aae'},other:{name:'其他系統',short:'其他系統',icon:'compass',color:'#6b9fa0'}};
const STATUSES={active:'進行中',completed:'已完結',paused:'暫停中',planned:'籌備中',abandoned:'已中止'};
const ATTRS={STR:'力量',CON:'體質',SIZ:'體型',DEX:'敏捷',APP:'外貌',INT:'智力',POW:'意志',EDU:'教育'};
const COLORS=['#378b8b','#c09a5e','#8f7cb0','#80adb1','#657b9e','#b88587','#93a67e','#b5b4bb'];
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function safeImageSrc(value){
 if(typeof value!=='string'||value.length>3500000)return '';
 if(/^data:image\/(?:png|webp|jpeg);base64,[a-zA-Z0-9+/=\r\n]+$/.test(value))return value;
 if(/^https?:\/\//.test(value))return safeUrl(value);
 return /^(?:\.\/)?(?:assets|images)\/[a-zA-Z0-9_./-]+\.(?:png|webp|jpe?g)$/i.test(value)?value:'';
}
const level=char=>char.classes?.length?char.classes.reduce((n,c)=>n+c.level,0):null;
const party=campaign=>[...new Set(campaign.characters.map(c=>c.player).filter(Boolean))];
const ownCharacters=campaigns=>campaigns.flatMap(c=>c.characters.filter(p=>p.mine));
const countBy=(values)=>Object.entries(values.filter(v=>v!==null&&v!==undefined&&v!=='').reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'zh-Hant'));
const mean=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null;
function buckets(values,ranges){return ranges.map(([name,min,max])=>({name,value:values.filter(v=>v>=min&&v<=max).length}))}
function getStats(campaigns,role){const chars=role==='played'?ownCharacters(campaigns):campaigns.flatMap(c=>c.characters);return{campaigns:campaigns.length,characters:chars.length,sessions:campaigns.reduce((a,c)=>a+c.sessions.length,0),players:new Set(campaigns.flatMap(party)).size,active:campaigns.filter(c=>c.status==='active').length,systems:countBy(campaigns.map(c=>c.system==='other'?c.systemName||'其他系統':SYSTEMS[c.system].short)),chars};}
function validateData(data){
 const fail=m=>{throw new Error(m)};const txt=(v,max=1000)=>typeof v==='string'&&v.length<=max;
 const date=v=>v===''||(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v);
 if(!data||typeof data!=='object'||data.schemaVersion!==1||!Array.isArray(data.campaigns)||data.campaigns.length>1000)fail('資料格式不符：需要 schemaVersion: 1 與 campaigns 清單（最多 1,000 團）。');
 if(!txt(data.ownerName,80)||!data.ownerName.trim()||typeof data.demo!=='boolean')fail('請填寫有效的 ownerName 與 demo 設定。');
 const ids=new Set();
 for(const [i,c] of data.campaigns.entries()){
  const where=`第 ${i+1} 團`;
  if(!c||!txt(c.id,100)||!c.id||ids.has(c.id)||!/^[a-zA-Z0-9_-]+$/.test(c.id))fail(`${where}的 id 無效或重複。`);ids.add(c.id);
  if(!['played','gm'].includes(c.role)||!SYSTEMS[c.system]||!STATUSES[c.status])fail(`${where}的身分、系統或狀態無效。`);
  for(const k of ['title','gm'])if(!txt(c[k],180)||!c[k].trim())fail(`${where}的${k==='title'?'劇本名稱':'GM'}不可空白。`);
  for(const k of ['edition','systemName','description'])if(c[k]!==undefined&&!txt(c[k],k==='description'?20000:200))fail(`${where}的 ${k} 格式不正確。`);
  if(!date(c.startDate)||!date(c.endDate))fail(`${where}的日期格式不正確。`);
  if(c.startDate&&c.endDate&&c.endDate<c.startDate)fail(`${where}的結束日期不可早於開始日期。`);
  if(!Array.isArray(c.characters)||c.characters.length>100||!Array.isArray(c.sessions)||c.sessions.length>2000)fail(`${where}的角色或回次清單不正確。`);
  const charIds=new Set();
  for(const p of c.characters){
   if(!p||!txt(p.id,100)||!p.id||charIds.has(p.id))fail(`${where}有無效或重複的角色 id。`);charIds.add(p.id);
   if(!txt(p.name,180)||!p.name.trim()||!txt(p.player,180)||!p.player.trim()||typeof p.mine!=='boolean')fail(`${where}的角色姓名、玩家或「我的角色」設定不正確。`);
   for(const k of ['ancestry','background','occupation','notes','sheetUrl','portraitAlt'])if(p[k]!==undefined&&!txt(p[k],k==='notes'?10000:2000))fail(`${where}的角色欄位 ${k} 格式不正確。`);
   if(p.sheetUrl&&!safeUrl(p.sheetUrl))fail(`${where}的角色卡連結必須是 http 或 https 網址。`);
   if(p.portrait!==undefined&&p.portrait!==''&&!safeImageSrc(p.portrait))fail(`${where}的角色立繪格式不正確。請使用 PNG、WebP、JPG 網址或網站內的 assets/images 路徑。`);
   if(p.color!==undefined&&!/^#[0-9a-fA-F]{6}$/.test(p.color))fail(`${where}的角色底色需為六位數色碼，例如 #264653。`);
   if(!Array.isArray(p.classes)||p.classes.length>20||p.classes.some(x=>!x||!txt(x.name,100)||!x.name.trim()||!Number.isInteger(x.level)||x.level<1||x.level>100||x.subclass!==undefined&&!txt(x.subclass,120)))fail(`${where}的職業等級格式不正確。`);
   if(!p.attributes||typeof p.attributes!=='object'||Array.isArray(p.attributes)||Object.entries(p.attributes).some(([k,v])=>!ATTRS[k]||v!==null&&(!Number.isFinite(v)||v<0||v>999)))fail(`${where}的屬性需為 0–999 的數字或 null。`);
   if(!Array.isArray(p.skills)||p.skills.length>250||p.skills.some(x=>!x||!txt(x.name,180)||!x.name.trim()||!Number.isFinite(x.value)||x.value<0||x.value>999))fail(`${where}的技能格式不正確。`);
   if(new Set(p.skills.map(s=>s.name.trim())).size!==p.skills.length)fail(`${where}的同一角色不可有重複技能名稱。`);
  }
  const sessionIds=new Set();
  for(const s of c.sessions){if(!s||!txt(s.id,100)||!s.id||sessionIds.has(s.id)||!txt(s.title,200)||!s.title.trim()||!date(s.date)||!txt(s.summary,50000)||!txt(s.url,2000)||(s.url&&!safeUrl(s.url)))fail(`${where}的回次資料或連結格式不正確。`);sessionIds.add(s.id);}
 }
 return data;
}

    return { SYSTEMS, STATUSES, ATTRS, COLORS, escapeHtml, safeUrl, safeImageSrc, level, party, ownCharacters, countBy, mean, buckets, getStats, validateData };
  })();
  __modules["./shared.js"] = (() => {
const { STATUSES, escapeHtml: e } = __modules["./model.js"];
const paths={book:'<path d="M4 3h12a4 4 0 0 1 4 4v14H7a3 3 0 0 1-3-3V3Z"/><path d="M4 17h16M8 7h8M8 10h6"/>',arrow:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m12 5-7 7 7 7M5 12h15"/>',link:'<path d="M14 3h7v7M21 3l-9 9M10 4H4v16h16v-6"/>'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.book}</svg>`;
const status=campaign=>`<span class="status ${e(campaign.status)}">${STATUSES[campaign.status]}</span>`;

    return { icon, status };
  })();
  __modules["./front.js"] = (() => {
const { SYSTEMS, STATUSES, COLORS, escapeHtml: e, safeImageSrc, level, party, countBy, getStats } = __modules["./model.js"];
const { icon, status } = __modules["./shared.js"];
const fmt=d=>d?new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric'}).format(new Date(`${d}T00:00:00`)):'日期未定';
const systemName=c=>c.system==='other'?c.systemName||'其他系統':SYSTEMS[c.system].short;
const excerpt=(text,max=94)=>{const value=(text||'尚未留下文字紀錄。').replace(/\s+/g,' ').trim();return value.length>max?`${value.slice(0,max)}…`:value};
const portraitKey=(c,p)=>`${encodeURIComponent(c.id)}/${encodeURIComponent(p.id)}`;
const characterColor=(c,p)=>{if(/^#[0-9a-fA-F]{6}$/.test(p.color||''))return p.color;const key=`${c.id}:${p.id}`;let n=0;for(const ch of key)n=(n*31+ch.charCodeAt(0))>>>0;return ['#315B63','#7B5264','#53698B','#6D6547','#694D76','#3F6C5B','#865D45'][n%7]};
const allCharacters=data=>data.campaigns.flatMap(c=>c.characters.map(p=>({campaign:c,character:p,key:portraitKey(c,p)})));
const myCharacters=data=>allCharacters(data).filter(x=>x.character.mine);
const characterHref=(c,p)=>`#/${p.mine?'characters':'hall'}/${portraitKey(c,p)}`;

function portrait(c,p,variant='card'){
 const src=safeImageSrc(p.portrait||''),color=characterColor(c,p);
 return `<div class="portrait portrait-${variant}" style="--portrait-bg:${color}">${src?`<img src="${e(src)}" alt="${e(p.portraitAlt||`${p.name}角色立繪`)}">`:`<div class="portrait-fallback" aria-label="${e(p.name)}尚未上傳立繪"><span>${e(p.name.slice(0,1))}</span><small>PORTRAIT</small></div>`}<span class="portrait-system">${e(systemName(c))}</span></div>`;
}
function publicNav(route){const active=name=>route.page===name?'active':'';return `<header class="public-header"><a href="#/" class="public-brand"><img src="./favicon.svg" alt=""><span><strong>奈羅的團務手記</strong><small>THE CAMPAIGN JOURNAL</small></span></a><nav class="public-nav" aria-label="前台導覽"><a href="#/" class="${active('home')}">首頁</a><a href="#/journal/all/all" class="${active('journal')||active('public-campaign')}">團務誌</a><a href="#/characters" class="${active('characters')}">角色名鑑</a><a href="#/hall" class="${active('hall')}">冒險者名人堂</a><a href="#/stats" class="${active('stats')}">冒險統計</a></nav></header>`}
function frontShell(data,route,content,local=false){return `<div class="public-site">${publicNav(route)}<main id="main" class="public-main" tabindex="-1">${data.demo?`<div class="demo-ribbon">目前使用虛構示範資料，版面與功能可直接操作。</div>`:''}${content}</main><footer class="public-footer"><div><strong>奈羅的團務手記</strong><p>在骰聲停下以後，把故事留在這裡。</p></div><div><a href="#/journal/played/all">我跑過的團</a><a href="#/journal/gm/all">我帶過的團</a><a href="#/characters">角色名鑑</a><a href="#/hall">冒險者名人堂</a></div><span>© ${new Date().getFullYear()} ${e(data.ownerName)}${local?' · 本機草稿':''}</span></footer></div>`}

function campaignVisual(c,wide=false){const mine=c.characters.find(p=>p.mine)||c.characters[0];return `<div class="campaign-visual ${wide?'wide':''}" style="--campaign-color:${mine?characterColor(c,mine):SYSTEMS[c.system].color}">${mine?portrait(c,mine,wide?'hero':'card'):`<div class="portrait-fallback"><span>${e(c.title.slice(0,1))}</span></div>`}<div class="campaign-visual-copy"><span>${e(systemName(c))}</span><small>${c.role==='played'?'PLAYER’S JOURNAL':'GAME MASTER’S JOURNAL'}</small></div></div>`}
function campaignCard(c){const latest=c.sessions.at(-1);return `<article class="blog-card"><a href="#/story/${e(c.id)}" class="blog-card-image">${campaignVisual(c)}</a><div class="blog-card-body"><div class="post-meta"><span>${e(systemName(c))}</span><time>${fmt(latest?.date||c.startDate)}</time></div><h3><a href="#/story/${e(c.id)}">${e(c.title)}</a></h3><p>${e(excerpt(latest?.summary||c.description))}</p><div class="blog-card-foot"><span>${c.role==='played'?`GM · ${e(c.gm)}`:`${party(c).length} 位玩家`}</span><a href="#/story/${e(c.id)}">閱讀團務 ${icon('arrow')}</a></div></div></article>`}
function home(data){
 const campaigns=[...data.campaigns].sort((a,b)=>(b.sessions.at(-1)?.date||b.startDate||'').localeCompare(a.sessions.at(-1)?.date||a.startDate||''));const featured=campaigns[0];const recent=campaigns.slice(1,4);const chars=myCharacters(data).slice(0,8);
 if(!featured)return `<section class="front-empty"><span>THE FIRST PAGE</span><h1>第一場冒險，會從這裡開始。</h1><p>新的團務與角色公開後，會在這裡整理成冒險網誌。</p></section>`;
 const latest=featured.sessions.at(-1);
 return `<section class="front-hero"><div class="front-hero-copy"><span class="front-kicker">LATEST ADVENTURE · ${e(systemName(featured))}</span><h1>${e(featured.title)}</h1><p>${e(excerpt(latest?.summary||featured.description,150))}</p><div class="front-hero-meta"><span>${fmt(latest?.date||featured.startDate)}</span><span>${featured.role==='played'?`GM · ${e(featured.gm)}`:`由 ${e(data.ownerName)} 主持`}</span></div><a class="front-button" href="#/story/${e(featured.id)}">閱讀這場冒險 ${icon('arrow')}</a></div>${campaignVisual(featured,true)}</section><section class="front-section"><header class="front-section-head"><div><span>RECENT STORIES</span><h2>最近翻動的篇章</h2></div><a href="#/journal/all/all">閱讀全部團務 ${icon('arrow')}</a></header><div class="blog-grid">${recent.map(campaignCard).join('')}</div></section><section class="front-section character-preview"><header class="front-section-head"><div><span>CHARACTER ARCHIVE</span><h2>曾經成為的那些人</h2></div><a href="#/characters">開啟角色名鑑 ${icon('arrow')}</a></header><div class="preview-character-row">${chars.map(({campaign,character,key})=>`<a href="#/characters/${key}" class="preview-character">${portrait(campaign,character,'thumb')}<strong>${e(character.name)}</strong><small>${e(campaign.title)}</small></a>`).join('')}</div></section>`;
}
function journal(data,role='all',system='all'){
 const filtered=data.campaigns.filter(c=>(role==='all'||c.role===role)&&(system==='all'||c.system===system)).sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||''));
 const nav=(base,items,current)=>items.map(([key,label])=>`<a href="#/journal/${base==='role'?key:role}/${base==='system'?key:system}" class="${current===key?'active':''}">${label}<span>${data.campaigns.filter(c=>(base==='role'?(key==='all'||c.role===key):(role==='all'||c.role===role)&&(key==='all'||c.system===key))).length}</span></a>`).join('');
 return `<section class="front-page-head"><span>CAMPAIGN STORIES</span><h1>團務誌</h1><p>跑過的路、主持的世界，以及每次骰子落定後留下的選擇。</p></section><div class="journal-filters"><div>${nav('role',[['all','全部'],['played','我跑過的團'],['gm','我帶過的團']],role)}</div><div>${nav('system',[['all','所有系統'],['dnd','D&D'],['coc','CoC'],['other','其他']],system)}</div></div>${filtered.length?`<div class="blog-grid journal-grid">${filtered.map(campaignCard).join('')}</div>`:`<div class="front-empty"><h2>這個分類還沒有公開的團務紀錄</h2></div>`}`;
}
function charSubtitle(c,p){if(c.system==='dnd')return `${p.classes.map(x=>x.name).join(' / ')||'職業未填'}${level(p)?` · Lv.${level(p)}`:''}`;if(c.system==='coc')return p.occupation||'調查員';return c.systemName||'角色';}
function characters(data,key,includeAll=false){
 const list=includeAll?allCharacters(data):myCharacters(data),base=includeAll?'hall':'characters';
 if(!list.length)return `<section class="front-empty"><span>${includeAll?'ADVENTURER HALL OF FAME':'MY CHARACTER ARCHIVE'}</span><h1>${includeAll?'冒險者名人堂還是空的':'角色名鑑還是空的'}</h1><p>${includeAll?'所有玩家角色公開後，便會收錄在這裡。':'標記為「我的角色」的資料公開後，便會出現在這裡。'}</p></section>`;
 let index=Math.max(0,list.findIndex(x=>x.key===key));const selected=list[index],{campaign:c,character:p}=selected;
 return `<section class="character-stage ${includeAll?'hall-stage':''}" data-character-index="${index}"><div class="character-stage-bg" data-label="${includeAll?'HALL OF FAME':'MY CHARACTERS'}" style="--portrait-bg:${p.color||'#375963'}"></div><div class="character-feature">${portrait(c,p,'feature')}<div class="character-copy"><span class="front-kicker">${e(systemName(c))} · ${p.mine?'我的角色':`玩家 · ${e(p.player)}`}</span><h1>${e(p.name)}</h1><p class="character-class">${e(charSubtitle(c,p))}</p><dl><div><dt>所屬團務</dt><dd><a href="#/story/${e(c.id)}">${e(c.title)}</a></dd></div><div><dt>玩家</dt><dd>${e(p.player)}</dd></div><div><dt>GM</dt><dd>${e(c.gm)}</dd></div>${p.ancestry?`<div><dt>種族</dt><dd>${e(p.ancestry)}</dd></div>`:''}${p.background?`<div><dt>背景</dt><dd>${e(p.background)}</dd></div>`:''}</dl><p class="character-description">${e(p.notes||'這名角色的故事，還等著被寫下。')}</p>${p.sheetUrl?`<a class="front-text-link" href="${e(p.sheetUrl)}" target="_blank" rel="noopener noreferrer">開啟角色卡 ${icon('link')}</a>`:''}</div></div><div class="character-selector-wrap"><button class="selector-arrow prev" data-action="char-prev" aria-label="上一位角色">${icon('back')}</button><div class="character-selector" id="character-selector" role="listbox" aria-label="選擇角色">${list.map((x,i)=>`<a role="option" aria-selected="${i===index}" href="#/${base}/${x.key}" class="selector-card ${i===index?'selected':''}" data-selector-index="${i}" style="--portrait-bg:${x.character.color||'#375963'}">${portrait(x.campaign,x.character,'selector')}<span><strong>${e(x.character.name)}</strong><small>${e(x.campaign.title)}</small></span></a>`).join('')}</div><button class="selector-arrow next" data-action="char-next" aria-label="下一位角色">${icon('arrow')}</button></div><p class="selector-help">${includeAll?'名人堂收錄所有玩家角色 · ':''}使用左右方向鍵或箭頭循環選擇 · ${index+1} / ${list.length}</p></section>`;
}
function story(data,c){if(!c)return `<section class="front-empty"><h1>找不到這場冒險</h1><a class="front-button" href="#/journal/all/all">返回團務誌</a></section>`;return `<article class="story-page"><header class="story-head"><a href="#/journal/${c.role}/${c.system}" class="front-text-link">${icon('back')}返回團務誌</a><span>${e(systemName(c))} · ${c.role==='played'?'PLAYER’S JOURNAL':'GAME MASTER’S JOURNAL'}</span><h1>${e(c.title)}</h1><p>${e(c.description||'這場冒險的介紹尚未寫下。')}</p><div><span>${status(c)}</span><span>GM · ${e(c.gm)}</span><span>${fmt(c.startDate)}</span><span>${c.sessions.length} 回紀錄</span></div></header><section class="story-party"><div class="front-section-head"><div><span>THE PARTY</span><h2>同行的角色</h2></div></div><div class="story-character-row">${c.characters.map(p=>`<a href="${characterHref(c,p)}">${portrait(c,p,'story')}<strong>${e(p.name)}</strong><small>${e(charSubtitle(c,p))}</small></a>`).join('')}</div></section><section class="story-entries"><header><span>SESSION ARCHIVE</span><h2>冒險紀錄</h2></header>${c.sessions.length?c.sessions.map((s,i)=>`<article class="story-entry"><div class="story-entry-no">${String(i+1).padStart(2,'0')}</div><div><time>${fmt(s.date)}</time><h3>${e(s.title)}</h3><p>${e(s.summary||'本回摘要尚未寫下。')}</p>${s.url?`<a class="front-text-link" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">閱讀完整團錄 ${icon('link')}</a>`:''}</div></article>`).join(''):`<div class="front-empty"><p>尚未新增回次紀錄。</p></div>`}</section></article>`}

function systemBars(items){const max=Math.max(1,...items.map(x=>x.value));return `<div class="front-bars">${items.map((x,i)=>`<div><span>${e(x.name)}</span><i><b style="width:${x.value/max*100}%;background:${COLORS[i%COLORS.length]}"></b></i><strong>${x.value}</strong></div>`).join('')}</div>`}
function stats(data){const played=data.campaigns.filter(c=>c.role==='played'),gm=data.campaigns.filter(c=>c.role==='gm'),ps=getStats(played,'played'),gs=getStats(gm,'gm');const systems=countBy(data.campaigns.map(c=>systemName(c)));return `<section class="front-page-head"><span>THE NUMBERS BEHIND THE STORIES</span><h1>冒險統計</h1><p>從角色與團務紀錄整理出的旅程輪廓。</p></section><div class="front-stat-numbers"><div><strong>${data.campaigns.length}</strong><span>場團務</span></div><div><strong>${ps.characters}</strong><span>我的角色</span></div><div><strong>${gs.players}</strong><span>主持過的玩家</span></div><div><strong>${ps.sessions+gs.sessions}</strong><span>回冒險紀錄</span></div></div><div class="front-stats-grid"><section><span>SYSTEMS</span><h2>探索的遊戲系統</h2>${systemBars(systems)}</section><section><span>TWO SIDES OF THE TABLE</span><h2>玩家與主持</h2>${systemBars([{name:'我跑過的團',value:ps.campaigns},{name:'我帶過的團',value:gs.campaigns}])}</section></div>`}

function scrollSelected(){const selected=document.querySelector('.selector-card.selected'),rail=document.getElementById('character-selector');if(!selected||!rail)return;const overflow=rail.scrollWidth>rail.clientWidth+4;document.querySelectorAll('.selector-arrow').forEach(b=>b.hidden=!overflow);if(overflow)rail.scrollTo({left:selected.offsetLeft-(rail.clientWidth-selected.clientWidth)/2,behavior:'smooth'})}

    return { allCharacters, frontShell, home, journal, characters, story, stats, scrollSelected };
  })();
  (() => {
const { validateData, escapeHtml: e } = __modules["./model.js"];
const { frontShell, home, journal, characters, story, stats, allCharacters, scrollSelected } = __modules["./front.js"];
const app=document.getElementById('app');
let data,route={page:'home'};

function parseRoute(){
 const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
 if(!parts.length)return{page:'home'};
 if(parts[0]==='journal')return{page:'journal',role:['all','played','gm'].includes(parts[1])?parts[1]:'all',system:['all','dnd','coc','other'].includes(parts[2])?parts[2]:'all'};
 if(['characters','hall'].includes(parts[0]))return{page:parts[0],key:parts.length>2?`${parts[1]}/${parts[2]}`:''};
 if(parts[0]==='story')return{page:'story',id:parts[1]};
 if(parts[0]==='stats')return{page:'stats'};
 return{page:'not-found'};
}

function render(){
 route=parseRoute();let content='';
 if(route.page==='home')content=home(data);
 else if(route.page==='journal')content=journal(data,route.role,route.system);
 else if(route.page==='characters'||route.page==='hall')content=characters(data,route.key,route.page==='hall');
 else if(route.page==='story')content=story(data,data.campaigns.find(c=>c.id===route.id));
 else if(route.page==='stats')content=stats(data);
 else content=`<section class="front-empty"><h1>找不到這一頁</h1><a class="front-button" href="#/">回到首頁</a></section>`;
 app.innerHTML=frontShell(data,route,content,false);
 if(route.page==='characters'||route.page==='hall')requestAnimationFrame(scrollSelected);
 const titles={home:'首頁',journal:'團務誌',characters:'角色名鑑',hall:'冒險者名人堂',stats:'冒險統計'};
 const selected=data.campaigns.find(c=>c.id===route.id);
 document.title=`${selected?.title||titles[route.page]||'團務手記'} · ${data.ownerName}`;
}

function moveCharacter(step){
 const list=allCharacters(data).filter(x=>route.page==='hall'||x.character.mine);if(!list.length)return;
 const current=Math.max(0,list.findIndex(x=>x.key===route.key));
 location.hash=`#/${route.page}/${list[(current+step+list.length)%list.length].key}`;
}

app.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 if(button.dataset.action==='char-prev')moveCharacter(-1);
 if(button.dataset.action==='char-next')moveCharacter(1);
});
window.addEventListener('hashchange',()=>{if(!data)return;render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true})});
window.addEventListener('resize',()=>{if(route.page==='characters'||route.page==='hall')scrollSelected()},{passive:true});
window.addEventListener('keydown',event=>{if(!['characters','hall'].includes(route.page)||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(event.key==='ArrowLeft'){event.preventDefault();moveCharacter(-1)}if(event.key==='ArrowRight'){event.preventDefault();moveCharacter(1)}});

async function boot(){
 try{
  const response=await fetch(new URL('./data/campaigns.json',document.baseURI),{cache:'no-cache'});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  data=validateData(await response.json());render();
 }catch(error){
  app.innerHTML=`<div class="boot"><h1>手記暫時無法開啟</h1><p>無法載入團務資料，請稍後重新整理。</p><p>${e(error.message)}</p></div>`;
 }
}
boot();

  })();
})();
