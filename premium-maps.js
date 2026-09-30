import * as T from './three.module.js';
import {pineGeometry,mountainGeometry,texturedMaterial} from './visuals.js';
const cube=new T.BoxGeometry(1,1,1),pine=pineGeometry(1,1,3),peak=mountainGeometry(1,1,3);
cube.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(cube.attributes.position.count*3).fill(1),3));
const material=(color,metalness=0,roughness=.8)=>new T.MeshStandardMaterial({color,metalness,roughness,vertexColors:true});
const snow=material('#e5f0f5'),stone=texturedMaterial(material('#71899c'),'stone'),bark=material('#4a5559'),fir=material('#355e60'),steel=material('#263e50',.55,.42),glass=material('#214155',.65,.2),dock=material('#334653'),cargo=[material('#315f6a'),material('#6d4359'),material('#896449')];
const glow=color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.8,roughness:.3});
const cyan=glow('#51d8f4'),violet=glow('#a092ff'),warm=glow('#eacb83');
function shape(parent,geometry,mat,x,y,z,w,h,d){const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
const box=(g,m,x,y,z,w,h,d)=>shape(g,cube,m,x,y,z,w,h,d);
export function createPremiumScenery(map,index){
 const g=new T.Group();g.name=map;
 if(map==='alpine'){
  for(const side of [-1,1]){
   box(g,snow,side*12,.1,0,5,.65,30.2);
   for(let n=0;n<5;n++){const x=side*(19+(n%2)*10+(index%3)),z=-13+n*6,height=7+(index+n)%5;box(g,bark,x,height*.3,z,.4,height*.6,.4);for(let k=0;k<3;k++){shape(g,pine,fir,x,height*.47+k*1.5,z,2.4-k*.45,height*.6,2.4-k*.45);shape(g,pine,snow,x,height*.61+k*1.5,z,1.8-k*.35,height*.38,1.8-k*.35)}}
   if(index%2===0){const height=85+(index*11)%70,x=side*(100+(index%3)*19),z=-5;const mountain=shape(g,peak,stone,x,-4,z,48,height,110);mountain.rotation.y=index*.41;const cap=shape(g,peak,snow,x,height*.4-4,z,48*.38,height*.38,110*.38);cap.rotation.y=mountain.rotation.y;}
   if(index%5===0){box(g,stone,side*28,1,3,7,2,5);box(g,snow,side*28,2.1,3,7.3,.5,5.4)}
  }
 }else if(map==='harbour'){
  box(g,dock,-24,-.05,0,26,.35,30.2);
  for(const side of [-1,1]){box(g,cyan,side*8.45,.88,0,.075,.055,30.2);box(g,steel,side*10,.2,0,1,.45,30.2)}
  for(let n=0;n<4;n++){const x=-17-(n%2)*8,z=-8+Math.floor(n/2)*15,h=2.4+(index+n)%2*2.5;box(g,cargo[(index+n)%3],x,h/2,z,6.5,h,10);for(let rib=0;rib<5;rib++)box(g,steel,x-3.28,h/2,z-4+rib*2,.08,h,.09)}
  if(index%4===0){box(g,steel,-34,14,0,1,28,1);box(g,steel,-25,27,0,23,.8,.8);box(g,violet,-25,27.5,0,23,.06,.12);box(g,steel,-16,18,0,.09,18,.09);box(g,warm,-16,8.8,0,.5,.5,.5)}
  for(let n=0;n<2;n++){const x=23+n*25,h=20+(index*13+n*17)%65,w=10+n*3,z=n?8:-5;box(g,glass,x,h/2,z,w,h,12);box(g,steel,x,h+.3,z,w+.5,.6,12.5);box(g,n?violet:cyan,x-w/2-.05,h/2,z+6.05,.09,h,.09);box(g,n?violet:cyan,x,h+.65,z,w,.12,12);for(let y=3;y<h-1;y+=4)for(let c=-1;c<=1;c++)box(g,(index+c)%3?cyan:warm,x+c*w*.25,y,z+6.03,w*.16,.5,.06)}
  if(index%6===0){for(const side of [-1,1])box(g,steel,side*9,5.6,0,.4,11.2,.4);box(g,steel,0,11,0,18.5,.4,.5);box(g,violet,0,10.74,.1,18,.065,.1)}
 }
 return g;
}
