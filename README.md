# Wuepa - Catálogo de Accesorios (Frontend)

**Desarrollado por:** wuepa

Este repositorio contiene el frontend de Wuepa, una tienda de accesorios con autenticación, perfil de usuario y catálogo de productos. La app funciona completamente offline usando una API simulada (mock/stub) para desarrollo local.

## Funcionalidades principales

- **Catálogo de productos:**
	- Página principal con categorías visuales (Collares, Aretes, Pulseras) y productos destacados.
	- Vista de productos filtrada por categoría y búsqueda.
	- Imágenes y descripciones de cada producto.
- **Autenticación:**
	- Login, registro, recuperación y cambio de contraseña.
	- Estado de sesión persistente (localStorage).
- **Perfil de usuario:**
	- Visualización y edición de datos personales.
	- Botón para cerrar sesión.
- **Manual de usuario:**
	- Accesible desde el menú, explica el uso de la app y sus flujos.
- **Accesibilidad:**
	- Cumple WCAG 2.1, roles ARIA, navegación con teclado y lectores de pantalla.
- **Diseño responsivo:**
	- Adaptado a móviles y escritorio.
- **API simulada:**
	- Todas las funciones de backend (`src/services/api.ts`) son stubs locales.

## sa

- React + TypeScript
- Vite (dev server)
- Zustand (estado global)
- Sass (`src/styles.scss`)
- React Router

## Rutas principales

- `/buy` — Página principal: categorías, destacados, usuario logueado.
- `/products` — Catálogo filtrable por categoría y búsqueda.
- `/login` — Inicio de sesión.
- `/signup` — Registro de usuario.
- `/forgot` — Recuperar contraseña.
- `/reset` — Restablecer contraseña.
- `/profile` — Perfil editable.
- `/user-manual` — Manual de usuario.
- `/about` — Información sobre la app.

## Cómo ejecutar (desarrollo)

1. Instala dependencias:
	 ```bash
	 npm install
	 ```
2. Ejecuta el servidor de desarrollo:
	 ```bash
	 npm run dev
	 ```
3. Abre en el navegador:
	 - `http://localhost:5173/buy` — Página principal
	 - `http://localhost:5173/products` — Catálogo
	 - `http://localhost:5173/login` — Login

## API real

- El frontend usa `src/services/api.ts` para conectarse al backend desplegado en `https://wuepa-jewerly-backend.onrender.com`.
- La URL base se configura con `VITE_API_URL` en `.env`.
- Firebase sigue gestionando autenticación y recuperación/cambio de contraseña, mientras que el backend valida el token y sincroniza el usuario.

## Estilos

- Toda la app usa `src/styles.scss` (Sass) con variables, animaciones y reglas para cada sección.

## Siguientes pasos recomendados

- Integrar backend real reemplazando `src/services/api.ts`.
- Mejorar la gestión de imágenes y productos.
- Agregar funcionalidades de carrito y compra.

## Scripts útiles

- `npm run dev` — Servidor de desarrollo
- `npm run build` — Build de producción
- `npm run preview` — Preview local del build

## Contribuir

- Haz fork, crea una rama y envía un PR. Commits pequeños y enfocados.

## Licencia

MIT
#  wuepa Frontend

**Desarrollado por:** wuepa

Este repositorio contiene el frontend del proyecto wuepa. Actualmente la aplicaci�n est� enfocada en las funcionalidades de autenticaci�n y gesti�n de usuario, junto con una demo local de la experiencia "wuepa / Reuni�n" (videollamada) para desarrollo  la app usa stubs locales para simular el backend.

Resumen r�pido del estado actual
- Autenticaci�n: Login, Signup, Olvido/Reset de contrase�a (stubs).
- Perfil: p�gina de perfil con dise�o tipo tarjeta/modal.
- Manual de usuario: `/user-manual` actualizado y accesible desde el men�.
- Robusto: construido teniendo en cuenta accesibilidad (WCAG 2.1). Compatibilidad con lectores de pantalla y roles ARIA.
- wuepa: landing post-login en `/wuepa` con bot�n "Crear reuni�n" que abre la demo de videollamada en `/videocall`.
- Videocall demo: interfaz estilo Google Meet con un participante inicial, controles (c�mara, micr�fono, chat, colgar) y panel de chat.
- API: `src/services/api.ts` es un stub (no hace llamadas reales) para permitir desarrollo offline.
- Removed: funcionalidades multimedia avanzadas y endpoints externos fueron eliminados para dejar la app centrada en autenticaci�n y demo local.

##  Tecnolog�as

- React + TypeScript
- Vite (dev server)
- Sass (`src/styles.scss`)
- React Router

## P�ginas / Rutas principales

- `/buy` — Página principal: categorías, destacados, usuario logueado.
- `/products` — Catálogo filtrable por categoría y búsqueda.
- `/login` — Inicio de sesión.
- `/signup` — Registro de usuario.
- `/forgot` — Recuperar contraseña.
- `/reset` — Restablecer contraseña.
- `/profile` — Perfil editable.
- `/user-manual` — Manual de usuario.
- `/about` — Información sobre la app.

## C�mo ejecutar (desarrollo)

1. Instala dependencias:
```powershell
npm install
```
2. Ejecuta el servidor de desarrollo:
```powershell
npm run dev
```
3. Abrir en el navegador (por defecto Vite usa `http://localhost:5173`):

- `http://localhost:5173/login`  para probar login y flujo auth
- `http://localhost:5173/wuepa`  landing post-login
- `http://localhost:5173/videocall`  demo de videollamada

Nota: puedes conectar `src/services/api.ts` a un backend real reemplazando las funciones stub si lo deseas.

## API (modo stub)

`src/services/api.ts` exporta funciones con la misma interfaz esperada del backend pero que resuelven localmente (ej.: `login` guarda un token en `localStorage`). Esto permite desarrollo sin dependencia de un backend real.

## Estilos

- Toda la app usa `src/styles.scss` (Sass). He incluido variables de color y reglas espec�ficas para auth, sidebar, perfil, manual y la demo de videollamada.

## Consideraciones y siguientes pasos posibles

- Integraci�n con backend real: reemplazar `src/services/api.ts` por llamadas reales.
- Integraci�n WebRTC / streams reales en `/videocall`.
- Persistencia del chat y sincronizaci�n multiusuario (requiere backend).
- Limpieza final de estilos (se dejaron bloques de seguridad antes de eliminar c�digo totalmente).

## Scripts �tiles

- `npm run dev`  servidor de desarrollo
- `npm run build`  build de producci�n
- `npm run preview`  preview local del build

## Contribuir

- Fork  rama  PR. Mant�n los commits peque�os y enfocados.

## Licencia

MIT

