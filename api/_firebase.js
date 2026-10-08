import admin from 'firebase-admin';
export function getFirebaseAdmin(){
  if(!admin.apps.length){
    const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if(!raw)throw new Error('Servidor ainda não configurado.');
    const credentials=JSON.parse(raw);
    admin.initializeApp({credential:admin.credential.cert(credentials)});
  }
  return {auth:admin.auth(),db:admin.firestore(),fieldValue:admin.firestore.FieldValue};
}
export const allowedAdmins=()=>String(process.env.FLEET_ADMIN_UIDS||'').split(',').map(s=>s.trim()).filter(Boolean);
export const send=(res,status,body)=>res.status(status).json(body);
export const validate=(input)=>{
  if(!input||!['yaris','polo'].includes(input.vehicle))throw Error('Veículo inválido.');
  const name=String(input.name||'').trim(),purpose=String(input.purpose||'').trim();
  if(name.length<3||name.length>120||purpose.length<5||purpose.length>500)throw Error('Preencha responsável e finalidade corretamente.');
  const startAt=String(input.startAt||''),endAt=String(input.endAt||'');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(startAt)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(endAt))throw Error('Formato de data inválido.');
  const start=new Date(startAt+'-03:00'),end=new Date(endAt+'-03:00');
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end-start>31*86400000||start<Date.now())throw Error('Período inválido (máximo de 31 dias).');
  return {vehicle:input.vehicle,name,purpose,startAt,endAt,status:'pending'};
};
export async function requireAdmin(req,auth){
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)throw Error('Faça login como administrador.');
  const decoded=await auth.verifyIdToken(token);
  if(!allowedAdmins().includes(decoded.uid))throw Error('Conta sem permissão administrativa.');
  return decoded;
}
export const overlaps=(a,b)=>a.startAt<b.endAt&&a.endAt>b.startAt;
