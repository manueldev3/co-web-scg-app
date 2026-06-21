# Requirements Document

## Introduction

Esta especificación define una nueva sección de Blog para el sitio SCG (Guía no oficial de Star Citizen), construido sobre Next.js 16 con App Router, tema oscuro, Ant Design, Tailwind v4 e idioma español. El blog introduce, por primera vez en el proyecto, un sistema de cuentas de usuario basado en Firebase Authentication, con el fin exclusivo de permitir comentar y dar «me gusta» en las entradas publicadas.

El blog se organiza al estilo de WordPress (entradas clasificadas por categorías y fechas), expone un listado público y el detalle de cada entrada, añade un enlace propio en el menú de cabecera y aparece como primera sección de la página de inicio con entradas destacadas y reglas de distribución responsive.

Se incorpora además un panel de administración accesible bajo la ruta oculta `/admin`, con su propio inicio de sesión, un cuadro de mando (dashboard) con cuatro métricas y un mapamundi de usuarios conectados en tiempo real, y dos áreas de gestión: suscriptores del blog y entradas con sus categorías.

Por introducir un sistema de autenticación y tratamiento de nuevos datos personales (cuentas, comentarios y «me gusta»), se actualizan la Política de Privacidad y los Términos y Condiciones existentes.

Toda la funcionalidad de backend reutiliza la configuración de Firebase ya existente en el proyecto (SDK de cliente en `lib/firebase/config.ts` y Admin SDK en `lib/firebase/admin.ts`): Firebase Authentication para el inicio de sesión, Cloud Firestore para entradas, categorías, comentarios, «me gusta» y usuarios, y un patrón de presencia en tiempo real para el conteo de usuarios conectados.

### Restricción de plataforma (no funcional, transversal)

Este proyecto utiliza una versión modificada de Next.js 16.x con cambios que rompen compatibilidad. Antes de implementar rutas, layouts, componentes o llamadas de datos derivados de estos requisitos, la documentación incluida en `node_modules/next/dist/docs/` DEBE consultarse y los avisos de obsolescencia DEBEN respetarse. Esta restricción aplica a la fase de diseño e implementación, no altera el comportamiento funcional descrito en este documento.

## Glossary

- **Blog**: Sección del sitio SCG que publica entradas organizadas por categorías y fechas, con listado público, detalle de entrada, comentarios y «me gusta».
- **Sitio**: La aplicación web SCG en su conjunto.
- **Entrada (Post)**: Unidad de contenido publicable del Blog, con título, contenido, fecha, categoría y estado de publicación.
- **Categoria**: Etiqueta de clasificación de entradas al estilo WordPress; una entrada pertenece a una o varias categorías.
- **Estado_Publicacion**: Estado de una Entrada; valores admitidos: `borrador` (no visible al público) y `publicada` (visible al público).
- **Visitante**: Persona que accede al Sitio sin haber iniciado sesión.
- **Usuario_Registrado**: Persona con cuenta creada mediante Firebase Authentication que ha iniciado sesión; en el contexto del Blog también se denomina suscriptor.
- **Administrador**: Usuario con privilegios de administración del Blog, identificado mediante un custom claim de Firebase Authentication, con acceso a `/admin`.
- **Comentario**: Texto aportado por un Usuario_Registrado asociado a una Entrada publicada.
- **MeGusta**: Marca de aprobación («me gusta») de un Usuario_Registrado sobre una Entrada publicada; cada Usuario_Registrado puede registrar como máximo un MeGusta por Entrada.
- **Sistema_Auth**: Componente responsable del registro, inicio y cierre de sesión basado en Firebase Authentication.
- **Sistema_Blog**: Componente responsable del listado, detalle, comentarios y «me gusta» de las entradas.
- **Panel_Admin**: Conjunto de pantallas bajo la ruta `/admin`, compuesto por el Dashboard, la gestión de Usuarios y la gestión de Entradas.
- **Dashboard**: Pantalla inicial del Panel_Admin con métricas agregadas y el mapa de usuarios conectados.
- **Mapa_Conectados**: Mapamundi del Dashboard que muestra el número de usuarios conectados al Sitio en tiempo real.
- **Servicio_Presencia**: Mecanismo basado en Firebase que registra y actualiza en tiempo real los usuarios conectados al Sitio.
- **Seccion_Destacados**: Primera sección de la página de inicio que muestra entradas destacadas del Blog.
- **Reglas_Firestore**: Reglas de seguridad de Cloud Firestore que controlan las operaciones de lectura y escritura sobre las colecciones del Blog.
- **Pagina_Privacidad**: Documento de Política de Privacidad ubicado en `app/politica-de-privacidad/page.tsx`.
- **Pagina_Terminos**: Documento de Términos y Condiciones ubicado en `app/terminos-y-condiciones/page.tsx`.
- **Cabecera**: Componente de navegación superior del Sitio en `app/components/SiteHeader.tsx`.

## Requirements

### Requirement 1: Listado público del Blog

**User Story:** Como Visitante, quiero ver un listado de las entradas publicadas del Blog organizado por categorías y fechas, para descubrir y acceder al contenido.

#### Acceptance Criteria

1. WHEN un Visitante accede a la ruta `/blog`, THE Sistema_Blog SHALL mostrar únicamente las Entradas cuyo Estado_Publicacion es `publicada`.
2. THE Sistema_Blog SHALL ordenar las Entradas del listado por fecha de publicación de forma descendente, mostrando primero la Entrada con la fecha de publicación más reciente.
3. IF dos o más Entradas publicadas tienen la misma fecha de publicación, THEN THE Sistema_Blog SHALL ordenarlas entre sí por título en orden alfabético ascendente.
4. WHEN un Visitante selecciona una Categoria en el listado, THE Sistema_Blog SHALL mostrar únicamente las Entradas cuyo Estado_Publicacion es `publicada` y que pertenecen a esa Categoria.
5. THE Sistema_Blog SHALL mostrar para cada Entrada del listado su título.
6. THE Sistema_Blog SHALL mostrar para cada Entrada del listado su fecha de publicación.
7. THE Sistema_Blog SHALL mostrar para cada Entrada del listado el nombre de cada una de sus categorías asociadas.
8. WHILE el listado contiene más de 10 Entradas publicadas, THE Sistema_Blog SHALL mostrar como máximo 10 Entradas por página, preservando el orden por fecha de publicación descendente definido en los criterios 2 y 3.
9. WHEN un Visitante selecciona la página siguiente o anterior de la paginación, THE Sistema_Blog SHALL mostrar el conjunto de hasta 10 Entradas publicadas correspondiente a esa página, preservando el orden por fecha de publicación descendente.
10. IF un Visitante accede a una Categoria que no contiene Entradas cuyo Estado_Publicacion es `publicada`, THEN THE Sistema_Blog SHALL mostrar un mensaje en español indicando que no hay entradas disponibles y SHALL no mostrar ninguna Entrada en el listado.
11. WHEN un Visitante accede a la ruta `/blog` y no existe ninguna Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar un mensaje en español indicando que no hay entradas disponibles.
12. IF la recuperación de las Entradas desde el almacén de datos falla, THEN THE Sistema_Blog SHALL mostrar un mensaje de error en español indicando que el contenido no pudo cargarse y SHALL no mostrar un listado parcial de Entradas.

### Requirement 2: Detalle de una Entrada

**User Story:** Como Visitante, quiero abrir una Entrada publicada y leer su contenido completo, para informarme sobre el tema.

#### Acceptance Criteria

1. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar el título de la Entrada.
2. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar el contenido completo de la Entrada sin truncar.
3. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar la fecha de publicación de la Entrada.
4. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar la lista de categorías asociadas a la Entrada.
5. WHILE la Entrada publicada no tiene ninguna categoría asociada, WHEN un Visitante accede a la ruta de detalle de esa Entrada, THE Sistema_Blog SHALL mostrar el detalle sin la sección de categorías y sin error.
6. IF un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `borrador`, THEN THE Sistema_Blog SHALL responder con una página de recurso no encontrado.
7. IF un Visitante accede a una ruta de detalle cuyo identificador no corresponde a ninguna Entrada, THEN THE Sistema_Blog SHALL responder con una página de recurso no encontrado.
8. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar el número total de Comentarios asociados a esa Entrada como un valor entero igual o mayor que 0.
9. WHEN un Visitante accede a la ruta de detalle de una Entrada cuyo Estado_Publicacion es `publicada`, THE Sistema_Blog SHALL mostrar el número total de MeGusta asociados a esa Entrada como un valor entero igual o mayor que 0.

### Requirement 3: Registro e inicio de sesión de Usuario_Registrado

**User Story:** Como Visitante, quiero crear una cuenta e iniciar sesión, para poder comentar y dar «me gusta» en las entradas del Blog.

#### Acceptance Criteria

1. WHEN un Visitante envía el formulario de registro con un correo electrónico válido y una contraseña de al menos 8 caracteres, THE Sistema_Auth SHALL crear una cuenta mediante Firebase Authentication.
2. WHEN un Usuario_Registrado envía el formulario de inicio de sesión con credenciales correctas, THE Sistema_Auth SHALL iniciar la sesión y establecer el estado autenticado.
3. IF un Visitante envía el formulario de inicio de sesión con credenciales incorrectas, THEN THE Sistema_Auth SHALL mostrar un mensaje de error en español sin revelar si el fallo corresponde al correo o a la contraseña, conservando el estado no autenticado.
4. IF un Visitante intenta registrarse con un correo electrónico ya asociado a una cuenta existente, THEN THE Sistema_Auth SHALL rechazar el registro y mostrar un mensaje de error en español.
5. IF un Visitante envía el formulario de registro con un correo electrónico con formato inválido o una contraseña de menos de 8 caracteres, THEN THE Sistema_Auth SHALL rechazar el registro y mostrar un mensaje de error en español.
6. WHEN un Usuario_Registrado solicita cerrar sesión, THE Sistema_Auth SHALL finalizar la sesión y restablecer el estado a no autenticado.
7. WHILE un Usuario_Registrado tiene una sesión activa, THE Sistema_Auth SHALL mantener el estado autenticado entre recargas de página del Sitio.
8. WHEN se crea una cuenta mediante Firebase Authentication, THE Sistema_Auth SHALL crear un registro de usuario en la colección de usuarios de Firestore con el rol de suscriptor.
9. IF la comunicación con Firebase Authentication falla durante el registro o el inicio de sesión, THEN THE Sistema_Auth SHALL mostrar un mensaje de error en español y conservar el estado no autenticado.

### Requirement 4: Comentarios en entradas publicadas (solo autenticados)

**User Story:** Como Usuario_Registrado, quiero comentar en una entrada publicada, para participar en la conversación.

#### Acceptance Criteria

1. WHILE un Usuario_Registrado tiene sesión activa y consulta una Entrada publicada, THE Sistema_Blog SHALL mostrar un formulario para añadir un Comentario con un campo de contenido que acepte entre 1 y 2000 caracteres.
2. WHEN un Usuario_Registrado envía un Comentario con contenido de entre 1 y 2000 caracteres sobre una Entrada publicada, THE Sistema_Blog SHALL guardar el Comentario en Firestore asociado al identificador de esa Entrada, al identificador del Usuario_Registrado y a una fecha de creación.
3. WHILE un Visitante no autenticado consulta una Entrada publicada, THE Sistema_Blog SHALL mostrar los Comentarios existentes de esa Entrada.
4. WHILE un Visitante no autenticado consulta una Entrada publicada, THE Sistema_Blog SHALL ocultar el formulario de comentario y mostrar una invitación a iniciar sesión.
5. IF un Visitante no autenticado intenta enviar un Comentario, THEN THE Sistema_Blog SHALL rechazar la operación de escritura sin guardar datos en Firestore y mostrar un mensaje de error en español indicando que se requiere iniciar sesión.
6. IF un Usuario_Registrado envía un Comentario con contenido vacío o con solo espacios en blanco, THEN THE Sistema_Blog SHALL rechazar el Comentario sin guardarlo en Firestore y mostrar un mensaje de error en español indicando que el contenido es obligatorio.
7. IF un Usuario_Registrado envía un Comentario con contenido que supera los 2000 caracteres, THEN THE Sistema_Blog SHALL rechazar el Comentario sin guardarlo en Firestore y mostrar un mensaje de error en español indicando que se superó el límite de 2000 caracteres.
8. WHEN el Sistema_Blog muestra un Comentario, THE Sistema_Blog SHALL mostrar el identificador del autor y la fecha de creación del Comentario.
9. WHEN un Comentario se guarda correctamente en Firestore, THE Sistema_Blog SHALL mostrar el Comentario en la lista de Comentarios de la Entrada en un plazo máximo de 3 segundos sin requerir recarga manual de la página.

### Requirement 5: «Me gusta» en entradas publicadas (solo autenticados)

**User Story:** Como Usuario_Registrado, quiero dar «me gusta» a una entrada publicada, para expresar mi aprobación.

#### Acceptance Criteria

1. WHILE un Usuario_Registrado tiene sesión activa y consulta una Entrada publicada, THE Sistema_Blog SHALL mostrar un control de «me gusta» junto con el número total de MeGusta de esa Entrada expresado como un número entero mayor o igual a 0.
2. WHILE un Usuario_Registrado tiene sesión activa y ya registró un MeGusta sobre la Entrada consultada, THE Sistema_Blog SHALL mostrar el control de «me gusta» en estado activado.
3. WHILE un Usuario_Registrado tiene sesión activa y no ha registrado un MeGusta sobre la Entrada consultada, THE Sistema_Blog SHALL mostrar el control de «me gusta» en estado desactivado.
4. WHEN un Usuario_Registrado activa el control de «me gusta» sobre una Entrada publicada en la que no había registrado un MeGusta, THE Sistema_Blog SHALL registrar un MeGusta asociado a esa Entrada y al Usuario_Registrado, incrementar el contador en 1 y mostrar el control en estado activado.
5. WHEN un Usuario_Registrado activa el control de «me gusta» sobre una Entrada en la que ya había registrado un MeGusta, THE Sistema_Blog SHALL eliminar el MeGusta de ese Usuario_Registrado sobre esa Entrada, decrementar el contador en 1 y mostrar el control en estado desactivado.
6. THE Sistema_Blog SHALL registrar como máximo un MeGusta por cada combinación de Usuario_Registrado y Entrada.
7. IF un Visitante no autenticado intenta registrar un MeGusta, THEN THE Sistema_Blog SHALL rechazar la operación de escritura, mantener sin cambios el contador de MeGusta de la Entrada y mostrar un mensaje en español indicando que se requiere iniciar sesión.
8. IF la operación de registro o de eliminación de un MeGusta no se completa correctamente, THEN THE Sistema_Blog SHALL conservar el valor previo del contador, mantener el estado previo del control de «me gusta» y mostrar un mensaje en español indicando que la operación no pudo completarse.
9. WHEN el número de MeGusta de una Entrada cambia, THE Sistema_Blog SHALL actualizar el contador mostrado en un plazo máximo de 3 segundos sin requerir recarga manual de la página.

### Requirement 6: Inicio de sesión de Administrador en ruta oculta

**User Story:** Como Administrador, quiero iniciar sesión a través de una ruta oculta `/admin`, para acceder al panel de administración.

#### Acceptance Criteria

1. WHEN un Visitante accede a la ruta `/admin` sin sesión autenticada, THE Sistema_Auth SHALL mostrar un formulario de inicio de sesión de administrador con campos de correo electrónico y contraseña en un tiempo máximo de 3 segundos.
2. WHEN un Administrador cuyo custom claim de Administrador en Firebase Auth está establecido en verdadero envía el formulario de inicio de sesión de `/admin` con credenciales válidas, THE Sistema_Auth SHALL conceder acceso al Panel_Admin en un tiempo máximo de 3 segundos.
3. IF un Administrador envía el formulario de inicio de sesión de `/admin` con credenciales no válidas, THEN THE Sistema_Auth SHALL denegar el acceso al Panel_Admin, conservar el formulario de inicio de sesión visible y mostrar un mensaje de error en español indicando que las credenciales son incorrectas.
4. IF un Usuario_Registrado cuyo custom claim de Administrador en Firebase Auth está ausente o establecido en falso envía el formulario de inicio de sesión de `/admin` con credenciales válidas, THEN THE Sistema_Auth SHALL denegar el acceso al Panel_Admin y mostrar un mensaje de acceso no autorizado en español.
5. IF un Visitante o un Usuario_Registrado cuyo custom claim de Administrador en Firebase Auth está ausente o establecido en falso accede a cualquier ruta bajo `/admin` distinta del formulario de inicio de sesión, THEN THE Panel_Admin SHALL redirigir al formulario de inicio de sesión de administrador en un tiempo máximo de 3 segundos.
6. THE Sitio SHALL omitir todo enlace, botón o referencia de navegación al Panel_Admin y a la ruta `/admin` en la Cabecera y en el pie de página.
7. WHEN un Administrador con sesión activa solicita cerrar sesión dentro del Panel_Admin, THE Sistema_Auth SHALL finalizar la sesión autenticada y redirigir al formulario de inicio de sesión de administrador en un tiempo máximo de 3 segundos.
8. WHILE un Administrador no posee una sesión autenticada activa, THE Panel_Admin SHALL impedir el acceso a cualquier vista del Panel_Admin distinta del formulario de inicio de sesión.

### Requirement 7: Dashboard del Panel_Admin con métricas

**User Story:** Como Administrador, quiero ver un cuadro de mando con las métricas esenciales del Blog, para conocer el estado de la actividad de un vistazo.

#### Acceptance Criteria

1. WHILE un Administrador autenticado permanece en el Dashboard, THE Dashboard SHALL mostrar el número total de Entradas como un entero mayor o igual a 0.
2. WHILE un Administrador autenticado permanece en el Dashboard, THE Dashboard SHALL mostrar el número de Entradas que tienen al menos un Comentario como un entero mayor o igual a 0.
3. WHILE un Administrador autenticado permanece en el Dashboard, THE Dashboard SHALL mostrar el número total de Comentarios de todas las Entradas como un entero mayor o igual a 0.
4. WHILE un Administrador autenticado permanece en el Dashboard, THE Dashboard SHALL mostrar el número total de MeGusta de todas las Entradas como un entero mayor o igual a 0.
5. WHEN el Administrador carga el Dashboard, THE Dashboard SHALL obtener los valores de las 4 métricas a partir de los datos almacenados en Firestore.
6. WHILE las 4 métricas están siendo obtenidas desde Firestore, THE Dashboard SHALL mostrar un indicador de carga para cada métrica pendiente.
7. IF la obtención de una o más métricas desde Firestore falla, THEN THE Dashboard SHALL mostrar un mensaje de error que indique que la métrica no pudo cargarse, sin mostrar valores parciales o incorrectos para esa métrica.

### Requirement 8: Mapa de usuarios conectados en tiempo real

**User Story:** Como Administrador, quiero ver un mapamundi con el número de usuarios conectados en tiempo real, para conocer la actividad en vivo del Sitio.

#### Acceptance Criteria

1. WHILE un Administrador visualiza el Dashboard, THE Dashboard SHALL mostrar el Mapa_Conectados con el número total de usuarios conectados al Sitio como un valor entero mayor o igual a 0.
2. WHEN un usuario establece una conexión con el Sitio, THE Servicio_Presencia SHALL registrar la conexión en un plazo máximo de 5 segundos desde el inicio de la conexión.
3. WHEN un usuario cierra su conexión con el Sitio, THE Servicio_Presencia SHALL eliminar el registro de su conexión en un plazo máximo de 5 segundos desde la desconexión.
4. IF una conexión registrada no presenta actividad durante un periodo superior a 60 segundos, THEN THE Servicio_Presencia SHALL eliminar el registro de dicha conexión.
5. WHEN el número de usuarios conectados cambia, THE Mapa_Conectados SHALL actualizar el número mostrado en un plazo máximo de 5 segundos y sin requerir recarga manual de la página.
6. WHERE un registro de conexión incluye una ubicación geográfica aproximada con latitud entre -90 y 90 grados y longitud entre -180 y 180 grados, THE Mapa_Conectados SHALL representar esa conexión en la posición correspondiente del mapamundi.
7. IF un registro de conexión no incluye una ubicación geográfica válida, THEN THE Mapa_Conectados SHALL incluir esa conexión en el número total de usuarios conectados sin representarla en una posición del mapamundi.
8. IF el Servicio_Presencia no está disponible o no responde en un plazo de 10 segundos, THEN THE Mapa_Conectados SHALL mostrar una indicación de error que informe al Administrador de que los datos de presencia no están disponibles y SHALL conservar el último número de usuarios conectados obtenido.

### Requirement 9: Gestión de Usuarios (suscriptores) en el Panel_Admin

**User Story:** Como Administrador, quiero gestionar los suscriptores del Blog, para administrar las cuentas registradas.

#### Acceptance Criteria

1. WHILE un Administrador accede a la sección de Usuarios del Panel_Admin, THE Panel_Admin SHALL mostrar la lista de Usuarios_Registrados con su correo electrónico, su rol y su fecha de registro.
2. IF no existe ningún Usuario_Registrado, THEN THE Panel_Admin SHALL mostrar un mensaje en español indicando que no hay usuarios.
3. WHEN un Administrador elimina un Usuario_Registrado, THE Panel_Admin SHALL eliminar el registro del usuario en Firestore y su cuenta en Firebase Authentication.
4. WHEN un Administrador modifica el rol de un Usuario_Registrado a un rol permitido, THE Panel_Admin SHALL guardar el nuevo rol en el registro del usuario en Firestore.
5. IF un Administrador busca usuarios por correo electrónico, THEN THE Panel_Admin SHALL mostrar únicamente los Usuarios_Registrados cuyo correo electrónico contiene el término de búsqueda sin distinción de mayúsculas y minúsculas.
6. IF un usuario sin privilegios de Administrador intenta leer o escribir registros de Usuarios mediante operaciones directas sobre Firestore, THEN las Reglas_Firestore SHALL rechazar la operación.

### Requirement 10: Gestión de Entradas y Categorías en el Panel_Admin

**User Story:** Como Administrador, quiero crear, editar, publicar y eliminar entradas y sus categorías al estilo WordPress, para mantener el contenido del Blog.

#### Acceptance Criteria

1. WHILE un Administrador accede a la sección de Entradas del Panel_Admin, THE Panel_Admin SHALL mostrar la lista de Entradas ordenada por fecha de forma descendente, mostrando para cada Entrada su título, su Estado_Publicacion, su fecha y sus categorías.
2. WHEN un Administrador crea una Entrada con un título de 1 a 200 caracteres, un contenido de 1 a 50000 caracteres y entre 1 y 10 categorías, THE Panel_Admin SHALL guardar la Entrada en Firestore con Estado_Publicacion `borrador`.
3. WHEN un Administrador edita una Entrada existente con un título de 1 a 200 caracteres y un contenido de 1 a 50000 caracteres, THE Panel_Admin SHALL guardar los cambios en Firestore conservando su Estado_Publicacion.
4. WHEN un Administrador publica una Entrada, THE Panel_Admin SHALL establecer su Estado_Publicacion a `publicada` y registrar la fecha de publicación con la fecha y hora actuales.
5. WHEN un Administrador elimina una Entrada, THE Panel_Admin SHALL eliminar la Entrada y sus Comentarios y MeGusta asociados en Firestore.
6. WHEN un Administrador crea una Categoria con un nombre de 1 a 50 caracteres que no coincide con el nombre de ninguna Categoria existente, THE Panel_Admin SHALL guardar la Categoria en Firestore.
7. IF un Administrador crea una Categoria con un nombre que coincide con el de una Categoria existente, THEN THE Panel_Admin SHALL rechazar la creación, conservar la Categoria existente sin cambios y mostrar un mensaje de error en español indicando que el nombre ya existe.
8. WHEN un Administrador elimina una Categoria, THE Panel_Admin SHALL eliminar la Categoria y desasociarla de las Entradas que la referencian.
9. IF un Administrador intenta crear o editar una Entrada con un título vacío, con un contenido vacío, con un título de más de 200 caracteres o con un contenido de más de 50000 caracteres, THEN THE Panel_Admin SHALL rechazar la operación, conservar los datos previos sin cambios y mostrar un mensaje de error en español indicando el campo inválido.
10. IF un usuario sin privilegios de Administrador intenta crear, editar o eliminar Entradas o Categorías mediante operaciones directas sobre Firestore, THEN las Reglas_Firestore SHALL rechazar la operación.
11. WHILE un Administrador accede a la sección de Entradas y no existe ninguna Entrada, THE Panel_Admin SHALL mostrar un mensaje en español indicando que no hay Entradas.
12. IF un Administrador intenta crear una Entrada sin asociar al menos una Categoria, THEN THE Panel_Admin SHALL rechazar la operación y mostrar un mensaje de error en español indicando que se requiere al menos una Categoria.

### Requirement 11: Sección destacada del Blog en la página de inicio

**User Story:** Como Visitante, quiero ver las entradas destacadas del Blog al principio de la página de inicio, para acceder rápidamente al contenido más relevante.

#### Acceptance Criteria

1. THE Sitio SHALL mostrar la Seccion_Destacados como primera sección de la página de inicio.
2. THE Seccion_Destacados SHALL mostrar la Entrada publicada más reciente con un tamaño visual mayor que el del resto de entradas destacadas.
3. THE Seccion_Destacados SHALL incluir las 2 Entradas publicadas con mayor número de Comentarios, además de la Entrada publicada más reciente.
4. IF dos o más Entradas publicadas tienen el mismo número de Comentarios al seleccionar las destacadas, THEN THE Seccion_Destacados SHALL priorizar la Entrada con la fecha de publicación más reciente.
5. WHERE la Entrada con mayor número de Comentarios coincide con la Entrada más reciente, THE Seccion_Destacados SHALL seleccionar las siguientes Entradas con mayor número de Comentarios hasta completar el conjunto de destacados sin repetir Entradas.
6. WHILE el ancho de la ventana gráfica es igual o superior a 1024 píxeles, THE Seccion_Destacados SHALL mostrar 3 Entradas.
7. WHILE el ancho de la ventana gráfica está entre 768 y 1023 píxeles, THE Seccion_Destacados SHALL mostrar 2 Entradas, priorizando las más recientes.
8. WHILE el ancho de la ventana gráfica es inferior a 768 píxeles, THE Seccion_Destacados SHALL mostrar 1 Entrada, priorizando la más reciente.
9. IF el número de Entradas publicadas es menor que el número de destacados que correspondería mostrar, THEN THE Seccion_Destacados SHALL mostrar únicamente las Entradas publicadas disponibles sin espacios vacíos de relleno.
10. IF no existe ninguna Entrada publicada, THEN THE Seccion_Destacados SHALL mostrar un mensaje en español indicando que aún no hay entradas.

### Requirement 12: Enlace al Blog en la Cabecera

**User Story:** Como Visitante, quiero un enlace directo al Blog en el menú de cabecera, para acceder al Blog desde cualquier página.

#### Acceptance Criteria

1. THE Cabecera SHALL incluir un enlace de navegación etiquetado «Blog» que apunte a la ruta `/blog`, ubicado en la misma lista de navegación y al mismo nivel jerárquico que el enlace existente «Wiki».
2. WHEN un Visitante selecciona el enlace del Blog en la Cabecera, THE Sitio SHALL navegar a la ruta `/blog` en menos de 1 segundo.
3. WHILE la ruta activa es exactamente `/blog` o comienza por el segmento `/blog/`, THE Cabecera SHALL marcar el enlace del Blog como seleccionado, y en cualquier otra ruta THE Cabecera SHALL mostrar el enlace del Blog como no seleccionado.
4. WHILE el ancho de la ventana gráfica es igual o superior a 1024 píxeles, THE Cabecera SHALL mostrar el enlace del Blog dentro de la navegación horizontal.
5. WHILE el ancho de la ventana gráfica es inferior a 1024 píxeles, THE Cabecera SHALL mostrar el enlace del Blog dentro del menú lateral desplegable accesible mediante el botón de menú.
6. WHEN un Visitante selecciona el enlace del Blog dentro del menú lateral desplegable, THE Cabecera SHALL cerrar dicho menú lateral tras iniciar la navegación a `/blog`.

### Requirement 13: Actualización de la Política de Privacidad

**User Story:** Como responsable del Sitio, quiero actualizar la Política de Privacidad para reflejar el nuevo sistema de cuentas, comentarios y «me gusta», para cumplir con la transparencia en el tratamiento de datos personales.

#### Acceptance Criteria

1. THE Pagina_Privacidad SHALL describir que el Sitio dispone de un sistema de cuentas basado en Firebase Authentication para comentar y dar «me gusta» en el Blog.
2. THE Pagina_Privacidad SHALL describir los datos personales tratados a través de las cuentas, incluyendo como mínimo el correo electrónico y el contenido textual de los Comentarios.
3. THE Pagina_Privacidad SHALL describir la finalidad del tratamiento de cada categoría de dato personal recogido a través de las cuentas, los Comentarios y los MeGusta.
4. THE Pagina_Privacidad SHALL describir que los datos de cuentas, Comentarios y MeGusta se almacenan en servicios de Firebase.
5. THE Pagina_Privacidad SHALL describir el derecho del Usuario_Registrado a solicitar la eliminación de su cuenta y de sus datos asociados, incluyendo Comentarios y MeGusta.
6. THE Pagina_Privacidad SHALL indicar al menos un medio de contacto para que el Usuario_Registrado ejerza el derecho de eliminación.
7. WHEN se publica la actualización de la Pagina_Privacidad, THE Pagina_Privacidad SHALL mostrar una fecha de última actualización, expresada en día, mes y año, igual o posterior a la fecha de la actualización.

### Requirement 14: Actualización de los Términos y Condiciones

**User Story:** Como responsable del Sitio, quiero actualizar los Términos y Condiciones para incluir las normas del nuevo sistema de cuentas, comentarios y «me gusta», para regular el uso de la nueva funcionalidad.

#### Acceptance Criteria

1. THE Pagina_Terminos SHALL describir las condiciones de creación y uso de cuentas de Usuario_Registrado en el Blog, incluyendo los requisitos de registro, la obligación de proporcionar datos veraces y las causas de suspensión o cancelación de la cuenta.
2. THE Pagina_Terminos SHALL describir las normas de conducta aplicables a los Comentarios publicados por los Usuarios_Registrados, incluyendo la prohibición de contenido ofensivo, ilegal, publicitario no autorizado o ajeno a la temática del Blog.
3. THE Pagina_Terminos SHALL describir las normas de uso de la funcionalidad de «me gusta», incluyendo la prohibición de manipular de forma artificial el número de «me gusta» mediante cuentas múltiples o medios automatizados.
4. THE Pagina_Terminos SHALL describir que el Sitio puede moderar, ocultar o eliminar Comentarios que incumplan las normas de conducta, sin previo aviso al Usuario_Registrado.
5. WHEN se publica la actualización de la Pagina_Terminos, THE Pagina_Terminos SHALL mostrar una fecha de última actualización, expresada en día, mes y año, igual o posterior a la fecha de la actualización.

### Requirement 15: Seguridad y autorización de datos del Blog

**User Story:** Como responsable del Sitio, quiero que las operaciones sobre los datos del Blog estén protegidas por reglas de seguridad, para evitar accesos y escrituras no autorizados.

#### Acceptance Criteria

1. THE Reglas_Firestore SHALL permitir a cualquier usuario, autenticado o no, la lectura de las Entradas cuyo Estado_Publicacion es `publicada` y de los Comentarios y MeGusta asociados a dichas Entradas.
2. IF un usuario no autenticado intenta crear un Comentario o un MeGusta, THEN THE Reglas_Firestore SHALL rechazar la operación sin persistir ningún dato y devolver un error indicando permiso denegado.
3. WHILE un Usuario_Registrado está autenticado, THE Reglas_Firestore SHALL permitirle crear Comentarios y MeGusta únicamente cuando el identificador de usuario asociado al dato coincide exactamente con el identificador del Usuario_Registrado autenticado.
4. IF el identificador de usuario asociado a un Comentario o MeGusta que se intenta crear no coincide con el identificador del Usuario_Registrado autenticado, THEN THE Reglas_Firestore SHALL rechazar la operación sin persistir ningún dato y devolver un error indicando permiso denegado.
5. IF un Usuario_Registrado intenta modificar o eliminar un Comentario o un MeGusta cuyo identificador de usuario asociado no coincide con su propio identificador, THEN THE Reglas_Firestore SHALL rechazar la operación conservando sin cambios el dato existente y devolver un error indicando permiso denegado.
6. WHERE el usuario tiene privilegios de Administrador, THE Reglas_Firestore SHALL permitir la creación, la edición y la eliminación de Entradas y de Categorías.
7. IF un usuario sin privilegios de Administrador intenta crear, editar o eliminar una Entrada o una Categoría, THEN THE Reglas_Firestore SHALL rechazar la operación conservando sin cambios el dato existente y devolver un error indicando permiso denegado.
8. IF un usuario sin privilegios de Administrador intenta leer una Entrada cuyo Estado_Publicacion es `borrador`, THEN THE Reglas_Firestore SHALL rechazar la operación sin devolver el contenido de la Entrada y devolver un error indicando permiso denegado.
