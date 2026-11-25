// Собрать все CSS-правила с цветами со всех страниц (вместе со стилями, которые скрипты добавляют на лету)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');const S=process.env.S;const B='http://127.0.0.1:8767/';
const PAGES=fs.readFileSync(S+'/pages.txt','utf8').trim().split('\n').map(p=>p.replace(/index\.html$/,'')).filter(p=>p!=='404.html');
const PROPS=['background-color','background-image','color','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','box-shadow','fill','stroke','caret-color','-webkit-text-fill-color','text-decoration-color','column-rule-color'];
(async()=>{const b=await chromium.launch();const rules=new Map();const inl=new Map();
 for(const path of PAGES){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await ctx.addInitScript(()=>{localStorage.setItem('st_obranch','abulhair');localStorage.setItem('st_obr_man','1');localStorage.setItem('st_cart_samal',JSON.stringify([{id:'samal_001',name:'Black Berry',price:2300,qty:1}]))});
  const p=await ctx.newPage();
  await ctx.route('**/*',r=>{const u=r.request().url();if(/script\.google/.test(u)){const q=new URL(u).searchParams;if(q.get('action')==='getMenu')return r.fulfill({contentType:'application/json',body:fs.readFileSync(S+'/m_live.json')});return r.fulfill({contentType:'application/json',body:'{"status":"success"}'})}if(/ipify|ipapi|geojs|2gis/.test(u))return r.abort();r.fallback()});
  try{await p.goto(B+path,{waitUntil:'load',timeout:30000})}catch(e){}await p.waitForTimeout(2500);
  if(path===''||path==='kk/'){for(const fn of ['openCart()','closeMov("cartMov");startOrder()','closeMov("orderMov");openBranchHeader()','closeMov("obrMov");openSearchOv&&openSearchOv()','typeof closeSearchOv=="function"&&closeSearchOv();var c=document.querySelector(".item-card");c&&c.click()']){try{await p.evaluate(fn)}catch(e){}await p.waitForTimeout(700)}}
  const got=await p.evaluate(PROPS=>{const out=[];const walk=(list,media)=>{for(const r of list){if(r.cssRules&&r.media){walk(r.cssRules,(media?media+' and ':'')+r.media.mediaText);continue}if(r.cssRules&&r.conditionText!==undefined){walk(r.cssRules,(media?media+' and ':'')+r.conditionText);continue}if(!r.selectorText||!r.style)continue;const d={};for(const k of PROPS){const v=r.style.getPropertyValue(k);if(v)d[k]=[v,r.style.getPropertyPriority(k)]}if(Object.keys(d).length)out.push({sel:r.selectorText,media:media||'',d})}};
   for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}if(sh.href&&/dark\.css/.test(sh.href))continue;walk(rs,'')}
   const inl=[];document.querySelectorAll('[style]').forEach(e=>{const st=e.getAttribute('style');if(/#[0-9a-f]{3,6}\b|rgba?\(/i.test(st))inl.push(st)});return{out,inl}},PROPS);
  for(const r of got.out){const k=r.media+'||'+r.sel+'||'+JSON.stringify(r.d);rules.set(k,r)}
  for(const s of got.inl)inl.set(s,(inl.get(s)||0)+1);
  await ctx.close()}
 fs.writeFileSync(S+'/css_rules.json',JSON.stringify([...rules.values()]));fs.writeFileSync(S+'/inline_styles.json',JSON.stringify([...inl.keys()]));
 console.log('правил с цветом:',rules.size,'| inline-стилей с цветом:',inl.size);await b.close()})();
