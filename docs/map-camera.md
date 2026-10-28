# Mapa e câmera de proximidade

O mundo foi redistribuído em um vale com um circuito contínuo, duas serras, trilhas de ligação, rio, ponte, prado, abrigo e duas cavernas. As alamedas curvas substituem a base circular e a cruz central. Atlas, relevo, destinos, trilhas, árvores e recompensas usam as coordenadas compartilhadas de `exploration.ts`. Os 16 IDs de descobertas são mantidos, preservando a coleção local já salva.

A câmera exterior continua isométrica, com rotação Q/R e zoom. Sob abrigos, copas próximas e dentro das cavernas, aproxima a câmera e abre a lente continuamente até a perspectiva próxima do personagem, antecipando a entrada no portal/abrigo. Um braço de câmera de 3,5 m retrai diante de colisores; a saída retoma o zoom isométrico escolhido. O atlas mantém marcadores numerados de 20 px, alvos de 44 px e uma lista de destinos; o acampamento é agrupado na visão regional. Telhados, rochas e folhas permanecem renderizados. Foram removidos o recorte de paredes, a ocultação do teto e o descarte de folhagem. A visão regional continua disponível fora do modo de proximidade; binóculos continuam com sua lente própria.

## Verificação

`check-expedition.mjs` verifica os 16 IDs, limites, entrada/percurso/saída das duas cavernas com colisão real, aproximação das trilhas pelo portal, conectividade de todas as rotas ao acampamento, acesso aos destinos, detecção de coberturas e retração da câmera diante de parede. `check-items.mjs` cobre modelos e ações de equipamento. Capturas SceneLab são fixtures de desenvolvimento, sem jogadores reais, e essa rota não integra o build de produção.

Esta mudança não é um teste de carga de 20 mil usuários e não altera autenticação, pagamentos, privilégios VIP ou a liberação administrativa da Lapa. Gestos detalhados de beber, farejar e travessia continuam locais; os pares veem os itens equipados e suas poses básicas.
