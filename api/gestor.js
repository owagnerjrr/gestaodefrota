export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('Referrer-Policy','no-referrer');
  if (req.method !== 'GET') return res.status(405).send('Método não permitido');
  const key = process.env.FLEET_ADMIN_LINK_TOKEN;
  if (!key) return res.status(503).send('Acesso administrativo não configurado.');
  // Link compartilhado: qualquer pessoa com /gestor recebe acesso administrativo.
  res.redirect(302, '/admin#key=' + encodeURIComponent(key));
}
