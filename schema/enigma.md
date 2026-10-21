# Modelo de datos — Enigma Go para empresas

Stack: **Supabase** (Postgres + Realtime + Auth anónima). Frontend React + Vite
que habla directo con Supabase; toda escritura pasa por funciones RPC
`security definer`, nunca por insert/update directos desde el cliente.

## Quién es quién

- **Todos los dispositivos** inician una sesión **anónima** de Supabase Auth
  (`signInAnonymously`). No hay contraseñas ni tabla propia de usuarios: el
  dueño de cada fila es `auth.uid()`.
- **Organizador**: el usuario anónimo que crea el evento (`events.owner_id`).
- **Equipo**: el usuario anónimo que se une con el código (`teams.device_id`).
  Un dispositivo puede manejar varios equipos (útil para el demo con pestañas).

## Entidades

### `cases` — catálogo de casos (público)

| Campo | Tipo | Req. | Asigna | Restricciones |
|---|---|---|---|---|
| key | text PK | sí | semilla | `^[a-z0-9-]{3,40}$` |
| title | text | sí | semilla | 3–80 caracteres |
| minutes | int | sí | semilla | 10–120 |
| difficulty | int | sí | semilla | 1–5 |
| question | text | sí | semilla | pregunta de la acusación |
| intro | text | sí | semilla | |
| suspects | jsonb | sí | semilla | arreglo de 4 textos |
| clues | jsonb | sí | semilla | arreglo de `{t, o:[...]}`, **sin la respuesta** |

### `case_secrets` — respuestas (nadie las lee por la API)

| Campo | Tipo | Req. | Restricciones |
|---|---|---|---|
| case_key | text PK → cases.key | sí | on delete cascade |
| answers | int[] | sí | índice correcto de cada pista |
| culprit | int | sí | índice del sospechoso culpable |
| solution | text | sí | explicación que se revela al acusar |

RLS activado **sin políticas**: solo las funciones `security definer` la leen.
Así las respuestas nunca viajan al navegador antes de tiempo.

### `events` — un evento de una empresa

| Campo | Tipo | Req. | Default | Asigna | Restricciones |
|---|---|---|---|---|---|
| id | uuid PK | sí | gen_random_uuid() | servidor | |
| owner_id | uuid → auth.users | sí | auth.uid() | servidor | on delete cascade |
| code | text | sí | | servidor | único, `^[A-Z0-9]{6}$`, sin O/0/I/1 |
| company | text | sí | | cliente | 2–60 caracteres |
| case_key | text → cases.key | sí | | cliente | |
| mode | text | sí | | cliente | `app` \| `recorrido` |
| status | text | sí | `lobby` | servidor | `lobby` \| `live` \| `finished` |
| started_at / finished_at | timestamptz | no | | servidor | |
| created_at | timestamptz | sí | now() | servidor | |

### `teams` — equipos dentro de un evento

| Campo | Tipo | Req. | Default | Asigna | Restricciones |
|---|---|---|---|---|---|
| id | uuid PK | sí | gen_random_uuid() | servidor | |
| event_id | uuid → events.id | sí | | servidor | on delete cascade |
| device_id | uuid | sí | auth.uid() | servidor | |
| name | text | sí | | cliente | 2–24 caracteres; único por evento |
| color | text | sí | | cliente | `^#[0-9a-fA-F]{6}$` |
| score, correct, wrong, current_clue | int | sí | 0 | servidor | ≥ 0 |
| accused | int | no | | servidor | |
| accused_ok | boolean | no | | servidor | |
| finished_at | timestamptz | no | | servidor | |

Máximo 12 equipos por evento (lo valida `join_event`).

### `answers` — cada respuesta de un equipo

PK (`team_id`, `clue_index`), `option_index`, `is_correct`, `points`,
`created_at`. Una sola respuesta por pista y equipo.

## Reglas de acceso (RLS)

| Tabla | select | insert / update / delete |
|---|---|---|
| cases | cualquier sesión | nadie (solo semilla) |
| case_secrets | nadie | nadie |
| events | cualquier sesión (se necesita para unirse con el código) | solo vía RPC |
| teams | cualquier sesión (marcador público del evento) | solo vía RPC |
| answers | el dispositivo del equipo o el dueño del evento | solo vía RPC |

Nota: los ids son uuid no adivinables y `events`/`teams` no tienen datos
personales (nombre de empresa y de equipo), por eso su lectura es abierta.

## Puntaje (lo calcula el servidor)

- Pista acertada: **+30**. Pista fallada: **+10**.
- Acusación correcta: **+50**.
- Ranking: `score` descendente y, en empate, quien terminó primero.

## Fuera de alcance (por ahora)

- Casos generados por IA (la tabla `cases` ya admite agregarlos).
- Cuentas con correo para el organizador y historial de eventos.
- GPS real: en oficinas no es confiable; el modo `recorrido` usa solo QR.
