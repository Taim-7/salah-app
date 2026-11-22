(function(root){
  'use strict';
  // Natural Earth public-domain country outlines, simplified at 1:110m.
  // This is a broad country filter, not a legal border or surveying tool.
  const shapes = {"GB":{"type":"MultiPolygon","coordinates":[[[[-6.19788,53.86757],[-6.95373,54.0737],[-7.57217,54.05996],[-7.36603,54.59584],[-7.57217,55.13162],[-6.73385,55.17286],[-5.66195,54.5546],[-6.19788,53.86757]]],[[[-3.09383,53.40455],[-3.09208,53.40444],[-2.94501,53.985],[-3.6147,54.60094],[-3.63001,54.61501],[-4.84417,54.79097],[-5.08253,55.0616],[-4.71911,55.50847],[-5.04798,55.78399],[-5.5864,55.31115],[-5.645,56.27501],[-6.14998,56.78501],[-5.78682,57.81885],[-5.01,58.63001],[-4.21149,58.55085],[-3.005,58.635],[-4.07383,57.55302],[-3.055,57.69002],[-1.95928,57.6848],[-2.21999,56.87002],[-3.119,55.97379],[-2.08501,55.91],[-2.00568,55.8049],[-1.11499,54.62499],[-0.43048,54.46438],[0.18498,53.32501],[0.46998,52.93],[1.68153,52.73952],[1.55999,52.1],[1.05056,51.80676],[1.44987,51.28943],[0.55033,50.76574],[-0.78752,50.77499],[-2.49,50.50002],[-2.95627,50.69688],[-3.61745,50.22836],[-4.54251,50.34184],[-5.24502,49.96],[-5.77657,50.15968],[-4.30999,51.21],[-3.41485,51.42601],[-3.42272,51.42685],[-4.98437,51.59347],[-5.2673,51.9914],[-4.22235,52.30136],[-4.77001,52.84],[-4.58,53.495],[-3.09383,53.40455]]]]},"IE":{"type":"Polygon","coordinates":[[[-6.19788,53.86757],[-6.03299,53.15316],[-6.78886,52.26012],[-8.56162,51.6693],[-9.97709,51.82045],[-9.16628,52.86463],[-9.68852,53.88136],[-8.32799,54.66452],[-7.57217,55.13162],[-7.36603,54.59584],[-7.57217,54.05996],[-6.95373,54.0737],[-6.19788,53.86757]]]}};
  function inRing(x, y, ring) {
    let inside = false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[i],b=ring[j];
      if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
    }
    return inside;
  }
  function inPolygon(x,y,poly) {
    if (!poly.length || !inRing(x,y,poly[0])) return false;
    return !poly.slice(1).some(hole=>inRing(x,y,hole));
  }
  function insideGeometry(x,y,shape) {
    const polys=shape.type==='MultiPolygon'?shape.coordinates:[shape.coordinates];
    return polys.some(poly=>inPolygon(x,y,poly));
  }
  // Coastlines on a small-scale map can be a little inaccurate; allow 2 km
  // outside the drawn shore to avoid rejecting genuine coastal GPS locations.
  function shoreDistanceKm(x,y,shape) {
    const polys=shape.type==='MultiPolygon'?shape.coordinates:[shape.coordinates];
    const cos=Math.cos(y*Math.PI/180), sx=111.195*cos, sy=111.195;
    let best=Infinity;
    for(const poly of polys) for(const ring of poly) for(let j=1;j<ring.length;j++) {
      const a=ring[j-1],b=ring[j],ax=(a[0]-x)*sx,ay=(a[1]-y)*sy,bx=(b[0]-x)*sx,by=(b[1]-y)*sy;
      const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
      const t=den?Math.min(1,Math.max(0,-(ax*dx+ay*dy)/den)):0;
      best=Math.min(best,Math.hypot(ax+t*dx,ay+t*dy));
    }
    return best;
  }
  function country(lat,lng) {
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<49.4||lat>59.5||lng<-11.5||lng>2.3) return null;
    for(const [code,geom] of Object.entries(shapes)) if(insideGeometry(lng,lat,geom)) return code;
    // Generalised 110m boundaries cannot be relied on near the coast.
    let nearest=null,distance=Infinity;
    for(const [code,geom] of Object.entries(shapes)) {
      const d=shoreDistanceKm(lng,lat,geom);
      if(d<distance){distance=d;nearest=code;}
    }
    return distance<=2?nearest:null;
  }
  root.SalahRegion={country,allowed:(lat,lng)=>country(lat,lng)!==null,zone:(lat,lng)=>country(lat,lng)==='IE'?'Europe/Dublin':'Europe/London'};
  if(typeof module!=='undefined'&&module.exports) module.exports=root.SalahRegion;
})(typeof window!=='undefined'?window:globalThis);
