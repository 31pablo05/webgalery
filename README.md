# Webgalery

Sitio estático de una artista visual. Astro genera el HTML en el build; el contenido sale de Sanity.

## Variables de entorno

En Vercel, y en un `.env` local:

| Variable | Uso |
| --- | --- |
| `SANITY_PROJECT_ID` | Proyecto de Sanity |
| `SANITY_DATASET` | Dataset publicado, por ejemplo `production` |
| `PUBLIC_WEB3FORMS_KEY` | Clave pública del formulario de contacto |
| `SITE` | URL pública con protocolo, por ejemplo `https://dominio.com` |

`SITE` arma el sitemap y las URLs canónicas. Si no está definida en Vercel, se usa el dominio de producción del proyecto.

## Comandos

```sh
npm install
npm run dev
npm run build
```

## Reconstruir el sitio cuando se publica en Sanity

El sitio no se actualiza solo: cada cambio publicado tiene que disparar un build nuevo en Vercel.

1. Entrá al proyecto en Vercel → **Settings** → **Git** → **Deploy Hooks**.
2. Creá un hook. Nombre sugerido: `Sanity`. Branch: la de producción (`main`).
3. Copiá la URL que te da Vercel. Ya incluye el token; no hace falta otra clave.
4. Entrá a [sanity.io/manage](https://www.sanity.io/manage), abrí el proyecto → **API** → **Webhooks** → **Create webhook**.
5. Completalo así:
   - **Name:** Vercel
   - **URL:** la URL del Deploy Hook
   - **Dataset:** el mismo que `SANITY_DATASET` (por ejemplo `production`)
   - **Trigger on:** Create, Update y Delete
   - **Filter:** `!(_id in path("drafts.**"))`
   - **Projection:** vacío
   - **HTTP method:** POST
   - **API version:** la que ofrece el formulario
6. Guardá el webhook y desactivá la opción de disparar también con borradores, si aparece. El filtro de arriba deja afuera los drafts: el sitio se reconstruye cuando se publica, edita o borra un documento, y no en cada autoguardado del estudio.
7. Publicá un cambio chico en Sanity y confirmá en Vercel que arrancó un deployment.

El hook dispara el build. No hace falta un servidor ni una ruta de API en el sitio.
