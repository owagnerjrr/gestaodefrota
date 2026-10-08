import {getFirebaseAdmin,requireAdmin,send,overlaps} from './_firebase.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const {auth,db,fieldValue}=getFirebaseAdmin();
    const user=await requireAdmin(req,auth);
    if(req.method==='GET'){
      const snap=await db.collection('fleetRequests').orderBy('createdAt','desc').limit(150).get();
      return send(res,200,{requests:snap.docs.map(d=>({id:d.id,...d.data(),createdAt:null}))});
    }
    if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
    const {id,action}=req.body||{};
    if(typeof id!=='string'||!/^[\w-]{8,128}$/.test(id)||!['approve','reject'].includes(action))return send(res,400,{error:'Operação inválida.'});
    const ref=db.collection('fleetRequests').doc(id);
    await db.runTransaction(async tx=>{
      const request=await tx.get(ref);
      if(!request.exists||request.data().status!=='pending')throw Error('Solicitação inexistente ou já analisada.');
      const r=request.data();
      if(action==='approve'){
        const query=db.collection('fleetBookings').where('vehicle','==',r.vehicle).where('startAt','<',r.endAt);
        const bookings=await tx.get(query);
        if(bookings.docs.some(d=>d.data().status==='approved'&&overlaps(d.data(),r)))throw Error('Conflito com reserva já aprovada.');
        tx.set(db.collection('fleetBookings').doc(id),{...r,status:'approved',approvedBy:user.uid,approvedAt:fieldValue.serverTimestamp()});
      }
      tx.update(ref,{status:action==='approve'?'approved':'rejected',reviewedBy:user.uid,reviewedAt:fieldValue.serverTimestamp()});
      if(action==='approve')tx.set(db.collection('publicAvailability').doc(id),{vehicle:r.vehicle,startAt:r.startAt,endAt:r.endAt,status:'approved'});
      else tx.delete(db.collection('publicAvailability').doc(id));
    });
    return send(res,200,{ok:true});
  }catch(err){return send(res,/login|permissão|token|auth/i.test(err.message)?403:400,{error:err.message||'Operação não concluída.'})}
}
