/* Galaxy toegankelijkheid: labels voor schermlezers, toetsenbord, zichtbare focus */
(function(){
  const L={'💜':'Like','📤':'Delen','🔖':'Bewaren','📑':'Bewaard','💬':'Chat openen','‹':'Terug','➤':'Versturen','🎙️':'Spraakbericht','🗺️':'Hele kaart','🎨':'Achtergrond kiezen','－':'Uitzoomen','＋':'Inzoomen','-':'Uitzoomen','+':'Inzoomen','⋯':'Meer opties','📹':'Videobellen','✨':'Extra','👤':'Mijn profiel','✕':'Sluiten','×':'Sluiten','◎':'Naar mijn plek','🎵':'Themalied aan of uit','🔍':'Zoeken','⚙️':'Instellingen','🛡️':'Veiligheid','📍':'Inchecken','👻':'Onzichtbaar','🚩':'Melden','🚫':'Blokkeren','👋':'Zwaaien','✓':'Bevestigen','✏️':'Bewerken','📷':'Foto toevoegen','🗑️':'Verwijderen','›':'Volgende','▶':'Afspelen','⏸':'Pauze','❤️':'Like','🔔':'Meldingen','☰':'Menu','?':'Hulp','🧍':'Mijn mannetje'};
  const hasWord=s=>/[A-Za-zÀ-ÿ]{2,}/.test(s);
  function fix(root){
    if(!root.querySelectorAll)return;
    root.querySelectorAll('button,a,[onclick]').forEach(el=>{
      const tag=el.tagName;
      if(el.classList.contains('ov'))return;
      if(el.classList.contains('tg')){
        el.setAttribute('role','switch');el.setAttribute('aria-checked',el.classList.contains('on')?'true':'false');
        if(!el.hasAttribute('aria-label')){const row=el.parentElement;const s=row&&(row.textContent||'').trim().split('\n')[0].slice(0,60);el.setAttribute('aria-label',s||'Schakelaar')}
        return;
      }
      if(tag!=='BUTTON'&&tag!=='A'&&tag!=='INPUT'&&tag!=='LABEL'&&tag!=='SELECT'&&tag!=='TEXTAREA'){
        if(!el.hasAttribute('role'))el.setAttribute('role','button');
        if(!el.hasAttribute('tabindex'))el.tabIndex=0;
      }
      if(el.hasAttribute('aria-label')||el.hasAttribute('aria-labelledby'))return;
      const t=(el.textContent||'').trim();
      if(hasWord(t))return;
      if(/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(t)){el.setAttribute('aria-label','Taal kiezen');return}
      if(t.startsWith('🪙')){el.setAttribute('aria-label','Munten');return}
      const lab=el.title||L[t]||L[t.replace(/️/g,'')]||(el.querySelector('img[alt]:not([alt=""])')?'':'');
      if(lab)el.setAttribute('aria-label',lab);
      else if(t&&!el.querySelector('img'))el.setAttribute('aria-label','Knop '+t);
    });
    root.querySelectorAll('input:not([type=hidden]),textarea,select').forEach(el=>{
      if(el.hasAttribute('aria-label')||el.id&&document.querySelector('label[for="'+el.id+'"]')||el.closest('label'))return;
      const lab=el.placeholder||el.title||el.name; if(lab)el.setAttribute('aria-label',lab);
    });
  }
  const st=document.createElement('style');
  st.textContent='.btn:not(.ghost):not(.g){background:linear-gradient(135deg,#7c3aed,#db2777 55%,#0e7490);color:#fff}:focus-visible{outline:3px solid #67e8f9!important;outline-offset:2px;border-radius:6px}.inp:focus-visible,.fld:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #67e8f9!important;outline-offset:0}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}';
  document.head.appendChild(st);
  document.addEventListener('keydown',e=>{
    const el=e.target;
    if((e.key==='Enter'||e.key===' ')&&el&&el.getAttribute&&el.getAttribute('role')==='button'&&el.tagName!=='BUTTON'){e.preventDefault();el.click()}
  });
  document.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('.tg');if(g)setTimeout(()=>g.setAttribute('aria-checked',g.classList.contains('on')?'true':'false'),50)});
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const o=[...document.querySelectorAll('.ov.on')].filter(x=>x.id!=='welV'&&x.id!=='gmDrive').pop();if(o&&typeof closeO==='function')closeO(o.id)});
  let q=false;
  function run(){q=false;fix(document.body)}
  function start(){fix(document.body);new MutationObserver(()=>{if(!q){q=true;setTimeout(run,300)}}).observe(document.body,{childList:true,subtree:true})}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
