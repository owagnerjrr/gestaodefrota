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
