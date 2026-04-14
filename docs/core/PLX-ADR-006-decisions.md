============================================================
[PLX-ADR-006]  PULSE - DECISIONES DE ARQUITECTURA
               rev. 1.1  /  2026-04-13  /  VIGENTE
============================================================


1.  ÍNDICE DE DECISIONES
------------------------------------------------------------

    | ID     | TÍTULO                                      | ESTADO  |
    |--------|---------------------------------------------|---------|
    | ADR-01 | MongoDB sobre base de datos relacional      | VIGENTE |
    | ADR-02 | BullMQ sobre ejecución directa en cron      | VIGENTE |
    | ADR-03 | Cron global sobre N crons por monitor       | VIGENTE |
    | ADR-04 | Mongoose sobre Prisma                       | VIGENTE |
    | ADR-05 | consecutiveFails embebido en Monitor        | VIGENTE |
    | ADR-06 | Room WebSocket por usuario                  | VIGENTE |
    | ADR-07 | Firma HMAC en webhooks                      | VIGENTE |
    | ADR-08 | React + Vite sobre Next.js                  | VIGENTE |


2.  DECISIONES
------------------------------------------------------------

2.1  ADR-01 - MongoDB sobre base de datos relacional

    CONTEXTO
        Pulse necesita almacenar dos tipos de datos con
        características muy distintas: configuración de
        monitores (con reglas de validación heterogéneas)
        y resultados de chequeos (log masivo append-only).

    DECISIÓN
        MongoDB como base de datos principal.

    RAZONES

        1. Assertions polimórficas
           Cada monitor puede tener múltiples reglas de
           validación de tipos distintos:

           ```json
           "assertions": [
             { "type": "statusCode", "expected": 200 },
             { "type": "responseTime", "maxMs": 800 },
             { "type": "jsonPath", "path": "$.status", "expected": "ok" },
             { "type": "sslExpiry", "minDaysRemaining": 14 }
           ]
           ```

           En un modelo relacional, esto requiere una tabla
           de assertions con columnas nullable por tipo o
           una columna Json sin validación de estructura.
           En MongoDB cada assertion es un subdocumento con
           su propio shape - polimorfismo nativo.

        2. TTL indexes nativos
           Los check results son un log append-only de alto
           volumen. MongoDB permite definir un TTL index:

           ```js
           CheckSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 7776000 })
           ```

           Los documentos se eliminan automáticamente al
           cumplir 90 días. No se necesita un cron de limpieza
           ni lógica de archivado.

        3. Documentos embebidos
           La configuración de alertas vive embebida dentro
           del documento de Monitor. El dashboard nunca
           necesita un JOIN para obtener el estado completo
           de un monitor - es una sola lectura.

        4. Escritura optimizada
           MongoDB está optimizado para inserciones masivas.
           Con 100 monitores chequeando cada 60 segundos,
           se generan 144.000 documentos por día. El driver
           de MongoDB soporta `insertMany` con alta eficiencia.

    CONSECUENCIAS
        x  Sin transacciones ACID entre colecciones por defecto.
           Se mitiga manteniendo la lógica crítica dentro de
           una sola operación de documento.
        !  Las agregaciones para estadísticas usan el pipeline
           de MongoDB en lugar de SQL - curva de aprendizaje
           distinta pero capacidad equivalente.

2.2  ADR-02 - BullMQ sobre ejecución directa en cron

    CONTEXTO
        El scheduler detecta monitores que deben ejecutarse
        y necesita lanzar los chequeos HTTP.

    DECISIÓN
        Los chequeos se encolan como jobs en BullMQ.
        Un worker independiente los procesa de forma asíncrona.

    RAZONES
        - Ejecutar N chequeos síncronamente en el event loop
          bloquearía el servidor durante el ciclo del cron.
        - BullMQ limita la concurrencia de forma configurable.
        - Los reintentos con backoff están integrados sin
          lógica adicional.
        - El historial de jobs es inspeccionable en Redis.

    CONSECUENCIAS
        * Redis es una dependencia obligatoria del sistema.

2.3  ADR-03 - Cron global sobre N crons por monitor

    CONTEXTO
        Cada monitor tiene su propio intervalo de ejecución.
        Se necesita un mecanismo que respete ese intervalo.

    DECISIÓN
        Un único cron corre cada 10 segundos y consulta
        monitores cuyo `nextCheckAt` ya venció.

    RAZONES
        - Crear y destruir timers dinámicamente al agregar o
          eliminar monitores es frágil y no sobrevive reinicios.
        - El estado de qué monitorear vive en MongoDB, no en
          memoria. El servidor puede reiniciarse sin pérdida.

    CONSECUENCIAS
        !  Resolución mínima de 10 segundos. Un monitor con
           intervalo de 30s puede ejecutarse con hasta 10s de
           desfase. Aceptable para uptime monitoring.

2.4  ADR-04 - Mongoose sobre Prisma

    CONTEXTO
        Se necesita un ODM para interactuar con MongoDB desde
        NestJS.

    DECISIÓN
        Mongoose con `@nestjs/mongoose`.

    RAZONES
        - Prisma soporta MongoDB pero con limitaciones:
          no soporta documentos embebidos con arrays de
          subdocumentos heterogéneos, que es exactamente
          lo que requieren las assertions.
        - Mongoose es el ODM estándar de MongoDB en Node.js.
          La integración con NestJS está bien documentada
          y mantenida oficialmente.
        - Los schemas de Mongoose con discriminators
          modelan assertions polimórficas de forma nativa.

    CONSECUENCIAS
        x  Sin migraciones declarativas. Los cambios de schema
           se gestionan con scripts de migración manuales o
           con `migrate-mongo`.

2.5  ADR-05 - consecutiveFails embebido en Monitor

    CONTEXTO
        Las alertas se disparan tras N fallos consecutivos.
        El contador debe sobrevivir reinicios del servidor.

    DECISIÓN
        `consecutiveFails` y `lastNotifiedAt` se almacenan
        como campos del documento Monitor en MongoDB, no en
        memoria ni en Redis.

    RAZONES
        - Un reinicio del proceso no resetea el contador.
        - No requiere coordinación entre réplicas del servidor.
        - Con MongoDB, actualizar un campo embebido es una
          operación atómica sobre el mismo documento.

    CONSECUENCIAS
        !  Cada chequeo fallido genera un `findOneAndUpdate`
           adicional en la colección monitors.

2.6  ADR-06 - Room WebSocket por usuario

    CONTEXTO
        Los clientes conectados deben recibir eventos de sus
        monitores en tiempo real.

    DECISIÓN
        Al conectar, cada cliente se une al room de su userId.
        Todos los eventos del usuario se emiten a ese room.

    RAZONES
        - Una conexión recibe todos los updates del usuario.
        - El frontend no gestiona N subscripciones separadas.
        - La lógica de emisión es simple:
          `gateway.to(userId).emit(event, payload)`.

    CONSECUENCIAS
        !  Si el usuario tiene muchos monitores activos,
           el volumen de eventos por conexión es proporcional.

2.7  ADR-07 - Firma HMAC en webhooks

    CONTEXTO
        Los webhooks se envían como POST a una URL configurada
        por el usuario.

    DECISIÓN
        Si `webhookSecret` está presente, el payload se firma
        con HMAC-SHA256 en `X-Pulse-Signature: sha256=<hash>`.

    RAZONES
        - Es el estándar de la industria (GitHub, Stripe).
        - El receptor puede verificar autenticidad sin
          conocer los internos de Pulse.
        - Coste de implementación bajo, valor de seguridad alto.

    CONSECUENCIAS
        o  El secret es opcional. Sin él, no hay firma.

2.8  ADR-08 - React + Vite sobre Next.js

    CONTEXTO
        Se necesita un frontend para el dashboard de Pulse.

    DECISIÓN
        React 18 + Vite. Sin framework SSR.

    RAZONES
        - El dashboard es una SPA autenticada. No hay rutas
          públicas que se beneficien de SSR o SSG.
        - Vite ofrece HMR más rápido que Next.js en desarrollo.
        - El proyecto ya tiene Next.js en Aether. Usar React
          puro demuestra que el stack se elige según el caso
          de uso, no por costumbre.
        - La complejidad de un framework SSR no está
          justificada para una aplicación completamente
          detrás de autenticación.

    CONSECUENCIAS
        x  Sin SSR ni meta tags dinámicos. No aplica para
           este tipo de aplicación.
        o  El despliegue es un build estático servido desde
           cualquier CDN o hosting de archivos estáticos.


============================================================

| REV | FECHA      | DESCRIPCIÓN                              |
|-----|------------|------------------------------------------|
| 1.0 | 2026-04-13 | Creación inicial                         |
| 1.1 | 2026-04-13 | ADR-01 MongoDB / ADR-04 Mongoose / ADR-08|
