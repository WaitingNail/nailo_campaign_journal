export const SYSTEMS={dnd:{name:'Dungeons & Dragons',short:'D&D',icon:'swords',color:'#be9656'},coc:{name:'Call of Cthulhu',short:'CoC',icon:'moon',color:'#8d7aae'},other:{name:'其他系統',short:'其他系統',icon:'compass',color:'#6b9fa0'}};
export const STATUSES={active:'進行中',completed:'已完結',paused:'暫停中',planned:'籌備中',abandoned:'已中止'};
export const ATTRS={STR:'力量',CON:'體質',SIZ:'體型',DEX:'敏捷',APP:'外貌',INT:'智力',POW:'意志',EDU:'教育'};
export const COLORS=['#378b8b','#c09a5e','#8f7cb0','#80adb1','#657b9e','#b88587','#93a67e','#b5b4bb'];
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
export function safeImageSrc(value){
 if(typeof value!=='string'||value.length>3500000)return '';
 if(/^data:image\/(?:png|webp|jpeg);base64,[a-zA-Z0-9+/=\r\n]+$/.test(value))return value;
 if(/^https?:\/\//.test(value))return safeUrl(value);
 return /^(?:\.\/)?(?:assets|images)\/[a-zA-Z0-9_./-]+\.(?:png|webp|jpe?g)$/i.test(value)?value:'';
}
export const level=char=>char.classes?.length?char.classes.reduce((n,c)=>n+c.level,0):null;
export const party=campaign=>[...new Set(campaign.characters.map(c=>c.player).filter(Boolean))];
export const ownCharacters=campaigns=>campaigns.flatMap(c=>c.characters.filter(p=>p.mine));
export const countBy=(values)=>Object.entries(values.filter(v=>v!==null&&v!==undefined&&v!=='').reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'zh-Hant'));
export const mean=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null;
export function buckets(values,ranges){return ranges.map(([name,min,max])=>({name,value:values.filter(v=>v>=min&&v<=max).length}))}
export function getStats(campaigns,role){const chars=role==='played'?ownCharacters(campaigns):campaigns.flatMap(c=>c.characters);return{campaigns:campaigns.length,characters:chars.length,sessions:campaigns.reduce((a,c)=>a+c.sessions.length,0),players:new Set(campaigns.flatMap(party)).size,active:campaigns.filter(c=>c.status==='active').length,systems:countBy(campaigns.map(c=>c.system==='other'?c.systemName||'其他系統':SYSTEMS[c.system].short)),chars};}
export function validateData(data){
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
  for(const k of ['edition','systemName','description','coverAlt'])if(c[k]!==undefined&&!txt(c[k],k==='description'?20000:200))fail(`${where}的 ${k} 格式不正確。`);
  if(c.cover!==undefined&&c.cover!==''&&!safeImageSrc(c.cover))fail(`${where}的團務封面格式不正確。請使用 PNG、WebP、JPG 網址或網站內的 assets/images 路徑。`);
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
