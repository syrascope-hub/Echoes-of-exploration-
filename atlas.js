(function(){
'use strict';
const stage=document.getElementById('atlasStage'),$=id=>document.getElementById(id);
if(!window.THREE||!THREE.OrbitControls){stage.innerHTML='<p class="atlas-fail">The 3D map could not start. Check that your browser allows WebGL, then reload the page. You can still use the list below!</p>';return}
const T=THREE,PI=Math.PI;
/* ---------- real landing / impact coordinates [lat, lon(E+), site] ---------- */
const LOC={'a11-stage':[.67,23.47,'a11'],'a12-stage':[-3.01,-23.42,'a12'],'a14-stage':[-3.65,-17.47,'a14'],'a15-stage':[26.13,3.63,'a15'],'a16-stage':[-8.97,15.5,'a16'],'a17-stage':[20.19,30.77,'a17'],lrv15:[26.13,3.63,'a15'],lrv16:[-8.97,15.5,'a16'],lrv17:[20.19,30.77,'a17'],alsep:[-3.01,-23.42,'a12'],surveyor1:[-2.47,-43.34,'s1'],surveyor3:[-2.94,-23.34,'a12'],ranger7:[-10.63,-20.6,'r7'],retroreflector:[-3.65,-17.47,'a14'],'lcross-shepherd':[-84.68,-48.7,'cab'],'lcross-centaur':[-84.68,-48.7,'cab'],'curiosity-rover':[-4.59,137.44,'gale'],viking1:[22.27,-47.95,'v1'],viking2:[47.64,-134.26,'v2'],pathfinder:[19.13,-33.25,'pf'],sojourner:[19.13,-33.25,'pf'],spirit:[-14.57,175.47,'sp'],opportunity:[-1.95,-5.53,'op'],phoenix:[68.22,-125.75,'ph'],insight:[4.5,135.62,'in'],'curiosity-heatshield':[-4.59,137.44,'gale'],'curiosity-backshell':[-4.59,137.44,'gale'],'curiosity-skycrane':[-4.59,137.44,'gale'],'perseverance-heatshield':[18.44,77.45,'jez'],'perseverance-backshell':[18.44,77.45,'jez'],'perseverance-descent':[18.44,77.45,'jez'],ingenuity:[18.44,77.45,'jez']};
const MK={'a11-stage':'lm','a12-stage':'lm','a14-stage':'lm','a15-stage':'lm','a16-stage':'lm','a17-stage':'lm',lrv15:'lrv',lrv16:'lrv',lrv17:'lrv',alsep:'alsep',surveyor1:'surv',surveyor3:'surv',ranger7:'ranger',retroreflector:'retro','lcross-shepherd':'shep','lcross-centaur':'centaur',viking1:'viking',viking2:'viking',pathfinder:'pf',sojourner:'soj',spirit:'mer',opportunity:'mer',phoenix:'phx',insight:'ins','curiosity-rover':'mer','curiosity-heatshield':'hs','curiosity-backshell':'bs','curiosity-skycrane':'sky','perseverance-heatshield':'hs','perseverance-backshell':'bs','perseverance-descent':'sky',ingenuity:'ing'};
/* Optional real NASA models: drop a .glb into assets/models and list it here, e.g. {'lrv15':'assets/models/lrv.glb'} */
const GLB={'curiosity-rover':'model_curiosity.glb','a11-stage':'model_lm.glb','a12-stage':'model_lm.glb','a14-stage':'model_lm.glb','a15-stage':'model_lm.glb','a16-stage':'model_lm.glb','a17-stage':'model_lm.glb',viking1:'model_viking.glb',viking2:'model_viking.glb',spirit:'model_mer.glb',opportunity:'model_mer.glb',insight:'model_insight.glb',ingenuity:'model_ingenuity.glb'};
const GLBNOTE={'model_curiosity.glb':'Real 3D model of the Curiosity rover (static pose). Shown larger than its true size next to the scene.','model_lm.glb':'Real NASA 3D model of the Apollo Lunar Module. The model shows the whole spacecraft, but only the descent stage (the lower, gold part) stayed on the Moon.','model_viking.glb':'Real NASA 3D model of a Viking lander.','model_mer.glb':'Real NASA 3D model of a Mars Exploration Rover. Spirit and Opportunity were twin rovers.','model_insight.glb':'Real NASA 3D model of the InSight lander.','model_ingenuity.glb':'Real NASA 3D model of the Ingenuity helicopter. It is shown larger than real size.'};
const HOT={'model_lm.glb':[{t:'Ascent stage (flew home)',p:[.5,.7,.5]},{t:'Descent stage (left here)',p:[.5,.3,.5]},{t:'Footpad',p:[.12,.05,.12]}],'model_insight.glb':[{t:'Lander deck',p:[.5,.4,.5]},{t:'Solar panel',p:[.92,.5,.5]}]};
window.eoeDebug={stop(){VCtl.autoRotate=false}};
const CDN='https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';
const WORLD={Moon:{map:['./moon.jpg',CDN+'moonmap1k.jpg'],bump:['./moon_bump.jpg',CDN+'moonbump1k.jpg'],bs:.05,tint:0x8a8a8a},Mars:{map:['./mars.jpg',CDN+'marsmap1k.jpg'],bump:['./mars_bump.jpg',CDN+'marsbump1k.jpg'],bs:.06,tint:0xa5603c}};
const VIEW={Moon:[10,8],Mars:[8,112]};
const SC={left:0xd8b779,ended:0xf2eee6,impact:0xe8643a,science:0x4fd1c5};
const card=id=>CARDS.find(c=>c.id===id);
/* ---------- helpers ---------- */
const ll=(la,lo,r)=>{const p=(lo+180)*PI/180,t=la*PI/180;return new T.Vector3(-r*Math.cos(p)*Math.cos(t),r*Math.sin(t),r*Math.sin(p)*Math.cos(t))};
const grp={};CARDS.forEach(c=>{const l=LOC[c.id];if(l)(grp[l[2]]=grp[l[2]]||[]).push(c.id)});
function pos(id){const l=LOC[id],g=grp[l[2]],n=g.length,k=g.indexOf(id);let la=l[0],lo=l[1];if(n>1){const a=k*2*PI/n+.5;la+=2.3*Math.sin(a);lo+=2.3*Math.cos(a)/Math.max(.25,Math.cos(la*PI/180))}return[Math.max(-89,Math.min(89,la)),lo]}
function loadTex(urls,ok,fail){let i=0;const L=new T.TextureLoader();L.setCrossOrigin('anonymous');(function n(){if(i>=urls.length){if(fail)fail();return}L.load(urls[i++],t=>{t.encoding=T.sRGBEncoding;ok(t)},undefined,n)})()}
function proc(w){const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d'),m=w==='Moon';g.fillStyle=m?'#8b8b8b':'#a65a35';g.fillRect(0,0,1024,512);let s=11;const r=()=>(s=s*16807%2147483647)/2147483647,n=m?1100:700;for(let i=0;i<n;i++){const x=r()*1024,y=r()*512,k=(m?4:3)+Math.pow(r(),3)*(m?38:30),a=g.createRadialGradient(x,y,k*.2,x,y,k);a.addColorStop(0,m?'rgba(40,40,40,.35)':'rgba(70,30,15,.3)');a.addColorStop(.85,m?'rgba(200,200,200,.18)':'rgba(220,150,100,.15)');a.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=a;g.fillRect(x-k,y-k,2*k,2*k)}const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
function stars(n,r){const a=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,t=Math.random()*6.283,s=Math.sqrt(1-u*u);a.set([s*Math.cos(t)*r,u*r,s*Math.sin(t)*r],i*3)}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(a,3));return new T.Points(g,new T.PointsMaterial({color:0xffffff,size:1.3,sizeAttenuation:false,transparent:true,opacity:.8}))}
/* ---------- globe scene ---------- */
const R=new T.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.outputEncoding=T.sRGBEncoding;stage.appendChild(R.domElement);
const S=new T.Scene(),C=new T.PerspectiveCamera(38,1,.05,200);C.position.set(0,.3,3.4);S.add(C);
const sunL=new T.DirectionalLight(0xfff4e6,1.35);sunL.position.set(-3,2,4);C.add(sunL);S.add(new T.AmbientLight(0x8fa0b8,.45));S.add(stars(1400,60));
const globes={},hitsBy={Moon:[],Mars:[]},pinById={};
function mkGlobe(name){const W=WORLD[name],g=new T.Group(),mat=new T.MeshStandardMaterial({color:W.tint,roughness:1,metalness:0,bumpScale:W.bs}),mesh=new T.Mesh(new T.SphereGeometry(1,96,64),mat);g.add(mesh);g.userData.mesh=mesh;
loadTex(W.map,t=>{t.anisotropy=8;mat.map=t;mat.color.set(0xffffff);mat.needsUpdate=true},()=>{mat.map=proc(name);mat.color.set(0xffffff);mat.needsUpdate=true});
loadTex(W.bump,t=>{mat.bumpMap=t;mat.needsUpdate=true});
if(name==='Mars')g.add(new T.Mesh(new T.SphereGeometry(1.035,64,48),new T.MeshBasicMaterial({color:0xff8a50,transparent:true,opacity:.1,side:T.BackSide,depthWrite:false})));
S.add(g);globes[name]=g;g.visible=false}
mkGlobe('Moon');mkGlobe('Mars');
CARDS.forEach(c=>{if(!LOC[c.id])return;const[la,lo]=pos(c.id),p=ll(la,lo,1),pin=new T.Group(),col=SC[c.status]||SC.left;pin.position.copy(p);pin.lookAt(p.clone().multiplyScalar(2));
const stem=new T.Mesh(new T.CylinderGeometry(.003,.003,.06,6).rotateX(PI/2).translate(0,0,.03),new T.MeshBasicMaterial({color:col})),
head=new T.Mesh(new T.SphereGeometry(.02,16,12).translate(0,0,.07),new T.MeshBasicMaterial({color:col})),
hit=new T.Mesh(new T.SphereGeometry(.045,8,6).translate(0,0,.07),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
hit.userData.id=c.id;pin.add(stem,head,hit);globes[c.world].add(pin);hitsBy[c.world].push(hit);pinById[c.id]={head,p,world:c.world}});
const ctl=new T.OrbitControls(C,R.domElement);Object.assign(ctl,{enablePan:false,enableDamping:true,dampingFactor:.07,minDistance:1.35,maxDistance:6,autoRotate:true,autoRotateSpeed:.35,rotateSpeed:.6,zoomSpeed:.7,enableZoom:false});
let cur='Moon',active=null,busy=false,viewerOpen=false,vis=true;
const tip=$('atlasTip');
function setWorld(w){cur=w;active=null;Object.keys(globes).forEach(k=>globes[k].visible=k===w);document.querySelectorAll('[data-atlas]').forEach(b=>{const on=b.dataset.atlas===w;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});$('atlasCount').textContent=hitsBy[w].length+' pins · '+(w==='Moon'?'🌕 The Moon':'🔴 Mars');buildPinList(w);C.position.copy(ll(VIEW[w][0],VIEW[w][1],3.0));ctl.enabled=true;ctl.autoRotate=true;ctl.update();Object.values(pinById).forEach(i=>i.head.scale.setScalar(1))}
document.querySelectorAll('[data-atlas]').forEach(b=>b.addEventListener('click',()=>setWorld(b.dataset.atlas)));
function buildPinList(w){const el=$('pinList');if(!el)return;el.innerHTML=CARDS.filter(c=>c.world===w&&LOC[c.id]).map(c=>'<button type="button" class="pin-chip" data-pin="'+c.id+'">'+(window.eoeEmoji?eoeEmoji(c):'')+' '+c.name.replace(/ — .*/,'')+'</button>').join('')}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pin]');if(b){setWorld(card(b.dataset.pin).world);fly(b.dataset.pin,true)}});
$('zoomIn').addEventListener('click',()=>zoom(-.5));$('zoomOut').addEventListener('click',()=>zoom(.5));
function zoom(d){const l=Math.min(6,Math.max(1.35,C.position.length()+d));C.position.setLength(l);ctl.autoRotate=false}
const RC=new T.Raycaster(),mouse=new T.Vector2();
function pick(e){const r=R.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);RC.setFromCamera(mouse,C);const h=RC.intersectObjects(hitsBy[cur].concat(globes[cur].userData.mesh),false)[0];return h&&h.object.userData.id||null}
let down=null;const cv=R.domElement;
cv.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];ctl.enableZoom=true;ctl.autoRotate=false});
cv.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<6){const id=pick(e);if(id)fly(id,true)}down=null});
cv.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')return;const id=pick(e);cv.style.cursor=id?'pointer':'grab';if(id){const c=card(id),r=stage.getBoundingClientRect();tip.textContent=c.name+' · '+c.year;tip.style.left=(e.clientX-r.left+14)+'px';tip.style.top=(e.clientY-r.top+14)+'px';tip.style.opacity=1}else tip.style.opacity=0});
cv.addEventListener('pointerleave',()=>{ctl.enableZoom=false;tip.style.opacity=0});
function fit(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;R.setSize(w,h);C.aspect=w/h;C.fov=C.aspect<1.3?2*Math.atan(Math.tan(PI/7.6)/C.aspect)*180/PI:38;C.updateProjectionMatrix()}
new ResizeObserver(fit).observe(stage);fit();
new IntersectionObserver(es=>vis=es[0].isIntersecting).observe(stage);
/* fly camera to a pin along the sphere (never through it) */
function ease(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2}
function move(toDir,toLen,D,done){const f=C.position.clone(),fl=f.length(),fd=f.clone().normalize(),q=new T.Quaternion().setFromUnitVectors(fd,toDir.clone().normalize()),qi=new T.Quaternion(),t0=performance.now();ctl.enabled=false;ctl.autoRotate=false;
(function s(t){const k=Math.min(1,(t-t0)/D),e=ease(k);qi.identity().slerp(q,e);C.position.copy(fd).applyQuaternion(qi).multiplyScalar(fl+(toLen-fl)*e);C.lookAt(0,0,0);if(k<1)requestAnimationFrame(s);else done&&done()})(t0)}
function fly(id,open,tries){const i=pinById[id];if(!i||viewerOpen)return;if(busy){if((tries||0)<16)setTimeout(()=>fly(id,open,(tries||0)+1),250);return}if(i.world!==cur)setWorld(i.world);busy=true;active=id;tip.style.opacity=0;
move(i.p,1.5,open?1000:1200,()=>{busy=false;if(open)openViewer(id);else{ctl.enabled=true;ctl.update()}})}
function back(){const i=pinById[vId];busy=true;move(C.position,3,700,()=>{busy=false;ctl.enabled=true;ctl.update()})}
/* ---------- procedural equipment models (simplified reconstructions) ---------- */
const M=(c,m=.3,r=.6)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,side:T.DoubleSide});
const P={foil:M(0xc8962e,.85,.35),white:M(0xe6e3dc,.1,.7),grey:M(0x6b6f76,.5,.5),dark:M(0x1a1b1f,.2,.8),silver:M(0xb9bec6,.9,.3),panel:M(0x1d2c5c,.6,.3),rust:M(0xb5532b,.2,.8),char:M(0x30241c,.2,.9),red:M(0xd9552b,.2,.7)};
const V=(x,y,z)=>new T.Vector3(x,y,z),G={b:(w,h,d)=>new T.BoxGeometry(w,h,d),c:(a,b,h,s=20,hs=1,o=false)=>new T.CylinderGeometry(a,b,h,s,hs,o),s:r=>new T.SphereGeometry(r,24,16)};
function add(g,ge,m,x=0,y=0,z=0,rx=0,ry=0,rz=0){const o=new T.Mesh(ge,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o}
function strut(g,a,b,r=.04,m=P.silver){const d=b.clone().sub(a),L=d.length(),o=new T.Mesh(G.c(r,r,L,8),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());g.add(o)}
const wheel=(g,x,y,z,r,w)=>{add(g,G.c(r,r,w,20),P.dark,x,y,z,PI/2);add(g,G.c(r*.55,r*.55,w*1.05,12),P.silver,x,y,z,PI/2)};
const dish=(g,r,x,y,z,rx=0,ry=0,rz=0)=>add(g,new T.SphereGeometry(r,24,8,0,6.283,0,.8),P.white,x,y,z,PI+rx,ry,rz);
const legs=(g,n,top,ty,out,pad)=>{for(let i=0;i<n;i++){const a=i*6.283/n+.4,c=Math.cos(a),s=Math.sin(a);strut(g,V(c*top,ty,s*top),V(c*out,.05,s*out),.05);add(g,G.c(pad,pad,.05,16),P.silver,c*out,.03,s*out)}};
function lander(ins){const g=new T.Group();add(g,G.c(1.1,1.1,.14,6),P.grey,0,1,0);legs(g,3,.95,1,1.7,.3);for(const s of[-1,1]){add(g,G.c(1,1,.04,36),P.panel,s*2.05,1.2,0,0,0,s*.12);strut(g,V(s*1,1.05,0),V(s*1.5,1.15,0),.04)}
add(g,G.b(.55,.35,.5),P.white,.3,1.27,.2);add(g,G.b(.4,.3,.4),P.foil,-.4,1.25,-.3);strut(g,V(-.3,1.3,.5),V(-.3,2.1,.5),.03);add(g,G.b(.35,.12,.12),P.dark,-.3,2.15,.5);
if(ins){add(g,new T.SphereGeometry(.45,24,10,0,6.283,0,1.4),P.silver,1.5,.02,1.9);add(g,G.b(.5,.25,.5),P.grey,-1.4,.12,1.9)}else{strut(g,V(.7,1.15,.6),V(1.5,.9,1.5),.05);strut(g,V(1.5,.9,1.5),V(1.9,.3,1.9),.04);add(g,G.c(.12,.12,.25),P.dark,1.95,.2,1.95)}
return g}
const B={
lm(){const g=new T.Group();add(g,G.c(1,1,.95,8),P.foil,0,1.35,0);add(g,G.c(.93,.93,.12,8),P.silver,0,1.9,0);add(g,G.c(.16,.42,.55,16),P.char,0,.7,0);
for(let i=0;i<4;i++){const a=i*PI/2+PI/4,c=Math.cos(a),s=Math.sin(a);strut(g,V(c*.95,1.35,s*.95),V(c*2.1,.18,s*2.1),.05);strut(g,V(c*.5,1.05,s*.5),V(c*1.8,.5,s*1.8),.03);add(g,G.c(.38,.38,.07,20),P.silver,c*2.1,.06,s*2.1)}
for(let i=0;i<4;i++){const a=i*PI/2,c=Math.cos(a),s=Math.sin(a);add(g,G.b(.45,.55,.45),i%2?P.white:P.grey,c*1.05,1.35,s*1.05,0,-a)}
add(g,G.b(.1,1.3,.05),P.silver,.4,1,2.05,.45);return g},
lrv(){const g=new T.Group();add(g,G.b(1.4,.1,1.1),P.grey,0,.75,0);add(g,G.b(.9,.1,1),P.silver,-1.1,.78,0);add(g,G.b(.9,.1,1),P.silver,1.1,.78,0);
for(const x of[-1.1,1.1])for(const z of[-.8,.8])wheel(g,x,.4,z,.4,.25);
for(const z of[-.28,.28]){add(g,G.b(.5,.08,.4),P.white,-.1,.85,z);add(g,G.b(.08,.6,.4),P.white,-.34,1.1,z)}
add(g,G.b(.35,.5,.5),P.dark,.55,1.05,0);strut(g,V(1.1,.85,0),V(1.1,2,0),.03);dish(g,.4,1.1,2.05,0,.5);add(g,G.b(.25,.2,.25),P.foil,1.5,1.1,.3);add(g,G.b(.5,.4,.8),P.dark,-1.2,1.05,0);return g},
alsep(){const g=new T.Group();add(g,G.b(1,.55,1),P.foil,0,.4,0);add(g,G.b(.9,.04,.9),P.white,0,.7,0,.1);strut(g,V(.3,.7,.3),V(.3,1.9,.3),.03);dish(g,.35,.3,2,.3,.4);
add(g,G.c(.17,.17,1,16),P.grey,2.4,.2,0,0,0,PI/2);for(let i=0;i<6;i++)add(g,G.c(.3,.3,.02,20),P.silver,1.95+i*.18,.2,0,0,0,PI/2);strut(g,V(.5,.2,0),V(1.9,.18,0),.02,P.dark);
add(g,G.b(.5,.3,.5),P.white,-1.8,.2,.8);add(g,G.c(.3,.3,.3),P.silver,-1.5,.2,-.9);add(g,new T.SphereGeometry(.3,16,8,0,6.283,0,1.5),P.silver,-1.5,.35,-.9);add(g,G.b(.4,.2,.6),P.grey,-.3,.12,-1.8);return g},
surv(){const g=new T.Group();legs(g,3,.3,1,1.7,.3);add(g,G.c(.1,.1,1.9),P.silver,0,1.6,0);for(let i=0;i<3;i++){const a=i*2.094+.4;add(g,G.b(.45,.5,.45),i?P.white:P.foil,Math.cos(a)*.55,1,Math.sin(a)*.55,0,-a)}
add(g,G.b(1.5,.05,1),P.panel,0,2.65,0,.25);dish(g,.3,.7,2.2,.2,.3);add(g,G.b(.25,.25,.25),P.dark,-.25,1.6,.15);add(g,G.c(.1,.1,.35),P.silver,-.25,1.85,.15);return g},
ranger(){const g=new T.Group();add(g,G.c(.8,.8,.45,6),P.silver,0,.8,0);add(g,G.c(.06,.35,1.6,6),P.silver,0,1.8,0);add(g,G.b(.5,.35,.5),P.dark,0,.45,0);dish(g,.7,.2,1.45,0,.4,0,-.3);
for(const s of[-1,1]){add(g,G.b(2.2,.04,1),P.panel,s*1.9,1,0,0,0,s*-.06);strut(g,V(s*.7,1,0),V(s*.9,1,0),.05)}strut(g,V(0,2.6,0),V(0,3,0),.02);return g},
retro(){const g=new T.Group(),p=new T.Group();add(p,G.b(1.8,.1,1.8),P.grey);for(let i=0;i<10;i++)for(let j=0;j<10;j++){const x=-.81+i*.18,z=-.81+j*.18;add(p,G.c(.07,.07,.06,14),P.silver,x,.07,z);add(p,G.c(.05,.05,.065,14),P.dark,x,.075,z)}
p.rotation.x=-.5;p.position.y=1;g.add(p);strut(g,V(-.8,.8,-.7),V(-1.1,0,-1.5),.04);strut(g,V(.8,.8,-.7),V(1.1,0,-1.5),.04);strut(g,V(0,.6,.8),V(0,0,1.4),.04);return g},
shep(){const g=new T.Group();add(g,G.c(.85,.85,1.7,24),P.white,0,1.1,0);add(g,G.c(.9,.9,.8,24,1,true),P.panel,0,1.2,0);add(g,G.c(1,1,.15,24),P.silver,0,2,0);add(g,G.c(.15,.4,.5,16),P.char,0,.1,0);dish(g,.4,.5,2.3,0,.3);for(let i=0;i<4;i++){const a=i*PI/2;add(g,G.c(.05,.12,.3,10),P.dark,Math.cos(a)*.95,.55,Math.sin(a)*.95)}return g},
centaur(){const g=new T.Group();add(g,G.c(.8,.8,3.4,32),P.silver,0,1.7,0);add(g,new T.SphereGeometry(.8,32,12,0,6.283,0,1.57),P.silver,0,3.4,0);add(g,G.c(.18,.5,.6,16),P.char,0,-.1,0);for(const y of[.6,1.7,2.8])add(g,new T.TorusGeometry(.8,.03,8,32).rotateX(PI/2),P.grey,0,y,0);add(g,G.c(.81,.81,.5,32,1,true),P.char,0,2.6,0);g.rotation.z=1.25;g.rotation.y=.6;return g},
viking(){const g=new T.Group();add(g,G.c(1,1,.55,6),P.grey,0,1.25,0);legs(g,3,.9,1.25,2,.4);add(g,G.b(.55,.45,.5),P.dark,.9,1.5,.4);add(g,G.b(.55,.45,.5),P.dark,-.9,1.5,.4);strut(g,V(.4,1.5,-.4),V(.6,2.6,-.4),.04);dish(g,.5,.62,2.75,-.4,.4);
strut(g,V(-.3,1.5,.7),V(-.3,2.5,.7),.03);add(g,G.b(.3,.2,.2),P.dark,-.3,2.55,.7);strut(g,V(-.3,1.2,.8),V(-1.5,.9,1.7),.05);add(g,G.c(.15,.15,.3),P.silver,-1.6,.75,1.8);return g},
pf(){const g=new T.Group();add(g,G.c(1.2,1.2,.08,3),P.silver,0,.15,0);for(let i=0;i<3;i++){const a=i*2.094+PI/6,pg=new T.Group();pg.position.set(Math.cos(a)*.6,.15,Math.sin(a)*.6);pg.rotation.y=-a;add(pg,G.b(1,.05,1.2),P.panel,.5*Math.cos(.4),.5*Math.sin(.4),0,0,0,.4);g.add(pg)}
add(g,G.b(.6,.4,.6),P.white,0,.4,0);strut(g,V(0,.6,0),V(0,1.8,0),.03);add(g,G.b(.3,.2,.2),P.dark,0,1.85,0);dish(g,.25,.3,.8,.2,.5);return g},
soj(){const g=new T.Group();add(g,G.b(1,.35,.7),P.white,0,.65,0);add(g,G.b(1,.03,.75),P.panel,0,.85,0);for(const x of[-.4,0,.4])for(const z of[-.5,.5])wheel(g,x,.2,z,.19,.14);for(const z of[-.5,.5])strut(g,V(-.4,.3,z),V(.4,.3,z),.03);strut(g,V(-.4,.85,0),V(-.4,1.4,0),.02);add(g,G.b(.12,.12,.2),P.dark,.52,.65,0);return g},
mer(){const g=new T.Group();add(g,G.b(1.5,.45,1.1),P.foil,0,.85,0);add(g,G.b(1.9,.05,1.5),P.panel,0,1.12,0);for(const x of[-.9,0,.9])for(const z of[-.85,.85])wheel(g,x,.35,z,.33,.25);for(const z of[-.85,.85])strut(g,V(-.9,.5,z),V(.9,.5,z),.04);
strut(g,V(-.5,1.1,0),V(-.5,2.2,0),.04);add(g,G.b(.15,.15,.45),P.dark,-.5,2.25,0);strut(g,V(.4,1.1,.4),V(.4,1.6,.4),.03);add(g,G.c(.25,.25,.03,20),P.white,.4,1.65,.4,.4);strut(g,V(.75,.8,0),V(1.5,.6,0),.05);add(g,G.c(.1,.1,.3),P.silver,1.55,.55,0,0,0,PI/2);return g},
phx(){return lander(false)},ins(){return lander(true)},
hs(){const g=new T.Group();add(g,G.c(.25,2.2,.8,64,1,true),P.char,0,.4,0);add(g,new T.TorusGeometry(2.2,.05,8,64).rotateX(PI/2),P.rust);add(g,G.c(.3,.3,.1,16),P.rust,0,.8,0);g.rotation.z=.25;return g},
bs(){const g=new T.Group();add(g,G.c(.7,1.6,1.4,40,1,true),P.white,0,.7,0,0,0,.5);for(const[a,b,m]of[[0,PI,P.red],[PI,PI,P.white]]){const o=add(g,new T.SphereGeometry(2.4,32,10,a,b,0,1.25),m,3.2,.1,.5,0,.4);o.scale.y=.12}
for(let i=0;i<5;i++)strut(g,V(.9,.4,0),V(3.2+Math.cos(i*1.3)*1.2,.12,.5+Math.sin(i*1.3)*1.2),.012,P.white);return g},
sky(){const g=new T.Group();add(g,G.b(2,.35,2),P.grey,0,1.3,0);for(let i=0;i<4;i++){const a=i*PI/2+PI/4,c=Math.cos(a),s=Math.sin(a);add(g,G.s(.38),P.white,c*.8,.8,s*.8);add(g,G.c(.1,.28,.7,16),P.dark,c*1.1,.95,s*1.1);add(g,G.c(.1,.28,.7,16),P.dark,c*.7,.95,s*1.3*(i%2?-1:1)*.9);strut(g,V(c,1.5,s),V(0,3,0),.03)}add(g,G.b(.6,.5,.6),P.foil,0,1.75,0);g.rotation.z=.3;return g},
ing(){const g=new T.Group();add(g,G.b(.5,.6,.5),P.foil,0,.95,0);strut(g,V(0,1.25,0),V(0,1.85,0),.03);add(g,G.b(.8,.03,.5),P.panel,0,1.95,0,0,0,.1);add(g,G.b(1.2,.02,.16),P.dark,.6,1.45,0);add(g,G.b(.5,.02,.16),P.dark,-.25,1.45,0);add(g,G.b(1.2,.02,.16),P.dark,0,1.68,.6,0,PI/2);add(g,G.b(1.2,.02,.16),P.dark,0,1.68,-.6,0,PI/2);strut(g,V(0,1.25,0),V(0,1.7,0),.03);
for(const x of[-1,1])for(const z of[-1,1])strut(g,V(x*.25,.7,z*.25),V(x*.75,.03,z*.75),.02,P.dark);return g}};
/* ---------- surface viewer ---------- */
const VW=$('viewer'),vStage=$('viewerStage');let VR,VS,VC,VCtl,vId=null;
function grad(a,b){const c=document.createElement('canvas');c.width=2;c.height=256;const g=c.getContext('2d'),l=g.createLinearGradient(0,0,0,256);l.addColorStop(0,a);l.addColorStop(1,b);g.fillStyle=l;g.fillRect(0,0,2,256);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
function grain(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#c8c8c8';g.fillRect(0,0,256,256);let s=7;const r=()=>(s=s*16807%2147483647)/2147483647;for(let i=0;i<260;i++){const x=r()*256,y=r()*256,k=6+r()*26,d=r()<.5,gr=g.createRadialGradient(x,y,0,x,y,k);gr.addColorStop(0,d?'rgba(90,90,90,.28)':'rgba(255,255,255,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;for(const ox of[-256,0,256])for(const oy of[-256,0,256]){g.save();g.translate(ox,oy);g.fillRect(x-k,y-k,2*k,2*k);g.restore()}}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(10,10);return t}
function initViewer(){VR=new T.WebGLRenderer({antialias:true});VR.setPixelRatio(Math.min(devicePixelRatio||1,2));VR.outputEncoding=T.sRGBEncoding;VR.toneMapping=T.ACESFilmicToneMapping;VR.toneMappingExposure=1.05;VR.shadowMap.enabled=true;VR.shadowMap.type=T.PCFSoftShadowMap;vStage.appendChild(VR.domElement);VC=new T.PerspectiveCamera(42,1,.1,300);
VCtl=new T.OrbitControls(VC,VR.domElement);Object.assign(VCtl,{enableDamping:true,dampingFactor:.07,minDistance:2.5,maxDistance:16,maxPolarAngle:1.5,autoRotate:true,autoRotateSpeed:.8,enablePan:false});
new ResizeObserver(()=>{const w=vStage.clientWidth,h=vStage.clientHeight;if(!w||!h)return;VR.setSize(w,h);VC.aspect=w/h;VC.updateProjectionMatrix()}).observe(vStage)}
const glbCache={};let GL=null,wrapG=null,vSpots=[],envCache={};
function getGL(){if(GL||!T.GLTFLoader||!T.DRACOLoader)return GL;const d=new T.DRACOLoader();d.setDecoderPath('./');GL=new T.GLTFLoader();GL.setDRACOLoader(d);return GL}
function loadGLB(f){return glbCache[f]||(glbCache[f]=new Promise((res,rej)=>{const l=getGL();if(!l)return rej(new Error('no loader'));l.load(f,g=>res(g.scene),undefined,rej)}))}
function skyEnv(moon){const k=moon?'m':'r';if(envCache[k])return envCache[k];const sc=new T.Scene();sc.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({map:moon?grad('#05070d','#8d8d92'):grad('#e0a47c','#7d4326'),side:T.BackSide})));const sm=new T.Mesh(new T.SphereGeometry(5,16,8),new T.MeshBasicMaterial({color:0xffffff}));sm.position.set(-30,34,24);sc.add(sm);const pm=new T.PMREMGenerator(VR);envCache[k]=pm.fromScene(sc,.03).texture;pm.dispose();return envCache[k]}
function sunSprite(moon){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.1,moon?'rgba(255,248,225,.95)':'rgba(255,235,200,.9)');r.addColorStop(.28,moon?'rgba(255,170,80,.4)':'rgba(255,190,120,.4)');r.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=r;g.fillRect(0,0,256,256);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,fog:false}));s.position.set(-60,52,-70);s.scale.setScalar(moon?26:34);return s}
function clearSpots(){vSpots.forEach(s=>s.el.remove());vSpots=[]}
function placeModel(m,id,file){if(wrapG)VS.remove(wrapG);m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o.material.envMapIntensity!==undefined)o.material.envMapIntensity=1.1}});m.position.set(0,0,0);m.scale.setScalar(1);m.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(m),sz=bb.getSize(V(0,0,0)),k=(file?3.4:3.2)/Math.max(sz.x,sz.y,sz.z);m.scale.setScalar(k);m.updateMatrixWorld(true);bb.setFromObject(m);m.position.y-=bb.min.y;m.position.x-=(bb.min.x+bb.max.x)/2;m.position.z-=(bb.min.z+bb.max.z)/2;m.updateMatrixWorld(true);bb.setFromObject(m);
wrapG=new T.Group();wrapG.add(m);VS.add(wrapG);const h=bb.max.y-bb.min.y;VCtl.target.set(0,h*.45,0);VC.position.set(4.6,h*.8+1.2,5.6);VCtl.update();
clearSpots();const hs=(file&&HOT[file])||[];hs.forEach(s=>{const el=document.createElement('div');el.className='spot';el.innerHTML='<i></i><span>'+s.t+'</span>';$('viewerStage').appendChild(el);const pv=V(bb.min.x+s.p[0]*(bb.max.x-bb.min.x),bb.min.y+s.p[1]*(bb.max.y-bb.min.y),bb.min.z+s.p[2]*(bb.max.z-bb.min.z)),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,nn=V(pv.x-cx,0,pv.z-cz);vSpots.push({el,v:pv,n:nn.length()>.35?nn.normalize():null})})}
function updSpots(){const w=vStage.clientWidth,h=vStage.clientHeight;vSpots.forEach(s=>{const p=s.v.clone().project(VC);let ok=p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1;if(ok&&s.n){const d=V(VC.position.x,0,VC.position.z).normalize();ok=d.dot(s.n)>.15}s.el.style.display=ok?'':'none';if(ok){s.el.style.left=((p.x+1)/2*w)+'px';s.el.style.top=((1-p.y)/2*h)+'px'}})}
function buildScene(id){const c=card(id),moon=c.world==='Moon';vId=id;VS=new T.Scene();wrapG=null;clearSpots();VS.background=moon?grad('#000104','#0b0d14'):grad('#6b3d28','#e0a47c');if(!moon)VS.fog=new T.Fog(0xb77752,16,60);if(moon)VS.add(stars(900,120));
VS.environment=skyEnv(moon);VS.add(sunSprite(moon));
VS.add(new T.HemisphereLight(moon?0x8ea3c4:0xffd6b0,moon?0x1b1b1b:0x5a2e18,.35));const sun=new T.DirectionalLight(moon?0xffffff:0xffe2c4,moon?3.2:2.6);sun.position.set(-6,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:30});sun.shadow.camera.updateProjectionMatrix();VS.add(sun);
const gm=new T.MeshStandardMaterial({color:moon?0x8f8c88:0xb26a46,roughness:1,map:grain(),bumpMap:grain(),bumpScale:.6});loadTex(WORLD[c.world].map,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(7,7);t.anisotropy=8;gm.map=t;gm.color.set(moon?0xb4b1ad:0xd08258);gm.needsUpdate=true});
const gr=new T.Mesh(new T.CircleGeometry(80,64).rotateX(-PI/2),gm);gr.receiveShadow=true;VS.add(gr);
let s=5;const r=()=>(s=s*16807%2147483647)/2147483647;for(let i=0;i<70;i++){const a=r()*6.283,d=5+r()*30,k=.15+r()*r()*1.2,o=new T.Mesh(new T.DodecahedronGeometry(k,1),new T.MeshStandardMaterial({color:moon?0x5c5a58:0x7d4026,roughness:1,flatShading:true}));o.position.set(Math.cos(a)*d,k*.3,Math.sin(a)*d);o.rotation.set(r()*3,r()*3,r()*3);o.scale.y=.6;o.castShadow=o.receiveShadow=true;VS.add(o)}
const file=GLB[id],ld=$('vLoad');placeModel(B[MK[id]](),id,null);$('vNote').textContent='This is a simplified 3D reconstruction built in code, not an exact engineering model.';
if(file){if(ld){ld.hidden=false;ld.textContent='Loading real NASA 3D model…'}
 loadGLB(file).then(sc=>{if(vId!==id)return;placeModel(sc.clone(true),id,file);$('vNote').textContent=GLBNOTE[file]||'Real NASA 3D model.';if(ld)ld.hidden=true}).catch(()=>{if(vId!==id)return;if(ld){ld.textContent='Using the simplified model (the real one could not load).';setTimeout(()=>{ld.hidden=true},3500)}})}else if(ld)ld.hidden=true;
const list=CARDS.filter(x=>x.world===c.world&&MK[x.id]),i=list.findIndex(x=>x.id===id);$('vKicker').textContent=(c.world==='Moon'?'The Moon':'Mars')+' · '+c.year+' · '+c.type;$('vTitle').textContent=c.name;$('vSummary').textContent=c.summary;$('vFact').innerHTML='<b>💡 Did you know?</b> '+c.fact.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));$('vStatus').textContent=c.statusLabel;$('vSource').href=c.source;$('vNum').textContent=(i+1)+' / '+list.length;
const sv=$('vSave');sv.textContent=saved.has(id)?'✓ Saved':'+ Save'}
function openViewer(id){if(window.eoeSeen)window.eoeSeen(id);if(!VR)initViewer();buildScene(id);VW.classList.add('open');document.body.style.overflow='hidden';viewerOpen=true;VCtl.autoRotate=true;$('viewerClose').focus()}
function closeViewer(){VW.classList.remove('open');if(!document.getElementById('detailModal').classList.contains('open'))document.body.style.overflow='';viewerOpen=false;back()}
function step(d){const c=card(vId),list=CARDS.filter(x=>x.world===c.world&&MK[x.id]),n=list[(list.findIndex(x=>x.id===vId)+d+list.length)%list.length];active=n.id;buildScene(n.id)}
$('viewerClose').addEventListener('click',closeViewer);$('vPrev').addEventListener('click',()=>step(-1));$('vNext').addEventListener('click',()=>step(1));
$('vNotes').addEventListener('click',()=>openModal(vId));
$('vSave').addEventListener('click',()=>{if(saved.has(vId))saved.delete(vId);else saved.add(vId);saveState();render();$('vSave').textContent=saved.has(vId)?'✓ Saved':'+ Save'});
document.addEventListener('keydown',e=>{if(!viewerOpen||document.getElementById('detailModal').classList.contains('open'))return;if(e.key==='Escape')closeViewer();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
/* cards -> atlas */
document.getElementById('cardGrid').addEventListener('click',e=>{const l=e.target.closest('[data-locate]'),v=e.target.closest('[data-view3d]');if(l){setWorld(card(l.dataset.locate).world);document.getElementById('atlas').scrollIntoView({behavior:'smooth'});setTimeout(()=>fly(l.dataset.locate,false),650)}if(v){const i=card(v.dataset.view3d);setWorld(i.world);fly(v.dataset.view3d,true)}});
/* ---------- loop ---------- */
/* ---------- site labels (tap a name to open it) ---------- */
const SITE={a11:'Apollo 11',a12:'Apollo 12',a14:'Apollo 14',a15:'Apollo 15',a16:'Apollo 16',a17:'Apollo 17',s1:'Surveyor 1',r7:'Ranger 7',cab:'Cabeus Crater',v1:'Viking 1',v2:'Viking 2',pf:'Pathfinder',sp:'Spirit',op:'Opportunity',ph:'Phoenix','in':'InSight',gale:'Gale Crater',jez:'Jezero Crater'};
const siteEls={};Object.keys(grp).forEach(k=>{const id=grp[k][0],w=card(id).world,b=document.createElement('button');b.type='button';b.className='site-label';b.textContent=SITE[k]||card(id).name;b.setAttribute('aria-label','Open '+(SITE[k]||card(id).name));['pointerdown','pointerenter','touchstart'].forEach(ev=>b.addEventListener(ev,()=>{ctl.autoRotate=false},{passive:true}));b.addEventListener('click',()=>{setWorld(w);fly(id,true)});stage.appendChild(b);siteEls[k]={el:b,id,world:w}});
const ring=document.createElement('div');ring.className='pin-ring';stage.appendChild(ring);
const _v=new T.Vector3(),_c=new T.Vector3();
function updLabels(){const w=stage.clientWidth,h=stage.clientHeight;_c.copy(C.position).normalize();let ringOn=false;Object.keys(siteEls).forEach(k=>{const s=siteEls[k],el=s.el;if(s.world!==cur){el.style.display='none';return}const p=pinById[s.id].p;_v.copy(p).normalize();const front=_v.dot(_c)>.22;if(!front){el.style.display='none';return}_v.copy(p).multiplyScalar(1.05).project(C);el.style.display='';el.style.left=((_v.x+1)/2*w+8)+'px';el.style.top=((1-_v.y)/2*h-9)+'px';if(active&&grp[k].indexOf(active)>-1){ring.style.display='block';ring.style.left=((_v.x+1)/2*w)+'px';ring.style.top=((1-_v.y)/2*h)+'px';ringOn=true}});if(!ringOn)ring.style.display='none'}

setWorld('Moon');
(function loop(t){requestAnimationFrame(loop);if(viewerOpen){VCtl.update();VR.render(VS,VC);updSpots();return}if(!vis)return;if(active&&pinById[active])pinById[active].head.scale.setScalar(1.5+.5*Math.sin(t/220));if(ctl.enabled)ctl.update();R.render(S,C);updLabels()})(0);
})();
