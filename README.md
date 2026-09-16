# CodeParty 3D - Videojuego de Tablero y Trivia Multijugador 3D

CodeParty 3D es un videojuego educativo multijugador 3D en tiempo real inspirado en dinamicas de juegos de tablero y trivia tecnologica. Los jugadores compiten recorriendo un circuito de casillas tematicas en 3D, lanzando dados con fisicas de animacion, respondiendo preguntas de programacion generadas por Inteligencia Artificial (Google Gemini) y activando habilidades estrategicas para alcanzar la meta de Estrellas o Puntos/Monedas.

## Despliegue en Produccion

El proyecto se encuentra desplegado y accesible publicamente con certificado SSL en:
https://codeparty3d.andrescortes.dev

## Arquitectura y Patrones del Sistema

### 1. Modelo de Arquitectura General
El proyecto esta construido bajo el patron de Monolito Modular Desacoplado con separacion estricta entre Cliente, Servidor y Base de Datos:

- Frontend (Cliente SPA): Aplicacion web en Angular 17 con motor 3D en Three.js estructurada en componentes standalone separados en logica (.ts), maquetado (.html) y estilos (.scss).
- Backend (Servidor de Logica y WebSockets): Servidor monolitico modular en NestJS que orquesta la API REST y la pasarela de eventos en tiempo real con Socket.IO.
- Base de Datos (Persistencia Local): PostgreSQL 16 ejecutado en un contenedor aislado de Docker.
- Orquestacion: Entorno multi-contenedor administrado mediante Docker Compose.

### 2. Patron de Comunicacion Hibrido (REST + Event-Driven)
- Capa REST (HTTP): Utilizada para operaciones sin estado (creacion de salas, consulta de salas activas, generacion de preguntas).
- Capa Event-Driven / Pub-Sub (WebSockets con Socket.IO): Utilizada para la sincronizacion de estado en tiempo real (movimiento de jugadores, lanzamiento de dados, rotacion de turnos, eventos de casillas y desconexiones).

### 3. Patron de Capas en Backend (Layered Architecture: Controller - Service - Repository)
1. Capa de Controladores / Gateways: Recibe peticiones HTTP (SalasController, AiController) y mensajes Socket.IO (ArenaGateway).
2. Capa de Servicios / Casos de Uso: Contiene la logica del juego, gestion de turnos y comunicacion con IA (SalasService, AiService).
3. Capa de Infraestructura / Persistencia: Administra las conexiones a PostgreSQL mediante pg.Pool (SupabaseService).

### 4. Patron del Frontend (Component-Driven + Reactive Services)
- Component-Driven Architecture: Componentes Standalone desacoplados con estructura profesional de tres archivos (component.ts, component.html, component.scss).
- Reactive State Management: Servicios singleton (SocketService, ApiService, SoundService, BotService) que exponen flujos observables de RxJS.

## Tipo de Encarpetado

El proyecto utiliza el patron de Encarpetado por Caracteristicas / Dominio (Feature-Based / Domain-Driven Packaging):

- backend/src/salas/: Controlador, servicio y logica del dominio de salas.
- backend/src/gateway/: Pasarela de WebSockets y sincronizacion de partidas en tiempo real.
- backend/src/ai/: Integracion con Google Gemini y bancos de preguntas de respaldo.
- frontend/src/app/arena/: Tablero 3D (board/), personajes 3D (characters/), escenarios (scenarios/), HUD y camara.
- frontend/src/app/lobby/: Sala de espera, seleccion de personajes y votacion de escenarios.
- frontend/src/app/home/: Pantalla de inicio, seleccion de modos y explorador de salas activas.
- frontend/src/app/services/: Servicios compartidos de audio, sockets, API REST y bots.

## Caracteristicas Principales

### Renderizado 3D Interactivo con Three.js
- 4 Escenarios 3D tematicos con geometria procedural:
  - Isla Tropical (isla-arcoiris): Entorno playero con palmeras, oceano animado y rocas costeras.
  - Reino Dulce (sugar-kingdom): Paisaje de dulces con paletas gigantes y bastones de caramelo.
  - Parque Magico (parque-diversiones): Parque de feria con carpas de circo iluminadas y ruedas de la fortuna giratorias.
  - Bosque Encantado (bosque-encantado): Bosque de fantasia con casas hongo magicas y cristales levitantes.
- Circuitos de 52 casillas con curvas CatmullRom y elevaciones tridimensionales.
- Modelos 3D de personajes animados con saltos parabolicos: Estrella, Hongo, Cristal y Cohete.
- Dado 3D interactivo con fisicas de rotacion, parada e impacto por cabezazo del personaje.
- Camara orbital en tercera persona con soporte para raton, gestos tactiles moviles y atajos de teclado.

### Modos de Juego Multijugador
- Modo Red Local (LAN / Wi-Fi): Conexion simultanea entre ordenadores y dispositivos moviles detectando automaticamente la IP de la red local.
- Modo Local (Mismo PC): Partidas de 1 a 4 participantes con soporte de Bots de Inteligencia Artificial configurables en 3 niveles de dificultad.

### Condiciones de Victoria Configurables
- Meta de Estrellas: 1, 2, 3 o 5 estrellas.
- Meta de Puntos / Monedas: 50, 100, 150 o 200 puntos.
- Victoria inmediata al alcanzar cualquiera de los dos objetivos.

### Generacion de Preguntas con IA y Respaldo Local
- Integracion con Google Gemini 1.5 Flash para generar preguntas de trivia en tiempo real.
- Sistema de tolerancia a fallos con triple redundancia: Google Gemini API -> Base de datos PostgreSQL local en Docker -> Banco de preguntas estatico offline.

### Sistema de Audio Sintetizado con Web Audio API
- Efectos de sonido y melodias procedurales en tiempo real para cada mundo y menu.
- Sistema de corte instantaneo con 0 ms de retardo al cambiar entre pantallas.
- Efectos de sonido para tiradas de dado, captura de estrellas, penalizaciones y fanfarrias de acierto/fallo en preguntas.

## Patrones de Software Implementados

### 1. Patron Fabrica (Factory Pattern)
- CharacterFactory: Instancia dinamicamente los modelos 3D de personajes encapsulando geometrias, materiales y animaciones.
- ScenarioFactory: Construye proceduralmente terrenos 3D, iluminacion y elementos ambientales segun el mundo seleccionado.

### 2. Patron Maquina de Estados (State Machine Pattern)
- BoardEngine y ArenaComponent gestionan el ciclo de vida del turno: Esperando Tiro -> Dado Girando -> Impacto -> Desplazamiento por Casillas -> Efecto de Casilla -> Validacion de Victoria -> Siguiente Turno.

### 3. Patron Observador (Observer Pattern / Reactive Streams)
- SocketService expone flujos reactivos con RxJS permitiendo que los componentes Angular reaccionen de manera desacoplada a los eventos del servidor.

### 4. Patron Pasarela (Gateway Pattern) y Pub/Sub
- ArenaGateway centraliza la comunicacion bidireccional mediante Socket.IO, gestionando salas aisladas, difusion de estados y reconexiones.

### 5. Patron Estrategia de Respaldo (Fallback Strategy Pattern)
- AiService implementa una estrategia escalonada: Gemini API -> PostgreSQL local -> Banco de preguntas offline.

### 6. Patron Bloqueo Transaccional Concurrente (Pessimistic Locking Pattern)
- La funcion PostgreSQL unirse_sala_concurrente utiliza pg_advisory_xact_lock para serializar los accesos y evitar condiciones de carrera.

## Flujo de Juego y Rotacion de Turnos

1. Inicio de Turno: El servidor emite board-turn-start indicando el jugador activo y las metas.
2. Lanzamiento de Dado: El jugador activo emite board-hit-dice. El servidor calcula el resultado y lo difunde con board-dice-result.
3. Desplazamiento 3D: Los clientes reproducen la animacion de saltos parabolicos del personaje por las 52 casillas.
4. Efecto de Casilla: Se procesa el efecto (Azul: +10 monedas, Roja: -5 monedas, Estrella: +1 estrella / +30 pts, Trivia: pregunta interactiva).
5. Actualizacion de Marcador: El servidor difunde board-player-updated con las nuevas estrellas y monedas.
6. Evaluacion de Victoria: Si el jugador activo alcanza la meta, el servidor emite game-over declarando al ganador.

## Base de Datos Local en Docker

- Contenedor Docker: codeparty_postgres (PostgreSQL 16 Alpine).
- Puerto interno (Docker Network): 5432
- Puerto expuesto en Host: 5433
- Base de datos: codeparty
- Usuario: postgres
- Contrasena: postgres
- Inicializacion automatica: El archivo supabase_migration.sql se ejecuta al levantar Docker y crea las tablas salas, jugadores, preguntas y la funcion unirse_sala_concurrente.

## Tecnologias Utilizadas

- Frontend: Angular 17 (Standalone Components, Routing, RxJS)
- Graficos 3D: Three.js (r128)
- Estilos: SCSS Modular (Glassmorphism, diseno responsive y animaciones)
- Backend: NestJS 10 (Arquitectura modular por capas y REST API)
- Tiempo Real: Socket.IO 4
- Inteligencia Artificial: Google Generative AI (Gemini 1.5 Flash)
- Base de Datos: PostgreSQL 16
- Contenedores: Docker y Docker Compose

## Estructura del Proyecto

```text
CodeArena 3D/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   └── fallback-questions.ts
│   │   ├── gateway/
│   │   │   ├── arena.gateway.ts
│   │   │   └── gateway.module.ts
│   │   ├── salas/
│   │   │   ├── salas.controller.ts
│   │   │   └── salas.service.ts
│   │   ├── supabase/
│   │   │   └── supabase.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── arena/
│   │   │   │   ├── board/
│   │   │   │   │   └── board.engine.ts
│   │   │   │   ├── characters/
│   │   │   │   │   ├── base.character.ts
│   │   │   │   │   ├── character.factory.ts
│   │   │   │   │   ├── crystal.character.ts
│   │   │   │   │   ├── mushroom.character.ts
│   │   │   │   │   ├── rocket.character.ts
│   │   │   │   │   └── star.character.ts
│   │   │   │   ├── hud/
│   │   │   │   │   ├── hud.component.html
│   │   │   │   │   ├── hud.component.scss
│   │   │   │   │   └── hud.component.ts
│   │   │   │   ├── question-modal/
│   │   │   │   │   ├── question-modal.component.html
│   │   │   │   │   ├── question-modal.component.scss
│   │   │   │   │   └── question-modal.component.ts
│   │   │   │   ├── scenarios/
│   │   │   │   │   ├── bosque-encantado.ts
│   │   │   │   │   ├── isla-arcoiris.ts
│   │   │   │   │   ├── parque-diversiones.ts
│   │   │   │   │   ├── scenario.factory.ts
│   │   │   │   │   └── sugar-kingdom.ts
│   │   │   │   ├── arena.component.html
│   │   │   │   ├── arena.component.scss
│   │   │   │   ├── arena.component.ts
│   │   │   │   ├── arena-turn.service.ts
│   │   │   │   ├── arena-vfx.service.ts
│   │   │   │   ├── camera.controller.ts
│   │   │   │   ├── input.handler.ts
│   │   │   │   ├── particle-system.ts
│   │   │   │   └── physics.service.ts
│   │   │   ├── home/
│   │   │   │   ├── home.component.html
│   │   │   │   ├── home.component.scss
│   │   │   │   └── home.component.ts
│   │   │   ├── lobby/
│   │   │   │   ├── character-selector/
│   │   │   │   │   ├── character-selector.component.html
│   │   │   │   │   ├── character-selector.component.scss
│   │   │   │   │   └── character-selector.component.ts
│   │   │   │   ├── scenario-vote/
│   │   │   │   │   ├── scenario-vote.component.html
│   │   │   │   │   ├── scenario-vote.component.scss
│   │   │   │   │   └── scenario-vote.component.ts
│   │   │   │   ├── lobby.component.html
│   │   │   │   ├── lobby.component.scss
│   │   │   │   └── lobby.component.ts
│   │   │   └── services/
│   │   │       ├── api.service.ts
│   │   │       ├── bot.service.ts
│   │   │       ├── haptic.service.ts
│   │   │       ├── local-questions.ts
│   │   │       ├── socket.service.ts
│   │   │       └── sound.service.ts
│   │   ├── styles.scss
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── supabase_migration.sql
├── .env.example
└── .gitignore
```

## Reglas de Negocio y Control de Concurrencia

- R1 - Codigo de Sala Unico: Identificadores alfanumericos de 6 caracteres generados mediante nanoid.
- R2 - Limite Estricto de 4 Jugadores: Cada sala permite un maximo de 4 participantes activos.
- R3 - Bloqueo de Concurrencia Transaccional: La funcion SQL unirse_sala_concurrente bloquea transaccionalmente la sala con pg_advisory_xact_lock.
- R4 - Formato Valido de Preguntas: Enunciado, 4 opciones unicas, indice de respuesta correcta (0-3) y dificultad.
- R5 - Auto-Limpieza de Salas Inactivas: Las salas finalizadas son marcadas como FINISHED y depuradas de la lista publica.

## Instalacion y Puesta en Marcha

### Prerrequisitos
- Docker Desktop instalado y en ejecucion.
- Node.js v18+ (opcional).

### 1. Clonar el Repositorio
```bash
git clone https://github.com/SAOT31/codeparty-3d.git
cd codeparty-3d
```

### 2. Configurar Variables de Entorno
Copiar la plantilla de variables de entorno:
```bash
cp .env.example backend/.env
```

Configurar backend/.env con los valores correspondientes:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/codeparty
GEMINI_API_KEY=tu_clave_de_google_gemini_aqui
HOST_IP=192.168.1.4
```

### 3. Ejecutar con Docker Compose
```bash
docker compose up --build
```

Servicios iniciados:
- PostgreSQL: localhost:5433
- Backend NestJS: http://localhost:3000
- Frontend Angular: http://localhost:4200

## Acceso a la Aplicacion

- PC Anfitrion (Local): http://localhost:4200
- Dispositivos en Misma Red Wi-Fi: http://TU_IP_LOCAL:4200 (Ejemplo: http://192.168.1.4:4200)
- Servidor en Produccion: https://codeparty3d.andrescortes.dev
- API Backend: http://localhost:3000
- Base de Datos PostgreSQL: localhost:5433 (usuario: postgres, clave: postgres, db: codeparty)
