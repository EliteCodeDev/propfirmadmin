# Guía de implementación de módulos/feature (Frontend – Admin)

Alcance: esta guía aplica a nuevos módulos y features del panel de administración (propfirmadmin), basada en los patrones existentes del proyecto.

1) Estructura y ubicación
- Páginas y rutas: usa la carpeta src/app para páginas y rutas anidadas. Ej.: src/app/main/withdrawals/page.tsx
- Componentes: coloca componentes reutilizables en src/components. Reutiliza componentes existentes antes de crear nuevos.
- API client: cada módulo de API vive en src/api/<modulo>/index.ts y usa el cliente compartido en src/api/client.ts
- Tipos compartidos: define o extiende tipos en src/types y asegúrate de exportarlos en src/types/index.ts (barrel).

2) Tipado y alineación con el backend
- Mantén los tipos sincronizados con el backend (nombres de campos y valores permitidos).
- Ejemplo de estado de retiros: 'pending' | 'approved' | 'paid' | 'rejected'. Envía SIEMPRE en minúsculas.
- Cuando el backend requiera campos condicionales (p.ej. rejectionDetail si status === 'rejected'), valida en UI antes de llamar al API.
- No declares tipos o interfaces de dominio en archivos src/app/**/page.tsx. Decláralos en src/types y expórtalos por el barrel (src/types/index.ts); luego impórtalos en la página. Se prohíben en pages las interfaces y los type alias con shape de objeto a nivel superior (lo valida ESLint).

3) Módulos de API
- Crea una carpeta por feature: src/api/<feature>/index.ts
- Exporta funciones CRUD y auxiliares (paginación, filtros) usando el axios client de src/api/client.ts
- Define interfaces para query/payload locales al módulo (p.ej. QueryDto, CreatePayload, UpdatePayload) y usa tipos compartidos de src/types donde aplique.
- Estandariza respuestas paginadas con los tipos de src/types/pagination.ts (PageMeta, PaginatedResponse, PageResponse).
- No uses fetch directo desde las pages. Las pages deben delegar todo acceso a datos a las funciones del módulo API correspondiente.
- Normaliza en la capa API cualquier variación de respuestas del backend (por ejemplo, [items, total], { data, meta }, items[]). Las pages no deben contener lógica de "unwrapping"/normalización.
- Desde el navegador, consume el BFF (/api/server) a través del axios client compartido (baseURL configurada) para evitar CORS y gestionar Authorization/401 mediante interceptores.

4) Data fetching
- Para listados y detalle, usa SWR: trae datos con useSWR(key, fetcher) donde el fetcher delega en el módulo API del feature (no fetchers ad hoc con fetch en la page). Para mutaciones, usa mutate con revalidación selectiva.
- Los endpoints paginados deben aceptar page y limit, y opcionalmente filtros (p.ej., status, email). Refleja esos parámetros en la key de SWR.

5) UI y componentes
- Tablas: utiliza el componente existente PaginatedCardTable con ColumnConfig y render/renderActions para acciones por fila.
- Diálogos y modales: reutiliza components/ui/dialog (envoltura de @radix-ui/react-dialog) para confirmaciones y formularios.
- Botones: sigue el patrón de clases Tailwind usados en el admin (ej.: bg-blue-600 text-white para primarios), manteniendo consistencia.
- Formularios: valida antes de enviar (required, min/max) y muestra errores de API de forma clara. Recomendado: zod para esquemas de validación y (opcional) react-hook-form para formularios complejos.

6) Manejo de errores y UX
- Mapea errores 400/422 a validaciones de formulario; 401/403 a flujo de autenticación/autorización; 5xx a mensajes genéricos con opción de reintento.
- Usa loaders/skeletons durante la carga y deshabilita controles durante mutaciones para evitar acciones duplicadas.

7) Seguridad
- No expongas secretos en cliente. Usa el axios client configurado (headers, baseURL e interceptores). No hardcodees URLs absolutas.
- Respeta permisos: oculta/deshabilita acciones no permitidas si el usuario no es admin o no tiene rol adecuado.

8) Accesibilidad e i18n
- Usa etiquetas aria y relaciones entre label/inputs. Asegura contraste y estados focus visibles.
- i18n: en el Admin es opcional. Mantén los textos preparados para internacionalización (clave única y no textos "quemados" si se planea multiidioma). Si se requiere i18n, se sugiere integrar una solución como next-intl y externalizar mensajes.

9) Definition of Done (DoD)
- Tipos y API client creados/actualizados en src/api/<feature> e indexados en src/types si corresponde.
- Páginas/Componentes integrados con SWR y manejo de paginación/filtros.
- Data fetching a través de módulos API (sin fetch inline en pages) y respuestas normalizadas en la capa API.
- Estados y validaciones alineados con backend (incluyendo reglas condicionales).
- Sin tipos/ interfaces de dominio a nivel superior en pages (validadas por ESLint).
- Uso de BFF en cliente cuando aplique (axios client + interceptores para Authorization/401).
- Errores manejados y UX consistente (loaders, disabled, toasts/alertas cuando corresponda).
- Estilos y componentes consistentes con el resto del admin.
- Pruebas manuales básicas de flujo feliz y errores comunes (red, 400, 401).
- Lint sin errores (y sin warnings si el script usa --max-warnings=0) y build protegido por lint (prebuild local o paso en CI).

10) Notas del módulo Withdrawals como referencia
- Se envían estados en minúscula ('pending' | 'approved' | 'paid' | 'rejected').
- Se usa components/ui/dialog para confirmar aprobar/rechazar y para capturar rejectionDetail cuando corresponde.
- Las tablas usan PaginatedCardTable con renderActions para botones de aprobar/rechazar.
- Para filtros/queries, si el backend acepta estados en mayúsculas (PENDING | APPROVED | REJECTED | PAID), documenta el formato esperado en el módulo API y realiza el mapeo/normalización necesario. En mutaciones, mantén el envío en minúsculas.

11) Linting, formateo y gating de build (Admin)
- Estándar: usa el eslint.config.mjs del repo (flat config). No crees configuraciones paralelas; extiende/ajusta ahí mismo.
- Gating del build por lint:
  - Recomendado en CI: `npm ci && npm run lint && npm run build`. Si `lint` falla, el pipeline se detiene.
  - Opcional local: agrega en package.json "prebuild": "npm run lint" para que `next build` falle si hay errores de lint.
  - Tratar warnings como errores: añade `--max-warnings=0` al script `lint`.
  - Ejemplos de scripts:
    - "lint": "eslint . --ext .ts,.tsx --max-warnings=0"
    - "format": "prettier --write ."
    - "prebuild": "npm run lint"
- Alcance de lint: limita a src/ y excluye con .eslintignore (por ejemplo: .next/, node_modules/, .turbo/, coverage/).
- Arreglo rápido: `npm run lint -- --fix` para aplicar autofix seguro; revisa manualmente reglas no autofixables.
- TypeScript estricto (sugerido): considera `noUnusedLocals` y `noUnusedParameters` en tsconfig y ajusta si afecta código legado.

Actualiza DoD
- Añade a Definition of Done: "lint sin errores (y sin warnings si usas --max-warnings=0)" y "build protegido por lint (prebuild local o paso en CI)".

11.1) ¿Por qué puede fallar el build por lint en el Admin?
- Uso de process.env fuera del puente de configuración: la regla no-restricted-properties marca error si accedes a process.env fuera de src/config/**. Solución: importa valores desde '@/config'.
- Tipos de dominio en pages: en archivos src/app/**/page.tsx se prohíbe declarar interfaces o type alias con shape de objeto en el toplevel (no-restricted-syntax). Deben ir en src/types y luego importarse.
- Reglas de Next.js (core-web-vitals): el preset de Next puede marcar errores como next/no-img-element, enlaces sin next/link adecuado, problemas de accesibilidad, etc. Corrige según sugerencia del linter o migra al componente recomendado.
- Warnings contados como errores: si configuras el script de lint con --max-warnings=0, cualquier warning (por ejemplo, @typescript-eslint/no-explicit-any en capas UI, que está en "warn") hará fallar el lint y, por ende, el build si usas prebuild o CI gating.
- Integración del lint en el build: si agregas "prebuild": "npm run lint", el build fallará cuando ESLint retorne código distinto de cero. En CI, si encadenas npm run lint && npm run build, también se bloqueará el pipeline ante errores de lint.