# Legendary

Esta aplicación interpresta un archivo de subtitulos `srt` y genera un clip de video con el momento exacto en el que uno de los personajes de la serie "How I Met Your Mother" dice una frase en particular.

## Intención
Este proyecto fue creado con el proposito de seguir probando la capacidad de `NodeJS` para realizar absolutamente cualquier tarea. Y también porque me gusta la serie "How I Met Your Mother".

[![Legendary](https://img.youtube.com/vi/6H78sadIfTw/0.jpg)](https://www.youtube.com/watch?v=6H78sadIfTw)

## ¿Cómo funciona?

Mediante la utilización de la librería `subtitles-parser` se interpretan los subtitulos para enteder el momento exacto en el que un personaje empieza y termina de decir una frase y luego con `ffmpeg` se realiza un recorte del video.

La complejidad de la aplicación se da cuando el personaje "parte" la palabra en 2 y espera un momento para terminar la frase. Esto hace que el subtitulo este particionado en 1 o más, teniendo que interpretar cuando la palabra empieza y termina para generar un solo clip o 2 dependiendo de la duración del mismo.

## ¿Cómo ejecutarlo?

Para que esto funcione deben tener tanto el subtitulo como el archivo de video. Los subtitulos iran en la carpeta `subtitles` y los videos videos en la carpeta `episodes`. El formato del video puede cambiar, pero, habría que cambiar el código. Los videos se guardaran en una carpeta llamada `output`.

### Instalación

```
$ npm install
```

### Ejecutarlo

```
$ npm start
```
