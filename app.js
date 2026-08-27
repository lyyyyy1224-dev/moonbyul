const CARDS = [
  {id:1,img:'assets/moonbyul_01.jpg',rarity:1,name:'별이 01'},
  {id:2,img:'assets/moonbyul_02.jpg',rarity:1,name:'별이 02'},
  {id:3,img:'assets/moonbyul_03.jpg',rarity:1,name:'별이 03'},
  {id:4,img:'assets/moonbyul_04.jpg',rarity:1,name:'별이 04'},
  {id:5,img:'assets/moonbyul_05.jpg',rarity:1,name:'별이 05'},
  {id:6,img:'assets/moonbyul_06.jpg',rarity:1,name:'별이 06'},
  {id:7,img:'assets/moonbyul_07.jpg',rarity:2,name:'별이 07'},
  {id:8,img:'assets/moonbyul_08.jpg',rarity:2,name:'별이 08'},
  {id:9,img:'assets/moonbyul_09.jpg',rarity:2,name:'별이 09'},
  {id:10,img:'assets/moonbyul_10.jpg',rarity:2,name:'별이 10'},
  {id:11,img:'assets/moonbyul_11.jpg',rarity:3,name:'별이 11'},
  {id:12,img:'assets/moonbyul_12.jpg',rarity:3,name:'별이 12'}
];
const RARITY = {1:'COMMON ✦',2:'RARE ✦✦',3:'STAR ✦✦✦'};
const SELL_VALUE = {1:80,2:220,3:600};
const SUMMON_COST = 200;
const DEFAULT = {coins:20000,packs:{small:0,big:0,surprise:0},owned:{},opened:0,favorites:[],level:1,summonTarget:3,inventoryOrder:[]};
let state = load(); let filter='all';
let summonHoldTimer=null, summonRepeatTimer=null, summonDidRepeat=false;
let dragState=null;

function load(){try{return {...structuredClone(DEFAULT),...JSON.parse(localStorage.getItem('byulHandbook')||'{}')}}catch(e){return structuredClone(DEFAULT)}}
function save(doRender=true){localStorage.setItem('byulHandbook',JSON.stringify(state));if(doRender)render()}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1500)}
function weighted(pool,weights){let total=weights.reduce((a,b)=>a+b,0),r=Math.random()*total;for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i]}return pool[0]}
function drawCard(kind){let rarity;if(kind==='surprise')rarity=weighted([1,2,3],[20,55,25]);else rarity=weighted([1,2,3],[72,23,5]);const pool=CARDS.filter(c=>c.rarity===rarity);return pool[Math.floor(Math.random()*pool.length)]}
function addCard(c,n=1){state.owned[c.id]=(state.owned[c.id]||0)+n}
function totalOwned(){return Object.values(state.owned).reduce((a,b)=>a+(+b||0),0)}

function buy(type){const cfg={small:[2500,5],big:[4500,10],surprise:[4000,3]}[type];if(state.coins<cfg[0])return toast('⭐ 不夠喔');state.coins-=cfg[0];state.packs[type]++;save();toast('購入成功 ✦')}
function openPack(type){if(!state.packs[type])return toast('先去商店買卡包吧');state.packs[type]--;const n={small:5,big:10,surprise:3}[type],got=[];for(let i=0;i<n;i++){const c=drawCard(type);addCard(c);got.push(c)}state.opened++;state.coins+=Math.min(700,state.opened*25);save();showReveal(got)}
function showReveal(cards){document.getElementById('openMessage').textContent=`翻出了 ${cards.length} 張 Moonbyul 卡 ✨`;document.getElementById('revealGrid').innerHTML=cards.map(c=>cardHTML(c,true)).join('')}
function cardHTML(c,revealed=false){const count=state.owned[c.id]||0,owned=count>0,fav=state.favorites.includes(c.id);return `<div class="card ${owned?'':'locked'} ${fav?'favorite':''}" data-card="${c.id}" ${revealed?'':'title="點擊加入／移出紀念冊"'}><img src="${c.img}" alt="${c.name}"><span class="count">×${count}</span><div class="shade"><div class="name">${owned?c.name:'???'}</div><div class="rarity">${RARITY[c.rarity]}</div></div></div>`}

// ---- Merge area ----
function inventoryItems(){
  const items=[];
  CARDS.forEach(c=>{for(let i=0;i<(state.owned[c.id]||0);i++)items.push({key:`${c.id}-${i}`,card:c,copy:i})});
  return items.sort((a,b)=>a.card.rarity-b.card.rarity || a.card.id-b.card.id);
}
function mergeTileHTML(item,index){const c=item.card;return `<div class="merge-card rarity-${c.rarity}" data-merge-id="${c.id}" data-index="${index}" role="button" aria-label="${c.name}"><img src="${c.img}" alt="${c.name}"><span class="merge-rarity">${'✦'.repeat(c.rarity)}</span></div>`}
function renderMergeInventory(){const items=inventoryItems(),grid=document.getElementById('mergeInventory');grid.innerHTML=items.map(mergeTileHTML).join('');document.getElementById('mergeInventoryCount').textContent=`${items.length} 張`;document.getElementById('emptyMerge').style.display=items.length?'none':'block';bindMergeDrag()}
function organize(){renderMergeInventory();const grid=document.getElementById('mergeInventory');grid.classList.remove('organized-flash');void grid.offsetWidth;grid.classList.add('organized-flash');toast('已按稀有度與卡號整理 ✦')}
function summonOnce(silent=false){const n=Math.max(1,Math.min(10,state.summonTarget||3)),cost=n*SUMMON_COST;if(state.coins<cost){if(!silent)toast('⭐ 不夠召喚');stopSummonHold();return false}state.coins-=cost;for(let i=0;i<n;i++){const c=drawCard('small');addCard(c)}save();if(!silent)toast(`召喚 ${n} 張完成 ✦`);return true}
function setSummonTarget(v){state.summonTarget=Math.max(1,Math.min(10,v));save();}
function startSummonHold(e){e.preventDefault();summonDidRepeat=false;document.getElementById('summonBtn').classList.add('holding');clearTimeout(summonHoldTimer);summonHoldTimer=setTimeout(()=>{summonDidRepeat=true;summonOnce(true);summonRepeatTimer=setInterval(()=>summonOnce(true),620)},480)}
function stopSummonHold(e){if(e)e.preventDefault();clearTimeout(summonHoldTimer);clearInterval(summonRepeatTimer);summonHoldTimer=summonRepeatTimer=null;document.getElementById('summonBtn')?.classList.remove('holding');if(e&&!summonDidRepeat)summonOnce(false);else if(summonDidRepeat){save();toast('停止連續召喚')}}
function findUpgrade(rarity){if(rarity>=3)return null;const pool=CARDS.filter(c=>c.rarity===rarity+1);return pool[Math.floor(Math.random()*pool.length)]}
function mergeSameCard(id){const c=CARDS.find(x=>x.id===id);if(!c||c.rarity>=3)return toast('STAR 已是最高稀有度');if((state.owned[id]||0)<2)return toast('需要兩張相同卡片');state.owned[id]-=2;const gain=findUpgrade(c.rarity);addCard(gain);save();toast(`合成成功 → ${gain.name} ✨`)}
function sellCard(id){const c=CARDS.find(x=>x.id===id);if(!c||(state.owned[id]||0)<1)return;state.owned[id]--;state.coins+=SELL_VALUE[c.rarity];save();toast(`出售 ${c.name} +${SELL_VALUE[c.rarity]} ⭐`)}
function autoMerge(){let did=0;for(const c of CARDS.filter(c=>c.rarity<3)){while((state.owned[c.id]||0)>=2){state.owned[c.id]-=2;addCard(findUpgrade(c.rarity));did++}}save();toast(did?`一鍵合成完成：${did} 次 ✨`:'目前沒有兩張相同的可合成卡')}

function bindMergeDrag(){document.querySelectorAll('.merge-card').forEach(el=>{el.addEventListener('pointerdown',beginPointerDrag);el.ondragstart=()=>false})}
function beginPointerDrag(e){if(e.pointerType==='mouse'&&e.button!==0)return;const el=e.currentTarget,id=+el.dataset.mergeId;dragState={id,source:el,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,started:false};el.setPointerCapture?.(e.pointerId);el.addEventListener('pointermove',movePointerDrag);el.addEventListener('pointerup',endPointerDrag,{once:true});el.addEventListener('pointercancel',cancelPointerDrag,{once:true})}
function movePointerDrag(e){if(!dragState)return;const dx=e.clientX-dragState.startX,dy=e.clientY-dragState.startY;if(!dragState.started&&Math.hypot(dx,dy)>8){dragState.started=true;createDragGhost(dragState.id);dragState.source.classList.add('drag-source');document.body.classList.add('is-dragging')}if(!dragState.started)return;e.preventDefault();moveGhost(e.clientX,e.clientY);highlightDropTarget(e.clientX,e.clientY)}
function createDragGhost(id){const c=CARDS.find(x=>x.id===id),g=document.getElementById('dragGhost');g.innerHTML=`<img src="${c.img}" alt="">`;g.hidden=false}
function moveGhost(x,y){const g=document.getElementById('dragGhost');g.style.transform=`translate3d(${x-38}px,${y-48}px,0) rotate(3deg)`}
function elementAt(x,y){const g=document.getElementById('dragGhost');g.style.pointerEvents='none';const el=document.elementFromPoint(x,y);return el}
function highlightDropTarget(x,y){document.querySelectorAll('.merge-card.drop-target').forEach(x=>x.classList.remove('drop-target'));document.getElementById('sellZone').classList.remove('drag-over');const el=elementAt(x,y);const sell=el?.closest?.('#sellZone');if(sell){sell.classList.add('drag-over');return}const target=el?.closest?.('.merge-card');if(target&&target!==dragState.source&&+target.dataset.mergeId===dragState.id)target.classList.add('drop-target')}
function endPointerDrag(e){const current=dragState;if(!current)return cleanupDrag();current.source.removeEventListener('pointermove',movePointerDrag);if(!current.started)return cleanupDrag();e.preventDefault();const el=elementAt(e.clientX,e.clientY),sell=el?.closest?.('#sellZone'),target=el?.closest?.('.merge-card');cleanupDrag();if(sell)return sellCard(current.id);if(target&&target!==current.source&&+target.dataset.mergeId===current.id)return mergeSameCard(current.id);toast('拖到相同卡片上合成 ✦')}
function cancelPointerDrag(){cleanupDrag()}
function cleanupDrag(){if(dragState?.source){dragState.source.classList.remove('drag-source');dragState.source.removeEventListener('pointermove',movePointerDrag)}dragState=null;document.body.classList.remove('is-dragging');document.querySelectorAll('.merge-card.drop-target').forEach(x=>x.classList.remove('drop-target'));document.getElementById('sellZone')?.classList.remove('drag-over');const g=document.getElementById('dragGhost');g.hidden=true;g.innerHTML='';g.style.transform=''}

function render(){document.getElementById('coins').textContent=state.coins.toLocaleString();document.getElementById('openedStat').textContent=state.opened;document.getElementById('ownedStat').textContent=totalOwned();const discovered=CARDS.filter(c=>(state.owned[c.id]||0)>0).length;document.getElementById('collectionStat').textContent=`${discovered} / ${CARDS.length}`;document.getElementById('level').textContent=1+Math.floor(discovered/4);['small','big','surprise'].forEach(x=>document.getElementById(x+'Count').textContent=state.packs[x]||0);document.getElementById('cardGrid').innerHTML=CARDS.filter(c=>filter==='all'||(state.owned[c.id]||0)>0).map(c=>cardHTML(c)).join('');document.getElementById('albumGrid').innerHTML=state.favorites.length?state.favorites.map(id=>CARDS.find(c=>c.id===id)).filter(Boolean).map(c=>cardHTML(c)).join(''):'<p class="muted">還沒有收藏卡片。</p>';document.getElementById('summonTarget').textContent=state.summonTarget||3;renderMergeInventory()}
function switchView(v){document.querySelectorAll('.panel:not(.hero)').forEach(x=>x.classList.remove('active-view'));document.getElementById('view-'+v).classList.add('active-view');document.querySelectorAll('.nav[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));window.scrollTo({top:150,behavior:'smooth'});if(v==='merge')renderMergeInventory()}
function exportCode(){const d=btoa(unescape(encodeURIComponent(JSON.stringify(state))));document.getElementById('codeTitle').textContent='📤 引繼碼';document.getElementById('codeArea').value=d;document.getElementById('codeAction').textContent='複製引繼碼';document.getElementById('codeAction').onclick=()=>navigator.clipboard.writeText(d).then(()=>toast('已複製'));document.getElementById('codeDialog').showModal()}
function importCode(){document.getElementById('codeTitle').textContent='📥 讀取引繼碼';const area=document.getElementById('codeArea');area.value='';document.getElementById('codeAction').textContent='匯入進度';document.getElementById('codeAction').onclick=()=>{try{state={...structuredClone(DEFAULT),...JSON.parse(decodeURIComponent(escape(atob(area.value.trim()))))};save();document.getElementById('codeDialog').close();toast('進度匯入成功')}catch(e){toast('引繼碼格式不正確')}};document.getElementById('codeDialog').showModal()}

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelectorAll('[data-pack]').forEach(b=>b.addEventListener('click',()=>buy(b.dataset.pack)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPack(b.dataset.open)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.getElementById('settingsBtn').onclick=()=>document.getElementById('settingsDialog').showModal();
document.getElementById('albumBtn').onclick=()=>{render();document.getElementById('settingsDialog').close();document.getElementById('albumDialog').showModal()};
document.getElementById('exportBtn').onclick=exportCode;document.getElementById('importBtn').onclick=importCode;
document.getElementById('autoMergeBtn').onclick=autoMerge;document.getElementById('organizeBtn').onclick=organize;
document.getElementById('summonMinus').onclick=()=>setSummonTarget((state.summonTarget||3)-1);document.getElementById('summonPlus').onclick=()=>setSummonTarget((state.summonTarget||3)+1);
const summonBtn=document.getElementById('summonBtn');summonBtn.addEventListener('pointerdown',startSummonHold);summonBtn.addEventListener('pointerup',stopSummonHold);summonBtn.addEventListener('pointercancel',stopSummonHold);summonBtn.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&summonHoldTimer)stopSummonHold(e)});summonBtn.addEventListener('contextmenu',e=>e.preventDefault());
document.getElementById('resetBtn').onclick=()=>{if(confirm('確定要清除這個瀏覽器的所有遊戲進度嗎？')){state=structuredClone(DEFAULT);save();toast('已重置')}};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));render()});
document.addEventListener('click',e=>{const card=e.target.closest('.card[data-card]');if(!card||!(state.owned[card.dataset.card]>0)||card.closest('#revealGrid'))return;const id=+card.dataset.card,idx=state.favorites.indexOf(id);if(idx>=0)state.favorites.splice(idx,1);else state.favorites.push(id);save()});
render();
