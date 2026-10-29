/** Character-local dimensions: the cable is above the head; wrists hold a separate handle. */
export const ROPE_CABLE_HEIGHT=2.4;
export const ROPE_GRIP={height:1.65,forward:.45,halfWidth:.32};
/** Planar two-bone IK, including the wrist socket's 2 cm forward offset. */
export function ropeArmAngles(){
 const upper=.27,lower=Math.hypot(.27,.02),dy=ROPE_GRIP.height-1.39,dz=ROPE_GRIP.forward;
 const elbow=Math.acos(Math.max(-1,Math.min(1,(dy*dy+dz*dz-upper*upper-lower*lower)/(2*upper*lower))));
 const shoulder=Math.atan2(-dz,-dy)-Math.atan2(lower*Math.sin(elbow),upper+lower*Math.cos(elbow));
 return {shoulder,elbow:elbow+Math.atan2(.02,.27)};
}
