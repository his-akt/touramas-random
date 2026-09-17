// ツアマス ランダム編成アプリ：ロジック・UI
const ACCESSORY_SLOTS=[
 {key:"頭",aliases:["アクセサリー（頭）リスト","アクセサリ（頭）リスト","アクセサリ（頭）","アクセサリー（頭）","頭"]},
 {key:"顔",aliases:["アクセサリー（顔）リスト","アクセサリ（顔）リスト","アクセサリ（顔）","アクセサリー（顔）","顔"]},
 {key:"腕",aliases:["アクセサリー（腕）リスト","アクセサリ（腕）リスト","アクセサリ（腕）","アクセサリー（腕）","腕"]},
 {key:"胴",aliases:["アクセサリー（胴）リスト","アクセサリ（胴）リスト","アクセサリ（胴）","アクセサリー（胴）","胴"]},
 {key:"腰",aliases:["アクセサリー（腰）リスト","アクセサリ（腰）リスト","アクセサリ（腰）","アクセサリー（腰）","腰"]},
 {key:"足",aliases:["アクセサリー（足）リスト","アクセサリ（足）リスト","アクセサリ（足）","アクセサリー（足）","足"]}
];
const POSITIONS=["レフト","センター","ライト"];
const ACCESSORY_RATE=.5;
const norm=v=>v==null?"":String(v).trim();
const eq=(a,b)=>norm(a)===norm(b);
const common=v=>{const s=norm(v);return s===""||s==="共通"};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function esc(v){return norm(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function firstSheet(names){return names.find(n=>Array.isArray(DB[n]))}
function rows(names){const n=firstSheet(names);return n?DB[n]:[]}
const STAGES=rows(["ステージリスト","ステージ"]);
const SONGS=rows(["楽曲リスト","楽曲"]);
const IDOLS=rows(["アイドルリスト","アイドル"]);
const COSTUMES=rows(["衣装リスト","衣装"]);
const SP_APPEALS=rows(["SPアピールリスト","スペシャルアピールリスト"]);
const SP_CONDITIONS=rows(["SPアピール使用条件"]);
const SP_TARGETS=rows(["SPアピール設定対象"]);
function accessoryRows(slot){const n=slot.aliases.find(x=>Array.isArray(DB[x]));return n?DB[n]:[]}
const ALL_GENRES=[...new Set([
 ...COSTUMES.map(x=>norm(x["ジャンル"])),
 ...ACCESSORY_SLOTS.flatMap(s=>accessoryRows(s).map(x=>norm(x["ジャンル"]))),
 ...SP_APPEALS.map(x=>norm(x["ジャンル"]))
].filter(Boolean))];
const RARITY_ORDER=["なし","UR","SSR","SR","R","N"];
const ALL_RARITIES=RARITY_ORDER.filter(v=>[
 ...COSTUMES.map(x=>norm(x["レア度"])),
 ...ACCESSORY_SLOTS.flatMap(s=>accessoryRows(s).map(x=>norm(x["レア度"]))),
 ...SP_APPEALS.map(x=>norm(x["レア度"]))
].includes(v));
function passFilter(item,genres,rarities){
 const g=norm(item["ジャンル"]),r=norm(item["レア度"]);
 const gAll=genres.size===0||genres.size===ALL_GENRES.length;
 const rAll=rarities.size===0||rarities.size===ALL_RARITIES.length;
 return (gAll||genres.has(g))&&(rAll||rarities.has(r));
}
function compatible(item,idol){
 return (common(item["シリーズ"])||eq(item["シリーズ"],idol["シリーズ"])) &&
        (common(item["性別"])||eq(item["性別"],idol["性別"]));
}
function normalExclusive(item,idol){
 const x=norm(item["専用"]);
 return common(x)||eq(x,idol["アイドル名"]);
}
function selected(kind){return new Set([...document.querySelectorAll(`input[data-filter="${kind}"]:checked`)].map(x=>x.value))}

const filterState={
 songMode:"none", songValue:"",
 idolMode:"none", idolValue:"",
 specificIdols:[null,null,null],
 costumeMode:"none"
};

function idolCandidatesFor(song){
 const gender=norm(song["性別"]);
 let c=IDOLS.filter(x=>common(gender)||common(x["性別"])||eq(x["性別"],gender));
 if(filterState.idolMode==="series") c=c.filter(x=>eq(x["シリーズ"],filterState.idolValue));
 if(filterState.idolMode==="gender") c=c.filter(x=>eq(x["性別"],filterState.idolValue));
 return c;
}
function validLineupsFor(song){
 const base=idolCandidatesFor(song);
 if(filterState.idolMode!=="specific") {
   if(base.length<3)return [];
   const result=[];
   for(let i=0;i<base.length;i++)for(let j=i+1;j<base.length;j++)for(let k=j+1;k<base.length;k++) result.push([base[i],base[j],base[k]]);
   return result.map(a=>shuffle(a));
 }
 const result=[];
 const used=new Set();
 function rec(pos,current){
   if(pos===3){result.push([...current]);return}
   const fixed=filterState.specificIdols[pos];
   const candidates=fixed?[fixed]:base;
   for(const idol of candidates){
     const name=norm(idol?.["アイドル名"]);
     if(!name||used.has(name))continue;
     // 固定アイドルも楽曲の性別・アイドル側条件に適合している必要がある。
     if(!base.some(x=>eq(x["アイドル名"],name)))continue;
     used.add(name);current.push(idol);rec(pos+1,current);current.pop();used.delete(name);
   }
 }
 rec(0,[]);
 return result;
}
function chooseLineup(song){
 const valid=validLineupsFor(song);
 if(!valid.length)return null;
 return pick(valid);
}
function chooseCostume(idol,g,r){
 let c=COSTUMES.filter(x=>compatible(x,idol)&&normalExclusive(x,idol)&&passFilter(x,g,r));
 if(filterState.costumeMode==="exclusive") c=c.filter(x=>!common(x["専用"]));
 if(filterState.costumeMode==="common") c=c.filter(x=>common(x["専用"]));
 if(c.length)return pick(c);
 // 専用衣装が存在しない場合は、デフォルト衣装「フューチャーコネクト」を使用する。
 // これは衣装条件「専用」を選択している場合も同様。
 const fallback=COSTUMES.find(x=>norm(x["衣装名"])==="フューチャーコネクト");
 return fallback||null;
}
function chooseAccessory(slot,idol,g,r){
 if(Math.random()>=ACCESSORY_RATE)return null;
 const c=accessoryRows(slot).filter(x=>compatible(x,idol)&&normalExclusive(x,idol)&&passFilter(x,g,r));
 return c.length?pick(c):null;
}
function conditionGroups(spid){
 const m=new Map();
 SP_CONDITIONS.filter(x=>eq(x["SPID"],spid)).forEach(x=>{
  const k=norm(x["条件グループ"])||"1";
  if(!m.has(k))m.set(k,[]);
  if(norm(x["必須アイドル"]))m.get(k).push(norm(x["必須アイドル"]));
 });
 return [...m.values()];
}
function spActive(sp,lineup){
 const groups=conditionGroups(sp["SPID"]);
 if(!groups.length)return true;
 const names=new Set(lineup.map(x=>norm(x["アイドル名"])));
 return groups.some(group=>group.every(n=>names.has(n)));
}
function spTarget(sp,idol){
 const t=SP_TARGETS.filter(x=>eq(x["SPID"],sp["SPID"]));
 if(!t.length)return true;
 return t.some(x=>eq(x["設定可能アイドル"],idol["アイドル名"]));
}
function chooseSP(lineup,g,r){
 const available=new Set(
  SP_APPEALS
   .filter(x=>passFilter(x,g,r))
   .filter(x=>spActive(x,lineup))
   .filter(x=>lineup.some(idol=>compatible(x,idol)))
   .map(x=>norm(x["SPID"]))
 );
 return lineup.map(idol=>{
  const c=SP_APPEALS.filter(x=>available.has(norm(x["SPID"]))&&compatible(x,idol)&&spTarget(x,idol));
  if(!c.length)return null;
  const x=pick(c);available.delete(norm(x["SPID"]));return x;
 });
}
function filteredSongs(){
 let c=SONGS.slice();
 if(filterState.songMode==="series") c=c.filter(x=>eq(x["シリーズ"],filterState.songValue));
 if(filterState.songMode==="gender") c=c.filter(x=>eq(x["性別"],filterState.songValue));
 return c;
}
function randomize(){
 if(!STAGES.length||!SONGS.length||!IDOLS.length)throw new Error("ステージ・楽曲・アイドルのデータを確認してください。");
 const g=selected("genre"),r=selected("rarity");
 const songPool=filteredSongs();
 if(!songPool.length)throw new Error("現在の楽曲選出条件に一致する楽曲がありません。");
 const feasible=[];
 for(const song of songPool){const lineup=chooseLineup(song);if(lineup)feasible.push({song,lineup});}
 if(!feasible.length)throw new Error("現在のフィルター条件では、楽曲と3人のアイドルを組み合わせた編成を作成できません。");
 const chosen=pick(feasible),stage=pick(STAGES),song=chosen.song,lineup=chosen.lineup;
 const members=lineup.map(idol=>({idol,costume:chooseCostume(idol,g,r),accessories:Object.fromEntries(ACCESSORY_SLOTS.map(s=>[s.key,chooseAccessory(s,idol,g,r)]))}));
 chooseSP(lineup,g,r).forEach((sp,i)=>members[i].sp=sp);
 return {stage,song,members};
}
function field(o,names){for(const n of names)if(Object.hasOwn(o,n))return o[n];return ""}
function activeFilterSummary(){
 const a=[];
 if(filterState.songMode!=="none")a.push(`楽曲：${filterState.songMode==="series"?`シリーズ「${filterState.songValue}」`:`性別「${filterState.songValue}」`}`);
 if(filterState.idolMode!=="none"){
  if(filterState.idolMode==="series")a.push(`アイドル：シリーズ「${filterState.idolValue}」`);
  else if(filterState.idolMode==="gender")a.push(`アイドル：性別「${filterState.idolValue}」`);
  else {
   const parts=POSITIONS.map((p,i)=>filterState.specificIdols[i]?`${p}「${filterState.specificIdols[i]["アイドル名"]}」`:"").filter(Boolean);
   a.push(`アイドル：${parts.length?parts.join(" / "):"特定アイドル（未指定）"}`);
  }
 }
 if(filterState.costumeMode!=="none")a.push(`衣装：${filterState.costumeMode==="exclusive"?"専用":"共通"}`);
 return a;
}
function display(x){
 const stage=esc(field(x.stage,["ステージ名","名前"])),song=esc(field(x.song,["楽曲名","曲名","名前"]));
 const cards=x.members.map((m,i)=>{
  const acc=ACCESSORY_SLOTS.map(s=>{const a=m.accessories[s.key],name=a?field(a,["アクセサリー名","アクセサリ名","アクセサリー","名前"]):"なし";return `<div class="detail-row"><span class="label">${esc(s.key)}</span><span>${esc(name||"なし")}</span></div>`}).join("");
  return `<article class="idol-card"><div class="position">${POSITIONS[i]}</div><div class="idol-name">${esc(m.idol["アイドル名"])}</div><div class="detail-list"><div class="detail-row"><span class="label">衣装</span><span>${esc(field(m.costume||{},["衣装名","名前"])||"なし")}</span></div>${acc}<div class="detail-row"><span class="label">SP</span><span>${esc(field(m.sp||{},["SPアピール名","スペシャルアピール名","名前"])||"なし")}</span></div></div></article>`;
 }).join("");
 const summary=activeFilterSummary();
 document.getElementById("result").innerHTML=`<section class="result-card result-header"><div class="result-title"><span class="result-title-mark">✦</span><div><h2>今回のライブ編成</h2><div class="basic-result"><div class="basic-row"><span class="label">ステージ</span><span>${stage}</span></div><div class="basic-row"><span class="label">楽曲</span><span>${song}</span></div></div></div></div><button id="rerollButton" class="small-button" type="button">↻ 再抽選</button></section>${summary.length?`<div class="active-filters">${summary.map(x=>`<span>${esc(x)}</span>`).join("")}</div>`:""}<section class="result-card lineup-section"><h2 class="section-title"><span>★</span> アイドル編成</h2><div class="lineup">${cards}</div></section>`;
 document.getElementById("rerollButton").onclick=()=>runRandom();
}
function setMode(name,value){
 if(name==="song")filterState.songMode=value;
 if(name==="idol")filterState.idolMode=value;
 if(name==="costume")filterState.costumeMode=value;
 renderFilterDetails();
}
function renderFilterDetails(){
 const songDetail=document.getElementById("songFilterDetails");
 const idolDetail=document.getElementById("idolFilterDetails");
 const costumeDetail=document.getElementById("costumeFilterDetails");
 songDetail.innerHTML=filterState.songMode==="series"?`<label class="select-label">シリーズ<select id="songSeriesSelect">${seriesOptions(SONGS,filterState.songValue)}</select></label>`:filterState.songMode==="gender"?`<div class="select-label">性別<div class="segmented">${["女","男"].map(v=>`<button type="button" class="seg-btn ${filterState.songValue===v?"selected":""}" data-song-gender="${esc(v)}">${v}</button>`).join("")}</div></div>`:"";
 idolDetail.innerHTML=filterState.idolMode==="series"?`<label class="select-label">シリーズ<select id="idolSeriesSelect">${seriesOptions(IDOLS,filterState.idolValue)}</select></label>`:filterState.idolMode==="gender"?`<div class="select-label">性別<div class="segmented">${["女","男"].map(v=>`<button type="button" class="seg-btn ${filterState.idolValue===v?"selected":""}" data-idol-gender="${esc(v)}">${v}</button>`).join("")}</div></div>`:filterState.idolMode==="specific"?`<div class="position-selectors">${POSITIONS.map((p,i)=>`<div class="position-selector"><span>${p}</span><button type="button" class="choice-button" data-position-index="${i}">${filterState.specificIdols[i]?esc(filterState.specificIdols[i]["アイドル名"]):"アイドルを選択"}<span>›</span></button></div>`).join("")}</div>`:"";
 costumeDetail.innerHTML="";
 // ラジオはネイティブinputではなく、role=radioのボタンとして描画する。
 // 再描画時にブラウザのネイティブradio状態が残る問題を避け、見た目と状態を常にfilterStateに同期する。
 document.querySelectorAll("[data-mode]").forEach(el=>{
   const category=el.dataset.category;
   const mode=el.dataset.categoryMode;
   const current=category==="song"?filterState.songMode:category==="idol"?filterState.idolMode:filterState.costumeMode;
   const selected=mode===current;
   el.setAttribute("aria-checked",selected?"true":"false");
   el.classList.toggle("selected",selected);
 });
 const ss=document.getElementById("songSeriesSelect");if(ss)ss.onchange=()=>{filterState.songValue=ss.value};
 const is=document.getElementById("idolSeriesSelect");if(is)is.onchange=()=>{filterState.idolValue=is.value};
 document.querySelectorAll("[data-song-gender]").forEach(b=>b.onclick=()=>{filterState.songValue=b.dataset.songGender;renderFilterDetails()});
 document.querySelectorAll("[data-idol-gender]").forEach(b=>b.onclick=()=>{filterState.idolValue=b.dataset.idolGender;renderFilterDetails()});
 document.querySelectorAll("[data-position-index]").forEach(b=>b.onclick=()=>openIdolPicker(Number(b.dataset.positionIndex)));
}
function seriesOptions(items,current){
 let values=[...new Set(items.map(x=>norm(x["シリーズ"])).filter(Boolean))];
 values=values.filter(v=>!eq(v,"共通"));
 if([...new Set(items.map(x=>norm(x["シリーズ"])))].some(v=>eq(v,"共通")))values.push("共通");
 return `<option value="" ${current?"":"selected"}>選択してください</option>`+values.map(v=>`<option value="${esc(v)}" ${eq(v,current)?"selected":""}>${esc(v)}</option>`).join("");
}
function openIdolPicker(index){
 const modal=document.getElementById("idolPicker");
 modal.classList.add("open");modal.setAttribute("aria-hidden","false");
 modal.dataset.positionIndex=String(index);
 document.getElementById("pickerTitle").textContent=`${POSITIONS[index]}のアイドルを選択`;
 const search=document.getElementById("idolSearch");
 search.value="";
 search.blur();
 renderIdolPicker();
}
function closeIdolPicker(){
 const m=document.getElementById("idolPicker");
 const search=document.getElementById("idolSearch");
 if(document.activeElement===search)search.blur();
 m.classList.remove("open");
 m.setAttribute("aria-hidden","true");
}
function renderIdolPicker(){
 const index=Number(document.getElementById("idolPicker").dataset.positionIndex);
 const q=norm(document.getElementById("idolSearch").value).toLowerCase();
 const selectedElsewhere=new Set(filterState.specificIdols.map((x,i)=>i===index?null:x?x["アイドル名"]:null).filter(Boolean));
 const list=IDOLS.filter(x=>!q||norm(x["アイドル名"]).toLowerCase().includes(q)||norm(x["シリーズ"]).toLowerCase().includes(q));
 document.getElementById("idolPickerList").innerHTML=list.map(idol=>{
  const name=norm(idol["アイドル名"]),disabled=selectedElsewhere.has(name),selected=filterState.specificIdols[index]&&eq(filterState.specificIdols[index]["アイドル名"],name);
  return `<button type="button" class="idol-choice${selected?" selected":""}" ${disabled?"disabled":""} data-idol-name="${esc(name)}"><span><strong>${esc(name)}</strong><small>${esc(idol["シリーズ"])}・${esc(idol["性別"])}</small></span><span class="idol-choice-mark">${selected?"✓":""}</span></button>`;
 }).join("")||`<div class="picker-empty">該当するアイドルがありません。</div>`;
}
function setupFilterUI(){
 document.getElementById("songModeOptions").innerHTML=`${radio("song","none","指定なし",filterState.songMode)}${radio("song","series","シリーズ",filterState.songMode)}${radio("song","gender","性別",filterState.songMode)}`;
 document.getElementById("idolModeOptions").innerHTML=`${radio("idol","none","指定なし",filterState.idolMode)}${radio("idol","series","シリーズ",filterState.idolMode)}${radio("idol","gender","性別",filterState.idolMode)}${radio("idol","specific","特定アイドル",filterState.idolMode)}`;
 document.getElementById("costumeModeOptions").innerHTML=`${radio("costume","none","指定なし",filterState.costumeMode)}${radio("costume","exclusive","専用",filterState.costumeMode)}${radio("costume","common","共通",filterState.costumeMode)}`;
 renderFilterDetails();
}
function radio(category,mode,label,current){
 const selected=current===mode;
 return `<button type="button" class="radio-row${selected?" selected":""}" role="radio" aria-checked="${selected?"true":"false"}" data-mode="${category}:${mode}" data-category="${category}" data-category-mode="${mode}"><span class="radio-dot" aria-hidden="true"></span><span>${label}</span></button>`;
}
function openFilters(){document.getElementById("filterModal").classList.add("open");document.getElementById("filterModal").setAttribute("aria-hidden","false");setupFilterUI()}
function closeFilters(){document.getElementById("filterModal").classList.remove("open");document.getElementById("filterModal").setAttribute("aria-hidden","true")}
function validateFilters(){
 if(filterState.songMode!=="none"&&!filterState.songValue)return "楽曲選出条件の詳細を選択してください。";
 if(filterState.idolMode!=="none"&&filterState.idolMode!=="specific"&&!filterState.idolValue)return "アイドル選出条件の詳細を選択してください。";
 if(filterState.idolMode==="specific"&&!filterState.specificIdols.some(Boolean))return "特定アイドルを1人以上指定してください。";
 return "";
}
function runRandom(){
 try{
  const v=validateFilters();
  if(v)throw new Error(v);
  display(randomize());
  requestAnimationFrame(()=>document.getElementById("result").scrollIntoView({behavior:"smooth",block:"start"}));
 }catch(e){
  console.error(e);
  document.getElementById("result").innerHTML=`<div class="error-message">${esc(e.message||"編成生成に失敗しました。")}</div>`;
 }
}
function setup(){
 document.getElementById("genreFilters").innerHTML=ALL_GENRES.map(v=>`<label><input type="checkbox" data-filter="genre" value="${esc(v)}" checked>${esc(v)}</label>`).join("");
 document.getElementById("rarityFilters").innerHTML=ALL_RARITIES.map(v=>`<label><input type="checkbox" data-filter="rarity" value="${esc(v)}" checked>${esc(v)}</label>`).join("");
 document.getElementById("randomButton").onclick=runRandom;
 document.getElementById("filterButton").onclick=openFilters;
 document.getElementById("filterClose").onclick=closeFilters;
 document.getElementById("filterApply").onclick=()=>{const v=validateFilters();if(v){alert(v);return}closeFilters();runRandom()};
 document.getElementById("filterReset").onclick=()=>{filterState.songMode="none";filterState.songValue="";filterState.idolMode="none";filterState.idolValue="";filterState.specificIdols=[null,null,null];filterState.costumeMode="none";setupFilterUI()};
 document.getElementById("genreRarityReset").onclick=()=>{document.querySelectorAll("input[data-filter=\"genre\"], input[data-filter=\"rarity\"]").forEach(x=>x.checked=true)};
 document.getElementById("idolPickerClose").onclick=(e)=>{e.preventDefault();e.stopPropagation();closeIdolPicker()};
 document.getElementById("idolSearch").oninput=renderIdolPicker;
 document.getElementById("idolPickerList").addEventListener("click",e=>{
   const b=e.target.closest("[data-idol-name]");
   if(!b||b.disabled)return;
   const modal=document.getElementById("idolPicker");
   const index=Number(modal.dataset.positionIndex);
   const idol=IDOLS.find(x=>eq(x["アイドル名"],b.dataset.idolName));
   filterState.specificIdols[index]=idol||null;
   document.getElementById("idolSearch").blur();
   closeIdolPicker();
   renderFilterDetails();
 });
 document.getElementById("idolPicker").addEventListener("click",e=>{if(e.target===e.currentTarget)closeIdolPicker()});
 document.addEventListener("click",e=>{
   const el=e.target.closest("[data-mode]");
   if(!el)return;
   e.preventDefault();
   e.stopPropagation();
   setMode(el.dataset.category,el.dataset.categoryMode);
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeIdolPicker();closeFilters()}});
}
addEventListener("DOMContentLoaded",setup);
