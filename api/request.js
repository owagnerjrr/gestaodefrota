import {getFirebaseAdmin,send,validate} from './_firebase.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
  try{
    if(process.env.FLEET_PUBLIC_REQUESTS_ENABLED!=='true')return send(res,503,{error:'Recebimento de solicitações ainda não habilitado pelo administrador.'});
    const {db,fieldValue}=getFirebaseAdmin();
    const input=validate(req.body);
    const doc=await db.collection('fleetRequests').add({...input,createdAt:fieldValue.serverTimestamp()});
    // Availability contains no names, destination or personal details.
    await db.collection('publicAvailability').doc(doc.id).set({vehicle:input.vehicle,startAt:input.startAt,endAt:input.endAt,status:'pending'});
    return send(res,201,{id:doc.id,status:'pending'});
  }catch(err){return send(res,400,{error:err.message||'Não foi possível enviar.'})}
}
