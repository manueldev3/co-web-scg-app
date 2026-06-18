/**
 * Descripcion_Curada de naves: Texto_Descripcion indexado por el `slug` de la
 * Nave (Req 3.1, 3.2). El `slug` es el mismo que produce
 * `toSlug(resolveShipName(v))` en `app/wiki/utils.ts`, es decir, el nombre de
 * la nave (`name_full ?? name`) en minúsculas con los grupos de caracteres no
 * alfanuméricos reemplazados por guiones (p. ej. "Aurora MR" → "aurora-mr").
 *
 * Esta fuente se mantiene manualmente dentro del propio código del proyecto:
 * NO depende de la API_UEX ni de ninguna fuente externa nueva (Req 3.5). Para
 * ampliarla basta con añadir más entradas a este mapa, sin tocar la página de
 * detalle ni el resto de la wiki.
 *
 * Convención de formato: cada valor puede contener varios párrafos separados
 * por una línea en blanco (`\n\n`). `normalizeDescription` (en `utils.ts`) los
 * divide, los recorta y descarta los vacíos antes de renderizarlos como texto
 * plano. Cuando un slug no tiene entrada aquí, el Proveedor_Descripcion
 * devuelve la ausencia y el Bloque_Descripcion se omite (Req 3.4).
 */
export const SHIP_DESCRIPTIONS: Record<string, string> = {
  "aurora-mr":
    "La Aurora MR de Roberts Space Industries es una de las naves iniciales más populares del universo de Star Citizen. Concebida como un vehículo asequible y versátil, combina capacidad de carga modesta con un armamento básico que la hace apta tanto para los primeros pasos de un piloto como para tareas de transporte ligero.\n\nSu diseño prioriza la fiabilidad sobre el lujo: cabina sencilla, mantenimiento económico y una cama integrada que permite registrar puntos de reaparición en los confines del sistema. Muchos ciudadanos recuerdan la Aurora como su primera nave, el punto de partida de carreras que después se diversifican hacia el comercio, el combate o la exploración.",

  "mustang-alpha":
    "La Mustang Alpha de Consolidated Outland es la rival directa de la Aurora en el segmento de naves de entrada. Apuesta por una estética estilizada y un manejo ágil, orientada a pilotos que valoran la velocidad y la respuesta en vuelo por encima de la capacidad de carga.\n\nCon una bodega reducida pero una silueta aerodinámica, la Mustang Alpha encaja bien en desplazamientos rápidos y en el aprendizaje del vuelo de combate. Su carácter deportivo la ha convertido en una de las opciones favoritas para quienes empiezan buscando agilidad antes que volumen de transporte.",

  "avenger-titan":
    'La Avenger Titan de Aegis Dynamics es una nave de carga ligera muy apreciada por su equilibrio entre versatilidad, armamento y precio. Derivada de la plataforma militar Avenger, conserva una potencia de fuego notable para su tamaño junto a una bodega aprovechable para el comercio inicial.\n\nEsta combinación la ha consolidado como una de las naves "todoterreno" recomendadas para nuevos jugadores: sirve para transportar mercancías, defenderse de amenazas menores y dar el salto desde las naves iniciales sin una inversión desproporcionada.',

  "cutlass-black":
    "La Cutlass Black de Drake Interplanetary es una nave multipropósito de tamaño medio, famosa por su robustez, su amplia rampa de carga trasera y su reputación entre contrabandistas y milicias por igual. Drake la diseñó para ser barata de adquirir y fácil de mantener.\n\nCon espacio para un vehículo terrestre ligero, torreta tripulable y capacidad para operar en equipo reducido, la Cutlass Black es una elección habitual para quienes buscan una nave capaz de adaptarse a la carga, el abordaje o el patrullaje sin especializarse en una sola tarea.",

  "constellation-andromeda":
    "La Constellation Andromeda de Roberts Space Industries es la versión insignia de la icónica familia Constellation: una nave multitripulación de gran porte que combina capacidad de carga, potencia de fuego y autonomía para viajes largos. Es un salto cualitativo respecto a las naves de un solo piloto.\n\nIncorpora torretas tripulables, espacio habitable para la tripulación y la posibilidad de transportar una pequeña nave parásita en su bahía. La Andromeda representa para muchos jugadores el primer gran objetivo de progresión, el punto en el que las operaciones en solitario dan paso al juego en equipo.",
};
