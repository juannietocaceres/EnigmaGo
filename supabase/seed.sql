-- Generado por scripts/build-seed.mjs. No editar a mano: editar supabase/cases.json.
insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  'postre-desaparecido', 'El postre desaparecido', 15, 1, '¿Quién se comió la torta?', 'La torta de cumpleaños de Sofía desapareció de la nevera antes de la fiesta.',
  '["Tomás, el primo","La vecina","El papá","Rocky, el perro"]'::jsonb, '[{"t":"Hay migas de torta hasta el sofá donde Tomás jugaba videojuegos. ¿Qué indica?","o":["Alguien comió mirando la tele","La torta se cayó sola","Fue la vecina"]},{"t":"La cámara muestra a la vecina en el balcón a las 5:00. ¿A quién descartas?","o":["A la vecina","A Tomás","Al papá"]},{"t":"El papá llegó a las 6:00 con la torta ya perdida y Rocky estaba encerrado. ¿Quién queda?","o":["El papá","Rocky","Tomás"]}]'::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  'postre-desaparecido', array[0,0,2], 0, 'Las migas llevaban hasta el sofá donde Tomás jugaba. La vecina estaba en el balcón, el papá llegó cuando la torta ya no estaba y Rocky estaba encerrado.')
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;

insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  'bicicleta-fantasma', 'La bicicleta fantasma', 30, 2, '¿Quién se llevó la bicicleta?', 'La bici de montaña de Camila desapareció del parqueadero del edificio.',
  '["El portero","El vecino del 302","Mateo, el hermano","Un mensajero"]'::jsonb, '[{"t":"El candado no está cortado: está abierto. ¿Qué deduces?","o":["Usaron una cizalla","Se dañó solo","Alguien tenía la llave"]},{"t":"Solo hay dos copias de la llave: Camila y su casa. ¿Quién vive con ella?","o":["El mensajero","El portero","Mateo"]},{"t":"La cámara muestra a alguien con capucha saliendo por la puerta de atrás. ¿A quién descartas?","o":["Al portero, que nunca salió de la portería","A Camila","A Mateo"]},{"t":"Mateo debía plata y en su cuarto hay un aviso de venta de bicis usadas. ¿Conclusión?","o":["Vendió la bici para pagar","Fue el mensajero","Solo estaba curioseando"]}]'::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  'bicicleta-fantasma', array[2,2,0,0], 2, 'El candado se abrió con llave, y solo Camila y su casa tenían copia. Mateo debía plata y tenía un aviso de venta de bicis usadas.')
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;

insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  'collar-valdes', 'El collar de la señora Valdés', 45, 3, '¿Quién se llevó el collar?', 'Anoche desapareció el collar de la señora Valdés durante la cena en la casa de campo.',
  '["El jardinero","La cocinera","El mayordomo","La sobrina"]'::jsonb, '[{"t":"Hay barro fresco junto a la vitrina. ¿Qué significa?","o":["Alguien entró desde el jardín","Alguien salió de la cocina","Fue la lluvia del techo"]},{"t":"La ventana estaba cerrada, pero el pestillo tiene tierra. ¿Qué deduces?","o":["Alguien la abrió con manos sucias","Nadie la tocó","La cerró el mayordomo"]},{"t":"Una nota dice: ''Las rosas no se riegan solas''. ¿A quién apunta?","o":["Al jardinero","A la sobrina","A la cocinera"]},{"t":"En el bolsillo de un delantal verde hay una hoja de laurel y un guante roto. ¿De quién es?","o":["Del mayordomo","De la cocinera","Del jardinero"]},{"t":"El collar brilla dentro de una maceta. ¿Quién la cuida?","o":["La sobrina","El jardinero","El mayordomo"]}]'::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  'collar-valdes', array[0,0,0,2,1], 0, 'El barro junto a la vitrina, el pestillo con tierra, la nota de las rosas, el delantal verde y la maceta: todo llevaba al jardín.')
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;

insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  'noche-museo', 'Noche en el museo', 60, 4, '¿Quién robó la máscara de oro?', 'Una máscara de oro desapareció del museo durante la noche de gala.',
  '["La curadora","El guardia","El restaurador","La guía"]'::jsonb, '[{"t":"La alarma de la vitrina no sonó. ¿Qué implica?","o":["Entró un ladrón externo","Estaba dañada de fábrica","Alguien conocía el código"]},{"t":"Solo tres personas tienen el código: curadora, guardia y restaurador. ¿A quién descartas?","o":["Al guardia","A la curadora","A la guía"]},{"t":"Las cámaras confirman que el guardia estuvo toda la noche en el cuarto de monitores. ¿Quién queda?","o":["El guardia","Solo la guía","Curadora o restaurador"]},{"t":"La curadora dio un discurso de 9 a 10 frente a 200 personas. ¿Y el restaurador?","o":["Estaba con el guardia","Estaba en el discurso","Nadie lo vio en ese rato"]},{"t":"En el taller del restaurador hay una réplica recién pintada de la máscara. ¿Qué sugiere?","o":["Es de la guía","Pensaba cambiarla por la original","Es un encargo aprobado"]},{"t":"La réplica tiene fecha de hace tres semanas, antes de anunciar la gala. ¿Conclusión?","o":["Fue casualidad","Lo planeó con tiempo","Es de la curadora"]}]'::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  'noche-museo', array[2,2,2,2,1,1], 2, 'El restaurador conocía el código, nadie lo vio durante el discurso y tenía lista una réplica desde hacía tres semanas.')
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;

insert into public.cases (key, title, minutes, difficulty, question, intro, suspects, clues) values (
  'tren-medianoche', 'El tren de medianoche', 75, 5, '¿Quién se llevó la maleta con los planos?', 'En el tren turístico de medianoche, la maleta con los planos de una empresa desapareció del vagón 3.',
  '["El camarero","La ingeniera","El pasajero del 12B","La conductora"]'::jsonb, '[{"t":"Las ventanas están selladas y el tren no paró en toda la noche. ¿Dónde está la maleta?","o":["Nunca existió","Todavía a bordo","La bajaron en una estación"]},{"t":"El camarero vio una maleta gris cerca del vagón comedor a las 12:30. ¿Qué te dice?","o":["Nada útil","Que el comedor es el lugar clave","Que él es el culpable"]},{"t":"El pasajero del 12B cenó de 12:00 a 1:00 con cuatro testigos. ¿A quién descartas?","o":["Al pasajero del 12B","Al camarero","A la ingeniera"]},{"t":"El registro de velocidad no cambió: la conductora nunca dejó la locomotora. ¿A quién descartas?","o":["A la ingeniera","Al camarero","A la conductora"]},{"t":"Quedan el camarero y la ingeniera. Ella dijo que dormía, pero su boleto del comedor se marcó a las 12:40. ¿Su coartada?","o":["Se cae: mintió","Se confirma","No importa"]},{"t":"El camarero trabajó atendiendo mesas a la vista de todos. ¿Qué pesa más ahora?","o":["Que hay muchos pasajeros","Que la ingeniera no tiene testigos","Que el camarero conoce el tren"]},{"t":"En el equipaje de la ingeniera hay un candado nuevo, igual al de la maleta. ¿Conclusión?","o":["Es del camarero","Preparó el cambio de maletas","Es coincidencia"]}]'::jsonb)
on conflict (key) do update set title = excluded.title, minutes = excluded.minutes, difficulty = excluded.difficulty,
  question = excluded.question, intro = excluded.intro, suspects = excluded.suspects, clues = excluded.clues;
insert into public.case_secrets (case_key, answers, culprit, solution) values (
  'tren-medianoche', array[1,1,0,2,0,1,1], 1, 'La maleta nunca salió del tren. La coartada de la ingeniera se cayó con su boleto del comedor y llevaba un candado igual al de la maleta.')
on conflict (case_key) do update set answers = excluded.answers, culprit = excluded.culprit, solution = excluded.solution;
