# ⚡ Bobinas Express | WhatsApp AI Agent & Catálogo Modular en React

Aplicación web modular construida con **React 18**, **Vite** y **Tailwind CSS**, diseñada para la comercialización de bobinas de encendido automotriz con integración a **WhatsApp Cloud API** y conector multi-motor para **Supabase (PostgreSQL)**, **MongoDB Atlas**, **MySQL** y **LocalStorage**.

---

## 📁 Estructura Modular del Proyecto

```text
Bobinas Expres - Jeremy/
├── index.html                   # Entry HTML con Google Fonts & FontAwesome
├── package.json                 # Dependencias y scripts de Vite y Node
├── vite.config.js               # Configuración del bundler Vite con React
├── tailwind.config.js           # Paleta de colores de marca y WhatsApp
├── postcss.config.js            # PostCSS y Autoprefixer
├── .env.example                 # Variables de entorno para WhatsApp API y Supabase
├── server/
│   └── webhook-whatsapp.js      # Servidor Express Webhook oficial de WhatsApp
└── src/
    ├── main.jsx                 # Punto de entrada de React 18 (createRoot)
    ├── App.jsx                  # Orquestador principal y layout
    ├── index.css                # Directivas Tailwind, animaciones y scrollbars
    ├── data/
    │   └── seedData.js          # Catálogo inicial de bobinas y ventas históricas
    ├── utils/
    │   ├── formatters.js        # Normalización de datos y formatos monetarios
    │   ├── csvParser.js         # Parser RFC-4180 (manejo de comas entre comillas)
    │   └── whatsapp.js          # Normalización de teléfonos (+58) y generador de URLs
    ├── hooks/
    │   ├── useAIAgent.js        # Motor de IA: búsqueda por tokens y cierre de ventas
    │   └── useSoundEffects.js   # Efectos de audio Web Audio API (caja registradora)
    ├── context/
    │   ├── ToastContext.jsx     # Notificaciones flotantes en tiempo real
    │   ├── AuthContext.jsx      # Autenticación y control de acceso del Administrador
    │   ├── InventoryContext.jsx # Estado global del inventario, ventas y motores DB
    │   └── CartContext.jsx      # Carrito de compra privado y formulario de checkout
    └── components/
        ├── common/
        │   └── OwnerNotificationBanner.jsx  # Notificación flotante de venta al dueño
        ├── layout/
        │   ├── Header.jsx                   # Barra superior con navegación y carrito
        │   ├── TopNoticeBar.jsx             # Cinta superior de estado y despachos
        │   └── Footer.jsx                   # Pie de página y datos de contacto
        ├── catalog/
        │   ├── CatalogView.jsx              # Vista principal con banner y cuadrícula
        │   ├── CoilCard.jsx                 # Tarjeta individual de repuesto
        │   └── CatalogFilters.jsx           # Filtro por texto, marca dinámica y stock
        ├── simulator/
        │   ├── SimulatorView.jsx            # Interfaz interactiva de chat de WhatsApp
        │   ├── ChatMessage.jsx              # Burbujas de chat con botones transaccionales
        │   ├── ChatQuickPrompts.jsx         # Botones de consultas frecuentes
        │   └── DatabaseConsole.jsx          # Consola SQL y queries en vivo
        ├── sales/
        │   ├── SalesView.jsx                # Panel de auditoría con KPIs de ventas
        │   └── SalesTable.jsx               # Tabla de órdenes con reversión de stock
        ├── database/
        │   ├── DatabaseView.jsx             # Selector de motores (Supabase, Mongo, MySQL)
        │   └── InventoryTable.jsx           # Tabla CRUD completa del inventario
        ├── admin/
        │   └── AdminConfigView.jsx          # Configuración del bot, teléfono y prompt
        └── modals/
            ├── CartDrawer.jsx               # Carrito lateral deslizable y pedido a WA
            ├── AuthModal.jsx                # Modal de login de Administrador
            ├── ProductModal.jsx             # Modal para crear/editar bobinas
            ├── BulkImportModal.jsx          # Carga masiva con soporte CSV/JSON
            ├── SchemaCodeModal.jsx          # Visualizador de esquemas DDL y RPC
            └── ManualSaleModal.jsx          # Registro manual de ventas en almacén
```

---

## 🚀 Instalación y Puesta en Marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el entorno de desarrollo frontend (Vite)
```bash
npm run dev
```
La aplicación abrirá automáticamente en tu navegador en `http://localhost:3000`.

### 3. Iniciar el servidor backend de Webhook de WhatsApp (Opcional para producción)
```bash
npm run server
```
Inicia el webhook en `http://localhost:4000/v1/webhook/whatsapp`.

### 4. Compilar para producción
```bash
npm run build
```
Genera la carpeta optimizada `dist/` lista para desplegar en Vercel, Netlify o cualquier servidor estático.

---

## 🔑 Credenciales de Acceso Administrador

Para acceder a las vistas protegidas (**Auditoría de Ventas**, **Base de Datos & Stock**, y **Configurar IA**):
- **Usuario:** `admin` o `dueno`
- **Contraseña:** `admin123` o PIN `4747`

---

## 📱 Flujo de Notificación WhatsApp
- **Teléfono Oficial del Dueño:** `0412-6497478` (`+58 412-6497478`)
- Cuando un cliente hace clic en **"Enviar Pedido a WhatsApp"** o confirma una compra en el chat IA, el sistema descuenta automáticamente el stock de la base de datos y genera una URL de WhatsApp pre-rellenada con los datos de la orden para que el dueño reciba la confirmación inmediatamente.
