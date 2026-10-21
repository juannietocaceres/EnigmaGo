# Enigma Go · para empresas

Misterios en equipo para eventos de empresa. El organizador crea el evento y
proyecta un marcador en vivo; cada equipo juega desde su celular con un código.

- **Stack:** React + Vite + Tailwind, Supabase (Postgres, Realtime, Auth anónima), Vercel.
- **Modelo de datos:** [schema/enigma.md](schema/enigma.md)
- **Contrato:** [api/contrato-enigma.md](api/contrato-enigma.md)

## Configurar Supabase (una sola vez)

1. Supabase → **SQL Editor** → pegar todo `supabase/setup.sql` → **Run**.
2. Supabase → **Authentication → Sign In / Providers** → activar **Allow anonymous sign-ins**.
3. Copiar `.env.example` a `.env.local` y llenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API Keys). Nunca usar la `service_role`.

Para cambiar los casos: editar `supabase/cases.json`, correr `npm run seed` y
volver a pegar `supabase/seed.sql` en el SQL Editor.

## Desarrollo

```bash
npm install
npm run dev
```

La cámara para escanear QR solo funciona en `localhost` o con HTTPS (Vercel).

## Publicar en Vercel

Importar el repo en Vercel (framework: Vite) y agregar las dos variables
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Settings → Environment Variables.

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio |
| `/organizar` | Crear evento |
| `/evento/:id` | Consola del organizador |
| `/evento/:id/marcador` | Marcador para proyectar |
| `/evento/:id/qr` | QR imprimibles del recorrido |
| `/unirse` | Unirse con código |
| `/jugar/:teamId` | Juego del equipo |
