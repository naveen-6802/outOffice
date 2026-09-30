// Shared straight road coordinates for every map and both game modes.
export const ROAD_PROFILES=Object.fromEntries(['coast','forest','city','park','alpine','harbour'].map(map=>[map,{bends:[]}]));
export let roadMode='endless';
export function setRoadMode(mode){roadMode=mode==='race'?'race':'endless'}
export function roadCenter(){return 0}
export function roadSlope(){return 0}
export function roadHeading(){return 0}
export function roadPoint(s,lane,origin,map='coast',out={}){out.x=lane;out.z=origin-s;return out}
