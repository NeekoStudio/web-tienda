# Atribuciones de terceros — CutFrame

CutFrame usa los siguientes componentes de código abierto. Se conservan aquí sus
avisos de copyright tal y como exigen sus licencias.

## U²-Net — licencia Apache 2.0

Modelo de segmentación usado para separar el objeto del fondo. Se distribuye
dentro de esta web el archivo `models/u2netp.onnx`, la variante ligera del
modelo, exportada a ONNX.

- Proyecto: https://github.com/xuebinqin/U-2-Net
- Autores: Xuebin Qin, Zichen Zhang, Chenyang Huang, Masood Dehghan,
  Osmar R. Zaiane, Martin Jagersand
- Licencia: Apache License 2.0

El archivo ONNX procede de las publicaciones del proyecto `rembg`
(https://github.com/danielgatis/rembg), también bajo licencia MIT, que reexporta
los pesos originales de U²-Net.

## ONNX Runtime Web — licencia MIT

Motor de inferencia (WebAssembly) que ejecuta el modelo dentro del navegador.
Se distribuyen dentro de esta web los archivos `ort/ort-wasm-simd-threaded.wasm`
y `ort/ort-wasm-simd-threaded.mjs`.

- Proyecto: https://github.com/microsoft/onnxruntime
- Copyright: Microsoft Corporation
- Licencia: MIT

## client-zip — licencia MIT

Generación del archivo ZIP de descarga, en el navegador.

- Proyecto: https://github.com/Touffy/client-zip
- Copyright: David Junger
- Licencia: MIT

## React — licencia MIT

- Copyright: Meta Platforms, Inc. y colaboradores
- Licencia: MIT

## Tipografías Inter y Sora — SIL Open Font License 1.1

- Inter: Rasmus Andersson
- Sora: Jonathan Barnbrook / Ellen Luff (Google Fonts)
- Licencia: SIL OFL 1.1

Ambas se sirven desde el propio dominio a través de los paquetes `@fontsource`,
sin llamadas a Google Fonts.
