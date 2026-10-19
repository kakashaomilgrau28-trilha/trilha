-- Fictitious catalog for the independent Trilha demonstration; no real event data.

insert into public.editions (id, label, short_label, description, accent_color) values
('preview', 'Prévia', 'PRÉVIA', 'Explore sem sair de casa', '#4b7961'),
('alpha', 'Edição Alpha', 'ALPHA', 'Espaço demonstrativo Alpha', '#c4874c'),
('omega', 'Edição Ômega', 'ÔMEGA', 'Espaço demonstrativo Ômega', '#6c76a8')
on conflict (id) do nothing;

insert into public.clubs (id, name, color) values
('horizonte', 'Horizonte', '#c26c48'),
('ipe', 'Ipê Amarelo', '#d5a841'),
('constelacao', 'Constelação', '#647da8')
on conflict (id) do nothing;

insert into public.rewards (id, edition_id, name, description, category, rarity, points, max_claims, map_x, map_y, icon) values
('rosa-dos-ventos', 'preview', 'Rosa dos Ventos', 'Um emblema para quem segue novos caminhos.', 'Emblema', 'Incomum', 30, 1, 34, 36, '🧭'),
('folha-de-campo', 'preview', 'Folha de Campo', 'Cartão colecionável inspirado na natureza.', 'Cartão', 'Comum', 15, 1, 69, 27, '🍃'),
('constelacao-do-sul', 'alpha', 'Constelação do Sul', 'Um distintivo para guardar no seu álbum.', 'Distintivo', 'Raro', 50, 1, 64, 68, '✨'),
('trilha-de-pinheiros', 'alpha', 'Trilha de Pinheiros', 'Uma lembrança ilustrada de exploração.', 'Cartão', 'Comum', 20, 1, 31, 67, '🌲'),
('sinal-de-companheirismo', 'omega', 'Sinal de Companheirismo', 'Emblema de uma jornada feita em conjunto.', 'Emblema', 'Incomum', 35, 1, 48, 28, '🤝'),
('cume-dourado', 'omega', 'Cume Dourado', 'Cartão especial da edição Ômega.', 'Cartão', 'Raro', 55, 1, 71, 62, '⛰️')
on conflict (id) do nothing;

insert into public.cosmetics (id, name, description, price_minor, currency_code, icon, item_type) values
('lenço-azul', 'Lenço azul-marinho', 'Um toque de cor para o seu avatar.', 490, 'BRL', '🧣', 'Acessório'),
('mochila-campo', 'Mochila de campo', 'Visual alternativo com bolsos de exploração.', 790, 'BRL', '🎒', 'Acessório'),
('moldura-folhas', 'Moldura de folhas', 'Uma moldura decorativa para o perfil.', 390, 'BRL', '🌿', 'Visual'),
('emote-saudacao', 'Emote de saudação', 'Um cumprimento animado para o mapa.', 590, 'BRL', '👋', 'Visual')
on conflict (id) do nothing;
