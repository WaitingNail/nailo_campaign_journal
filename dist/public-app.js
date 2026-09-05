import {validateData,escapeHtml as e} from './model.js';
import {frontShell,home,journal,characters,story,stats,allCharacters,scrollSelected} from './front.js';

const app=document.getElementById('app');
let data,route={page:'home'};

function parseRoute(){
 const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
 if(!parts.length)return{page:'home'};
 if(parts[0]==='journal')return{page:'journal',role:['all','played','gm'].includes(parts[1])?parts[1]:'all',system:['all','dnd','coc','other'].includes(parts[2])?parts[2]:'all'};
 if(parts[0]==='characters')return{page:'characters',key:parts.length>2?`${parts[1]}/${parts[2]}`:''};
 if(parts[0]==='story')return{page:'story',id:parts[1]};
 if(parts[0]==='stats')return{page:'stats'};
 return{page:'not-found'};
}

function render(){
 route=parseRoute();let content='';
 if(route.page==='home')content=home(data);
 else if(route.page==='journal')content=journal(data,route.role,route.system);
 else if(route.page==='characters')content=characters(data,route.key);
 else if(route.page==='story')content=story(data,data.campaigns.find(c=>c.id===route.id));
 else if(route.page==='stats')content=stats(data);
 else content=`<section class="front-empty"><h1>找不到這一頁</h1><a class="front-button" href="#/">回到首頁</a></section>`;
 app.innerHTML=frontShell(data,route,content,false);
 if(route.page==='characters')requestAnimationFrame(scrollSelected);
 const titles={home:'首頁',journal:'團務誌',characters:'角色名鑑',stats:'冒險統計'};
 const selected=data.campaigns.find(c=>c.id===route.id);
 document.title=`${selected?.title||titles[route.page]||'團務手記'} · ${data.ownerName}`;
}

function moveCharacter(step){
 const list=allCharacters(data);if(!list.length)return;
 const current=Math.max(0,list.findIndex(x=>x.key===route.key));
 location.hash=`#/characters/${list[(current+step+list.length)%list.length].key}`;
}

app.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 if(button.dataset.action==='char-prev')moveCharacter(-1);
 if(button.dataset.action==='char-next')moveCharacter(1);
});
window.addEventListener('hashchange',()=>{if(!data)return;render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true})});
window.addEventListener('resize',()=>{if(route.page==='characters')scrollSelected()},{passive:true});
window.addEventListener('keydown',event=>{if(route.page!=='characters'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(event.key==='ArrowLeft'){event.preventDefault();moveCharacter(-1)}if(event.key==='ArrowRight'){event.preventDefault();moveCharacter(1)}});

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
