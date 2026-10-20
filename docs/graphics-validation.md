# Atualização visual — 20/10/2026

## Implementação

- Personagens com geometrias arredondadas, joelhos e cotovelos articulados, transições de caminhada, corrida, bicicleta e gestos, respiração e piscadas.
- Movimento com integração fixa de 120 Hz, aceleração, frenagem, salto, queda e aterrissagem. Espaço ou botão Pular; WASD e controle flutuante preservados.
- Câmera com interpolação e aproximação ao encontrar terreno, paredes e copas. Ocultação da etiqueta local quando a câmera está próxima.
- Sombras suaves, iluminação com gradação de tons, texturas procedurais leves, grama, água, brasas, cabos e detalhes nas cavernas.
- Floresta instanciada em células com LOD; terreno dividido para descarte fora da câmera; objetos estáticos agrupados por região/material; consultas locais de colisão.
- Qualidade Auto, Alta e Leve. Auto ajusta resolução e sombras conforme amostras locais. Ajuda permite mostrar o diagnóstico de renderização.
- Recursos gráficos descartados ao desmontar cenas e remover personagens. Nenhuma dependência adicional.

## Validação executada

- `pnpm build`: compilação TypeScript e empacotamento concluídos. Permanece o aviso de pacote compartilhado acima de 500 kB.
- `node scripts/check-motion.mjs`: movimento em 30/60/144 Hz, salto/aterrissagem, frenagem, pausa, paredes, limites, índice de colisões e rotação.
- `node scripts/check-world.mjs`: movimento, centro da Lapa, posição inicial livre e catálogo de 511 clubes.
- Navegador: acampamento, câmera na mata, caverna e lanterna, bicicleta com deslocamento, mapa detalhado e controles em viewport de 390 × 844.
- Cena de revisão usa personagens locais fictícios, sem gravar dados ou enviar mensagens ao multiplayer.

## Amostras comparáveis do acampamento

Mesma posição inicial e câmera, um personagem, navegador desktop, superfície renderizada de 1082 × 585, DPR 1. Versão anterior baseada no commit `060d1369`; versão nova em qualidade Alta. Janelas de aproximadamente três segundos, após o carregamento.

| Medida | Anterior | Atualizada |
| --- | ---: | ---: |
| Chamadas de desenho por quadro | 234 | 91 |
| Triângulos desenhados | 480.821 | 132.540 |
| Geometrias registradas | 583 | 66 |
| Texturas registradas | 23 | 13 |
| FPS na amostra | 56,2 | 56,0 |
| Tempo de quadro p95 | 18,4 ms | 18,4 ms |

As chamadas de desenho caíram cerca de 61% nessa vista. As amostras não demonstram aumento de FPS. Não constituem garantia de 60 FPS, ensaio prolongado de memória, teste de rede multiplayer ou medição em telefone físico. Compilação inicial, troca de cenário, posição, hardware e quantidade de jogadores afetam os resultados.

Com 24 personagens fictícios adicionais, uma amostra marcou 48,5 FPS, p95 de 35,8 ms e 321 chamadas de desenho. Após removê-los, os contadores voltaram a 91 chamadas, 66 geometrias e 13 texturas. Isso verifica a liberação nesse ciclo específico, sem provar ausência de vazamentos em sessões longas.
