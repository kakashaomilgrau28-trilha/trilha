# Interações dos equipamentos — 27/10/2026

Base publicada: f8336e98df65c28f37e90fd437cbe580fa4502ce.

A reclamação do usuário foi que os itens pareciam imagens coladas e a maioria estava bugada. A inspeção encontrou modelos presos à origem do avatar, sem articulação, pet girando junto ao corpo, bicicleta carregada ao descer e ações sobrescritas na troca de item.

## Comportamento corrigido
- Mapa: segurado com as duas mãos; F abre o atlas funcional.
- Lanterna: encaixada no pulso; feixe e ponto de luz pertencem ao modelo e acompanham a mão/direção.
- Cantil: F bebe, G ou o botão Reabastecer enche perto da água. Ação com duração/progresso, pose de beber, trava de repetição e conclusão única. Trocar o item ou caminhar cancela sem consumo. Pausa não conclui a ação. Não consome água quando a energia já está cheia.
- Bicicleta: modelo de quadro, rodas, raios e pedais; movimento roda as peças e sincroniza a pose das pernas. Ao descer, fica estacionada; para montar é preciso chegar a menos de 3 m. Cavernas exigem ir a pé. O estado visual remoto deixa de reportar uma bicicleta montada quando o jogador desce.
- Pet: modelo independente no mundo, quatro patas, cabeça e rabo animados; acompanha o jogador com colisão e altura do terreno. F fareja uma descoberta próxima ou brinca ao redor do jogador.
- Corda: rolo na mão; fixação no ponto de ancoragem cria um cabo 3D visível para a travessia. Troca rápida de item bloqueada durante a passagem.
- Bússola: modelo na mão e agulha orientada ao norte do mundo. F orienta a câmera ao norte.
- Binóculos: modelo junto ao peito e depois aos olhos; F alterna visão ampliada com vinheta óptica. Equipar e usar no mesmo quadro deixa de perder o comando.
- Botas: presas aos pés articulados, com sola/cadarços; efeito de aderência passivo indicado no HUD.
- Capacete: preso à cabeça, com luz própria que acompanha o personagem.
- Inspeção: botão Ver equipamento de perto aproxima a câmera e oculta etiquetas flutuantes que cobriam os modelos.

## Validação
check-items.mjs verifica os dez modelos como malhas 3D, ligações a pulso/cabeça/pés, descarte ao guardar, pet independente, bicicleta estacionada/pedais, norte da bússola, liga/desliga real das luzes e consumo/cancelamento/pausa/conclusão única do cantil. check-motion e check-expedition continuam passando. SceneLab continua exclusiva do desenvolvimento, com pontos para lago e ancoragem.

As animações detalhadas de beber, luz e farejar são locais. Outros jogadores continuam vendo os itens equipados e as poses base; esta alteração não adiciona um protocolo completo de replicação das ações. Sem alteração de economia, VIP, autenticação ou banco de dados.
