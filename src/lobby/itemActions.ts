export type WaterAction={kind:'drink'|'refill';elapsed:number;duration:number};
export type WaterState={water:number;energy:number;action:WaterAction|null};
export function startWaterAction(state:WaterState,nearWater:boolean){
 if(state.action)return 'Espere concluir a ação atual.';
 if(nearWater&&state.water<3){state.action={kind:'refill',elapsed:0,duration:1.8};return 'Reabastecendo o cantil…'}
 if(state.water<=0)return 'Cantil vazio. Reabasteça perto do lago ou do riacho.';
 if(state.energy>=99)return 'Você já está descansado. Guarde a água para a caminhada.';
 state.action={kind:'drink',elapsed:0,duration:1.5};return 'Bebendo água…';
}
/** Commit once at completion. Switching away cancels without consuming water. */
export function advanceWaterAction(state:WaterState,dt:number,item:string,enabled:boolean){
 if(!state.action)return '';
 if(item!=='cantil'){state.action=null;return 'Ação do cantil cancelada.'}
 if(!enabled)return '';
 state.action.elapsed=Math.min(state.action.duration,state.action.elapsed+dt);
 if(state.action.elapsed<state.action.duration)return '';
 const kind=state.action.kind;state.action=null;
 if(kind==='refill'){state.water=3;return 'Cantil reabastecido: 3 doses.'}
 state.water=Math.max(0,state.water-1);state.energy=Math.min(100,state.energy+45);
 return 'Você bebeu água e recuperou energia.';
}
