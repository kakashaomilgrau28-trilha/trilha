# Referências do cenário da Lapa

O jogo usa metros em torno da Praça General Carneiro (−25.7675993, −49.7164928). As ruas, três áreas públicas e 23 contornos de edifícios são o recorte OpenStreetMap salvo em `src/data/lapa-center-osm.json` em 19/10/2026. O recorte não é um levantamento arquitetônico completo: o [Setor Histórico da Lapa](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Setor-Historico-da-Lapa) descreve centenas de imóveis em 14 quarteirões.

| Marco | Posição adotada | Referência para o modelo |
| --- | --- | --- |
| Praça General Carneiro e General Gomes Carneiro | Polígono OSM 307355210; pedestal junto ao centro | [Turismo da Lapa](https://www.lapaturismo.com.br/copia-hotel-vovo-nana-1), [registro histórico da estátua](https://www.paranahistorica.com.br/publicacoes/parana/428/praca-general-carneiro-na-lapa-ano-desconhecido) |
| Igreja Matriz de Santo Antônio | Contorno OSM 266958811; fachada no extremo oeste | [Patrimônio Cultural do Paraná](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Igreja-de-Santo-Antonio-Matriz-da-Lapa), [IPHAN](https://www.gov.br/iphan/pt-br/patrimonio-cultural/patrimonio-material/bens-tombados/livros-do-tombo/livro-do-tombo-historico) |
| Theatro São João | Nó OSM 3124636995, aproximadamente −25.76796, −49.71718 | [Patrimônio Cultural do Paraná](https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Teatro-Sao-Joao-Lapa), [registro de localização](https://mapcarta.com/N3124636995) |
| Museu Histórico da Lapa | Nó OSM 3124636999, junto ao Theatro | [MuseusBr](https://cadastro.museus.gov.br/museus/museu-historico-da-lapa/) |
| Panteon dos Heroes | Nó OSM 3124636997 | [Turismo da Lapa](https://www.lapaturismo.com.br/copia-museu-historico), [Viaje Paraná](https://www.viajeparana.com/Galeria-de-Imagens/Lapa) |
| Casa Lacerda | Contorno OSM 307355211 | [Viaje Paraná](https://www.viajeparana.com/Galeria-de-Imagens/Lapa) |
| Prefeitura Municipal | Contorno OSM 489670463 | [Turismo da Lapa](https://www.lapaturismo.com.br/prefeitura-municipal) |
| Casa Vermelha | Nó OSM 3124638611, sem contorno medido | [Turismo da Lapa](https://www.lapaturismo.com.br/copia-museu-do-mate) |
| Museu da Moda | Contorno OSM 1548877281 | [registro fotográfico](https://actividades.centraldereservas.com/d/araucaria/excursion-a-lapa-y-el-parque-estatal-do-monge-lst1GYW0) |

Os detalhes característicos modelados são fachadas brancas e telhados cerâmicos no casario, fachada amarela com cinco arcos e frontão no Theatro, frontão curvo e torre lateral na igreja, monumento central na praça e colunata branca no Panteon. Telhados, cores, alturas e dimensões sem cadastro são aproximações feitas a partir das referências. O Theatro, o Museu e o Panteon têm posições de pontos OSM, mas seus volumes 3D não correspondem a contornos medidos. Casas adicionais ao longo das ruas são casario contextual para representar a densidade do centro; não atribuir endereço, nome ou precisão cadastral a cada uma. O cenário não serve para navegação.
