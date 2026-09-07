export const memeClips = {
  hit: [
    {name:'墨镜装酷',url:'effects/thug-life.mp4'},
    {name:'Gwenchana',url:'effects/gwenchana.mp4'},
    {name:'指头笑', url:'effects/roll-safe.mp4'},
    {name:'Wow！', url:'effects/wow.mp4'},
    {name:'欢呼哥', url:'effects/cheer.mp4'},
    {name:'突然起舞', url:'effects/dance.mp4'},
    {name:'狗狗蹦迪', url:'effects/dog.mp4'},
    {name:'暗中狂笑', url:'effects/laugh.mp4'},
    {name:'突然爆炸', url:'effects/explosion.mp4',kind:'blast'},
    {name:'放个烟花', url:'effects/fireworks.mp4',kind:'blast'},
    {name:'神龙爆燃', url:'effects/chinese-dragon.mp4',kind:'blast'},
  ],
  miss: [
    {name:'未完待续',url:'effects/continued.mp4'},
    {name:'Gwenchana',url:'effects/gwenchana.mp4'},
    {name:'问号脸', url:'effects/confused.mp4'},
    {name:'哭脸', url:'effects/crying.mp4'},
    {name:'老板大笑', url:'effects/jameson.mp4'},
    {name:'滑稽脸', url:'effects/troll.mp4'},
    {name:'笑到旋转', url:'effects/lol.mp4'},
    {name:'汗流浃背', url:'effects/sweat.mp4'},
    {name:'空枪也爆炸', url:'effects/explosion.mp4',kind:'blast'},
    {name:'反向庆祝', url:'effects/fireworks.mp4',kind:'blast'},
    {name:'空枪惊动神龙', url:'effects/chinese-dragon.mp4',kind:'blast'},
  ],
};

// Soft green key with spill reduction; neutral whites and skin remain opaque.
export function keyGreen(data){
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    const dominance=g-Math.max(r,b);
    if(g<55||dominance<=18)continue;
    const amount=Math.min(1,(dominance-18)/42);
    data[i+3]=Math.round(data[i+3]*(1-amount));
    if(amount>0)data[i+1]=Math.min(g,Math.max(r,b)+18);
  }
  return data;
}

export function shouldTrigger(now,lastStart,group,lastGroup){
  return now-lastStart>=(group===lastGroup?950:400);
}

export function randomLayout(width,height,aspect,random=Math.random){
  const margin=Math.min(12,width*.04,height*.04);
  const maxWidth=Math.min(460,width*.46,(height-margin*2)*.55*aspect);
  const minWidth=Math.min(maxWidth,Math.max(70,width*.18));
  const w=minWidth+(maxWidth-minWidth)*random(),h=w/aspect;
  return {width:w,height:h,x:margin+(width-w-margin*2)*random(),y:margin+(height-h-margin*2)*random()};
}

export const screenClips=[
  {id:'fireworks',url:'effects/screen-fireworks.mp4'},
  {id:'fire',url:'effects/screen-fire.mp4'},
  {id:'explosion',url:'effects/screen-explosion.mp4'},
  {id:'smoke',url:'effects/screen-blast.mp4'},
  {id:'sparkles',url:'effects/screen-sparkles.mp4'},
];
export const screenKinds=screenClips.map(c=>c.id);
export function canScreenTrigger(now,lastStart){return now-lastStart>=3600;}

// Full-arena compositing of downloaded footage, independent of floating memes.
export class ScreenEffects {
  constructor(host){
    this.host=host;this.enabled=true;this.lastStart=-Infinity;this.lastKind=null;this.active=false;this.generation=0;this.lastPaint=0;
    this.canvas=document.createElement('canvas');this.canvas.className='screen-effects';this.canvas.hidden=true;
    this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});
    this.videos=new Map();
    for(const clip of screenClips){
      const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=clip.url;
      video.addEventListener('error',()=>{if(this.video===video)this.hide();});this.videos.set(clip.id,video);
    }
  }
  setEnabled(value){this.enabled=value;if(!value)this.hide();}
  hide(){this.generation++;this.video?.pause();this.video=null;this.active=false;this.canvas.hidden=true;}
  trigger(now=performance.now(),force=false,kind=null){
    if(!this.ctx||(!force&&(!this.enabled||!canScreenTrigger(now,this.lastStart))))return false;
    if(!force&&Math.random()>.4)return false;
    const choices=screenKinds.filter(k=>k!==this.lastKind);
    this.kind=screenKinds.includes(kind)?kind:choices[Math.floor(Math.random()*choices.length)];
    this.hide();const generation=this.generation;
    this.lastKind=this.kind;this.lastStart=now;this.lastPaint=-Infinity;this.active=true;this.video=this.videos.get(this.kind);
    try{this.video.currentTime=0;this.video.play().catch(()=>{if(this.generation===generation)this.hide();});}catch{this.hide();return false;}
    return true;
  }
  update(now){
    if(!this.active)return;
    const video=this.video;
    if(video.ended||now-this.lastStart>2800){this.hide();return;}
    if(video.readyState<2||now-this.lastPaint<50)return;
    const w=video.videoWidth,h=video.videoHeight;if(!w||!h)return;
    this.lastPaint=now;
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    try{
      this.ctx.drawImage(video,0,0,w,h);
      const pixels=this.ctx.getImageData(0,0,w,h);keyGreen(pixels.data);this.ctx.putImageData(pixels,0,0);
      this.canvas.style.opacity=String(Math.min(1,(now-this.lastStart)/120,(2800-(now-this.lastStart))/250));this.canvas.hidden=false;
    }catch{this.hide();}
  }
}

export class MemeEffects {
  constructor(host,onError=()=>{}){
    this.host=host;this.onError=onError;this.enabled=true;this.lastStart=-Infinity;this.lastGroup=null;this.lastIndex={};this.generation=0;this.lastPaint=0;this.active=null;this.layoutSize='';
    this.element=document.createElement('div');this.element.className='meme-effect';this.element.hidden=true;
    this.element.setAttribute('aria-hidden','true');
    this.canvas=document.createElement('canvas');this.canvas.width=384;this.canvas.height=216;
    this.element.append(this.canvas);host.append(this.element);
    this.context=this.canvas.getContext('2d',{willReadFrequently:true});
    this.videos=new Map();
    for(const clip of Object.values(memeClips).flat()){
      if(this.videos.has(clip.url))continue;
      const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=clip.url;
      video.addEventListener('error',()=>{if(this.active===video)this.hide();});this.videos.set(clip.url,video);
    }
  }
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.hide();}
  hide(){this.generation++;if(this.active)this.active.pause();this.active=null;this.element.hidden=true;this.context?.clearRect(0,0,this.canvas.width,this.canvas.height);}
  trigger(group,now=performance.now(),force=false,chosenUrl=null){
    if(!this.context||(!force&&!this.enabled)||!memeClips[group])return;
    if(!force&&!shouldTrigger(now,this.lastStart,group,this.lastGroup))return;
    const clips=memeClips[group];
    const choices=clips.map((_,i)=>i).filter(i=>i!==this.lastIndex[group]);
    const chosen=chosenUrl?clips.findIndex(clip=>clip.url===chosenUrl):-1;
    const index=chosen>=0?chosen:choices[Math.floor(Math.random()*choices.length)];
    this.lastIndex[group]=index;const clip=clips[index];this.hide();const generation=this.generation;
    const video=this.videos.get(clip.url);this.active=video;this.lastStart=now;this.lastGroup=group;this.lastPaint=0;
    this.element.dataset.outcome=group;this.layoutSize='';
    try{video.currentTime=0;video.play().catch(()=>{if(this.generation===generation){this.hide();if(force)this.onError('梗视频暂时无法播放，请刷新后重试。');}});}catch{this.hide();}
    return clip;
  }
  update(now){
    const video=this.active;if(!video)return;
    if(video.ended||now-this.lastStart>2600){this.hide();return;}
    if(video.readyState<2||now-this.lastPaint<50)return;
    this.lastPaint=now;
    const width=video.videoWidth,height=video.videoHeight;if(!width||!height)return;
    const size=`${this.host.clientWidth}:${this.host.clientHeight}`;
    if(size!==this.layoutSize){
      const layout=randomLayout(this.host.clientWidth,this.host.clientHeight,width/height);
      Object.assign(this.element.style,{left:layout.x+'px',top:layout.y+'px',bottom:'auto',width:layout.width+'px',height:layout.height+'px'});
      this.layoutSize=size;
    }
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    try{
      this.context.drawImage(video,0,0,width,height);
      const pixels=this.context.getImageData(0,0,width,height);keyGreen(pixels.data);this.context.putImageData(pixels,0,0);
      this.element.hidden=false;
    }catch{this.hide();}
  }
}

export const particleKinds=["fireworks","fire","explosion","shockwave","meteors","confetti"];
export class ParticleScreenEffects {
  constructor(host){
    this.host=host;this.enabled=true;this.lastStart=-Infinity;this.lastKind=null;this.active=false;
    this.canvas=document.createElement('canvas');this.canvas.className='screen-effects';this.canvas.hidden=true;
    this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  }
  setEnabled(value){this.enabled=value;if(!value)this.hide();}
  hide(){this.active=false;this.canvas.hidden=true;}
  trigger(now=performance.now(),force=false,kind=null){
    if(!this.ctx||(!force&&(!this.enabled||!canScreenTrigger(now,this.lastStart))))return false;
    if(!force&&Math.random()>.4)return false;
    const choices=particleKinds.filter(k=>k!==this.lastKind);
    this.kind=particleKinds.includes(kind)?kind:choices[Math.floor(Math.random()*choices.length)];
    this.lastKind=this.kind;this.lastStart=now;this.active=true;this.canvas.hidden=false;
    this.seeds=Array.from({length:150},()=>({x:Math.random(),y:Math.random(),a:Math.random()*Math.PI*2,s:.3+Math.random()*.7,h:Math.random()*360}));
    return true;
  }
  update(now){
    if(!this.active)return;
    const t=(now-this.lastStart)/1000;if(t>2.2){this.hide();return;}
    const w=Math.max(1,Math.min(1280,this.host.clientWidth)),h=Math.max(1,Math.round(w*this.host.clientHeight/Math.max(1,this.host.clientWidth)));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    const c=this.ctx;c.clearRect(0,0,w,h);c.globalAlpha=Math.min(1,t*8)*Math.min(1,(2.2-t)*2);
    c.globalCompositeOperation=this.kind==='confetti'?'source-over':'lighter';
    for(let i=0;i<this.seeds.length;i++){
      const p=this.seeds[i];let x,y,r=2+p.s*3,color=`hsl(${p.h},100%,65%)`;
      if(this.kind==='fireworks'){
        const burst=i%5,age=t-burst*.18;if(age<0)continue;
        const distance=(1-Math.exp(-age*2.4))*Math.min(w,h)*.34*p.s;
        x=w*(.15+burst*.175)+Math.cos(p.a)*distance;y=h*(.22+(burst%2)*.2)+Math.sin(p.a)*distance+age*age*32;
        color=`hsla(${burst*72},100%,70%,${Math.max(0,1-age/2)})`;
      }else if(this.kind==='fire'){
        const rise=(t*.7+p.y)%1;x=p.x*w+Math.sin(t*5+p.a)*20;y=h*(1-rise*.6);r=(1-rise)*25*p.s+2;
        color=`hsla(${15+rise*45},100%,${48+rise*25}%,${(1-rise)*.55})`;
      }else if(this.kind==='explosion'){
        const d=(1-Math.exp(-t*3))*Math.max(w,h)*.6*p.s;
        x=w/2+Math.cos(p.a)*d;y=h/2+Math.sin(p.a)*d;r=(1-t/2.4)*24*p.s+1;
        color=`hsla(${p.s*55},100%,60%,${Math.max(0,1-t/2.2)})`;
      }else if(this.kind==='shockwave'){
        if(i>=4)continue;const age=t-i*.16;if(age<0)continue;
        c.strokeStyle=`hsla(${185+i*30},100%,70%,${Math.max(0,1-age/2)})`;c.lineWidth=5*(1-age/2)+1;
        c.beginPath();c.ellipse(w/2,h/2,age*w*.65,age*h*.65,0,0,Math.PI*2);c.stroke();continue;
      }else if(this.kind==='meteors'){
        if(i>=30)continue;x=((p.x+t*.45)%1.5-.2)*w;y=((p.y+t*.65)%1.4-.2)*h;
        c.strokeStyle=`hsla(${20+p.h*.12},100%,70%,.7)`;c.lineWidth=2+p.s*3;c.beginPath();c.moveTo(x-65*p.s,y-100*p.s);c.lineTo(x,y);c.stroke();
      }else{
        x=(p.x*w+Math.sin(t*3+p.a)*40);y=((p.y+t*.4)%1.2-.1)*h;
        c.save();c.translate(x,y);c.rotate(p.a+t*4);c.fillStyle=color;c.fillRect(-4,-7,8,14);c.restore();continue;
      }
      c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(.5,r),0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }
}


export const mixedScreenKinds=[...screenKinds.map(k=>'video:'+k),...particleKinds.map(k=>'particle:'+k)];
export class MixedScreenEffects {
  constructor(host){this.video=new ScreenEffects(host);this.particle=new ParticleScreenEffects(host);this.enabled=true;this.lastStart=-Infinity;this.lastKind=null;}
  setEnabled(value){this.enabled=value;this.video.setEnabled(value);this.particle.setEnabled(value);}
  hide(){this.video.hide();this.particle.hide();}
  trigger(now=performance.now(),force=false,kind=null){
    if(!force&&(!this.enabled||!canScreenTrigger(now,this.lastStart)||Math.random()>.4))return false;
    const choices=mixedScreenKinds.filter(k=>k!==this.lastKind);
    const chosen=mixedScreenKinds.includes(kind)?kind:choices[Math.floor(Math.random()*choices.length)];
    this.hide();const [type,id]=chosen.split(':');
    const started=this[type].trigger(now,true,id);
    if(started){this.lastKind=chosen;this.lastStart=now;}
    return started;
  }
  update(now){this.video.update(now);this.particle.update(now);}
}
