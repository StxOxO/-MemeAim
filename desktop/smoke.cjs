module.exports = async function smoke(window) {
  const report = await window.webContents.executeJavaScript(`(async()=>{
    const check=(value,message)=>{if(!value)throw new Error(message);};
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    await wait(700);
    check(document.getElementById('fatal').hidden,'WebGL scene failed');
    check(document.querySelector('#arena canvas'),'3D canvas missing');
    check(typeof window.require==='undefined'&&typeof window.process==='undefined','Renderer has Node access');
    const manifest=await (await fetch('sounds/manifest.json')).json();
    check(manifest.hit.length&&manifest.miss.length,'Sounds missing');
    const audio=new Audio(manifest.hit[0].url);
    await new Promise((resolve,reject)=>{audio.onloadeddata=resolve;audio.onerror=()=>reject(new Error('Audio decode failed'));audio.load();setTimeout(()=>reject(new Error('Audio timeout')),10000);});
    const {memeClips,screenClips,MixedScreenEffects,particleKinds}=await import('./meme-effects.mjs');
    const urls=[...new Set([...Object.values(memeClips).flat(),...screenClips].map(c=>c.url))];
    for(const url of urls){
      const video=document.createElement('video');video.muted=true;
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Video timeout: '+url)),10000);video.onloadeddata=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(new Error('Video decode failed: '+url+' code='+video.error?.code+' '+video.error?.message));};video.src=url;video.load();});
      check(video.videoWidth>0,'Video dimensions missing');video.removeAttribute('src');video.load();
    }
    const fx=new MixedScreenEffects(document.getElementById('arena'));
    for(const kind of particleKinds){fx.trigger(0,true,'particle:'+kind);fx.update(500);check(!fx.particle.canvas.hidden,'Particle failed');}
    fx.setEnabled(false);check(fx.particle.canvas.hidden&&fx.video.canvas.hidden,'Effects did not stop');
    fx.video.canvas.remove();fx.particle.canvas.remove();
    const control=document.getElementById('control');control.value='cursor';control.dispatchEvent(new Event('change'));
    const modes=['gridshot','tracking','flick'];
    for(const mode of modes){
      document.querySelector('[data-mode="'+mode+'"]').click();document.getElementById('start').click();
      document.querySelector('#overlay-actions button').click();await wait(80);
      check(document.getElementById('overlay').hidden,'Training failed: '+mode);
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}));
      check(!document.getElementById('overlay').hidden,'Pause failed: '+mode);
      const buttons=[...document.querySelectorAll('#overlay-actions button')];buttons.find(b=>b.textContent==='返回训练场').click();
    }
    localStorage.setItem('desktop-smoke','persisted');
    return {videoCount:urls.length,hitSounds:manifest.hit.length,missSounds:manifest.miss.length,modes,particleCount:particleKinds.length};
  })()`,true);
  await window.loadURL('memeaim://app/');
  const persisted=await window.webContents.executeJavaScript(`localStorage.getItem('desktop-smoke')==='persisted'`);
  if(!persisted)throw new Error('Local storage did not survive reload');
  return {...report,persistence:true};
};
