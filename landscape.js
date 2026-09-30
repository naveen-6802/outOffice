export function needsLandscape(width,height,coarse,touchPoints=0){return height>=width&&(coarse||touchPoints>0)}
export async function rotateLandscape(doc,screen){
 // Fullscreen is a prerequisite for orientation locking in many mobile browsers.
 try{if(!doc.fullscreenElement&&doc.documentElement.requestFullscreen)await doc.documentElement.requestFullscreen()}catch{}
 try{if(screen?.orientation?.lock){await screen.orientation.lock('landscape');return true}}catch{}
 return false;
}
