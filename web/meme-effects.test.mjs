import test from 'node:test';
import assert from 'node:assert/strict';
import {keyGreen,shouldTrigger,memeClips,randomLayout} from './meme-effects.mjs';

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
  assert.equal(memeClips.hit.length,9);assert.equal(memeClips.miss.length,9);
  assert.equal(new Set(Object.values(memeClips).flat().map(c=>c.url)).size,15);
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
