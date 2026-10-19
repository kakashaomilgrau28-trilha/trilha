# Trilha · demonstração do jogo

Um MVP local de espaço virtual compartilhado para Desbravadores. O projeto é uma demonstração independente, não oficial e sem aprovação atribuída à organização do VI Campori Sul-Americano. A stack é React, TypeScript e Vite: oferece interface tipada e responsiva, com execução simples no navegador e sem conta ou credenciais de serviço.

## Executar localmente

Repositório: [kakashaomilgrau28-trilha/trilha](https://github.com/kakashaomilgrau28-trilha/trilha).

Requer Node.js 22.13 ou superior e pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abra o endereço local que o Vite informar (normalmente `http://localhost:5173`). Para gerar a versão estática, use `pnpm build`; os arquivos são gravados em `dist/`.

## O que já funciona

- Apelido, avatar e clube demonstrativo persistidos no navegador.
- Navegação entre Prévia, Alpha e Ômega; os resgates e pontos de cada edição ficam separados.
- Mapa vetorial fictício. Toque ou clique no mapa para mover seu avatar virtual; selecione uma recompensa para ver disponibilidade, alcance, limite e confirmar o resgate.
- Um fluxo QR de demonstração como alternativa, sem câmera nem códigos reais.
- Coleção pessoal e placares demonstrativos por jogador ou clube.
- Vitrine de cosméticos configuráveis com preços visíveis e compra simulada. Nenhum pagamento ou dado de cartão é solicitado; cosméticos não afetam pontos ou resgates.
- Chat público demonstrativo, com apelidos, bloqueio/silenciamento/denúncia locais, limite de 160 caracteres, intervalo de 8 segundos e bloqueio simples de telefones e e-mails.
- Estado de conexão alternável para mostrar a interface de sinal instável.

## Dados fictícios e configuração

Os dados de demonstração estão em `src/gameData.ts`: mapa e posições virtuais, jogadores, clubes, recompensas, itens cosméticos e preços. Não use as posições atuais em produção. Não há coordenadas reais, locais oficiais, horários ou regras do evento neste repositório. Os nomes, mapas e pontuações precisam ser substituídos e confirmados pela organização antes de qualquer associação ao evento.

`src/model.ts` contém os tipos do domínio; `src/gameLogic.ts` contém regras demonstrativas de alcance, pontuação e prevenção de dados de contato; `src/demoStore.ts` contém persistência local e o contrato inicial `GameRepository`. O arquivo `.env.example` não contém segredos e nenhuma variável é necessária para a demonstração.

## Backend compartilhado em preparação

A aplicação ainda não tem autenticação, banco de dados conectado, presença em tempo real nem servidor. `demoRepository` é apenas um adaptador local; o estado do navegador pode ser alterado pelo jogador e **não é confiável**. O projeto Supabase separado `trilha-campori` foi criado em `sa-east-1`. O esquema inicial está em `supabase/schema.sql` e já foi aplicado ao banco. Ele define clubes, edições, perfis, recompensas, resgates, chat e cosméticos, sem inserir os dados fictícios da demonstração.

Todas as tabelas estão com RLS ligado e sem permissões para `anon` ou `authenticated` enquanto não houver autenticação e regras de acesso definidas. O frontend continua independente do Supabase. Antes de uma versão compartilhada, implemente `GameRepository` contra um backend que confira identidade e edição, valide alcance/QR e limite de resgates, registre resgates de forma idempotente e calcule pontos no servidor. O cliente nunca deve enviar pontos como autoridade. Credenciais privilegiadas devem ficar apenas no servidor.

O projeto de banco está separado do projeto `CAMP 2027`. O código está no repositório `kakashaomilgrau28-trilha/trilha`. Ainda falta conectar a aplicação ao Supabase e configurar integração contínua ou publicação na Vercel.

## Localização e QR

O MVP não solicita permissão de GPS nem acompanha a localização em segundo plano. Todo movimento é virtual, feito ao clicar no mapa. A alternativa QR só simula uma validação local; o desenho/código apresentado não é um QR escaneável e não deve ser usado no evento. Uma versão real precisará de códigos assinados, expiração e uso único conferidos no servidor. Armazene presença aproximada pelo menor tempo necessário e nunca publique coordenadas precisas em perfil ou placar.

## Segurança, menores e moderação

Esta demonstração não implementa autenticação, consentimento parental, moderação efetiva, armazenamento seguro de denúncias ou políticas públicas. Os filtros de contato e limites de chat executados no navegador são apenas barreiras de demonstração e podem ser contornados. Antes de disponibilizar a menores, revise autenticação, consentimento, retenção e exclusão de dados, moderação, resposta a denúncias, privacidade e requisitos legais nos países participantes com profissionais responsáveis. Este README não afirma conformidade legal.

## Monetização

A vitrine apresenta produtos, conteúdo e preço em `src/gameData.ts`; clicar em “Experimentar” registra uma compra simulada no armazenamento local. Não há checkout, pagamento real, moeda premium, sorteio, anúncio ou coleta de dados de cartão. Para compras reais, ainda seriam necessários autorização do responsável para participantes menores, checkout seguro, preços/condições apropriados a cada país e revisão legal. Produtos pagos devem permanecer puramente visuais.
