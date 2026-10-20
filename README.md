# Lobby Trilha — atualização

A entrada atual usa servidores escolhíveis e jogadores reais com Supabase Auth e canais privados. O clube é apenas uma identificação opcional. Há conversa por sala, gestos, equipamentos experimentais e tela cheia do mapa. O mapa da Lapa foi preservado, desativado para o público e com liberação pela administração.

O VIP está definido em R$ 14,90 por pagamento único, mas as vendas estão desativadas a pedido do proprietário. Nenhuma compra é simulada como pagamento realizado. Os equipamentos estão disponíveis para experimentar enquanto a monetização é preparada.

Para operar, leia [docs/lobby-operations.md](docs/lobby-operations.md). Para o objetivo de até 20 mil simultâneos, leia [docs/scaling-20000.md](docs/scaling-20000.md): trata-se de um plano, sem teste de carga ou provisionamento dessa capacidade.

Validação: `npm run build`; `node scripts/check-lobby.mjs`. O segundo comando usa o projeto Trilha, cria identidades anônimas de teste e retira suas participações das salas no fim. A aplicação precisa das variáveis públicas descritas em `.env.example`.

Abaixo permanece a documentação histórica da versão anterior e do catálogo.

---
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

- Apelido, personagem e clube real de Desbravadores escolhido no Paraná, persistidos no navegador como perfil demonstrativo.
- Navegação entre Prévia, Alpha e Ômega; os resgates e pontos de cada edição ficam separados.
- Representação 3D jogável de ruas, praças e edifícios mapeados no centro da Lapa; WASD no computador e analógico flutuante no celular. As fachadas e alturas sem dados são interpretações artísticas.
- Um fluxo QR de demonstração como alternativa, sem câmera nem códigos reais.
- Coleção pessoal e placar demonstrativo; a aba do clube mostra apenas seus pontos locais, sem atribuir pontuação fictícia a outros clubes reais.
- Vitrine de cosméticos configuráveis com preços visíveis e compra simulada. Nenhum pagamento ou dado de cartão é solicitado; cosméticos não afetam pontos ou resgates.
- Chat público demonstrativo, com apelidos, bloqueio/silenciamento/denúncia locais, limite de 160 caracteres, intervalo de 8 segundos e bloqueio simples de telefones e e-mails.
- Catálogo de edições, recompensas e cosméticos carregado do Supabase; nomes dos clubes vêm de um snapshot verificável do diretório DSA e também foram sincronizados com o projeto Supabase.

## Dados fictícios e configuração

`src/gameData.ts` conserva os personagens NPC e o catálogo de fallback local. O recorte do centro histórico está em `src/data/lapa-center-osm.json`; os clubes de Desbravadores do Paraná estão em `src/data/parana-clubs.json`. As recompensas, os personagens NPC, pontos e regras de resgate permanecem demonstrativos. A representação da cidade não equivale a um mapa de navegação.

`src/model.ts` contém os tipos do domínio; `src/gameLogic.ts` contém regras demonstrativas de alcance, pontuação e prevenção de dados de contato; `src/demoStore.ts` contém persistência local e o contrato inicial `GameRepository`. `src/catalog.tsx` carrega o catálogo do Supabase com consultas paralelas e timeout. Sem variáveis, o servidor de desenvolvimento usa os dados locais; em produção, a conexão com o catálogo é obrigatória.

## Supabase

O projeto separado `trilha-campori` (`yphomgvxamhhetlxxkza`) fica em `sa-east-1`. `supabase/schema.sql` registra o esquema inicial aplicado ao banco; `supabase/catalog-access.sql` contém as políticas de leitura do catálogo e `supabase/seed.sql` registra os dados fictícios inseridos para esta demonstração. Esses scripts são fontes do provisionamento já realizado, não comandos para executar novamente em um banco existente.

Todas as tabelas têm RLS. `anon` e `authenticated` podem apenas ler edições, clubes, recompensas ativas e cosméticos ativos. Perfis, resgates, mensagens e cosméticos dos jogadores não têm permissões públicas. A chave publishable usada em `VITE_SUPABASE_PUBLISHABLE_KEY` é pública por definição; nunca coloque chaves `service_role` ou `sb_secret_` em variáveis Vite.

Para verificar o acesso real ao catálogo e o bloqueio das tabelas privadas, use `node --env-file=.env.local scripts/check-supabase.mjs`. Antes de implementar multiplayer, substitua `demoRepository` por operações autenticadas no servidor, com resgates transacionais e pontos calculados no backend. O estado local não é confiável para competição.

## Vercel

O projeto Vercel `trilha-campori` usa Node.js 24, Vite e as duas variáveis públicas do Supabase. `vercel.json` fixa os comandos de instalação e build. `.vercel/` e `.env.local` são ignorados pelo Git. A branch `main` do repositório `kakashaomilgrau28-trilha/trilha` publica automaticamente em produção.

## Localização e QR

O MVP não solicita permissão de GPS nem acompanha a localização em segundo plano. Todo movimento é virtual, com WASD/setas no computador ou analógico flutuante no celular. A alternativa QR só simula uma validação local; o desenho/código apresentado não é um QR escaneável e não deve ser usado no evento. Uma versão real precisará de códigos assinados, expiração e uso único conferidos no servidor. Armazene presença aproximada pelo menor tempo necessário e nunca publique coordenadas precisas em perfil ou placar.

## Segurança, menores e moderação

Esta demonstração não implementa autenticação, consentimento parental, moderação efetiva, armazenamento seguro de denúncias ou políticas públicas. Os filtros de contato e limites de chat executados no navegador são apenas barreiras de demonstração e podem ser contornados. Antes de disponibilizar a menores, revise autenticação, consentimento, retenção e exclusão de dados, moderação, resposta a denúncias, privacidade e requisitos legais nos países participantes com profissionais responsáveis. Este README não afirma conformidade legal.

## Monetização

A vitrine apresenta produtos, conteúdo e preço em `src/gameData.ts`; clicar em “Experimentar” registra uma compra simulada no armazenamento local. Não há checkout, pagamento real, moeda premium, sorteio, anúncio ou coleta de dados de cartão. Para compras reais, ainda seriam necessários autorização do responsável para participantes menores, checkout seguro, preços/condições apropriados a cada país e revisão legal. Produtos pagos devem permanecer puramente visuais.


## Centro histórico da Lapa em 3D

A prévia começa na Praça General Carneiro (-25.7675993, -49.7164928). Um recorte de aproximadamente 600 × 600 m usa ruas, caminhos, praças e contornos de edifícios do OpenStreetMap coletados em 19/10/2026. Os dados originais reduzidos e os scripts reprodutíveis estão em src/data/lapa-center-osm.json e scripts/import-lapa-osm.mjs. Licença dos dados: ODbL 1.0, © contribuidores do OpenStreetMap (https://www.openstreetmap.org/copyright). O crédito aparece no jogo.

A Igreja Matriz de Santo Antônio tem torre lateral, frontão curvo, três janelas superiores e telhado em duas águas, conforme a descrição do [Patrimônio Cultural do Paraná](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Igreja-de-Santo-Antonio-Matriz-da-Lapa). O [Theatro São João](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Teatro-Sao-Joao-Lapa), no lado oeste da praça, tem fachada amarela com cinco vãos em arco e frontão triangular. A praça inclui caminhos, árvores e o monumento ao General Carneiro, documentado pelo [turismo da Lapa](https://www.lapaturismo.com.br/copia-hotel-vovo-nana-1). O Museu Histórico vizinho, a Casa Lacerda, a Prefeitura e o Panteon dos Heroes foram modelados com suas posições e características arquitetônicas principais; o [setor histórico](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Setor-Historico-da-Lapa) é protegido como conjunto urbano. Registros adicionais de fachadas: [galeria Viaje Paraná](https://www.viajeparana.com/Galeria-de-Imagens/Lapa) e [Panteon](https://www.lapaturismo.com.br/copia-museu-historico).

Os 23 contornos cadastrados e as vias vêm dos dados abertos. O cadastro não cobre todos os edifícios do centro: casas adicionais criam a densidade visual do casario, mas cada lote e fachada dessas casas é ilustrativo. Cores, alturas não cadastradas, vegetação, pavimentação e iluminação também são interpretações artísticas. O cenário não serve para navegação real.

Personagens humanos articulados, câmera orbital com arraste e zoom, WASD/setas, corrida com Shift e analógico flutuante por Pointer Events no celular. Clique no cenário para ativar o teclado. E abre a recompensa a até 5 m virtuais. O movimento pausa em modais, ao perder foco e ao ocultar a aba. Colisões seguem os contornos de edifícios mapeados e dos volumes ilustrativos. Os demais personagens são NPCs simulados, sem multiplayer.

## Clubes de Desbravadores do Paraná

O script scripts/import-dsa-clubs.mjs percorre o formulário público do diretório da DSA por Brasil → Paraná → cidade e importa somente as opções prefixadas “DESBRAVADORES |”. Em 19/10/2026, a seleção tinha 185 cidades e retornou 511 clubes de Desbravadores em 174 delas. O snapshot completo de nomes, IDs e cidades fica em src/data/parana-clubs.json; nenhuma informação de membros ou contatos é coletada. O perfil começa em Lapa com o clube Excelência da Criação e permite escolher outra cidade paranaense. Estes dados são um recorte temporal do diretório, não prova de filiação de quem joga. Pontos e ranking continuam locais e demonstrativos.

O Google Maps não aparece no site nem é usado como fonte para traçar ruas ou edifícios. Os termos da plataforma restringem extrair esse material para criar outra representação; o OpenStreetMap licencia o recorte usado no jogo.

Verificação: node scripts/check-world.mjs confirma velocidade diagonal, independência da taxa de quadros, colisões, limites e conversão geográfica; pnpm build verifica TypeScript e bundle. O fluxo local no navegador validou seleção de clube, caminhada por WASD, interação e resgate.

