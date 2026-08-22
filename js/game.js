'use strict';
const WATCHES=8;
const $ = id => document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const TAU=Math.PI*2;
const G=window.G={
  W:1,H:1,t:0,mode:'title',prev:'play',watch:1,
  best:+localStorage.getItem('cinder.best')||0,
  fireHp:100,playerHp:100,px:0,py:0,pvx:0,pvy:0,pa:0,
  flick:0,inv:0,mx:0,my:0,hold:0,
  keys:Object.create(null),
  foes:[],sparks:[],bits:[],posts:[],ticks:[],
  spawned:0,need:0,fspd:0,fmax:1,cd:0,rest:0,shake:0,dawn:0,
  mute:0,ac:null,cr:0,
  stick:{on:0,vx:0,vy:0,id:-1},
  thr:{on:0,id:-1}
};
const cv=$('c'),ctx=cv.getContext('2d');
const el={watch:$('watch'),fbar:$('fbar'),pbar:$('pbar'),best:$('best'),
  shade:$('shade'),msg:$('msg'),go:$('go'),tit:$('tit'),toast:$('toast'),
  mute:$('mute'),pause:$('pausebtn'),stick:$('stick'),knob:$('knob'),thr:$('throw')};

function resize(){
  G.W=cv.width=innerWidth;G.H=cv.height=innerHeight;scatter();
}
function scatter(){
  const p=[],t=[],w=G.W,h=G.H;
  for(let i=0;i<4;i++){
    p.push({x:30+i*(w-60)/3,y:26});
    p.push({x:30+i*(w-60)/3,y:h-30});
  }
  for(let i=1;i<3;i++){
    p.push({x:24,y:50+i*(h-100)/3});
    p.push({x:w-28,y:50+i*(h-100)/3});
  }
  for(let i=0;i<72;i++){
    t.push({x:Math.random()*w,y:Math.random()*h,a:Math.random()*TAU,l:4+Math.random()*6});
  }
  G.posts=p;G.ticks=t;
}
function saveBest(n){
  if(n>G.best){G.best=n;localStorage.setItem('cinder.best',String(n));}
}
function hud(){
  el.watch.textContent='Watch '+G.watch;
  el.best.textContent='Best '+G.best;
  el.fbar.style.transform='scaleX('+clamp(G.fireHp/100,0,1)+')';
  el.pbar.style.transform='scaleX('+clamp(G.playerHp/100,0,1)+')';
}
function panel(on,title,msg,btn){
  el.shade.className=on?'on':'';
  if(title!=null)el.tit.textContent=title;
  if(msg!=null)el.msg.textContent=msg;
  if(btn!=null)el.go.textContent=btn;
}
function toast(s){
  el.toast.hidden=!s;
  el.toast.textContent=s||'';
}
function bit(x,y,vx,vy,z,s,c){G.bits.push({x,y,vx,vy,z,s,c});}
function burst(x,y,n,c){
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,sp=20+Math.random()*80;
    bit(x,y,Math.cos(a)*sp,Math.sin(a)*sp,0.5+Math.random()*0.5,1.2+Math.random()*2,c);
  }
}
function ac(){
  if(!G.ac)G.ac=new(window.AudioContext||window.webkitAudioContext)();
  if(G.ac.state==='suspended')G.ac.resume();
}
function snd(kind){
  if(G.mute||!G.ac)return;
  const t=G.ac.currentTime,g=G.ac.createGain();
  g.connect(G.ac.destination);
  if(kind==='whoosh'){
    const o=G.ac.createOscillator();
    o.type='triangle';
    o.frequency.setValueAtTime(360,t);
    o.frequency.exponentialRampToValueAtTime(72,t+0.11);
    g.gain.setValueAtTime(0.065,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.11);
    o.connect(g);o.start(t);o.stop(t+0.12);
  }else if(kind==='hit'){
    const o=G.ac.createOscillator();
    o.type='square';
    o.frequency.setValueAtTime(88,t);
    g.gain.setValueAtTime(0.045,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
    o.connect(g);o.start(t);o.stop(t+0.1);
  }else{
    const n=G.ac.createBufferSource();
    const buf=G.ac.createBuffer(1,(G.ac.sampleRate*0.04)|0,G.ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    n.buffer=buf;
    const f=G.ac.createBiquadFilter();
    f.type='bandpass';f.frequency.value=1700;f.Q.value=0.8;
    n.connect(f);f.connect(g);
    g.gain.setValueAtTime(0.035,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.04);
    n.start(t);
  }
}
function start(){
  ac();
  G.mode='play';G.watch=1;G.fireHp=100;G.playerHp=100;
  G.px=G.W*0.5;G.py=G.H*0.5+64;G.pvx=G.pvy=0;G.pa=-Math.PI/2;
  G.flick=G.inv=G.cd=G.rest=G.shake=G.dawn=0;
  G.foes.length=G.sparks.length=G.bits.length=0;
  panel(0);toast('');
  beginWatch();
  hud();
}
function beginWatch(){
  G.spawned=0;
  G.need=5+G.watch*2;
  G.fspd=26+G.watch*7;
  G.fmax=G.watch<4?1:G.watch<7?2:3;
  G.cdSpawn=0.35;
  saveBest(G.watch);
  hud();
}
function lose(how){
  G.mode='lose';
  panel(1,'Cinder',how==='fire'?'The fire went out.':'You fell.','Retry');
  toast('');
}
function win(){
  G.mode='win';G.dawn=1;
  saveBest(WATCHES);
  panel(1,'Cinder','Dawn. The fire held.','Retry');
  toast('');
}
function pause(){
  if(G.mode!=='play'&&G.mode!=='rest')return;
  G.prev=G.mode;G.mode='pause';
  panel(1,'Cinder','Paused','Resume');
}
function resume(){
  G.mode=G.prev||'play';
  panel(0);
}
function edge(){
  const w=G.W,h=G.H,s=Math.random()*4|0,m=18;
  if(s===0)return{x:Math.random()*w,y:m};
  if(s===1)return{x:Math.random()*w,y:h-m};
  if(s===2)return{x:m,y:Math.random()*h};
  return{x:w-m,y:Math.random()*h};
}
function spawnOne(){
  const p=edge();
  G.foes.push({x:p.x,y:p.y,hp:G.fmax,r:13});
  G.spawned++;
}
function aimDir(){
  if(G.thr.on){
    let b=null,d=1e12;
    for(const f of G.foes){
      const k=(f.x-G.px)*(f.x-G.px)+(f.y-G.py)*(f.y-G.py);
      if(k<d){d=k;b=f;}
    }
    if(b)return{x:b.x-G.px,y:b.y-G.py};
  }
  return{x:G.mx-G.px,y:G.my-G.py};
}
function shoot(){
  if(G.cd>0)return;
  const d=aimDir();
  let n=Math.hypot(d.x,d.y)||1;
  const vx=d.x/n*560,vy=d.y/n*560;
  G.sparks.push({x:G.px+d.x/n*14,y:G.py+d.y/n*14,vx,vy,life:0.62});
  G.pa=Math.atan2(d.y,d.x);G.flick=0.12;G.cd=0.16;
  snd('whoosh');
}
function hitPlayer(f){
  if(G.inv>0)return;
  G.playerHp-=22;
  G.inv=0.7;G.shake=10;
  const dx=G.px-f.x,dy=G.py-f.y,n=Math.hypot(dx,dy)||1;
  G.pvx+=dx/n*260;G.pvy+=dy/n*260;
  burst(G.px,G.py,8,'#c9c2b2');
  snd('hit');
  if(G.playerHp<=0){G.playerHp=0;lose('you');}
}
function hitFire(f){
  G.fireHp-=14;G.shake=8;
  burst(G.W*0.5,G.H*0.5,10,'#e85d04');
  snd('hit');
  f.hp=0;
  if(G.fireHp<=0){G.fireHp=0;lose('fire');}
}
function update(dt){
  G.t+=dt;
  if(G.shake)G.shake=Math.max(0,G.shake-dt*28);
  if(G.flick)G.flick=Math.max(0,G.flick-dt);
  if(G.inv)G.inv=Math.max(0,G.inv-dt);
  if(G.cd)G.cd=Math.max(0,G.cd-dt);
  G.cr-=dt;
  if(G.cr<=0&&(G.mode==='play'||G.mode==='rest')){snd('crackle');G.cr=0.35+Math.random()*0.55;}
  if(G.mode==='win'){G.dawn=Math.min(1,G.dawn+dt*0.25);}
  if(G.mode==='title'||G.mode==='play'||G.mode==='rest'||G.mode==='win'){
    if(Math.random()<dt*12){
      bit(G.W*0.5+(Math.random()-0.5)*10,G.H*0.5-8,(Math.random()-0.5)*12,-30-Math.random()*40,0.7,1.2+Math.random(),'#e85d04');
    }
  }
  if(G.mode!=='play'&&G.mode!=='rest'){
    for(let i=G.bits.length-1;i>=0;i--){
      const b=G.bits[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.z-=dt*1.3;if(b.z<=0)G.bits.splice(i,1);
    }
    return;
  }
  let ax=0,ay=0;
  const k=G.keys;
  if(k.KeyW||k.ArrowUp)ay--;
  if(k.KeyS||k.ArrowDown)ay++;
  if(k.KeyA||k.ArrowLeft)ax--;
  if(k.KeyD||k.ArrowRight)ax++;
  if(G.stick.on){ax+=G.stick.vx;ay+=G.stick.vy;}
  const am=Math.hypot(ax,ay);
  if(am>1){ax/=am;ay/=am;}
  G.pvx*=Math.pow(0.015,dt);G.pvy*=Math.pow(0.015,dt);
  G.px=clamp(G.px+(ax*228+G.pvx)*dt,18,G.W-18);
  G.py=clamp(G.py+(ay*228+G.pvy)*dt,18,G.H-18);
  if(G.hold||G.thr.on){
    const d=aimDir();
    if(d.x||d.y)G.pa=Math.atan2(d.y,d.x);
    shoot();
  }else if(!G.stick.on){
    G.pa=Math.atan2(G.my-G.py,G.mx-G.px);
  }else if(ax||ay){
    G.pa=Math.atan2(ay,ax);
  }
  if(Math.random()<dt*14){
    bit(G.W*0.5+(Math.random()-0.5)*10,G.H*0.5-8, (Math.random()-0.5)*12,-30-Math.random()*40,0.7,1.2+Math.random(),'#e85d04');
  }
  for(let i=G.bits.length-1;i>=0;i--){
    const b=G.bits[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.z-=dt*1.3;
    if(b.z<=0)G.bits.splice(i,1);
  }
  for(let i=G.sparks.length-1;i>=0;i--){
    const s=G.sparks[i];
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(s.life<=0||s.x<0||s.y<0||s.x>G.W||s.y>G.H){G.sparks.splice(i,1);continue;}
    for(const f of G.foes){
      const dx=f.x-s.x,dy=f.y-s.y;
      if(dx*dx+dy*dy<(f.r+5)*(f.r+5)){
        f.hp--;s.life=0;
        burst(f.x,f.y,5,'#c9c2b2');
        break;
      }
    }
  }
  const hx=G.W*0.5,hy=G.H*0.5,hr=24;
  if(G.mode==='play'){
    G.cdSpawn-=dt;
    if(G.spawned<G.need&&G.cdSpawn<=0){
      spawnOne();
      G.cdSpawn=0.55-G.watch*0.03;
    }
  }
  const foes=G.foes;
  for(let i=0;i<foes.length;i++){
    for(let j=i+1;j<foes.length;j++){
      const a=foes[i],b=foes[j];
      let dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
      if(d<676&&d>0){d=Math.sqrt(d);dx/=d;dy/=d;a.x+=dx*0.45;a.y+=dy*0.45;b.x-=dx*0.45;b.y-=dy*0.45;}
    }
  }
  for(let i=foes.length-1;i>=0;i--){
    const f=foes[i];
    if(f.hp<=0){foes.splice(i,1);continue;}
    const dx=hx-f.x,dy=hy-f.y,n=Math.hypot(dx,dy)||1;
    f.x+=dx/n*G.fspd*dt;f.y+=dy/n*G.fspd*dt;
    if(n<hr+f.r){hitFire(f);foes.splice(i,1);continue;}
    const px=G.px-f.x,py=G.py-f.y;
    if(px*px+py*py<12*12+f.r*f.r)hitPlayer(f);
  }
  if(G.mode==='play'&&G.spawned>=G.need&&!foes.length){
    if(G.watch>=WATCHES){win();return;}
    G.mode='rest';G.rest=2.1;
    toast('Watch '+G.watch+' clear');
  }
  if(G.mode==='rest'){
    G.rest-=dt;
    if(G.rest<=0){
      G.watch++;G.mode='play';toast('');beginWatch();
    }
  }
  hud();
}
let last=performance.now();
function loop(now){
  const dt=clamp((now-last)/1000,0,0.033);last=now;
  update(dt);
  drawWorld(ctx);
  requestAnimationFrame(loop);
}
function onKey(e,down){
  G.keys[e.code]=down;
  if(!down)return;
  if(e.code==='KeyM'){G.mute^=1;el.mute.textContent=G.mute?'×':'M';}
  if(e.code==='Escape'||e.code==='KeyP'){
    if(G.mode==='pause')resume();else pause();
  }
  if(e.code==='Space'){
    e.preventDefault();
    if(G.mode==='title'||G.mode==='lose'||G.mode==='win')start();
  }
}
function stickAt(x,y){
  const r=el.stick.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,max=r.width*0.36;
  if(d>max){dx=dx/d*max;dy=dy/d*max;}
  G.stick.vx=dx/max;G.stick.vy=dy/max;
  el.knob.style.transform='translate('+dx+'px,'+dy+'px)';
}
function clearStick(){
  G.stick.on=0;G.stick.id=-1;G.stick.vx=G.stick.vy=0;
  el.knob.style.transform='';
}
function bind(){
  addEventListener('resize',resize);
  addEventListener('keydown',e=>onKey(e,1));
  addEventListener('keyup',e=>onKey(e,0));
  addEventListener('mousemove',e=>{G.mx=e.clientX;G.my=e.clientY;});
  addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    if(e.target.closest('#shade,#hud,#stick,#throw'))return;
    G.hold=1;G.mx=e.clientX;G.my=e.clientY;ac();
  });
  addEventListener('mouseup',()=>{G.hold=0;});
  addEventListener('contextmenu',e=>e.preventDefault());
  el.go.onclick=()=>{ac();if(G.mode==='pause')resume();else start();};
  el.pause.onclick=()=>{if(G.mode==='pause')resume();else pause();};
  el.mute.onclick=()=>{G.mute^=1;el.mute.textContent=G.mute?'×':'M';ac();};
  const mark=()=>document.body.classList.add('touch');
  el.stick.addEventListener('pointerdown',e=>{
    mark();e.preventDefault();el.stick.setPointerCapture(e.pointerId);
    G.stick.on=1;G.stick.id=e.pointerId;stickAt(e.clientX,e.clientY);ac();
  });
  el.stick.addEventListener('pointermove',e=>{
    if(G.stick.on&&e.pointerId===G.stick.id)stickAt(e.clientX,e.clientY);
  });
  el.stick.addEventListener('pointerup',clearStick);
  el.stick.addEventListener('pointercancel',clearStick);
  const thrOn=e=>{mark();e.preventDefault();el.thr.setPointerCapture(e.pointerId);G.thr.on=1;G.thr.id=e.pointerId;ac();};
  const thrOff=e=>{if(e.pointerId===G.thr.id||!e.pointerId){G.thr.on=0;G.thr.id=-1;}};
  el.thr.addEventListener('pointerdown',thrOn);
  el.thr.addEventListener('pointerup',thrOff);
  el.thr.addEventListener('pointercancel',thrOff);
}
resize();
G.px=G.W*0.5;G.py=G.H*0.5+64;
hud();
bind();
requestAnimationFrame(loop);
