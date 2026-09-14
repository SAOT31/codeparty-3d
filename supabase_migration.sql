-- Migracion inicial para CodeArena 3D / CodeParty 3D
-- Ejecutar en PostgreSQL / Supabase SQL Editor

-- Tabla salas
CREATE TABLE IF NOT EXISTS salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  tema TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'WAITING' CHECK (estado IN ('WAITING','PLAYING','FINISHED')),
  capacidad_maxima INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla jugadores
CREATE TABLE IF NOT EXISTS jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  conectado BOOLEAN DEFAULT true,
  puntaje INT DEFAULT 0,
  color TEXT DEFAULT '#00f5ff'
);

-- Tabla preguntas
CREATE TABLE IF NOT EXISTS preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema TEXT NOT NULL,
  dificultad TEXT NOT NULL DEFAULT 'facil',
  enunciado TEXT NOT NULL,
  opciones JSONB NOT NULL,
  correcta INT NOT NULL
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_salas_codigo ON salas(codigo);
CREATE INDEX IF NOT EXISTS idx_preguntas_tema ON preguntas(LOWER(tema));

-- Procedimiento de concurrencia para salas
CREATE OR REPLACE FUNCTION unirse_sala_concurrente(p_sala_id UUID, p_nickname TEXT, p_color TEXT)
RETURNS jugadores AS $$
DECLARE
  v_count INT;
  v_jugador jugadores;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_sala_id::TEXT));

  SELECT COUNT(*) INTO v_count FROM jugadores WHERE sala_id = p_sala_id AND conectado = true;
  IF v_count >= 4 THEN
    RAISE EXCEPTION 'SALA_LLENA';
  END IF;

  INSERT INTO jugadores(sala_id, nickname, color, conectado, puntaje)
  VALUES (p_sala_id, p_nickname, p_color, true, 0)
  RETURNING * INTO v_jugador;

  RETURN v_jugador;
END;
$$ LANGUAGE plpgsql;

-- BANCO DE PREGUNTAS POR TEMA (SEEDS)
INSERT INTO preguntas (tema, dificultad, enunciado, opciones, correcta) VALUES
-- Angular
('Angular', 'facil', '¿Qué comando de Angular CLI se utiliza para crear un nuevo componente?', '["ng make component", "ng generate component", "ng build component", "ng create component"]', 1),
('Angular', 'facil', '¿Cuál directiva estructural se usa para mostrar u ocultar un elemento según una condición en Angular?', '["*ngSwitch", "*ngIf", "*ngShow", "*ngDisplay"]', 1),
('Angular', 'facil', '¿Qué decorador permite recibir datos desde un componente padre en Angular?', '["@Output()", "@Injectable()", "@Input()", "@ViewChild()"]', 2),
('Angular', 'facil', '¿Qué método del ciclo de vida se ejecuta tras inicializar el componente?', '["ngOnChanges", "ngOnInit", "ngDoCheck", "ngOnDestroy"]', 1),
('Angular', 'facil', '¿Qué propiedad de @Component habilita componentes sin NgModule en Angular 17+?', '["standalone: true", "independent: true", "modular: false", "isolated: true"]', 0),

-- TypeScript
('TypeScript', 'facil', '¿Qué palabra clave en TypeScript define una variable que no puede ser reasignada?', '["var", "let", "const", "static"]', 2),
('TypeScript', 'facil', '¿Cuál es el operador de encadenamiento opcional para evitar errores null o undefined?', '["?.", "!.", "??", "&&"]', 0),
('TypeScript', 'facil', '¿Qué palabra clave define la estructura formal de un objeto en TypeScript?', '["interface", "struct", "blueprint", "model"]', 0),
('TypeScript', 'facil', '¿Qué tipo especial en TypeScript representa la ausencia de cualquier tipo o valor de retorno?', '["null", "undefined", "void", "never"]', 2),
('TypeScript', 'facil', '¿Cuál es el operador nullish coalescing para asignar un valor por defecto solo si es null o undefined?', '["||", "??", "?:", "&&"]', 1),

-- JavaScript
('JavaScript', 'facil', '¿Qué método de Array crea un nuevo arreglo transformando cada uno de sus elementos?', '["filter()", "map()", "reduce()", "forEach()"]', 1),
('JavaScript', 'facil', '¿Qué método convierte una cadena de texto en formato JSON a un objeto JavaScript?', '["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.decode()"]', 0),
('JavaScript', 'facil', '¿Cuál de los siguientes es un tipo de datos primitivo en JavaScript?', '["Array", "Object", "boolean", "Promise"]', 2),
('JavaScript', 'facil', '¿Qué estructura de datos almacena únicamente valores únicos sin duplicados?', '["Set", "Map", "Array", "Object"]', 0),
('JavaScript', 'facil', '¿Qué palabra clave dentro de una función asíncrona espera la resolución de una Promesa?', '["await", "wait", "pause", "yield"]', 0),

-- NestJS
('NestJS', 'facil', '¿Qué decorador de NestJS define una clase como un controlador HTTP?', '["@Controller()", "@Injectable()", "@Module()", "@Resolver()"]', 0),
('NestJS', 'facil', '¿Qué decorador marca una clase para que pueda ser inyectada mediante Dependency Injection?', '["@Injectable()", "@Service()", "@Component()", "@Provider()"]', 0),
('NestJS', 'facil', '¿Qué decorador en NestJS agrupa controladores y proveedores en una unidad cohesiva?', '["@Module()", "@Bundle()", "@Package()", "@Group()"]', 0),
('NestJS', 'facil', '¿Qué decorador en NestJS marca una clase como pasarela de WebSockets?', '["@WebSocketGateway()", "@SocketServer()", "@GatewayIO()", "@WsHandler()"]', 0),
('NestJS', 'facil', '¿Qué función inicial de NestFactory arranca la aplicación NestJS en main.ts?', '["NestFactory.create()", "NestFactory.start()", "NestFactory.run()", "NestFactory.boot()"]', 0),

-- Node.js
('Node.js', 'facil', '¿Cuál es el gestor de paquetes predeterminado que viene instalado con Node.js?', '["npm", "yarn", "pnpm", "pip"]', 0),
('Node.js', 'facil', '¿Qué módulo nativo de Node.js se utiliza para interactuar con el sistema de archivos?', '["fs", "file", "path", "os"]', 0),
('Node.js', 'facil', '¿Qué variable global en Node.js contiene la ruta absoluta del directorio del archivo actual?', '["__dirname", "__filename", "process.cwd()", "$DIR"]', 0),
('Node.js', 'facil', '¿Cómo se importan módulos en la sintaxis tradicional CommonJS de Node.js?', '["require()", "import()", "include()", "load()"]', 0),

-- React
('React', 'facil', '¿Qué Hook de React se utiliza para manejar el estado local en un componente funcional?', '["useState", "useEffect", "useContext", "useReducer"]', 0),
('React', 'facil', '¿Qué Hook de React se utiliza para ejecutar efectos secundarios (peticiones, suscripciones, timers)?', '["useEffect", "useState", "useMemo", "useCallback"]', 0),
('React', 'facil', '¿Cómo se llama la extensión de sintaxis que permite escribir HTML dentro de JavaScript en React?', '["JSX", "TSX", "TemplateHTML", "ReactML"]', 0),
('React', 'facil', '¿Qué propiedad especial se debe pasar a los elementos de una lista mapeada para optimizar el Virtual DOM?', '["key", "id", "index", "ref"]', 0),

-- Vue
('Vue', 'facil', '¿Qué directiva de Vue se utiliza para enlazar datos bidireccionalmente en formularios?', '["v-model", "v-bind", "v-for", "v-on"]', 0),
('Vue', 'facil', '¿Qué directiva de Vue se utiliza para renderizar condicionalmente un bloque del DOM?', '["v-if", "v-show", "v-render", "v-else"]', 0),
('Vue', 'facil', '¿Qué función de Vue 3 Composition API crea una referencia reactiva a un valor primitivo?', '["ref()", "reactive()", "computed()", "watch()"]', 0),
('Vue', 'facil', '¿Cuál es la directiva abreviada para escuchar eventos en Vue (como @click)?', '["v-on:click", "v-bind:click", "v-event:click", "v-listen:click"]', 0),

-- HTML/CSS
('HTML/CSS', 'facil', '¿Qué propiedad CSS habilita el modelo de caja flexible en un contenedor?', '["display: flex", "display: grid", "display: block", "flex: 1"]', 0),
('HTML/CSS', 'facil', '¿Qué propiedad CSS permite aplicar un desenfoque de fondo tipo vidrio (glassmorphism)?', '["backdrop-filter: blur()", "filter: blur()", "background-blur", "box-shadow"]', 0),
('HTML/CSS', 'facil', '¿Qué etiqueta HTML semántica se utiliza para la barra de navegación principal?', '["<nav>", "<header>", "<main>", "<section>"]', 0),
('HTML/CSS', 'facil', '¿Qué propiedad de CSS Grid define el número y tamaño de las columnas?', '["grid-template-columns", "grid-columns", "columns", "grid-auto-flow"]', 0),

-- PostgreSQL
('PostgreSQL', 'facil', '¿Qué comando SQL se utiliza para consultar y recuperar registros de una tabla?', '["SELECT", "GET", "FETCH", "QUERY"]', 0),
('PostgreSQL', 'facil', '¿Qué cláusula SQL se utiliza para combinar filas de dos o más tablas basándose en una columna común?', '["JOIN", "UNION", "MERGE", "COMBINE"]', 0),
('PostgreSQL', 'facil', '¿Qué comando SQL añade un nuevo registro a una tabla existente?', '["INSERT INTO", "ADD ROW", "UPDATE", "CREATE"]', 0),
('PostgreSQL', 'facil', '¿Qué tipo de dato en PostgreSQL permite almacenar y consultar estructuras de objetos JSON nativos?', '["JSONB", "TEXT", "VARCHAR", "BLOB"]', 0),

-- MongoDB
('MongoDB', 'facil', '¿Cómo se llaman las unidades individuales de almacenamiento de datos en MongoDB?', '["Documentos", "Filas", "Tablas", "Tuplas"]', 0),
('MongoDB', 'facil', '¿En qué formato de datos similar a JSON almacena MongoDB los documentos internamente?', '["BSON", "XML", "YAML", "Protocol Buffers"]', 0),
('MongoDB', 'facil', '¿Qué método se utiliza en MongoDB para buscar documentos que coincidan con un criterio?', '["find()", "search()", "query()", "select()"]', 0),
('MongoDB', 'facil', '¿Cómo se llama el campo clave primaria generado automáticamente en cada documento de MongoDB?', '["_id", "id", "uuid", "pk"]', 0),

-- Docker
('Docker', 'facil', '¿Qué archivo de texto contiene las instrucciones paso a paso para construir una imagen de Docker?', '["Dockerfile", "docker-compose.yml", "Containerfile.json", "docker.config"]', 0),
('Docker', 'facil', '¿Qué comando de Docker lista todos los contenedores en ejecución actual?', '["docker ps", "docker list", "docker run", "docker images"]', 0),
('Docker', 'facil', '¿Qué herramienta de Docker permite definir y ejecutar aplicaciones compuestas por múltiples contenedores?', '["Docker Compose", "Docker Swarm", "Docker Hub", "Docker Engine"]', 0),
('Docker', 'facil', '¿Qué comando descarga una imagen desde Docker Hub hacia tu máquina local?', '["docker pull", "docker fetch", "docker download", "docker clone"]', 0),

-- Git
('Git', 'facil', '¿Qué comando de Git guarda los cambios preparados en el historial del repositorio con un mensaje descriptivo?', '["git commit -m \"...\"", "git push", "git save", "git record"]', 0),
('Git', 'facil', '¿Qué comando de Git crea y cambia inmediatamente a una nueva rama de trabajo?', '["git checkout -b <rama>", "git branch -new <rama>", "git switch -create", "git make-branch"]', 0),
('Git', 'facil', '¿Qué comando une los cambios de una rama secundaria dentro de la rama actual?', '["git merge <rama>", "git combine", "git union", "git join"]', 0),
('Git', 'facil', '¿Qué comando descarga las actualizaciones del repositorio remoto y las fusiona en tu rama local?', '["git pull", "git fetch", "git clone", "git push"]', 0),

-- WebSockets
('WebSockets', 'facil', '¿Qué ventaja principal ofrece WebSockets frente a las peticiones HTTP tradicionales?', '["Comunicación bidireccional en tiempo real con baja latencia", "Mayor compresión de imágenes", "No requiere conexión a internet", "Mayor seguridad de contraseña"]', 0),
('WebSockets', 'facil', '¿Cuál es el protocolo de esquema URI utilizado para conexiones WebSocket seguras?', '["wss://", "https://", "ws://", "socket://"]', 0),
('WebSockets', 'facil', '¿Cómo se llama el proceso inicial en el que una conexión HTTP se transforma a WebSocket?', '["Handshake / Upgrade", "Polling", "Handshake SSL", "Multiplexing"]', 0),
('WebSockets', 'facil', '¿Qué librería de JavaScript popular facilita la comunicación WebSocket con reconexión automática y fallback?', '["Socket.IO", "Axios", "Fetch", "Lodash"]', 0),

-- APIs REST
('APIs REST', 'facil', '¿Qué método HTTP se utiliza según las convenciones REST para solicitar datos de un recurso?', '["GET", "POST", "PUT", "DELETE"]', 0),
('APIs REST', 'facil', '¿Qué código de estado HTTP indica que una petición se completó con éxito (OK)?', '["200", "404", "500", "301"]', 0),
('APIs REST', 'facil', '¿Qué código de estado HTTP indica que el recurso solicitado no fue encontrado en el servidor?', '["404", "403", "500", "201"]', 0),
('APIs REST', 'facil', '¿Qué método HTTP se utiliza convencionalmente para crear un nuevo recurso en una API REST?', '["POST", "GET", "PATCH", "HEAD"]', 0),

-- Python
('Python', 'facil', '¿Qué palabra clave se utiliza en Python para definir una nueva función?', '["def", "function", "func", "fn"]', 0),
('Python', 'facil', '¿Qué estructura de datos en Python almacena pares de clave-valor?', '["dict (Diccionario)", "list (Lista)", "tuple (Tupla)", "set (Conjunto)"]', 0),
('Python', 'facil', '¿Qué función integrada en Python devuelve la cantidad de elementos de una lista o cadena?', '["len()", "size()", "count()", "length()"]', 0),
('Python', 'facil', '¿Cómo se llama el gestor de paquetes estándar de la comunidad Python?', '["pip", "npm", "conda", "gem"]', 0),
('Python', 'facil', '¿Cuál es la diferencia principal entre una lista y una tupla en Python?', '["Las listas son mutables y las tuplas inmutables", "Las tuplas solo aceptan números", "Las listas no tienen índice", "No hay diferencia"]', 0),

-- Java
('Java', 'facil', '¿Qué método es el punto de entrada principal para ejecutar cualquier aplicación Java estándar?', '["public static void main(String[] args)", "public void start()", "main()", "public static init()"]', 0),
('Java', 'facil', '¿En qué tipo de código intermedio compila el compilador de Java (javac)?', '["Bytecode (.class)", "Binario de máquina", "Ensamblador", "JavaScript"]', 0),
('Java', 'facil', '¿Qué máquina virtual ejecuta el Bytecode de Java en cualquier sistema operativo?', '["JVM (Java Virtual Machine)", "JRE", "JDK", "V8 Engine"]', 0),
('Java', 'facil', '¿Qué palabra clave se usa en Java para heredar una clase de otra?', '["extends", "implements", "inherits", "super"]', 0),

-- C#
('C#', 'facil', '¿Qué plataforma y framework principal de Microsoft es el entorno de ejecución de C#?', '[".NET", "NodeJS", "JVM", "Spring"]', 0),
('C#', 'facil', '¿Qué palabra clave en C# define una propiedad con get y set automáticos?', '["public int Edad { get; set; }", "property int Edad", "def Edad()", "var Edad;"]', 0),
('C#', 'facil', '¿Qué tecnología de C# permite realizar consultas declarativas sobre colecciones de objetos o bases de datos?', '["LINQ", "Entity", "LambdaQuery", "SQLSharp"]', 0),
('C#', 'facil', '¿Qué palabra clave se usa en C# para declarar que un método sobrescribe la implementación de la clase base?', '["override", "virtual", "new", "abstract"]', 0),

-- Go
('Go', 'facil', '¿Cómo se llaman los hilos livianos concurrentes gestionados por el runtime de Go?', '["Goroutines", "Threads", "Tasks", "Workers"]', 0),
('Go', 'facil', '¿Qué palabra clave inicia la ejecución de una función en una goroutine concurrente en Go?', '["go", "async", "spawn", "thread"]', 0),
('Go', 'facil', '¿Qué mecanismo nativo de Go se utiliza para comunicar y sincronizar datos de forma segura entre goroutines?', '["Channels (canales)", "Shared Memory", "Pipes", "Sockets"]', 0),
('Go', 'facil', '¿Qué palabra clave se utiliza para declarar una variable inmutable en Go?', '["const", "val", "final", "let"]', 0),

-- AWS
('AWS', 'facil', '¿Qué servicio de AWS proporciona servidores virtuales y capacidad de cómputo escalable en la nube?', '["Amazon EC2", "Amazon S3", "AWS Lambda", "Amazon RDS"]', 0),
('AWS', 'facil', '¿Qué servicio de almacenamiento de objetos en la nube ofrece AWS para guardar archivos, fotos y backups?', '["Amazon S3", "Amazon EBS", "Amazon EFS", "Amazon Glacier"]', 0),
('AWS', 'facil', '¿Qué servicio Serverless de AWS permite ejecutar código en respuesta a eventos sin aprovisionar servidores?', '["AWS Lambda", "Amazon EC2", "AWS Fargate", "Amazon ECS"]', 0),
('AWS', 'facil', '¿Qué servicio de base de datos relacional administrada ofrece AWS para PostgreSQL, MySQL y MariaDB?', '["Amazon RDS", "Amazon DynamoDB", "Amazon Redshift", "Amazon Aurora"]', 0),

-- Ciberseguridad
('Ciberseguridad', 'facil', '¿Cómo se llama el ataque que intenta engañar a un usuario mediante correos o enlaces falsos para robar credenciales?', '["Phishing", "DDoS", "SQL Injection", "Ransomware"]', 0),
('Ciberseguridad', 'facil', '¿Qué tipo de malware cifra los archivos de la víctima y exige un pago económico para su rescate?', '["Ransomware", "Spyware", "Adware", "Trojan"]', 0),
('Ciberseguridad', 'facil', '¿Qué método de autenticación requiere dos pasos distintos para verificar la identidad (ej. contraseña + código SMS/App)?', '["2FA / MFA (Doble Factor)", "Single Sign-On", "OAuth", "Biometría simple"]', 0),
('Ciberseguridad', 'facil', '¿Qué vulnerabilidad ocurre cuando entradas de usuario sin validar se ejecutan directamente como consultas a la base de datos?', '["SQL Injection (Inyección SQL)", "Cross-Site Scripting (XSS)", "CSRF", "Buffer Overflow"]', 0),

-- Algoritmos
('Algoritmos', 'facil', '¿Cuál es la complejidad temporal en el peor caso del algoritmo de búsqueda binaria sobre un arreglo ordenado?', '["O(log n)", "O(n)", "O(n^2)", "O(1)"]', 0),
('Algoritmos', 'facil', '¿Qué estructura de datos sigue el principio LIFO (Last In, First Out)?', '["Pila (Stack)", "Cola (Queue)", "Lista enlazada", "Árbol binario"]', 0),
('Algoritmos', 'facil', '¿Qué estructura de datos sigue el principio FIFO (First In, First Out)?', '["Cola (Queue)", "Pila (Stack)", "Heap", "Grafo"]', 0),
('Algoritmos', 'facil', '¿Cómo se llama la técnica algorítmica donde una función se llama a sí misma para resolver un subproblema más pequeño?', '["Recursión", "Iteración", "Memoización", "Backtracking"]', 0),

-- Bases de datos
('Bases de datos', 'facil', '¿Qué propiedad de las bases de datos relacionales garantiza que las transacciones sean Atómicas, Consistentes, Aisladas y Durables?', '["ACID", "BASE", "SOLID", "CRUD"]', 0),
('Bases de datos', 'facil', '¿Qué estructura especial acelera significativamente la velocidad de búsqueda y consulta en columnas de una tabla?', '["Índice (Index)", "Vista (View)", "Trigger", "Clave foránea"]', 0),
('Bases de datos', 'facil', '¿Qué tipo de clave identifica de manera única e irrepetible a cada fila en una tabla de base de datos?', '["Clave Primaria (Primary Key)", "Clave Foránea", "Índice Secundario", "Clave Externa"]', 0),
('Bases de datos', 'facil', '¿Cómo se llama la categoría de bases de datos no relacionales diseñadas para alta escala y modelos de datos flexibles?', '["NoSQL", "SQL", "RDBMS", "OLAP"]', 0)
ON CONFLICT DO NOTHING;
