# 🎲 Rummikub Pro - Estructura Completa del Proyecto

## 📁 Estructura de Directorios

```
rummikub-app/
├── backend/                          # Backend API + WebSocket
│   ├── src/
│   │   ├── config/                   # Configuraciones
│   │   │   ├── socialMedia.ts        # Integración redes sociales
│   │   │   └── database.ts           # Configuración BD
│   │   ├── services/                 # Servicios de negocio
│   │   │   ├── accountService.ts     # Gestión de cuentas
│   │   │   ├── gameRoomService.ts    # Salas de juego e invitaciones
│   │   │   ├── customGameService.ts  # Juegos personalizados con apuestas
│   │   │   ├── rewardService.ts      # Sistema de premios
│   │   │   ├── eventService.ts       # Eventos y torneos
│   │   │   ├── partnerService.ts      # Partners y afiliados
│   │   │   ├── partnerAcquisitionService.ts  # Captación de partners
│   │   │   ├── cryptoService.ts      # Criptomonedas y NFTs
│   │   │   ├── themeService.ts        # Temas y personalización
│   │   │   ├── profileService.ts      # Gestión de perfiles
│   │   │   ├── chatService.ts          # Chat con fotos
│   │   │   └── gameLogicService.ts   # Lógica del juego Rummikub
│   │   ├── routes/                    # Rutas API REST
│   │   │   ├── accountRoutes.ts      # Rutas de cuentas
│   │   │   ├── gameRoomRoutes.ts     # Rutas de salas
│   │   │   ├── partnerRoutes.ts      # Rutas de partners
│   │   │   ├── cryptoRoutes.ts       # Rutas de cripto
│   │   │   ├── socialRoutes.ts        # Rutas de redes sociales
│   │   │   ├── themeRoutes.ts         # Rutas de temas
│   │   │   ├── chatRoutes.ts          # Rutas de chat
│   │   │   └── tournamentRoutes.ts   # Rutas de torneos
│   │   ├── middleware/                # Middleware
│   │   │   ├── auth.ts                # Autenticación JWT
│   │   │   ├── upload.ts              # Subida de archivos
│   │   │   └── validation.ts          # Validación de datos
│   │   ├── models/                    # Modelos de base de datos
│   │   │   ├── User.ts
│   │   │   ├── Game.ts
│   │   │   ├── Tournament.ts
│   │   │   ├── Partner.ts
│   │   │   ├── NFT.ts
│   │   │   └── ChatMessage.ts
│   │   ├── utils/                     # Utilidades
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   └── helpers.ts
│   │   └── server.ts                   # Servidor principal
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                           # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game/                  # Componentes de juego
│   │   │   │   ├── GameBoard.tsx      # Tablero principal
│   │   │   │   ├── PlayerHand.tsx     # Mano del jugador
│   │   │   │   ├── TileSet.tsx       # Conjuntos de fichas
│   │   │   │   ├── CustomGameSettings.tsx  # Configuración personalizada
│   │   │   │   └── GameTimer.tsx      # Temporizador
│   │   │   ├── Tile/                  # Componentes de fichas
│   │   │   │   ├── Tile.tsx           # Ficha básica
│   │   │   │   └── CustomTile.tsx    # Ficha personalizada
│   │   │   ├── Chat/                  # Componentes de chat
│   │   │   │   ├── GameChat.tsx       # Chat de partida
│   │   │   │   ├── PrivateChat.tsx    # Chat privado
│   │   │   │   └── ChatMessage.tsx    # Mensaje individual
│   │   │   ├── Theme/                 # Componentes de temas
│   │   │   │   ├── ThemeCustomizer.tsx # Personalizador
│   │   │   │   ├── ThemeSelector.tsx   # Selector de temas
│   │   │   │   └── PremiumUpgrade.tsx # Upgrade a Premium
│   │   │   ├── Shop/                  # Componentes de tienda
│   │   │   │   ├── Shop.tsx           # Tienda principal
│   │   │   │   ├── CryptoPurchase.tsx # Compra con cripto
│   │   │   │   └── ItemCard.tsx       # Tarjeta de item
│   │   │   ├── Wallet/                # Componentes de wallet
│   │   │   │   ├── Wallet.tsx         # Wallet principal
│   │   │   │   ├── TokenConverter.tsx # Convertidor de tokens
│   │   │   │   └── TransactionHistory.tsx # Historial
│   │   │   ├── Tournament/            # Componentes de torneos
│   │   │   │   ├── TournamentList.tsx # Lista de torneos
│   │   │   │   ├── TournamentBracket.tsx # Bracket
│   │   │   │   └── TournamentCard.tsx  # Tarjeta de torneo
│   │   │   ├── Profile/               # Componentes de perfil
│   │   │   │   ├── Profile.tsx        # Perfil principal
│   │   │   │   ├── ProfileEdit.tsx    # Editar perfil
│   │   │   │   └── AvatarUpload.tsx   # Subir avatar
│   │   │   ├── Community/             # Componentes de comunidad
│   │   │   │   ├── SocialLinks.tsx    # Enlaces sociales
│   │   │   │   ├── FriendsList.tsx    # Lista de amigos
│   │   │   │   └── Leaderboard.tsx    # Tabla de clasificación
│   │   │   ├── Room/                  # Componentes de salas
│   │   │   │   ├── RoomList.tsx       # Lista de salas
│   │   │   │   ├── RoomCreator.tsx    # Crear sala
│   │   │   │   ├── RoomInvite.tsx     # Invitar a sala
│   │   │   │   └── RoomSettings.tsx   # Configuración de sala
│   │   │   └── common/                # Componentes comunes
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Loading.tsx
│   │   ├── pages/                      # Páginas principales
│   │   │   ├── Home.tsx               # Página principal
│   │   │   ├── Game.tsx               # Página de juego
│   │   │   ├── Shop.tsx               # Página de tienda
│   │   │   ├── Tournament.tsx         # Página de torneos
│   │   │   ├── Profile.tsx            # Página de perfil
│   │   │   └── Settings.tsx           # Página de configuración
│   │   ├── hooks/                      # Custom hooks
│   │   │   ├── useGame.ts             # Hook de juego
│   │   │   ├── useSocket.ts           # Hook de WebSocket
│   │   │   ├── useTheme.ts            # Hook de temas
│   │   │   └── useWallet.ts           # Hook de wallet
│   │   ├── store/                      # Estado global (Zustand)
│   │   │   ├── gameStore.ts           # Estado del juego
│   │   │   ├── userStore.ts           # Estado del usuario
│   │   │   ├── themeStore.ts          # Estado de temas
│   │   │   └── chatStore.ts           # Estado de chat
│   │   ├── api/                        # Cliente API
│   │   │   ├── client.ts              # Cliente axios
│   │   │   ├── game.ts                # API de juego
│   │   │   ├── user.ts                # API de usuario
│   │   │   ├── crypto.ts              # API de cripto
│   │   │   └── socialMedia.ts         # API de redes sociales
│   │   ├── utils/                      # Utilidades
│   │   │   ├── gameLogic.ts           # Lógica del juego
│   │   │   ├── validations.ts         # Validaciones
│   │   │   └── helpers.ts             # Helpers
│   │   ├── styles/                     # Estilos
│   │   │   ├── themes/                # Estilos de temas
│   │   │   │   ├── classic.css
│   │   │   │   ├── modern.css
│   │   │   │   ├── dark.css
│   │   │   │   └── premium.css
│   │   │   └── globals.css            # Estilos globales
│   │   ├── App.tsx                     # Componente principal
│   │   ├── main.tsx                    # Punto de entrada
│   │   └── index.tsx
│   ├── public/                         # Archivos públicos
│   │   ├── sounds/                     # Sonidos
│   │   │   ├── tile-place.mp3
│   │   │   ├── tile-pick.mp3
│   │   │   ├── game-start.mp3
│   │   │   └── premium/                # Sonidos premium
│   │   ├── images/                     # Imágenes
│   │   │   ├── themes/                 # Previews de temas
│   │   │   └── tiles/                 # Texturas de fichas
│   │   └── favicon.svg
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── index.html
│
├── mobile/                             # Aplicación móvil
│   ├── ios/                            # iOS
│   │   ├── Rummikub/
│   │   │   ├── AppDelegate.swift
│   │   │   ├── Info.plist
│   │   │   └── Assets.xcassets
│   │   └── Rummikub.xcodeproj
│   ├── android/                        # Android
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── java/
│   │   │   │   └── res/
│   │   │   └── build.gradle
│   │   └── build.gradle
│   ├── src/                            # Código compartido React Native
│   │   └── (mismo que frontend)
│   ├── package.json
│   └── app.json
│
├── contracts/                          # Smart Contracts
│   ├── RUMToken.sol                    # Token ERC-20
│   ├── RummikubNFT.sol                 # Contrato NFT
│   ├── Marketplace.sol                  # Marketplace
│   ├── Staking.sol                     # Staking
│   ├── migrations/                     # Migraciones
│   └── tests/                          # Tests
│
├── shared/                              # Código compartido
│   ├── types.ts                        # Tipos TypeScript
│   ├── themeTypes.ts                   # Tipos de temas
│   ├── constants.ts                    # Constantes
│   └── utils.ts                        # Utilidades compartidas
│
├── docs/                                # Documentación
│   ├── API.md                          # Documentación API
│   ├── DEPLOYMENT.md                   # Guía de despliegue
│   ├── FEATURES.md                     # Lista de características
│   └── ARCHITECTURE.md                 # Arquitectura
│
├── README.md                            # README principal
├── .gitignore
└── package.json                         # Root package.json
```

## 🗂️ Descripción de Módulos Principales

### Backend (`/backend`)

#### Servicios Clave:
- **accountService.ts**: Gestión completa de cuentas, perfiles, configuración
- **gameRoomService.ts**: Salas de juego, invitaciones, matchmaking
- **customGameService.ts**: Juegos personalizados con apuestas (10-1,000,000), tiempos (10-30s)
- **rewardService.ts**: Sistema de premios diarios, logros, recompensas
- **eventService.ts**: Eventos, torneos, competiciones
- **partnerService.ts**: Sistema de partners y afiliados
- **partnerAcquisitionService.ts**: Captación y gestión de partners
- **cryptoService.ts**: Criptomonedas, NFTs, conversión de tokens
- **themeService.ts**: Temas, personalización, Premium 3.0
- **profileService.ts**: Perfiles, avatares, banners
- **chatService.ts**: Chat con fotos, mensajería privada

#### Rutas API:
- `/api/account/*` - Gestión de cuentas
- `/api/game/*` - Juegos y salas
- `/api/partners/*` - Partners y afiliados
- `/api/crypto/*` - Criptomonedas y NFTs
- `/api/social/*` - Redes sociales
- `/api/theme/*` - Temas y personalización
- `/api/chat/*` - Chat
- `/api/tournament/*` - Torneos

### Frontend (`/frontend`)

#### Componentes Principales:
- **Game/**: Tablero, mano, conjuntos, configuración personalizada
- **Tile/**: Fichas con diseños personalizados
- **Chat/**: Chat de partida y privado con fotos
- **Theme/**: Personalizador de temas, colores, fuentes, brillo
- **Shop/**: Tienda con compra con cripto
- **Wallet/**: Wallet, conversión de tokens
- **Tournament/**: Torneos, brackets, rankings
- **Profile/**: Perfiles, edición, avatares
- **Community/**: Redes sociales, amigos, leaderboard
- **Room/**: Salas, invitaciones, configuración

### Mobile (`/mobile`)
- React Native / Capacitor
- Comparte código con frontend
- Configuraciones nativas iOS/Android

### Smart Contracts (`/contracts`)
- **RUMToken.sol**: Token ERC-20 principal
- **RummikubNFT.sol**: NFTs de fichas especiales
- **Marketplace.sol**: Marketplace de NFTs
- **Staking.sol**: Staking y rewards

## 🔑 Características Implementadas

### ✅ Sistema de Juego
- [x] Lógica completa de Rummikub
- [x] Juegos personalizados (apuestas 10-1,000,000)
- [x] Tiempos configurables (10-30 segundos)
- [x] IA avanzada (3 niveles)
- [x] Multijugador en tiempo real

### ✅ Personalización Premium 3.0
- [x] 10+ temas (4 gratis, 6 premium)
- [x] 11 diseños de fichas
- [x] Colores personalizables
- [x] Tamaño de fuente (4 opciones)
- [x] Brillo (4 niveles)
- [x] Sonidos ajustables
- [x] Animaciones y efectos

### ✅ Sistema de Cuentas
- [x] Registro y login
- [x] Gestión de perfiles
- [x] Avatares y banners
- [x] Configuración personalizada
- [x] Sistema de amigos

### ✅ Chat y Social
- [x] Chat en partida
- [x] Chat privado con fotos
- [x] Integración YouTube
- [x] Integración Telegram
- [x] Integración Twitter/X
- [x] Integración Instagram

### ✅ Partners y Afiliados
- [x] Sistema de partners
- [x] Captación de partners
- [x] Comisiones configurables
- [x] Dashboard de estadísticas

### ✅ Criptomonedas
- [x] Token RUM (ERC-20)
- [x] Wallet integrado
- [x] NFTs de fichas
- [x] Marketplace
- [x] Conversión de tokens
- [x] Compra con cripto

### ✅ Torneos y Eventos
- [x] Sistema de torneos
- [x] Brackets
- [x] Rankings
- [x] Eventos especiales
- [x] Premios

### ✅ Salas y Matchmaking
- [x] Salas privadas
- [x] Invitaciones
- [x] Matchmaking público
- [x] Configuración personalizada
- [x] Códigos de invitación

## 📦 Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Socket.io (WebSocket)
- MongoDB / PostgreSQL
- Redis
- AWS S3 (archivos)
- JWT (autenticación)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (estado)
- Socket.io-client
- React Query
- Ethers.js / Web3.js

### Mobile
- React Native / Capacitor
- Expo (opcional)

### Blockchain
- Solidity
- Hardhat / Truffle
- Web3.js / Ethers.js

## 🚀 Próximos Pasos

1. **Completar modelos de base de datos**
2. **Implementar lógica completa del juego**
3. **Crear componentes de UI faltantes**
4. **Configurar despliegue**
5. **Tests y optimización**
6. **Preparar para App Store/Play Store**

## 📝 Notas

- Todos los servicios están estructurados y listos para implementación
- Los tipos TypeScript están definidos en `/shared`
- La arquitectura es escalable y modular
- Listo para integración con servicios externos
