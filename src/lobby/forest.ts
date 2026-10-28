import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {biomeAt} from './biomes';
import {terrainHeight} from './exploration';

type Tree={x:number;z:number;s:number;hue:number;lightness:number};
export function buildForest(scene:T.Scene,trees:Tree[]){
 const forestLods:T.LOD[]=[];scene.userData.forestLods=forestLods;
 const cells=new Map<string,Tree[]>();
 for(const tree of trees){const key=`${Math.floor(tree.x/64)},${Math.floor(tree.z/64)},${biomeAt(tree.x,tree.z).id}`,group=cells.get(key)??[];group.push(tree);cells.set(key,group)}
 const crownParts=[0,1,2].map(i=>new T.ConeGeometry(2.8-i*.65,3.9-i*.45,10,1).translate(0,4.7+i*1.65,0));
 const nearCrown=mergeGeometries(crownParts)!;crownParts.forEach(g=>g.dispose());
 const farCrown=new T.ConeGeometry(2.7,7.5,5).translate(0,6,0);
 const broadCrown=new T.SphereGeometry(3.2,12,8).translate(0,5.8,0),acaciaCrown=new T.SphereGeometry(4,12,7).scale(1,.22,1).translate(0,5.4,0);
 const trunk=new T.CylinderGeometry(.18,.32,5,8).translate(0,2.5,0);
 const shrubGeo=new T.IcosahedronGeometry(1,1);
 const bark=new T.MeshStandardMaterial({color:'#675440',roughness:.92});
 const leaves=new T.MeshStandardMaterial({color:'#789368',roughness:.9});
 const distantLeaves=new T.MeshStandardMaterial({color:'#789368',roughness:.95});
 const shrubMat=new T.MeshStandardMaterial({color:'#577548',roughness:.95});
 const focus={value:new T.Vector3()};scene.userData.forestFocus=focus;const direction={value:new T.Vector2(1,1).normalize()};scene.userData.forestDirection=direction;
 const wind={value:0};scene.userData.wind=wind;
 leaves.onBeforeCompile=shader=>{
  shader.uniforms.forestTime=wind;shader.uniforms.forestFocus=focus;shader.uniforms.forestDirection=direction;
  shader.vertexShader='uniform float forestTime; varying vec3 leafWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    #ifdef USE_INSTANCING
      float bend = max(0.0, position.y - 3.0) * 0.018;
      transformed.x += sin(forestTime * 0.9 + instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.09) * bend;
    #endif
    leafWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;`);
  // Full foliage remains visible: the camera enters beneath the canopy.

 };
 const dummy=new T.Object3D(),color=new T.Color();
 for(const [key,cell] of cells){
  const [gx,gz]=key.split(',').map(Number),cx=gx*64+32,cz=gz*64+32;
  const lod=new T.LOD();lod.autoUpdate=false;forestLods.push(lod);lod.position.set(cx,0,cz);lod.userData.dynamic=true;
  const detailed=new T.Group(),distant=new T.Group();
  const biome=biomeAt(cell[0].x,cell[0].z),crownGeo=biome.id==='tropical'?broadCrown:biome.id==='savanna'?acaciaCrown:nearCrown;
  const trunks=new T.InstancedMesh(trunk,bark,cell.length),crowns=new T.InstancedMesh(crownGeo,leaves,cell.length),far=new T.InstancedMesh(biome.id==='taiga'?farCrown:crownGeo,distantLeaves,cell.length),shrubs=new T.InstancedMesh(shrubGeo,shrubMat,cell.length);
  cell.forEach((tree,i)=>{
   dummy.position.set(tree.x-cx,terrainHeight(tree.x,tree.z),tree.z-cz);dummy.scale.setScalar(tree.s);dummy.rotation.y=tree.x*.1;dummy.updateMatrix();
   for(const mesh of [trunks,crowns,far])mesh.setMatrixAt(i,dummy.matrix);
   color.setHSL(tree.hue,.24,tree.lightness+.12);crowns.setColorAt(i,color);far.setColorAt(i,color);
   dummy.position.y+=.7*tree.s;dummy.scale.set(1.3*tree.s,.8*tree.s,1.3*tree.s);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);
  });
  for(const mesh of [trunks,crowns,far,shrubs]){mesh.computeBoundingSphere();mesh.receiveShadow=true}
  trunks.castShadow=crowns.castShadow=true;
  detailed.add(trunks,crowns,shrubs);distant.add(far);
  lod.addLevel(detailed,0);lod.addLevel(distant,125,.15);lod.addLevel(new T.Group(),520,.15);scene.add(lod);
 }
}
