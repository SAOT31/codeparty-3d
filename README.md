# CodeParty 3D - Videojuego de Tablero y Trivia Multijugador 3D

CodeParty 3D es un videojuego educativo multijugador 3D en tiempo real inspirado en dinamicas de juegos de tablero y trivia tecnologica. Los jugadores compiten recorriendo un circuito de casillas tematicas en 3D, lanzando dados con fisicas de animacion, respondiendo preguntas de programacion generadas por Inteligencia Artificial (Google Gemini) y activando habilidades estrategicas para alcanzar la meta de Estrellas o Puntos/Monedas.

---

## Tabla de Contenidos
- Arquitectura y Patrones de Diseno
- Tipo de Encarpetado
- Caracteristicas Principales
- Patrones de Software Implementados
- Flujo de Juego y Rotacion de Turnos
- Tecnologias Utilizadas
- Estructura del Proyecto
- Reglas de Negocio y Control de Concurrencia
- Base de Datos Local en Docker
- Instalacion y Puesta en Marcha

---

## Arquitectura y Patrones del Sistema

### 1. Modelo de Arquitectura General
El proyecto esta construido bajo el patron de **Monolito Modular Desacoplado (Decoupled Modular Architecture)** con separacion estricta entre Cliente, Servidor y Base de Datos:

- **Frontend (Cliente SPA)**: Aplicacion web de pagina unica en Angular 17 con motor 3D en Three.js.
- **Backend (Servidor de Lógica y WebSockets)**: Servidor monolitico modular en NestJS que orquesta tanto la API REST como la pasarela de eventos en tiempo real.
- **Base de Datos (Persistencia Local)**: PostgreSQL 16 ejecutado en un contenedor aislado de Docker.
- **Orquestacion**: Administrado como un entorno multi-contenedor mediante Docker Compose.

### 2. Patron de Comunicacion Hibrido (REST + Event-Driven)
- **Capa REST (HTTP)**: Utilizada para operaciones sin estado (creacion de salas, consulta de salas activas, generacion de preguntas).
- **Capa Event-Driven / Pub-Sub (WebSockets con Socket.IO)**: Utilizada para la sincronizacion de estado en tiempo real (movimiento de jugadores, lanzamiento de dados, rotacion de turnos, eventos de casillas y desconexiones).

### 3. Patron de Capas en Backend (Layered Architecture: Controller - Service - Repository)
El backend en NestJS sigue la arquitectura en tres capas:
1. **Capa de Controladores / Gateways**: Recibe peticiones HTTP (`SalasController`, `AiController`) y mensajes Socket.IO (`ArenaGateway`).
2. **Capa de Servicios / Casos de Uso**: Contiene la logica del juego, gestion de turnos y comunicacion con IA (`SalasService`, `AiService`).
3. **Capa de Infraestructura / Persistencia**: Administra las conexiones a PostgreSQL mediante `pg.Pool` (`SupabaseService`).

### 4. Patron del Frontend (Component-Driven + Reactive Services)
El frontend en Angular 17 se estructura mediante:
- **Component-Driven Architecture**: Componentes Standalone reutilizables y autocontenidos (`ArenaComponent`, `HudComponent`, `LobbyComponent`, `HomeComponent`).
- **Reactive State Management**: Servicios singleton (`SocketService`, `ApiService`, `SoundService`, `BotService`) que exponen flujos observables de RxJS para mantener sincronizada la interfaz reactivamente.

---

## Tipo de Encarpetado

El proyecto utiliza el patron de **Encarpetado por Caracteristicas / Dominio (Feature-Based / Domain-Driven Packaging)** en lugar de un encarpetado puramente por tipos tecnicos:

### Ventajas del Encarpetado por Dominio
- **Alta Cohesion**: Todos los archivos relacionados con una misma funcionalidad (componente, estilos, logica 3D, fabrica) se ubican en la misma carpeta.
- **Bajo Acoplamiento**: Los modulos son independientes y faciles de escalar o modificar sin afectar el resto del sistema.

### Distribucion de Modulos:
- `backend/src/salas/`: Contiene controlador, servicio y DTOs del dominio de salas.
- `backend/src/gateway/`: Contiene la logica de sockets y sincronizacion de partidas.
- `backend/src/ai/`: Contiene la integracion con Google Gemini y bancos de preguntas.
- `frontend/src/app/arena/`: Contiene el tablero 3D (`board/`), personajes 3D (`characters/`), escenarios (`scenarios/`), HUD y camara.
- `frontend/src/app/lobby/`: Contiene la sala de espera, seleccion de personajes y votacion de escenarios.
- `frontend/src/app/home/`: Contiene la pantalla de bienvenida y el panel de union a salas.
- `shared/`: Tipos de datos e interfaces TypeScript compartidas entre frontend y backend.

---

## Diagrama de la Arquitectura del Sistema

```text
========================================================================================
                                CLIENTE (FRONTEND)
                       Angular 17 Standalone + Three.js
                        [Encarpetado por Caracteristicas]
----------------------------------------------------------------------------------------
 [ Interfaz de Usuario / HUD ]  <--->  [ Motor 3D Three.js / Camara Orbital / Dado ]
               |                                       |
    [ HttpClient / REST ]                   [ SocketService (Socket.IO Client) ]
========================================================================================
                                      | | (HTTP + WebSockets)
                                      v v
========================================================================================
                                SERVIDOR (BACKEND)
                         NestJS 10 (Monolito Modular)
                          [Capas: Gateway -> Service -> DB]
----------------------------------------------------------------------------------------
 [ SalasController ]    [ AiController ]    <--->    [ ArenaGateway (WebSocket Pub/Sub) ]
         |                    |                                  |
         +----------+---------+----------------------------------+
                    |
          [ SalasService / pg.Pool ]       [ AiService / Google Generative AI ]
========================================================================================
               |                                            |
               v                                            v
========================================================================================
     BASE DE DATOS LOCAL (DOCKER)                     SERVICIO EXTERNO
  PostgreSQL 16 (docker-compose:5433)           Google Gemini 1.5 Flash API
  Tablas: salas, jugadores, preguntas           Generacion de preguntas en JSON
========================================================================================
```

---

## Caracteristicas Principales

### Renderizado 3D Interactivo con Three.js
- Escenarios 3D procedurales: Isla Arcoiris, Volcan Codigo, Galaxia Pixel y Sugar Kingdom.
- Modelos de personajes tridimensionales animados con saltos parabolicos: Estrella, Hongo, Cristal y Cohete.
- Dado 3D interactivo con fisicas de giro, detencion en el aire e impacto mediante animacion del personaje.
- Camara orbital en tercera persona con soporte para raton, gestos tactiles en dispositivos moviles (rotacion y zoom pinch) y teclado.

### Modos de Juego Multijugador
- Modo Red Local (LAN / Wi-Fi): Conexion simultanea entre ordenadores y dispositivos moviles detectando automaticamente la IP de la red local.
- Modo Local (Mismo PC): Partidas de 1 a 4 participantes con soporte de Bots de Inteligencia Artificial configurables en 3 niveles de dificultad (Basico, Intermedio, Avanzado).

### Condiciones de Victoria Configurables
- El anfitrion define las metas al crear la partida:
  - Meta de Estrellas: 1, 2, 3 o 5 estrellas.
  - Meta de Puntos / Monedas: 50, 100, 150 o 200 puntos.
- Victoria inmediata al alcanzar cualquiera de los dos objetivos, eliminando limitaciones artificiales de rondas fijas.

### Generacion de Preguntas con IA y Respaldo Local
- Integracion con Google Gemini 1.5 Flash para generar preguntas de programacion en tiempo real segun el tema seleccionado (Angular, TypeScript, JavaScript, Python, SQL, etc.).
- Sistema de tolerancia a fallos con triple redundancia: Google Gemini API -> Base de datos PostgreSQL local en Docker -> Banco de preguntas estatico offline.

### Sistema de Audio Procedural con Web Audio API
- Efectos de sonido sintetizados en tiempo real y musica adaptativa por escenario sin requerir archivos pesados externos.

---

## Patrones de Software Implementados

### 1. Patrón Fabrica (Factory Pattern)
- CharacterFactory: Instancia dinamicamente los modelos de personajes 3D (StarCharacter, MushroomCharacter, CrystalCharacter, RocketCharacter) encapsulando geometrias, materiales, iluminacion y animaciones.
- ScenarioFactory: Construye proceduralmente terrenos 3D, elementos del entorno e iluminacion segun el escenario seleccionado.

### 2. Patrón Maquina de Estados (State Machine Pattern)
- BoardEngine y ArenaComponent gestionan el ciclo de vida del turno:
  Esperando Tiro -> Dado Girando -> Detencion / Impacto -> Desplazamiento por Casillas -> Efecto de Casilla -> Validacion de Victoria -> Siguiente Turno.

### 3. Patrón Observador (Observer Pattern / Reactive Streams)
- SocketService expone flujos reactivos con RxJS (roomState$, boardTurnStart$, boardDiceResult$, boardPlayerUpdated$, gameOver$) permitiendo que los componentes Angular reaccionen de manera desacoplada a los eventos del servidor.

### 4. Patrón Pasarela (Gateway Pattern) y Pub/Sub
- ArenaGateway centraliza la comunicacion bidireccional mediante Socket.IO, gestionando salas aisladas, difusion de estados de juego, sincronizacion de tiradas de dados y reconexiones.

### 5. Patrón Estrategia de Respaldo (Fallback Strategy Pattern)
- AiService implementa una estrategia de contingencia escalonada:
  1. Consulta a Google Gemini API para generar preguntas tecnicas con formato JSON estricto.
  2. Si la cuota o conexion fallan, consulta la base de datos PostgreSQL local de forma aleatoria.
  3. Si la base de datos no esta disponible, recurre al banco de preguntas estatico local.

### 6. Patrón Bloqueo Transaccional Concurrente (Pessimistic Locking Pattern)
- La funcion PostgreSQL unirse_sala_concurrente utiliza pg_advisory_xact_lock para serializar los accesos a nivel de base de datos y evitar condiciones de carrera cuando multiples jugadores intentan unirse a una sala simultaneamente.

---

## Flujo de Juego y Rotacion de Turnos

El ciclo de turnos multijugador sincroniza los eventos entre todos los dispositivos conectados mediante WebSockets:

1. Inicio de Turno:
   El servidor emite `board-turn-start` indicando el ID del jugador activo y las metas de victoria.
2. Lanzamiento de Dado:
   El jugador activo emite `board-hit-dice`. El servidor calcula el resultado y lo difunde a todos con `board-dice-result`.
3. Desplazamiento 3D:
   Todos los clientes reproducen la animacion de saltos parabolicos del personaje por las casillas correspondientes.
4. Efecto de Casilla:
   Se procesa el efecto (Azul: +10 monedas, Roja: -5 monedas, Estrella: +1 estrella / +30 pts, Trivia: pregunta interactiva).
5. Actualizacion de Marcador:
   El servidor difunde `board-player-updated` con las nuevas estrellas y monedas.
6. Evaluacion de Victoria:
   - Si el jugador activo alcanza la meta de estrellas o de puntos, el servidor emite `game-over` declarando al ganador inmediatamente.
   - Si no se alcanzo la meta, el jugador emite `board-end-turn` y el turno pasa al siguiente participante en la rotacion.

---

## Base de Datos Local en Docker

El proyecto no depende de servicios de base de datos en la nube. Todo el almacenamiento se ejecuta de forma 100% local a traves del contenedor PostgreSQL incluido en `docker-compose.yml`:

- Contenedor Docker: `codeparty_postgres` (PostgreSQL 16 Alpine).
- Puerto interno (Docker Network): `5432`
- Puerto expuesto en Host (PC): `5433`
- Base de datos: `codeparty`
- Usuario: `postgres`
- Contrasena: `postgres`
- Inicializacion automatica: El archivo `supabase_migration.sql` se ejecuta al levantar Docker y crea las tablas `salas`, `jugadores`, `preguntas` (con 93 preguntas tecnicas precargadas) y la funcion `unirse_sala_concurrente`.

### Cadenas de Conexion (DATABASE_URL)
- Conexion dentro de la red Docker (Backend en contenedor):
  `postgresql://postgres:postgres@postgres:5432/codeparty`
- Conexion directa desde el PC (DBeaver, pgAdmin, Node local):
  `postgresql://postgres:postgres@localhost:5433/codeparty`

---

## Tecnologias Utilizadas

| Capa | Tecnologia | Proposito |
| :--- | :--- | :--- |
| Frontend | Angular 17 | Arquitectura SPA, Standalone Components, Routing y RxJS |
| Graficos 3D | Three.js (r128) | Mallas procedimentales, luces, sombras, particulas y WebGL |
| Estilos | SCSS Modular | Diseno responsive, Glassmorphism y animaciones de interfaz |
| Backend | NestJS 10 | Framework modular de Node.js, arquitectura por capas y REST API |
| Tiempo Real | Socket.IO 4 | WebSockets de baja latencia con soporte para salas y reconexion |
| Inteligencia Artificial | Google Generative AI | Modelo Gemini 1.5 Flash para generacion dinamica de preguntas |
| Base de Datos | PostgreSQL 16 | Persistencia relacional local en Docker, funciones almacenadas y bloqueos |
| Contenedores | Docker y Docker Compose | Orquestacion multi-contenedor (PostgreSQL, Backend, Frontend) |

---

## Estructura del Proyecto

```text
CodeArena 3D/
├── backend/
│   ├── src/
│   │   ├── ai/                     # Dominio de IA con Google Gemini y fallback
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   └── fallback-questions.ts
│   │   ├── gateway/                # WebSocket Gateway con Socket.IO
│   │   │   ├── arena.gateway.ts    # Control de partidas en vivo, dados y turnos
│   │   │   └── gateway.module.ts
│   │   ├── salas/                  # Dominio de gestion y listado de salas
│   │   │   ├── salas.controller.ts
│   │   │   └── salas.service.ts
│   │   ├── supabase/               # Conexion nativa a PostgreSQL (pg.Pool)
│   │   │   └── supabase.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── arena/              # Dominio Tablero 3D, HUD, personajes y camaras
│   │   │   │   ├── board/          # Generacion del circuito de 36 casillas
│   │   │   │   ├── characters/     # Fabrica y clases de personajes 3D
│   │   │   │   ├── hud/            # Marcador superior, botones y habilidades
│   │   │   │   ├── question-modal/ # Modal de trivia con temporizador
│   │   │   │   ├── scenarios/      # Fabrica de escenarios 3D
│   │   │   │   ├── camera.controller.ts
│   │   │   │   ├── input.handler.ts
│   │   │   │   └── arena.component.ts
│   │   │   ├── home/               # Dominio Pantalla de inicio y seleccion de salas
│   │   │   ├── lobby/              # Dominio Sala de espera, seleccion y votacion
│   │   │   └── services/           # SocketService, ApiService, SoundService, BotService
│   │   ├── styles.scss             # Estilos globales y variables de diseno
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Orquestador multi-contenedor
├── supabase_migration.sql          # Script SQL de inicializacion (tablas y preguntas)
├── .env.example                    # Plantilla de variables de entorno
└── .gitignore                      # Reglas de exclusion para control de versiones
```

---

## Reglas de Negocio y Control de Concurrencia

- R1 - Codigo de Sala Unico: Identificadores alfanumericos de 6 caracteres generados mediante nanoid que garantizan unicidad en la creacion de partidas.
- R2 - Limite Estricto de 4 Jugadores: Cada sala permite un maximo de 4 participantes activos. Si un quinto jugador intenta unirse, la solicitud es rechazada con codigo HTTP 400 Bad Request y mensaje SALA_LLENA.
- R3 - Bloqueo de Concurrencia Transaccional: La funcion SQL unirse_sala_concurrente bloquea transaccionalmente la sala con pg_advisory_xact_lock para evitar sobrecupo en accesos concurrentes simultaneos.
- R4 - Formato Valido de Preguntas: Cada pregunta validada por IA o base de datos contiene enunciado, 4 opciones unicas, indice de respuesta correcta (0-3) y nivel de dificultad.
- R5 - Auto-Limpieza de Salas Inactivas: Las salas finalizadas o cuyos jugadores se han desconectado son marcadas automaticamente como FINISHED y eliminadas de la lista publica para evitar salas huerfanas.

---

## Instalacion y Puesta en Marcha

### Prerrequisitos
- Docker Desktop instalado y en ejecucion.
- Node.js v18+ (opcional, para ejecucion sin contenedores).

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/codeparty-3d.git
cd codeparty-3d
```

### 2. Configurar Variables de Entorno
Copiar la plantilla de variables de entorno:
```bash
cp .env.example backend/.env
```

Configurar `backend/.env` con los valores correspondientes:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/codeparty
GEMINI_API_KEY=tu_clave_de_google_gemini_aqui
HOST_IP=192.168.1.4
```

### 3. Ejecutar con Docker Compose
Ejecutar el siguiente comando en la raiz del proyecto:
```bash
docker compose up --build
```

Servicios iniciados por el orquestador:
- PostgreSQL: `localhost:5433` (Base de datos local inicializada con esquema y preguntas).
- Backend NestJS: `http://localhost:3000`
- Frontend Angular: `http://localhost:4200`

---

## Acceso a la Aplicacion

| Dispositivo | URL de Acceso |
| :--- | :--- |
| PC Anfitrion (Local) | `http://localhost:4200` |
| Dispositivos en Misma Red Wi-Fi | `http://TU_IP_LOCAL:4200` (Ejemplo: `http://192.168.1.4:4200`) |
| API Backend | `http://localhost:3000` |
| Base de Datos PostgreSQL | `localhost:5433` (usuario: postgres, clave: postgres, db: codeparty) |
