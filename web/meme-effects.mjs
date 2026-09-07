export const memeClips = {
  hit: [
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
