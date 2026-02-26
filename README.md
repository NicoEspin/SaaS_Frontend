# Stock Management - Frontend

Frontend (Next.js App Router) para el proyecto de Stock Management.

## Documentacion

La documentacion completa del frontend esta en:

- `docs/frontend/README.md`

## Requisitos

- Node.js 20+
- npm

## Variables de entorno

- `NEXT_PUBLIC_API_BASE_URL` (opcional)
  - Si apunta al origen del backend (ej: `https://api.example.com`), el cliente agrega `/api/v1` automaticamente.
  - Si ya incluye `/api/v1` (ej: `https://api.example.com/api/v1`), se usa tal cual.
  - Si no esta seteada, el frontend usa `baseURL: /api/v1` (util si hay proxy/rewrite en dev).

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
