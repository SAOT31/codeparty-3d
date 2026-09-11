export interface FallbackPregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
  dificultad: 'facil';
}

export const FALLBACK_PREGUNTAS_ANGULAR: FallbackPregunta[] = [
  {
    enunciado: '¿Que comando de Angular CLI se utiliza para crear un nuevo componente?',
    opciones: ['ng make component', 'ng generate component', 'ng build component', 'ng create component'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Para que sirve la directiva *ngFor en Angular?',
    opciones: ['Para iterar y repetir elementos en la plantilla', 'Para ocultar o mostrar un elemento', 'Para navegar a otra ruta', 'Para conectar un formulario'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual directiva estructural se utiliza para mostrar u ocultar un elemento segun una condicion?',
    opciones: ['*ngSwitch', '*ngIf', '*ngShow', '*ngDisplay'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que es un Service en Angular?',
    opciones: ['Un archivo de estilos CSS', 'Una clase para compartir logica y datos entre componentes', 'Una vista de usuario', 'Una etiqueta HTML'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador permite recibir datos desde un componente padre?',
    opciones: ['@Output()', '@Injectable()', '@Input()', '@ViewChild()'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador se utiliza para emitir eventos hacia un componente padre?',
    opciones: ['@Output()', '@Input()', '@HostBinding()', '@Emitter()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es la sintaxis utilizada para el enlace bidireccional (two-way binding)?',
    opciones: ['{{ngModel}}', '[(ngModel)]', '[ngModel]', '(ngModel)'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que comando se utiliza para compilar y levantar el servidor local de desarrollo?',
    opciones: ['ng start', 'ng run', 'ng serve', 'ng deploy'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador define una clase como un componente en Angular?',
    opciones: ['@Module()', '@Injectable()', '@Directive()', '@Component()'],
    correcta: 3,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo del ciclo de vida se ejecuta una sola vez despues de inicializar las propiedades del componente?',
    opciones: ['ngOnChanges', 'ngOnInit', 'ngDoCheck', 'ngOnDestroy'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que archivo contiene normalmente la plantilla visual HTML de un componente?',
    opciones: ['.component.ts', '.component.scss', '.component.html', '.component.spec.ts'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Para que sirve el modulo RouterModule en Angular?',
    opciones: ['Para navegar entre diferentes vistas y URLs', 'Para enviar correos electronicos', 'Para conectar con bases de datos', 'Para compilar TypeScript'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador se aplica a una clase para que pueda ser inyectada mediante Inyeccion de Dependencias?',
    opciones: ['@Component()', '@Injectable()', '@Pipe()', '@NgModule()'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que servicio oficial de Angular se utiliza para realizar peticiones HTTP REST?',
    opciones: ['FetchClient', 'HttpClient', 'RequestService', 'HttpHandler'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que caracter se utiliza para aplicar un Pipe en una expresion de plantilla de Angular?',
    opciones: ['; (punto y coma)', '| (pipe o barra vertical)', ': (dos puntos)', '& (ampersand)'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es el pipe integrado para formatear texto completamente en mayusculas?',
    opciones: ['caps', 'toUpper', 'uppercase', 'upper'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que clase se usa habitualmente con @Output() para emitir valores personalizados?',
    opciones: ['EventEmitter', 'Observable', 'Subject', 'Promise'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo del ciclo de vida se invoca justo antes de que Angular destruya un componente?',
    opciones: ['ngAfterViewInit', 'ngOnDestroy', 'ngExit', 'ngCleanup'],
    correcta: 1,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es la extension estandar del archivo TypeScript que contiene la clase de un componente?',
    opciones: ['.component.js', '.component.html', '.component.ts', '.component.json'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que directiva de atributo se usa para agregar o quitar clases CSS dinamicamente?',
    opciones: ['[ngClass]', '[ngStyle]', '[classAdd]', '[applyClass]'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que palabra clave de TypeScript define variables que no pueden ser reasignadas?',
    opciones: ['var', 'let', 'const', 'static'],
    correcta: 2,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es el tipo primitivo en TypeScript para representar valores de verdad o falsedad?',
    opciones: ['boolean', 'binary', 'truthy', 'bool'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que clase de RxJS permite multidifundir valores a multiples observadores?',
    opciones: ['Subject', 'Promise', 'Array', 'Tuple'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo de Three.js dibuja la escena en pantalla usando una camara?',
    opciones: ['renderer.render(scene, camera)', 'renderer.draw()', 'scene.paint()', 'camera.render()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que geometria de Three.js crea una caja o cubo tridimensional?',
    opciones: ['BoxGeometry', 'SphereGeometry', 'PlaneGeometry', 'ConeGeometry'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es el operador ternario en JavaScript y TypeScript?',
    opciones: ['condicion ? trueVal : falseVal', 'condicion ?? falseVal', 'condicion || falseVal', 'if (condicion) -> trueVal'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo de Array en JavaScript crea un nuevo arreglo transformando cada elemento?',
    opciones: ['map()', 'filter()', 'forEach()', 'reduce()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que propiedad en el decorador @Component habilita componentes independientes en Angular 17+?',
    opciones: ['standalone: true', 'independent: true', 'modular: false', 'single: true'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Cual es el operador de encadenamiento opcional en TypeScript?',
    opciones: ['?.', '!.', '??', '||'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que tipo de material en Three.js responde adecuadamente a iluminacion de escena y sombras?',
    opciones: ['MeshStandardMaterial', 'MeshBasicMaterial', 'LineBasicMaterial', 'SpriteMaterial'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo de Socket.IO en el cliente escucha un evento enviado por el servidor?',
    opciones: ['socket.on("evento", callback)', 'socket.emit("evento")', 'socket.listen()', 'socket.pull()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que metodo de Socket.IO envia un evento hacia el servidor?',
    opciones: ['socket.emit("evento", datos)', 'socket.push("evento")', 'socket.sendMsg()', 'socket.post()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que funcion en JavaScript convierte texto JSON a un objeto JavaScript?',
    opciones: ['JSON.parse()', 'JSON.stringify()', 'JSON.decode()', 'JSON.toObject()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que funcion en JavaScript serializa un objeto JavaScript a texto JSON?',
    opciones: ['JSON.stringify()', 'JSON.parse()', 'JSON.encode()', 'JSON.serialize()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador en NestJS define una clase como controlador de rutas HTTP?',
    opciones: ['@Controller()', '@Injectable()', '@Module()', '@Endpoint()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que decorador en NestJS define una clase como pasarela de WebSockets?',
    opciones: ['@WebSocketGateway()', '@SocketServer()', '@WsEndpoint()', '@GatewayIO()'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que coleccion de JavaScript no permite elementos repetidos?',
    opciones: ['Set', 'Map', 'Array', 'Tuple'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que API estandar del navegador permite sintetizar y procesar audio en tiempo real?',
    opciones: ['Web Audio API', 'Canvas API', 'WebGL API', 'SpeechSynthesis API'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que sintaxis de Angular 17+ reemplaza la directiva estructural *ngIf?',
    opciones: ['@if (condicion) { ... }', '#if (condicion)', '<ng-if>', '$if (condicion)'],
    correcta: 0,
    dificultad: 'facil',
  },
  {
    enunciado: '¿Que sintaxis de Angular 17+ reemplaza la directiva estructural *ngFor?',
    opciones: ['@for (item of items; track item.id) { ... }', '#for (item in items)', '<ng-repeat>', '$loop (items)'],
    correcta: 0,
    dificultad: 'facil',
  },
];