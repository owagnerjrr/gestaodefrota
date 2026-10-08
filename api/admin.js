import {timingSafeEqual} from 'node:crypto';
import {getFirebaseAdmin,send,overlaps,validate} from './_firebase.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const expected=process.env.FLEET_ADMIN_LINK_TOKEN||'';
    const supplied=String(req.headers['x-fleet-admin-token']||'');
    if(!expected||!supplied||Buffer.byteLength(expected)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return send(res,403,{error:'Link administrativo inválido ou não configurado.'});
    const {db,fieldValue}=getFirebaseAdmin();
    const user={uid:'shared-admin-link'};
    if(req.method==='GET'){
      const snap=await db.collection('fleetRequests').orderBy('createdAt','desc').limit(150).get();
      return send(res,200,{requests:snap.docs.map(d=>({id:d.id,...d.data(),createdAt:null}))});
    }
    if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
    const {id,action}=req.body||{};
    if(typeof id!=='string'||!/^[\\w-]{8,128}$/.test(id))return send(res,400,{error:'Identificador inválido.'});
    if(action==='delete'||action==='edit'){
      const ref=db.collection('fleetRequests').doc(id);
      const availability=db.collection('publicAvailability').doc(id);
      const booking=db.collection('fleetBookings').doc(id);
      const updated=action==='edit'?validate(req.body?.booking):null;
      const conflict='Horário já agendado, por favor escolher outro horário.';
      await db.runTransaction(async tx=>{
        const current=await tx.get(ref);
        if(!current.exists||['deleted','rejected'].includes(current.data().status))throw Error('Solicitação não encontrada ou já excluída.');
        const old=current.data();
        if(old.endAt<=new Date(Date.now()-3*3600000).toISOString().slice(0,19))throw Error('Agendamento já encerrado.');
        const locks=[old.vehicle,...(updated?[updated.vehicle]:[])].filter((v,i,a)=>a.indexOf(v)===i).sort().map(v=>db.collection('fleetReservationLocks').doc(v));
        const lockSnaps=[];
        for(const lock of locks)lockSnaps.push(await tx.get(lock));
        if(updated){
          const snapshot=await tx.get(db.collection('publicAvailability'));
          if(snapshot.docs.some(d=>d.id!==id&&d.data().vehicle===updated.vehicle&&['pending','approved','maintenance'].includes(d.data().status)&&overlaps(d.data(),updated)))throw Error(conflict);
        }
        locks.forEach((lock,i)=>tx.set(lock,{version:(lockSnaps[i].exists?(lockSnaps[i].data().version||0):0)+1,updatedAt:fieldValue.serverTimestamp()}));
        if(action==='delete'){
          tx.update(ref,{status:'deleted',deletedAt:fieldValue.serverTimestamp(),deletedBy:user.uid});
          tx.delete(availability);
          tx.delete(booking);
        }else{
          tx.update(ref,{...updated,status:old.status,editedAt:fieldValue.serverTimestamp(),editedBy:user.uid});
          tx.set(availability,{vehicle:updated.vehicle,startAt:updated.startAt,endAt:updated.endAt,status:old.status});
          if(old.status==='approved')tx.set(booking,{...updated,status:'approved',approvedBy:old.approvedBy||user.uid,approvedAt:old.approvedAt||fieldValue.serverTimestamp()});
        }
      });
      return send(res,200,{ok:true});
    }
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
