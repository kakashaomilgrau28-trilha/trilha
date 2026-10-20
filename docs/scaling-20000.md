# Trilha: caminho para 20 mil jogadores simultâneos

A versão desta entrega é um piloto funcional, com servidores escolhíveis. Ela **não foi testada nem provisionada para 20 mil simultâneos**. Não contratei planos pagos ou infraestrutura em seu nome.

## Como dividir as pessoas

Planejamento inicial: 400 salas de 50 pessoas comportam matematicamente 20 mil jogadores. Para margem de entrada e salas cheias, planejar 450–500 salas, abertas conforme a demanda. Esses números são proposta de dimensionamento; a quantidade de máquinas depende de testes com o cenário e o tráfego reais.

Manter os servidores escolhíveis, com busca, código, lotação e convites. Amigos escolhem o mesmo servidor. A identidade e as compras acompanham a conta; a conversa e a movimentação ficam na sala. Ao lotar, sugerir outra sala e oferecer fila com reserva temporária de vaga.

## Arquitetura recomendada

| Parte | Papel |
|---|---|
| Vercel/CDN | Entregar interface, modelos, sons e texturas com cache e arquivos compactados. |
| Servidores de jogo persistentes | WebSocket, simulação autoritativa, posição, colisões, proximidade, lotação, entrada e saída. |
| Colyseus + Redis compartilhado | Distribuir salas entre processos/máquinas e coordenar reservas. Validar o token do jogador na entrada. |
| Supabase/Postgres | Contas, perfis, inventário, direitos VIP, pagamentos e auditoria. |
| Filas e trabalhadores | Webhooks, entregas de compras, moderação, tarefas e consolidação de dados. |
| Observabilidade | Conexões, latência, desconexões, tempo de quadro, mensagens por segundo, erros e custos. |

Colyseus distribui salas entre processos e usa presença/driver compartilhados para escalar. Cada sala pertence a um processo; aumentar processos permite mais salas, mas o número de jogadores suportado precisa ser medido no seu jogo. [Documentação oficial](https://docs.colyseus.io/scalability).

Não gravar cada passo no banco. O servidor de jogo mantém o estado ativo em memória; envia mudanças compactas apenas a quem precisa recebê-las. Salvar no banco somente eventos persistentes e checkpoints. Não confiar em posições declaradas pelo navegador para prêmios, inventário, compras ou acesso VIP.

## Limites da instalação atual

Há oito salas públicas configuradas com regra de 50 vagas e salas VIP separadas, inicialmente sem vendas. A regra de vagas não significa que o plano atual sustente toda essa lotação.

O Supabase publica limites distintos para conexões, tráfego, presença e entrada em canais. Na consulta de 19/10/2026, o Free informa 200 conexões e 100 mensagens por segundo. Esses limites são do projeto, não de cada sala. A tabela também informa 10 mil conexões em planos superiores e aumento mediante suporte; 20 mil requer negociação ou outra infraestrutura. [Limites oficiais](https://supabase.com/docs/guides/realtime/limits).

O piloto usa presença privada para entrada/saída e Broadcast para mudanças visuais. Ele não representa a arquitetura final de jogo para 20 mil pessoas. As atualizações de posição não escrevem no Postgres, mas ainda geram tráfego multiplicado pelo número de destinatários. Como exemplo teórico, 50 jogadores enviando duas mudanças por segundo a outros 49 podem produzir cerca de 4.900 entregas por segundo em uma única sala, antes de outros eventos. É uma conta de tráfego, não um benchmark medido.

## Ordem de crescimento

1. Validar o produto com grupos pequenos e medir dispositivos reais, principalmente celulares de entrada.
2. Separar a simulação de jogo em servidores persistentes; validar identidade, velocidade, colisões e direitos no servidor.
3. Implementar Redis, distribuição das salas, filas de entrada, reconexão e desligamento gradual sem derrubar todas as salas.
4. Compactar modelos e texturas, reduzir desenhos por quadro, usar instâncias, níveis de detalhe e limitar avatares de alta definição aos próximos.
5. Testar cargas de 100, 500, 2 mil, 5 mil, 10 mil e 20 mil conexões, incluindo entrada em massa, reconexão, chat, pagamentos e falha de uma máquina.
6. Só anunciar capacidade após o teste completo, com margem para picos e orçamento aprovado.

Metas propostas para o teste: latência p95 menor que 150 ms para interação regional, pelo menos 30 quadros/s no celular de referência, entrada sem ultrapassar a lotação, e nenhuma perda/duplicação de compra sob repetição de webhook. São critérios a validar, não resultados desta entrega.

## VIP e recebimentos — adiado a seu pedido

Preço definido: **R$ 14,90, pagamento único, sem renovação automática**. As vendas ficam desativadas. Para retomar: ativar conta brasileira de recebimento, oferecer conta de jogador recuperável, criar o produto/preço, implementar checkout no servidor, verificar a assinatura dos webhooks, tratar reenvios de forma idempotente e revogar o direito em reembolso/contestação conforme a regra comercial definida. O retorno visual de “pagamento concluído” nunca pode liberar VIP sozinho.

O provedor deve receber os dados financeiros em seu próprio checkout; o Trilha armazena referências e status. A ativação da conta e os dados bancários devem ser preenchidos por você no provedor. [Checkout e entrega confirmada por webhook](https://docs.stripe.com/checkout/fulfillment).
