============================================================
[PLX-FMT-000]  PULSE - ESTÁNDAR DE DOCUMENTACIÓN
               rev. 1.0  /  2026-04-13  /  NORMATIVO
============================================================


1.  PROPÓSITO
------------------------------------------------------------

    Define el formato obligatorio para todos los documentos
    del proyecto Pulse. Todo documento nuevo debe conformarse
    a esta especificación antes de ser considerado válido.

    Repositorio:  github.com/Loksz/pulse


2.  ESTRUCTURA DE CARPETAS
------------------------------------------------------------

    ```
    docs/
    +-- PLX-FMT-000-format.md        <- este documento
    +-- core/                        <- visión, casos de uso, decisiones
    |   +-- PLX-OVW-001-overview.md
    |   +-- PLX-UC-005-use-cases.md
    |   +-- PLX-ADR-006-decisions.md
    +-- technical/                   <- arquitectura, datos
    |   +-- PLX-ARCH-002-architecture.md
    |   +-- PLX-DATA-003-data-model.md
    +-- api/                         <- contratos de interfaz
        +-- PLX-API-004-reference.md
    ```


3.  IDENTIFICACIÓN DE DOCUMENTOS
------------------------------------------------------------

3.1  Prefijo del proyecto

    Todos los documentos usan el prefijo  PLX  (de Pulse).

3.2  Tabla de tipos

    | CÓDIGO        | TIPO                        | CARPETA    |
    |---------------|-----------------------------|------------|
    | PLX-FMT-000   | Estándar de formato         | /          |
    | PLX-OVW-001   | Visión general              | core/      |
    | PLX-ARCH-002  | Arquitectura del sistema    | technical/ |
    | PLX-DATA-003  | Modelo de datos             | technical/ |
    | PLX-API-004   | Referencia de API           | api/       |
    | PLX-UC-005    | Casos de uso                | core/      |
    | PLX-ADR-006   | Decisiones de arquitectura  | core/      |

3.3  Nomenclatura de archivos

    Formato:  PLX-[TIPO]-[NNN]-[nombre-en-kebab].md

    - El prefijo PLX es fijo para todo el proyecto.
    - El tipo identifica la categoría del documento.
    - El número NNN es secuencial dentro del proyecto.
    - El nombre en kebab-case es descriptivo y en inglés.

3.4  Estados válidos

    | ESTADO    | DESCRIPCIÓN                                  |
    |-----------|----------------------------------------------|
    | BORRADOR  | En elaboración, no listo para referencia     |
    | REVISIÓN  | Completo, pendiente de aprobación            |
    | VIGENTE   | Aprobado, es la versión de referencia        |
    | OBSOLETO  | Reemplazado por una versión posterior        |


4.  ESTRUCTURA DE CABECERA
------------------------------------------------------------

    Todo documento comienza con el bloque de cabecera exacto:

    +- PLANTILLA --------------------------------------------+

    ========================================================
    [PLX-TIPO-NNN]  PULSE - TÍTULO DEL DOCUMENTO
                    rev. X.Y  /  YYYY-MM-DD  /  ESTADO
    ========================================================

    +--------------------------------------------------------+

    - El código y título van en MAYÚSCULAS.
    - Los metadatos se alinean con el título (sangría ajustada
      al ancho del código).
    - Los separadores = ocupan exactamente 56 caracteres.


5.  NUMERACIÓN DE SECCIONES
------------------------------------------------------------

5.1  Jerarquía

    Nivel 1  ->  1.   TÍTULO EN MAYÚSCULAS
    Nivel 2  ->  1.1  Título en título case
    Nivel 3  ->  1.1.1  descripción en minúsculas

5.2  Separadores visuales

    Nivel 1  ->  línea de guiones de 60 caracteres (----)
    Nivel 2  ->  sin separador, sangría de 4 espacios
    Nivel 3  ->  sin separador, sangría de 8 espacios

5.3  Espacio entre secciones

    - Dos líneas en blanco antes de cada sección nivel 1.
    - Una línea en blanco antes de cada sección nivel 2.
    - Sin línea adicional antes de nivel 3.


6.  TABLAS
------------------------------------------------------------

6.1  Reglas

    - Usar tablas para cualquier conjunto de 3 o más
      propiedades relacionadas.
    - Ninguna celda vacía: usar  -  cuando el valor no aplica.
    - La primera columna es siempre el identificador o nombre.
    - Encabezados en MAYÚSCULAS.

6.2  Símbolos de estado

    | SÍMBOLO | SIGNIFICADO               |
    |---------|---------------------------|
    | *       | Activo / requerido / sí   |
    | o       | Opcional                  |
    | x       | No aplica / no            |
    | !       | Condicional               |
    | -       | Sin valor / N/A           |


7.  BLOQUES DE CÓDIGO Y FLUJOS
------------------------------------------------------------

    - Todo bloque de código declara su lenguaje.
    - Los flujos usan bloques sin tipo con caracteres ASCII:
      ->  v  |  +  +  v

    Formato de flujo estándar:
    ```
    [COMPONENTE A]
          |
          |  descripción
          v
    [COMPONENTE B]
          +-- rama
          +-- otra rama
    ```


8.  NOTAS Y ADVERTENCIAS
------------------------------------------------------------

    | PREFIJO | USO                              |
    |---------|----------------------------------|
    | ~       | Nota informativa                 |
    | !       | Condición o caso especial        |
    | x       | Restricción o comportamiento     |

    Formato:  símbolo + dos espacios + texto en minúsculas.


9.  REGLAS DE PROSA
------------------------------------------------------------

    - Frases cortas y declarativas. Máximo 2 cláusulas.
    - Sin adjetivos valorativos.
    - Tiempo presente. Voz activa.
    - Máximo 3 líneas de prosa antes de pasar a lista o tabla.


10.  BLOQUE DE REVISIONES
------------------------------------------------------------

    Todo documento cierra con el separador = y la tabla:

    | REV | FECHA      | DESCRIPCIÓN      |
    |-----|------------|------------------|
    | 1.0 | YYYY-MM-DD | Creación inicial |


============================================================

| REV | FECHA      | DESCRIPCIÓN      |
|-----|------------|------------------|
| 1.0 | 2026-04-13 | Creación inicial |
