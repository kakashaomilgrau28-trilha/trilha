# Operação do lobby Trilha

O banco usado é `yphomgvxamhhetlxxkza` (Trilha), em São Paulo. A interface consulta oito servidores públicos e reserva a entrada no banco, com bloqueio por servidor para evitar ultrapassar a lotação por entradas concorrentes. O limite configurado é 50 por sala; isso é uma regra de admissão, não uma medição de desempenho.

As migrações são, na ordem: lobby.sql, lobby-hardening.sql, lobby-movement.sql e lobby-vip.sql. Já foram aplicadas no projeto Trilha. Não reaplicar os arquivos manualmente em produção.

Visitantes usam Supabase Auth anônimo, com sessão persistida no navegador. Apagar os dados do navegador perde essa identidade. Antes de vender VIP, obrigar conversão para uma conta recuperável e testar recuperação em outro dispositivo.

Presença é publicada uma vez por conexão. Movimento, gesto e equipamento usam Broadcast privado, no máximo duas atualizações por segundo e somente quando o estado muda. Perfil/apelido/clube vêm da lista de membros do servidor. A movimentação é visual e declarada pelo cliente; uma evolução com prêmios ou economia deve usar um servidor de jogo autoritativo.

Mensagens passam por RPC com usuário verificado, conteúdo de até 160 caracteres, bloqueio de contatos/links e intervalo de oito segundos. O histórico visível fica restrito ao servidor do usuário. O cliente lê 60 mensagens por entrada. Para evento público, configurar retenção, fila de moderação e resposta às denúncias.

VIP possui salas privadas `vip-<servidor>` com verificação do direito no banco antes de admitir um membro. Alterar o cliente não concede entrada na sala VIP. `lobby_entitlements` não possui permissão de escrita pelo navegador. O cenário decorativo não é um segredo; os direitos e os dados de sala são protegidos no servidor. A venda está desativada por solicitação do proprietário.

Lapa está preservada em src/world/OpenWorld.tsx, scene.ts e data/lapa-center-osm.json, carregada separadamente. `lobby_worlds.lapa.enabled` inicia falso. Seu conteúdo visual não é confidencial (o repositório já era público), mas o aplicativo só oferece o acesso após autorização. O administrador pode inspecionar e liberar/recolher a abertura pelo painel.

O acesso administrativo usa o e-mail verificado da conta proprietária do Trilha configurado em `trilha_private.admin_owner`. Entrar com qualquer outro e-mail não concede papel de administrador. O primeiro login confirmado do proprietário registra seu usuário em lobby_admins. A configuração do template de e-mail deve conter código OTP ou um link com retorno permitido ao domínio do Trilha. Esse fluxo administrativo por e-mail ainda precisa ser concluído pelo proprietário, pois não temos acesso à sua caixa de entrada.

Diagnóstico: `npm run build` verifica TypeScript e gera o site. `node scripts/check-lobby.mjs` testa duas sessões no backend; cria identidades anônimas de QA e limpa a participação em salas. Os testes não medem carga. A auditoria do Supabase não acusa mais funções elevadas na API pública; os alertas de acesso anônimo às tabelas sociais são intencionais e sujeitos a RLS. As tabelas antigas da demonstração continuam fechadas.

Configuração verificada em 20/10/2026: o Site URL do Supabase está em https://trilha-campori.vercel.app. O serviço padrão usa link de acesso. A tela orienta abrir o link e escolher o servidor após voltar; o campo de código é uma alternativa caso o e-mail contenha OTP. Não foi contratado SMTP nem realizado login na caixa de e-mail do proprietário.

