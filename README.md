# API_Design

# 🎯 Habit Tracker API

Una API RESTful robusta y escalable diseñada para el seguimiento de hábitos diarios. Construida con un enfoque estricto en la seguridad, la validación de datos y la consistencia transaccional utilizando las tecnologías más modernas del ecosistema Node.js.

🚀 **[Ver API en Producción (Render)](https://api-design-habbit.onrender.com/health)**

---

## 🛠️ Stack Tecnológico

- **Core:** Node.js, Express, TypeScript
- **Base de Datos:** PostgreSQL
- **ORM:** Drizzle ORM (con migraciones automatizadas)
- **Validación:** Zod (Esquemas estandarizados y tipado estricto)
- **Autenticación:** JWT (JSON Web Tokens) & Bcrypt para hashing
- **Testing:** Vitest & Supertest (Pruebas de integración E2E)

## ✨ Características Principales

- **Arquitectura Limpia:** Separación clara entre controladores, rutas y lógica de base de datos.
- **Validación Robusta (Middleware):** Implementación de factorías de middleware con Zod para validar `body`, `params` y `query` de forma interceptada antes de llegar a los controladores.
- **Integridad Relacional:** Uso de transacciones de base de datos (`db.transaction`) para operaciones complejas, como la asignación de múltiples _Tags_ a _Hábitos_ (Relación Muchos a Muchos).
- **Manejo Centralizado de Errores:** Interceptor global de errores (`errorHandler`) para garantizar respuestas JSON estandarizadas en toda la aplicación.
- **Pruebas Automatizadas:** Cobertura de pruebas de integración con limpieza de base de datos automatizada tras cada test.

---

## 🚀 Instalación y Despliegue Local

### Requisitos previos

- Node.js (v24+)
- PostgreSQL en ejecución

### Pasos de instalación

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/MarceJua/API_Design.git](https://github.com/MarceJua/API_Design.git)
   cd API_Design
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y configura tus credenciales de base de datos y secretos JWT:
   ```bash
   cp .env.example .env
   # Edita .env con tus valores
   ```
4. **Sincronizar la base de datos:**
   ```bash
   npm run db:push
   ```
5. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

## Referencia de la API (Endpoints Principales)

Todas las rutas (excepto login/register y health check) requieren un encabezado de autorización:
Authorization: Bearer <tu_token_jwt>

### 🔐 Autenticación (/api/auth)

- POST /register: Registra un nuevo usuario con validación estricta de contraseña y correo.

- POST /login: Retorna el payload del usuario y el token JWT.

### 👤 Usuarios (/api/users)

- GET /profile: Obtiene la información del usuario autenticado de forma segura.

- PUT /profile: Actualiza los datos del usuario.

- POST /change-password: Permite la rotación de credenciales.

### 📅 Hábitos (/api/habits)

- GET /: Lista todos los hábitos del usuario, resolviendo automáticamente las relaciones de sus etiquetas (Tags).

- POST /: Crea un hábito (Soporta vinculación inmediata con IDs de etiquetas).

- PUT /:id: Actualiza un hábito completo.

- DELETE /:id: Elimina un hábito de forma segura.

- POST /:id/complete: Registra el cumplimiento del hábito. Regla de negocio: Validado para permitir un solo registro por día.

### 🏷️ Etiquetas/Tags (/api/tags)

- GET /: Lista las etiquetas disponibles.

- POST /: Crea una nueva etiqueta.

- GET /:id/habits: Obtiene todos los hábitos de un usuario agrupados bajo una etiqueta específica.

## 🧪 Testing

El proyecto utiliza Vitest con hilos secuenciales aislados para evitar colisiones en la base de datos de prueba.

```
# Ejecutar todas las pruebas de integración
npm test

# Ejecutar pruebas con reporte de cobertura
npm run test:coverage
```

---
