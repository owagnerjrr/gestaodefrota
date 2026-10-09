import {getFirebaseAdmin,send} from './_firebase.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return send(res,405,{error:'Método não permitido.'});
  const id=String(req.query?.id||'');
  if(!/^[\w-]{8,128}$/.test(id))return send(res,400,{error:'Reserva inválida.'});
  try{
    const {db}=getFirebaseAdmin();
    const availability=await db.collection('publicAvailability').doc(id).get();
    if(!availability.exists||availability.data().status!=='approved')return send(res,404,{error:'Detalhes indisponíveis para esta reserva.'});
    const booking=await db.collection('fleetRequests').doc(id).get();
    if(!booking.exists||booking.data().status!=='approved')return send(res,404,{error:'Reserva indisponível.'});
    const b=booking.data();
    return send(res,200,{name:b.name||'',purpose:b.purpose||'',vehicle:b.vehicle,startAt:b.startAt,endAt:b.endAt});
  }catch(err){return send(res,500,{error:'Não foi possível consultar os detalhes da reserva.'});}
}