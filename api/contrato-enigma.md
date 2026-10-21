# Contrato — Enigma Go para empresas

El cliente habla directo con Supabase. Lecturas con `supabase.from(...)`,
escrituras solo con `supabase.rpc(...)`. Todas las operaciones exigen una
sesión (anónima vale).

**Formato de error único:** las funciones lanzan `raise exception '<codigo>'`
y el cliente recibe `error.message = '<codigo>'`. El cliente traduce el
código a un mensaje en español (`src/lib/api.ts`). Nunca se muestra SQL ni
nombres internos.

| Código | Cuándo |
|---|---|
| `sin_sesion` | No hay `auth.uid()` |
| `datos_invalidos` | Falla una validación de entrada |
| `caso_no_existe` | `case_key` desconocido |
| `codigo_invalido` | No existe un evento con ese código |
| `evento_cerrado` | El evento ya terminó |
| `evento_lleno` | Ya hay 12 equipos |
| `nombre_en_uso` | Otro equipo del evento tiene ese nombre |
| `no_autorizado` | La fila no es del usuario |
| `evento_no_activo` | El evento no está en curso |
| `tiempo_agotado` | Se acabó el tiempo del caso |
| `pista_fuera_de_orden` | La pista no es la actual del equipo |
| `opcion_invalida` | Índice de opción o sospechoso fuera de rango |
| `faltan_pistas` | Se intenta acusar sin terminar las pistas |
| `ya_acuso` | El equipo ya acusó |

## Lecturas

| Operación | Devuelve |
|---|---|
| `cases` select `*` order `minutes` | Catálogo, sin respuestas |
| `events` select `*` eq `id` | Un evento |
| `events` select `*` eq `code` | Para unirse |
| `teams` select `*` eq `event_id` | Equipos del evento (marcador) |
| Realtime `postgres_changes` sobre `teams` y `events` filtrado por evento | Cambios en vivo |

## Escrituras (RPC)

| Función | Entrada | Salida | Errores |
|---|---|---|---|
| `create_event` | `p_company`, `p_case_key`, `p_mode` | fila de `events` | sin_sesion, datos_invalidos, caso_no_existe |
| `start_event` | `p_event` | fila de `events` | no_autorizado (no es dueño o no está en lobby) |
| `finish_event` | `p_event` | `{culprit, solution}` | no_autorizado |
| `join_event` | `p_code`, `p_name`, `p_color` | fila de `teams` | codigo_invalido, evento_cerrado, evento_lleno, nombre_en_uso, datos_invalidos |
| `submit_answer` | `p_team`, `p_clue`, `p_option` | `{is_correct, correct_index, points, score, current_clue}` | no_autorizado, evento_no_activo, tiempo_agotado, pista_fuera_de_orden, opcion_invalida |
| `accuse` | `p_team`, `p_suspect` | `{is_correct, culprit, solution, score}` | no_autorizado, evento_no_activo, faltan_pistas, ya_acuso, opcion_invalida |

## Pruebas de contrato

Casos para correr contra el proyecto de Supabase (dos navegadores = dos
usuarios anónimos):

1. `create_event` feliz → código de 6 caracteres; con `p_case_key` inexistente → `caso_no_existe`.
2. `start_event` por el dueño → `live`; por otro navegador → `no_autorizado`.
3. `join_event` feliz; código malo → `codigo_invalido`; nombre repetido → `nombre_en_uso`.
4. `submit_answer` en orden → puntaje 30 o 10; misma pista otra vez → `pista_fuera_de_orden`; desde otro navegador → `no_autorizado`; antes de iniciar → `evento_no_activo`.
5. `accuse` antes de terminar → `faltan_pistas`; feliz → `+50` si acierta; segunda vez → `ya_acuso`.
6. `case_secrets` select desde el cliente → 0 filas (RLS sin políticas).
7. Lista vacía: `teams` de un evento recién creado → `[]`.
