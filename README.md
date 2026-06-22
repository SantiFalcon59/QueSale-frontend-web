# QueSale - Frontend Web

Cliente web de la plataforma QueSale, desarrollado con React y Vite.

## Stack Tecnológico

- **Core**: React 19 & Vite
- **Estilos**: TailwindCSS / Vanilla CSS
- **Autenticación**: Firebase Client SDK
- **Mapas**: @vis.gl/react-google-maps (Google Maps Platform)
- **Iconos**: Lucide React

## Requisitos Previos

- Node.js (v18 o superior)
- API Key de Google Maps Platform
- Configuración de Firebase Project

## Configuración y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno (`.env`):
   ```env
   VITE_API_URL=http://localhost:3016
   VITE_GOOGLE_MAPS_PLATFORM_KEY=tu_api_key_aqui
   ```

3. Iniciar servidor de desarrollo local:
   ```bash
   npm run dev
   ```
