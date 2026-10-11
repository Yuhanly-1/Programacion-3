#Proyecto desarrollado por:

#Yuhanly Mejia Acevedo 2024-0722

#Ambar Sepulveda Hernandez 2024-0607



# AutoMax - Portal de gestión de vehículos


Aplicación web desarrollada con HTML5, CSS3 y JavaScript puro. Guarda los registros en `localStorage` del navegador; no utiliza frameworks ni bases de datos externas.

## Cómo ejecutar

1. Descomprime la carpeta `AgenciaVehiculos`.
2. Abre `index.html` en un navegador actualizado.
3. Completa los campos y pulsa **Registrar vehículo**.
4. Utiliza **Editar** para modificar un registro o **Eliminar** para borrarlo.
5. Para la fotografía, pega una URL directa a una imagen pública o selecciona un archivo desde tu computadora. Si usas un enlace, debe permitir la carga directa de la imagen.
6. Escribe en el buscador para filtrar por código, marca o modelo.

## Funciones incluidas

- Registro de vehículos con código, marca, modelo, año, color, combustible, precio, cantidad, transmisión y descripción.
- Imagen del vehículo mediante URL pública o archivo local (hasta 1 MB).
- Vista previa de la imagen antes de guardar y opción para quitarla.
- Validación de campos obligatorios, año, precio, cantidad y códigos únicos.
- Guardado y recuperación mediante `localStorage`.
- Consulta, búsqueda, edición y eliminación de registros.
- Diseño adaptable a computadoras y móviles.

## Estructura

- `index.html`: estructura del portal.
- `CSS/styles.css`: diseño visual.
- `JS/app.js`: validaciones, registro y almacenamiento local.
- `images/logo.svg`: logo vectorial de AutoMax.

## Consideración

Las imágenes subidas desde el equipo se guardan como datos locales y se limitan a 1 MB por archivo para cuidar el espacio disponible. Las imágenes agregadas por URL guardan solamente el enlace, por lo que la imagen debe seguir disponible en el sitio externo.

`localStorage` guarda los datos únicamente en el navegador y dispositivo donde se registran. No sincroniza la información con otros equipos y los datos pueden borrarse si el usuario limpia el almacenamiento del navegador.
