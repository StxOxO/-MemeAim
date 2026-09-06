import * as THREE from './vendor/three.module.js';

// A separate first-person scene prevents the held weapon from clipping into the arena.
export class HeldWeapon {
  constructor(){
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(58,1,.03,10);
    this.root=new THREE.Group();this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xe9f8ff,0x33434a,2.4));
    const light=new THREE.DirectionalLight(0xffffff,3.5);light.position.set(-2,4,3);this.scene.add(light);
    const dark=new THREE.MeshStandardMaterial({color:0x26303a,roughness:.48,metalness:.65});
    const steel=new THREE.MeshStandardMaterial({color:0x64727c,roughness:.3,metalness:.8});
    const black=new THREE.MeshStandardMaterial({color:0x10191f,roughness:.8});
    const lime=new THREE.MeshStandardMaterial({color:0xc5f66b,emissive:0x75982c,emissiveIntensity:.15,roughness:.5});
    const glove=new THREE.MeshStandardMaterial({color:0x384349,roughness:.95});
    const sleeve=new THREE.MeshStandardMaterial({color:0x253541,roughness:.9});
    const box=(w,h,d,x,y,z,material=dark,parent=this.root)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
    // Compact training carbine: receiver, rail, stock and barrel.
    box(.135,.145,.46,0,0,-.07);
    box(.12,.08,.31,0,-.07,-.04,black);
    box(.105,.018,.44,0,.084,-.08,steel);
    for(let i=0;i<9;i++)box(.13,.012,.015,0,.101,.105-i*.042,black);
    box(.083,.087,.18,0,.012,-.39,steel);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.24,12),steel);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.014,-.56);this.root.add(barrel);
    const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.036,.033,.065,12),black);muzzle.rotation.x=Math.PI/2;muzzle.position.set(0,.014,-.7);this.root.add(muzzle);
    box(.095,.093,.22,0,-.012,.26,black);box(.14,.22,.045,0,-.028,.395,dark);
    const grip=box(.082,.17,.096,0,-.16,.08,black);grip.rotation.x=-.22;
    const magazine=box(.074,.19,.12,0,-.185,-.115,dark);magazine.rotation.x=.12;
    for(let i=0;i<3;i++)box(.079,.009,.104,0,-.19-i*.027,-.113,black);
    box(.006,.027,.15,.07,.009,-.045,lime);box(.006,.012,.047,.071,.044,.05,steel);
    // Open sight with a lime front post.
    box(.018,.063,.038,-.044,.14,.04,black);box(.018,.063,.038,.044,.14,.04,black);box(.106,.013,.038,0,.174,.04,black);
    box(.016,.055,.023,0,.126,-.29,steel);box(.018,.012,.025,0,.154,-.29,lime);
    this.bolt=box(.009,.028,.085,.073,.021,.082,steel);
    // Both gloved hands and sleeves are actual 3D meshes.
    const limb=(a,b,radius,material)=>{const direction=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(.01,direction.length()-radius*2),5,10),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());this.root.add(mesh);return mesh;};
    limb(new THREE.Vector3(.055,-.15,.105),new THREE.Vector3(.08,-.27,.20),.055,glove);
    limb(new THREE.Vector3(.085,-.26,.19),new THREE.Vector3(.25,-.47,.57),.074,sleeve);
    limb(new THREE.Vector3(-.025,-.105,-.29),new THREE.Vector3(-.1,-.13,-.23),.055,glove);
    limb(new THREE.Vector3(-.095,-.14,-.23),new THREE.Vector3(-.31,-.42,.28),.072,sleeve);
    for(let i=0;i<3;i++){box(.09,.018,.027,.02,-.126-i*.023,.071,glove);box(.015,.033,.093,-.05+i*.024,-.093,-.26,glove);}
    const triggerGuard=box(.018,.07,.14,.038,-.12,.005,steel);triggerGuard.rotation.x=.1;
    this.flash=new THREE.Group();this.flash.position.set(0,.014,-.75);this.root.add(this.flash);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.064,.22,6),new THREE.MeshBasicMaterial({color:0xffe8ad,transparent:true,opacity:.95}));flame.rotation.x=-Math.PI/2;flame.position.z=-.08;this.flash.add(flame);
    const core=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));core.scale.set(1,1,2.5);this.flash.add(core);
    this.flashLight=new THREE.PointLight(0xffce80,0,3);this.flashLight.position.set(0,.1,-.8);this.root.add(this.flashLight);
    this.flash.visible=false;this.kick=0;this.flashTime=0;this.sway=new THREE.Vector2();
  }
  resize(width,height){this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  fire(){this.kick=Math.min(1.3,this.kick+.9);this.flashTime=.055;this.flash.rotation.z=Math.random()*Math.PI;}
  aim(dx,dy){this.sway.x=THREE.MathUtils.clamp(this.sway.x+dx*.00012,-.022,.022);this.sway.y=THREE.MathUtils.clamp(this.sway.y+dy*.00012,-.015,.015);}
  update(dt,time){
    this.kick*=Math.exp(-dt*16);this.flashTime=Math.max(0,this.flashTime-dt);this.sway.multiplyScalar(Math.exp(-dt*8));
    const narrow=this.camera.aspect<1;
    this.root.position.set((narrow?.18:.38)+this.sway.x,-.3+Math.sin(time*1.9)*.0025+this.sway.y,-.72+this.kick*.07);
    this.root.rotation.set(.025+this.kick*.12,-.045+this.sway.x*.5,this.kick*-.026);
    this.root.scale.setScalar(narrow?.72:1);
    this.bolt.position.z=.082+this.kick*.05;this.flash.visible=this.flashTime>0;this.flashLight.intensity=this.flashTime>0?4:0;
  }
  render(renderer){renderer.autoClear=false;renderer.clearDepth();renderer.render(this.scene,this.camera);renderer.autoClear=true;}
}
