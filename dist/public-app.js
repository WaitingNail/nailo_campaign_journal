import {validateData,escapeHtml as e} from './model.js';
import {frontShell,home,journal,characters,hallOfFame,story,stats,allCharacters,scrollSelected,scrollHallSelected} from './front.js';

const app=document.getElementById('app');
let data,route={page:'home'},characterTransitionDirection=0,characterTransitionTimer=0;
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
 else if(route.page==='characters')content=characters(data,route.key);
 else if(route.page==='hall')content=hallOfFame(data,route.key);
 else if(route.page==='story')content=story(data,data.campaigns.find(c=>c.id===route.id));
 else if(route.page==='stats')content=stats(data);
 else content=`<section class="front-empty"><h1>找不到這一頁</h1><a class="front-button" href="#/">回到首頁</a></section>`;
 app.innerHTML=frontShell(data,route,content,false);
 if(route.page==='characters'){
  const stage=app.querySelector('.character-stage');
  if(stage&&characterTransitionDirection&&!reducedMotion()){
   stage.classList.add('is-entering',characterTransitionDirection<0?'from-prev':'from-next');
   characterTransitionTimer=setTimeout(()=>stage.classList.remove('is-entering','from-prev','from-next'),620);
  }
  characterTransitionDirection=0;requestAnimationFrame(scrollSelected);
 }
 if(route.page==='hall'&&route.key)requestAnimationFrame(scrollHallSelected);
 const titles={home:'首頁',journal:'團務誌',characters:'角色名鑑',hall:'冒險者名人堂',stats:'冒險統計'};
 const selected=data.campaigns.find(c=>c.id===route.id);
 document.title=`${selected?.title||titles[route.page]||'團務手記'} · ${data.ownerName}`;
}

function moveCharacter(step){
 const list=allCharacters(data).filter(x=>x.character.mine);if(!list.length)return;
 const current=Math.max(0,list.findIndex(x=>x.key===route.key));
 navigateCharacter(`#/characters/${list[(current+step+list.length)%list.length].key}`,step);
}

function navigateCharacter(hash,direction){
 if(location.hash===hash)return;
 characterTransitionDirection=direction<0?-1:1;
 const stage=app.querySelector('.character-stage');
 if(!stage||reducedMotion()){location.hash=hash;return}
 clearTimeout(characterTransitionTimer);stage.classList.remove('is-entering','from-prev','from-next','is-leaving','to-prev','to-next');
 stage.classList.add('is-leaving',direction<0?'to-prev':'to-next');
 characterTransitionTimer=setTimeout(()=>{location.hash=hash},190);
}

app.addEventListener('click',event=>{
 const characterLink=event.target.closest('[data-character-select]');
 if(characterLink&&route.page==='characters'){
  event.preventDefault();const current=Number(app.querySelector('.character-stage')?.dataset.characterIndex||0),next=Number(characterLink.dataset.selectorIndex||0);
  if(current!==next)navigateCharacter(characterLink.getAttribute('href'),next<current?-1:1);
  return;
 }
 const button=event.target.closest('[data-action]');if(!button)return;
 if(button.dataset.action==='char-prev')moveCharacter(-1);
 if(button.dataset.action==='char-next')moveCharacter(1);
});
window.addEventListener('hashchange',()=>{clearTimeout(characterTransitionTimer);if(!data)return;render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true})});
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
