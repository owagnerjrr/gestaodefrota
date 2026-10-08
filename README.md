# Gestão de Frota — Senac Três Corações

Projeto inicial React/Vite com Index público e Admin. Dois veículos: Toyota Yaris e Volkswagen Polo. Combustível permitido: **álcool**.

## Executar
```bash
npm install
npm run dev
```
Copie `.env.example` para `.env` e configure Firebase para habilitar leitura em tempo real.

## Estado
A interface pode ser visualizada em modo de demonstração sem Firebase. **Nenhum pedido é salvo no modo de demonstração.** A implantação em produção requer regras Firestore, autenticação das duas responsáveis e endpoint seguro de solicitações, validação de conflitos e e-mails. Não conceda escrita pública direta no Firestore. Não inclua segredos no frontend. As imagens dos veículos são representações por emoji até recebermos fotos autorizadas.


## Backend de solicitações (Vercel)

O frontend envia POST para `/api/request`; o Admin usa `/api/admin` com o token Firebase Authentication. As regras Firestore continuam bloqueando gravações diretamente do navegador.

Variáveis de ambiente necessárias na Vercel (Production):

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo da conta de serviço do projeto Firebase, em uma única variável secreta. **Nunca** adicionar ao GitHub ou enviar pelo chat.
- `FLEET_ADMIN_UIDS`: lista de UIDs dos responsáveis, separados por vírgula. O UID precisa coincidir também com os autorizados em `firestore.rules`.
- `FLEET_PUBLIC_REQUESTS_ENABLED`: manter ausente ou `false` até ativar proteção contra abuso (App Check/CAPTCHA e limitação de taxa), depois usar `true`.

Após salvar variáveis, fazer novo deploy. A API não envia e-mails ainda. Solicitações públicas não devem ser habilitadas antes das proteções anti-spam. Datas são interpretadas no fuso de Brasília (UTC-03); revisar o comportamento caso haja mudança de fuso. Testar aprovação e conflito antes de produção.
Atualização de implantação — outubro de 2026
