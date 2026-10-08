import {getFirebaseAdmin,send,validate,overlaps} from './_firebase.js';
const CONFLICT='Horário já agendado, por favor escolher outro horário.';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
  try{
    if(process.env.FLEET_PUBLIC_REQUESTS_ENABLED!=='true')return send(res,503,{error:'Recebimento de solicitações ainda não habilitado pelo administrador.'});
    const {db,fieldValue}=getFirebaseAdmin();
    const input=validate(req.body);
    const doc=db.collection('fleetRequests').doc();
    const availability=db.collection('publicAvailability').doc(doc.id);
    const lock=db.collection('fleetReservationLocks').doc(input.vehicle);
    await db.runTransaction(async tx=>{
      const lockSnap=await tx.get(lock);
      const existing=await tx.get(db.collection('publicAvailability'));
      if(existing.docs.some(d=>{
        const b=d.data();
        return b.vehicle===input.vehicle&&['pending','approved','maintenance'].includes(b.status)&&overlaps(b,input);
      }))throw Error(CONFLICT);
      tx.set(lock,{version:(lockSnap.exists?(lockSnap.data().version||0):0)+1,updatedAt:fieldValue.serverTimestamp()});
      tx.set(doc,{...input,createdAt:fieldValue.serverTimestamp()});
      tx.set(availability,{vehicle:input.vehicle,startAt:input.startAt,endAt:input.endAt,status:'pending'});
    });
    return send(res,201,{id:doc.id,status:'pending'});
  }catch(err){
    return send(res,err.message===CONFLICT?409:400,{error:err.message||'Não foi possível enviar.'});
  }
}
