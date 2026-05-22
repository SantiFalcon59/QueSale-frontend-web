# Estructura de Base de Datos - QueSale Geek

Este documento detalla las colecciones, documentos y relaciones en la base de datos de Firebase Firestore para la plataforma QueSale Geek.

## Jerarquía de Colecciones

### 1. `users` (Usuarios)
Contiene la información de perfil de los ciudadanos de la plataforma.
- **Campos:**
  - `displayName`: Nombre visible.
  - `username`: Identificador único (ej: @santipingui).
  - `email`: Correo electrónico.
  - `photoURL`: URL de la imagen de perfil.
  - `role`: Rango (`admin`, `moderator`, `user`).
  - `bio`: Biografía o descripción del usuario.
  - `interests`: Array de categorías de interés.
  - `stats`: Objeto con contadores (`events`, `followers`, `following`, `vibeScore`).
  - `createdAt`, `updatedAt`: Timestamps de gestión.
- **Subcolecciones:**
  - `wall` (Muro Personal): Publicaciones hechas en el perfil del usuario.
    - **Campos:** `content`, `authorId`, `authorName`, `authorPhoto`, `likes` (mapa de IDs), `likesCount`, `commentsCount`, `createdAt`.
    - `comments` (Comentarios): Respuestas a cada publicación en el muro.
      - **Campos:** `content`, `authorId`, `authorName`, `authorPhoto`, `createdAt`.
  - `favorites`: Referencias a eventos guardados por el usuario.
  - `notifications` (Centro de Alertas): Avisos sobre likes, comentarios o actualizaciones.
    - **Campos:** `type`, `fromId`, `fromName`, `fromPhoto`, `targetId`, `targetType`, `message`, `targetLink`, `isRead`, `createdAt`.

### 2. `usernames` (Índice de Nicks)
Utilizado para garantizar la unicidad de los nombres de usuario.
- **Documento:** `{username}` (ej: santipingui)
- **Campos:**
  - `userId`: Referencia al UID del usuario dueño de ese nick.

### 3. `organizers` (Organizaciones)
Entidades (empresas o grupos) que crean y gestionan eventos. Cada organizador puede tener múltiples administradores.
- **Campos:**
  - `ownerId`: UID del creador original.
  - `admins`: Mapa de UIDs con permisos (ej: `{ "UID123": true }`).
  - `name`: Nombre de la organización.
  - `description`: Sobre la organización.
  - `logo`: URL de la imagen de marca.
  - `verificationLevel`: Nivel de confianza (0-2). El nivel 2 permite venta de tickets.
  - `socials`: Objeto con `instagram`, `twitter`, `website`.

### 4. `events` (Eventos)
El núcleo de la plataforma, donde ocurre la interacción social y venta de entradas.
- **Campos:**
  - `title`, `description`, `category`.
  - `organizerId`: Referencia a la organización dueña.
  - `date`: Timestamp de inicio.
  - `location`: Objeto con `address` (string), `lat` (number), `lng` (number).
  - `price`: Costo de la entrada general.
  - `capacity`: Cupo máximo de personas.
  - `attendeesCount`: Contador de tickets vendidos/validados.
  - `image`: URL del banner principal.
  - `media`: Array de URLs para la galería de fotos.
  - `status`: Estado actual (`active`, `cancelled`, `completed`).
- **Subcolecciones:**
  - `posts` (Muro del Evento): Publicaciones de los usuarios sobre el evento.
    - **Campos:** `content`, `userId`, `type` (`query`, `comment`, `poll`, `feedback`), `likes`, `createdAt`.
  - `announcements` (Anuncios): Comunicados oficiales del organizador para este evento.
    - **Campos:** `title`, `content`, `media` (array), `createdAt`.
  - `chat` (Live Chat): Mensajes del chat en tiempo real.
    - **Campos:** `content`, `userId`, `createdAt`.

### 5. `tickets` (Entradas)
Documentos que acreditan el acceso de un usuario a un evento específico.
- **Campos:**
  - `userId`: Referencia al comprador.
  - `eventId`: Referencia al evento.
  - `status`: Estado del ticket (`active`, `used`, `cancelled`).
  - `purchasedAt`: Timestamp de compra.
  - `validatedAt`: Timestamp de validación en la puerta del evento.

---

## Nota sobre Communities (Comunidades)
Actualmente, la vista de **Comunidades** utiliza datos locales (Mock Data) para la interfaz de exploración y actividad. En una fase futura, estas se integrarán como una colección raíz `communities` con subcolecciones de `members` y `channels`.

---

## Roles y Permisos (Seguridad)

La seguridad está definida en `firestore.rules` basándose en los siguientes roles:

1. **User (Usuario):** Puede crear sus propios perfiles, publicar en muros y comprar tickets.
2. **Moderator (Moderador):** Tiene permisos adicionales para eliminar contenido en chats en vivo y muros de eventos/usuarios para mantener la convivencia.
3. **Admin (Administrador):** Control total del sistema, incluyendo asignación de roles y validación de organizaciones. Permiso para borrar cualquier documento.
4. **Organizer (Organizador):** Dueño de la gestión de sus eventos y anuncios.

## Relaciones Principales

- **Un Usuario puede ser parte de N Organizaciones** (vía el mapa `admins`).
- **Una Organización tiene N Eventos**.
- **Un Evento tiene N Mensajes de Chat y N Publicaciones**.
- **Un Usuario tiene N Tickets**, cada uno vinculado a **un Evento**.
- **Un Usuario tiene N Favoritos**, vinculados a **eventos**.
