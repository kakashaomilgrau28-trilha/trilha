# Trilha · demonstração do jogo

Um MVP de espaço virtual para Desbravadores, com catálogo conectado ao Supabase e publicação na Vercel. O projeto é uma demonstração independente, não oficial e sem aprovação atribuída à organização do VI Campori Sul-Americano. A stack é React, TypeScript e Vite. Perfil, progresso, chat e compras simuladas ficam neste navegador; esta versão ainda não oferece multiplayer.

## Executar localmente

Repositório: [kakashaomilgrau28-trilha/trilha](https://github.com/kakashaomilgrau28-trilha/trilha).

Site de demonstração: [Abrir Trilha](https://trilha-campori.vercel.app).

Requer Node.js 22.13 ou superior e pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
# Copie .env.example para .env.local e preencha a URL e a chave publishable do Supabase.
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
- Catálogo de edições, clubes, recompensas e cosméticos carregado do Supabase, com atualização e tratamento de falhas.

## Dados fictícios e configuração

Os dados de demonstração estão em `src/gameData.ts`: mapa e posições virtuais, jogadores, clubes, recompensas, itens cosméticos e preços. Não use as posições atuais em produção. Não há coordenadas reais, locais oficiais, horários ou regras do evento neste repositório. Os nomes, mapas e pontuações precisam ser substituídos e confirmados pela organização antes de qualquer associação ao evento.

`src/model.ts` contém os tipos do domínio; `src/gameLogic.ts` contém regras demonstrativas de alcance, pontuação e prevenção de dados de contato; `src/demoStore.ts` contém persistência local e o contrato inicial `GameRepository`. `src/catalog.tsx` carrega o catálogo do Supabase com consultas paralelas e timeout. Sem variáveis, o servidor de desenvolvimento usa os dados locais; em produção, a conexão com o catálogo é obrigatória.

## Supabase

O projeto separado `trilha-campori` (`yphomgvxamhhetlxxkza`) fica em `sa-east-1`. `supabase/schema.sql` registra o esquema inicial aplicado ao banco; `supabase/catalog-access.sql` contém as políticas de leitura do catálogo e `supabase/seed.sql` registra os dados fictícios inseridos para esta demonstração. Esses scripts são fontes do provisionamento já realizado, não comandos para executar novamente em um banco existente.

Todas as tabelas têm RLS. `anon` e `authenticated` podem apenas ler edições, clubes, recompensas ativas e cosméticos ativos. Perfis, resgates, mensagens e cosméticos dos jogadores não têm permissões públicas. A chave publishable usada em `VITE_SUPABASE_PUBLISHABLE_KEY` é pública por definição; nunca coloque chaves `service_role` ou `sb_secret_` em variáveis Vite.

Para verificar o acesso real ao catálogo e o bloqueio das tabelas privadas, use `node --env-file=.env.local scripts/check-supabase.mjs`. Antes de implementar multiplayer, substitua `demoRepository` por operações autenticadas no servidor, com resgates transacionais e pontos calculados no backend. O estado local não é confiável para competição.

## Vercel

O projeto Vercel `trilha-campori` usa Node.js 24, Vite e as duas variáveis públicas do Supabase. `vercel.json` fixa os comandos de instalação e build. `.vercel/` e `.env.local` são ignorados pelo Git. A publicação inicial usa envio direto dos fontes. A atualização automática por push requer adicionar a conexão de login do GitHub `kakashaomilgrau28-trilha` na conta Vercel e então vincular o repositório `kakashaomilgrau28-trilha/trilha`.

## Localização e QR

O MVP não solicita permissão de GPS nem acompanha a localização em segundo plano. Todo movimento é virtual, feito ao clicar no mapa. A alternativa QR só simula uma validação local; o desenho/código apresentado não é um QR escaneável e não deve ser usado no evento. Uma versão real precisará de códigos assinados, expiração e uso único conferidos no servidor. Armazene presença aproximada pelo menor tempo necessário e nunca publique coordenadas precisas em perfil ou placar.

## Segurança, menores e moderação

Esta demonstração não implementa autenticação, consentimento parental, moderação efetiva, armazenamento seguro de denúncias ou políticas públicas. Os filtros de contato e limites de chat executados no navegador são apenas barreiras de demonstração e podem ser contornados. Antes de disponibilizar a menores, revise autenticação, consentimento, retenção e exclusão de dados, moderação, resposta a denúncias, privacidade e requisitos legais nos países participantes com profissionais responsáveis. Este README não afirma conformidade legal.

## Monetização

A vitrine apresenta produtos, conteúdo e preço em `src/gameData.ts`; clicar em “Experimentar” registra uma compra simulada no armazenamento local. Não há checkout, pagamento real, moeda premium, sorteio, anúncio ou coleta de dados de cartão. Para compras reais, ainda seriam necessários autorização do responsável para participantes menores, checkout seguro, preços/condições apropriados a cada país e revisão legal. Produtos pagos devem permanecer puramente visuais.


## Mundo 3D e cenário de Lapa

Personagens humanos articulados, câmera de acompanhamento, WASD/setas, corrida com Shift e analógico flutuante por Pointer Events no celular. Clique no cenário para ativar o teclado. E abre a recompensa a até 5 m virtuais. Movimento pausa em modais, ao perder foco e ao ocultar a aba. O mundo inicial tem 240 m e colisões no cenário artístico. Os demais personagens são NPCs, sem multiplayer.

O cenário artístico é provisório, com ruas fictícias; não é um levantamento da Lapa. A integração oficial Google Maps usa WebGLOverlayView com personagens Three.js ancorados em Lapa–PR (-25.769722, -49.715833). Não baixa tiles nem cria edifícios a partir de imagens do Google. O modo Google não tem colisões com edifícios reais, e ainda precisa ser validado com uma chave habilitada.

Para ativar: habilite Maps JavaScript API e faturamento no Google Cloud; crie uma chave restrita ao website https://trilha-campori.vercel.app/* e à API; salve VITE_GOOGLE_MAPS_API_KEY em Production na Vercel e faça novo deploy. Opcional: VITE_GOOGLE_MAPS_MAP_ID para um mapa vetorial personalizado. Não é necessário GPS. A chave do navegador é pública por natureza e deve ter restrições de uso. O Google cobra por uso; configure limites/alertas na sua conta.

Clubes: seleção inicial de CARATUVA e Escudeiros do Rei (Curitiba) e Shekinah (Campina Grande do Sul), conferidos no diretório DSA em 19/10/2026. URLs por clube em src/realClubs.ts; SQL reproduzível em supabase/real-clubs.sql. Não é o catálogo nacional completo; nenhum clube sediado em Lapa foi confirmado. Não importamos pessoas, contatos nem suposta participação no jogo. Afiliações antigas fictícias são limpas no navegador.

Verificação: node scripts/check-world.mjs verifica velocidade diagonal, independência de FPS, colisão, limites e conversão geográfica; pnpm build verifica TypeScript e bundle. Google Maps só pode ser validado de ponta a ponta após configurar a chave.
