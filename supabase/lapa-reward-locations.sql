-- Locations within the 600 m game area centered on Praça General Carneiro.
-- Coordinates were chosen on OpenStreetMap roads near public landmarks.
update public.rewards as reward set map_x = location.x, map_y = location.y
from (values
  ('rosa-dos-ventos',47.37,46.55),
  ('folha-de-campo',39.55,57.48),
  ('constelacao-do-sul',42.50,66.67),
  ('trilha-de-pinheiros',54.40,73.45),
  ('sinal-de-companheirismo',13.02,37.68),
  ('cume-dourado',73.30,86.22)
) as location(id,x,y) where reward.id = location.id;
