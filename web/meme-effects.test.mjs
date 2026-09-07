import test from 'node:test';
import assert from 'node:assert/strict';
import {keyGreen,shouldTrigger,memeClips,randomLayout,ScreenEffects,canScreenTrigger,MixedScreenEffects,mixedScreenKinds} from './meme-effects.mjs';

test('11 种全屏效果混合选择并共用冷却和清理',()=>{
  const old=globalThis.document;
  globalThis.document={createElement:()=>({setAttribute(){},addEventListener(){},pause(){},play:()=>Promise.resolve(),getContext:()=>({})})};
  try{
    assert.equal(new Set(mixedScreenKinds).size,11);
    const fx=new MixedScreenEffects({append(){}});
    fx.trigger(0,true,'particle:shockwave');assert.equal(fx.particle.active,true);assert.equal(fx.video.active,false);
    assert.equal(fx.trigger(100),false);
    fx.trigger(4000,true,'video:smoke');assert.equal(fx.video.active,true);assert.equal(fx.particle.active,false);
    fx.setEnabled(false);assert.equal(fx.video.active,false);assert.equal(fx.particle.active,false);assert.equal(fx.trigger(8000),false);
  }finally{globalThis.document=old;}
});

test('全屏效果限频、关闭、暂停和超时清理',()=>{
  assert.equal(canScreenTrigger(3599,0),false);assert.equal(canScreenTrigger(3600,0),true);
  const old=globalThis.document;
  globalThis.document={createElement:()=>({setAttribute(){},addEventListener(){},pause(){},play:()=>Promise.resolve(),getContext:()=>({})})};
  try{
    const fx=new ScreenEffects({append(){}});
    assert.equal(fx.trigger(0,true,'fire'),true);assert.equal(fx.active,true);
    assert.equal(fx.trigger(100),false);
    fx.setEnabled(false);assert.equal(fx.active,false);assert.equal(fx.canvas.hidden,true);
    assert.equal(fx.trigger(4000),false);
    fx.trigger(5000,true,'fireworks');fx.update(7900);assert.equal(fx.active,false);
    fx.trigger(8000,true,'explosion');fx.hide();assert.equal(fx.canvas.hidden,true);
  }finally{globalThis.document=old;}
});

test('全屏视频抠绿后显示，过期播放失败不会关闭下一段',async()=>{
  const old=globalThis.document;let rejectFirst;let pauses=0;let output;
  const ctx={drawImage(){},getImageData:()=>({data:new Uint8ClampedArray([0,220,0,255])}),putImageData(p){output=p.data;}};
  globalThis.document={createElement:tag=>tag==='canvas'?{style:{},setAttribute(){},getContext:()=>ctx}:{readyState:2,videoWidth:1,videoHeight:1,addEventListener(){},pause(){pauses++;},play(){return new Promise((resolve,reject)=>{rejectFirst=reject;});}}};
  try{
    const fx=new ScreenEffects({append(){}});fx.trigger(0,true,'fire');const rejectOld=rejectFirst;
    fx.update(200);assert.equal(output[3],0);assert.equal(fx.canvas.hidden,false);
    fx.trigger(4000,true,'smoke');rejectOld(new Error('old playback'));await Promise.resolve();
    assert.equal(fx.active,true);assert.equal(fx.kind,'smoke');assert.ok(pauses>0);
    fx.video.ended=true;fx.update(4200);assert.equal(fx.canvas.hidden,true);
  }finally{globalThis.document=old;}
});

test('移除绿幕而保留皮肤、白衣和黑色',()=>{
  const pixels=new Uint8ClampedArray([0,220,0,255,120,80,60,255,240,240,240,255,10,10,10,255]);
  keyGreen(pixels);assert.equal(pixels[3],0);assert.equal(pixels[7],255);assert.equal(pixels[11],255);assert.equal(pixels[15],255);
});
test('绿幕边缘使用半透明并减少绿色溢出',()=>{
  const pixels=new Uint8ClampedArray([60,100,55,255]);keyGreen(pixels);assert.ok(pixels[3]>0&&pixels[3]<255);assert.ok(pixels[1]<=78);
});
test('连续射击限频且命中、打空均可切换',()=>{
  assert.equal(shouldTrigger(100,-Infinity,'hit',null),true);
  assert.equal(shouldTrigger(800,0,'hit','hit'),false);
  assert.equal(shouldTrigger(950,0,'hit','hit'),true);
  assert.equal(shouldTrigger(399,0,'miss','hit'),false);
  assert.equal(shouldTrigger(400,0,'miss','hit'),true);
  assert.equal(shouldTrigger(400,0,'hit','miss'),true);
  assert.equal(memeClips.hit.length,11);assert.equal(memeClips.miss.length,11);
  assert.equal(new Set(Object.values(memeClips).flat().map(c=>c.url)).size,18);
});

test('随机位置和尺寸在横屏、竖屏、小窗口内均不越界',()=>{
  for(const [width,height] of [[1920,1080],[390,844],[320,200]]){
    for(const aspect of [16/9,320/248])for(const random of [()=>0,()=>.5,()=>.999]){
      const r=randomLayout(width,height,aspect,random);
      assert.ok(r.width>0&&r.height>0);assert.ok(r.x>=0&&r.y>=0);
      assert.ok(r.x+r.width<=width);assert.ok(r.y+r.height<=height);
    }
    const a=randomLayout(width,height,16/9,()=>0),b=randomLayout(width,height,16/9,()=>.999);
    assert.notEqual(a.width,b.width);assert.notEqual(a.x,b.x);assert.notEqual(a.y,b.y);
  }
});
