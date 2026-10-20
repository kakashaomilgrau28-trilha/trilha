export const gearIds=['mapa','bicicleta','pet','lanterna','cantil','corda','bussola','binoculos','botas','capacete'] as const;
export function movementSpeed(item:string,running:boolean,energy:number,slope:number,inCave:boolean){
 if(item==='bicicleta'&&!inCave)return (energy>0?14:9)*Math.max(.4,1-slope*.55);
 const speed=running&&energy>0?6.5:item==='botas'?4.8:3.6;
 return speed*Math.max(item==='botas'?.72:.4,1-slope*(item==='botas'?.25:.7));
}
export function energyStep(energy:number,moving:boolean,running:boolean,bike:boolean,seconds:number){
 return Math.max(0,Math.min(100,energy+seconds*(moving?(bike?-1.2:running?-7:1.5):9)));
}
