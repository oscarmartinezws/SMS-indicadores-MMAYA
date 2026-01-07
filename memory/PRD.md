# SMS - Sistema de Monitoreo Sectorial

## Descripción del Proyecto
Sistema de gestión y monitoreo de indicadores sectoriales con dashboard analítico, gestión de usuarios con roles y permisos (RBAC), y seguimiento mensual de rendiciones.

## Stack Tecnológico
- **Frontend:** React.js + Recharts
- **Backend:** Node.js/Express.js
- **Base de datos:** PostgreSQL (externa en 37.60.254.167)
- **Autenticación:** JWT + bcrypt

## Características Implementadas

### Autenticación y Seguridad
- [x] Login con JWT
- [x] Hash de contraseñas con bcrypt
- [x] Verificación de token
- [x] Control de acceso basado en roles (RBAC)

### Dashboard
- [x] KPIs de indicadores (total, con avance, sin avance, % avance)
- [x] Gráficos por sector (barras)
- [x] Gráficos por entidad (barras)
- [x] Gráfico circular de estado general
- [x] Filtros por año, sector, entidad, área

### Gestión de Usuarios
- [x] CRUD de usuarios
- [x] Asignación de roles
- [x] Asignación de áreas
- [x] Estados activo/inactivo

### Gestión de Roles y Permisos
- [x] CRUD de roles
- [x] Asignación de permisos por menú
- [x] Filtrado de indicadores por área del usuario

### Gestión de Menú
- [x] Estructura jerárquica (separadores y opciones)
- [x] Configuración de permisos por rol

### Gestión de Indicadores (Banco de Indicadores)
- [x] Grid optimizado con solo códigos (sin descripciones largas)
- [x] **Paginación** de 10 registros por página con navegación
- [x] **Control de acceso por rol**:
  - ADMINISTRADOR: puede crear/editar indicadores (botón "✏️ Editar")
  - USUARIO: solo visualización (botón "👁 Ver")
- [x] **Modal de solo lectura** para usuarios:
  - Muestra descripciones completas (no cortadas)
  - Campos de solo lectura (fondo gris)
  - Solo botón "Cerrar"
- [x] **Modal de edición** para admin:
  - Combos ampliados con descripciones completas
  - Botones "Volver" y "💾 Grabar"
- [x] Catálogos cargados solo al abrir modal (mejor rendimiento)

### Seguimiento de Indicadores
- [x] Selección de indicador
- [x] Registro mensual de ejecución
- [x] **Campos calculados (COMPLETADO)**:
  - `% EJEC` = (EJECUCIÓN del mes / PROGRAMADO) * 100
  - `ACUMULADO` = suma acumulativa de EJECUTADO de meses anteriores
  - `LOGRADO` = total acumulado del año
- [x] Campos de solo lectura para valores calculados
- [x] Persistencia de datos calculados
- [x] Descripción cualitativa del avance
- [x] Modificaciones
- [x] Archivos adjuntos (upload y URL)
- [x] **PROGRAMADO editable (solo ADMIN)**:
  - Botón ✏️ al lado del valor PROGRAMADO (columna azul)
  - Modal para editar el PROGRAMADO del año
  - Se guarda en tabla `rendicion.programado`
  - % EJEC en columna LOGRADO (roja) = LOGRADO/PROGRAMADO * 100
  - Usuarios normales solo pueden ver el valor
- [x] **PROGRAMADO con validación y suma global (NUEVO - 2025-01-05)**:
  - Muestra "SUMA PROGRAMADO (TODOS LOS AÑOS)" junto a "LOGRO PROGRAMADO (META)"
  - Formato: `suma / meta` con color verde si cumple, rojo si excede
  - Modal de edición muestra:
    - Meta global del indicador
    - Suma de programados de todos los años
    - Disponible para programar
  - Validación: no permite guardar si la suma excedería la meta global
  - Endpoint nuevo: `GET /api/sms/rendicion/suma_programado/:id_indicador`
  - Permite guardar PROGRAMADO incluso sin datos mensuales
- [x] **Exportación de datos (COMPLETADO)**:
  - Exportar a CSV (todos los indicadores del usuario)
  - **Exportar a PDF mejorado**:
    - Descarga automática (sin ventana de impresión)
    - Descripción completa del indicador (múltiples líneas)
    - 3 sub-filas por indicador: EJEC, %EJEC, ACUM
    - Colores diferenciados por tipo de dato
    - Formato A4 landscape

### Configuración del Sistema
- [x] Período del plan (año inicio/fin)
- [x] Favicon y logo (upload y URL)
- [x] Tema de color (negro, azul, rosa)
- [x] Modo claro/oscuro
- [x] Texto de copyright

### Catálogos (CRUD)
- [x] Sectores
- [x] **Entidades con Áreas** (vista dual):
  - Sección izquierda: Grid de entidades con botones editar y ver áreas
  - Sección derecha: Áreas organizacionales de la entidad seleccionada
  - Relación 1:N entre entidad y áreas
- [x] Pilares
- [x] Ejes
- [x] Metas
- [x] Resultados
- [x] Acciones

## Estructura de Archivos Principales
```
/app/
├── backend/
│   ├── server.js          # API Node.js/Express (monolítico)
│   ├── package.json
│   └── uploads/           # Archivos subidos
├── frontend/
│   ├── src/
│   │   ├── App.js         # Componente principal (monolítico)
│   │   └── App.css
│   └── package.json
├── memory/
│   └── PRD.md             # Este archivo
└── test_reports/
    └── iteration_1.json   # Resultados de pruebas
```

## Credenciales de Prueba
- **Admin:** omartinez / P1c0l0c0
- **Usuario:** jperez / P1c0l0c0

## Tareas Completadas (Enero 2025)

### 2025-01-05
- ✅ **Mejoras de PROGRAMADO en vista Seguimiento**:
  - Muestra suma de todos los PROGRAMADO anuales junto a la meta global
  - Validación: no permite guardar si excede la meta global
  - Modal muestra información completa: meta, suma actual, disponible
  - Color verde/rojo según estado (cumple/excede meta)
  - Nuevo endpoint: `GET /api/sms/rendicion/suma_programado/:id`
  - Arreglado bug de ruta (endpoint movido antes de rutas parametrizadas)
  - Testing completo con testing agent (100% éxito - 9/9 pruebas)
- ✅ **% LOGRO GLOBAL (nuevo)**:
  - Campo calculado: SUMA LOGRADO (todos los años) / LOGRO PROGRAMADO (META) * 100
  - Colores: Verde >=100%, Naranja >=50%, Rojo <50%
  - Nuevo endpoint: `GET /api/sms/rendicion/suma_logrado/:id`
- ✅ **Mejora del reporte PDF**:
  - Título cambiado a "SEGUIMIENTO DE INDICADORES"
  - Una sola fila por indicador con: EJECUCIÓN (ENE-DIC), PROG, LOGRADO, % PROG, % LOG, Σ PROG, % LOGRO GLOBAL
  - Calidad mejorada (scale: 3, quality: 1.0)
  - Indicadores largos se ajustan en múltiples líneas
  - Leyenda explicativa al final del reporte
- ✅ **Archivos Adjuntos funcionando**:
  - Guardado persistente en tabla `archivos_rendicion`
  - Nuevos endpoints: GET/POST/DELETE `/api/sms/rendicion/adjuntos/...`
  - Archivos físicos en `/app/backend/uploads/`
  - Carga automática al seleccionar indicador/año
- ✅ **Bug fix - Menú duplicado**:
  - Corregido query que hacía LEFT JOIN innecesario con tabla opciones
  - Ahora muestra 15 menús únicos sin duplicados
- ✅ **Bug fix - Accesos por Rol**:
  - Creadas opciones faltantes para Rol 2 (USUARIO AREA)
  - Ahora los 3 roles tienen sus 15 opciones cada uno
- ✅ **Refactorización Frontend (Fase 1)**:
  - Creada estructura de carpetas: `/components/views`, `/components/common`, `/styles`
  - Extraído `theme.js` con estilos compartidos
  - Extraídos componentes: `Login.jsx`, `Sidebar.jsx`, `RolesView.jsx`, `MenuAdminView.jsx`, `UsuariosView.jsx`
  - Reducido `App.js` de 2510 a 2236 líneas (-274 líneas, -11%)

### 2025-01-04
- ✅ Implementación de campos calculados en vista Seguimiento
  - `% EJEC` calculado automáticamente
  - `ACUMULADO` como suma acumulativa
  - Campos de solo lectura
  - Persistencia en PostgreSQL
- ✅ **Botón de Exportación agregado**:
  - Exportar a CSV: genera archivo con todos los indicadores del usuario
  - Exportar a PDF: abre ventana de impresión con reporte formateado
  - Incluye: CÓDIGO, INDICADOR, EJECUCIÓN mensual, % EJEC, ACUMULADO, PROGRAMADO, LOGRADO
  - Campos sin datos se muestran vacíos
- ✅ Testing completo con testing agent (100% éxito)

## Backlog (Tareas Futuras)

### P1 - Alta Prioridad
1. **Refactorización Frontend**
   - Descomponer App.js en componentes separados
   - Crear carpeta components/
   - Implementar Context API para estado global

2. **Refactorización Backend**
   - Modularizar server.js usando Express Router
   - Crear carpeta routes/ con archivos separados
   - Implementar middleware de validación

### P2 - Media Prioridad
3. **Validación Server-Side**
   - Agregar validación de inputs con Joi o express-validator
   - Sanitizar datos de entrada
   - Mejorar manejo de errores

4. **Mejoras de UX**
   - Loading states más visibles
   - Mensajes de error más descriptivos
   - Confirmaciones antes de eliminar

### P3 - Baja Prioridad
5. **Reportes y Exportación**
   - Exportar rendiciones a Excel
   - Generar reportes PDF
   - Dashboard exportable

6. **Auditoría**
   - Registro de cambios
   - Historial de modificaciones
   - Log de accesos

## Notas Técnicas

### Base de Datos PostgreSQL
- Host: 37.60.254.167
- Puerto: 5432
- Database: sms
- Tablas principales: usuario, rol, menu, opciones, matriz_parametro, rendicion, configuracion_sistema

### Endpoints API Principales
- `POST /api/sms/login` - Autenticación
- `GET /api/sms/matriz_parametros` - Indicadores (filtrado por rol)
- `GET /api/sms/rendicion/:id/:gestion` - Obtener rendición
- `POST /api/sms/rendicion` - Guardar rendición
- `POST /api/sms/rendicion/programado` - Guardar solo PROGRAMADO anual
- `GET /api/sms/rendicion/suma_programado/:id` - Suma de todos los PROGRAMADO
- `GET /api/sms/rendicion/suma_logrado/:id` - Suma de todos los LOGRADO
- `GET /api/sms/dashboard/summary` - Datos del dashboard
- `GET/POST /api/sms/configuracion` - Configuración del sistema
