============================================================
[PLX-ARCH-002]  PULSE - ARQUITECTURA DEL SISTEMA
                rev. 1.1  /  2026-04-13  /  VIGENTE
============================================================


1.  MÓDULOS
------------------------------------------------------------

1.1  Tabla de módulos

    | MÓDULO              | RESPONSABILIDAD                               |
    |---------------------|-----------------------------------------------|
    | AuthModule          | Registro, login, JWT, refresh tokens          |
    | UsersModule         | Perfil de usuario, gestión de cuenta          |
    | MonitorsModule      | CRUD de monitores, assertions, toggle         |
    | CheckerModule       | Scheduling, ejecución de chequeos HTTP        |
    | ChecksModule        | Historial de resultados, paginación           |
    | AlertsModule        | Evaluación de umbrales, estado de alertas     |
    | NotificationsModule | Envío por email y webhook                     |
    | StatsModule         | Cálculo de uptime, latencia, caídas           |
    | GatewayModule       | WebSocket - eventos en tiempo real            |
    | DatabaseModule      | Conexión MongoDB, global                      |

1.2  Dependencias entre módulos

    ```
    AppModule
    +-- DatabaseModule     (global)
    +-- AuthModule
    |     +-- UsersModule
    +-- MonitorsModule
    |     +-- CheckerModule
    |           +-- ChecksModule
    |           +-- AlertsModule
    |           |     +-- NotificationsModule
    |           +-- GatewayModule
    +-- ChecksModule
    +-- StatsModule
    |     +-- ChecksModule
    +-- GatewayModule
    ```

    ~  Ningún módulo accede a la colección de otro
       directamente. La comunicación es exclusivamente
       a través del servicio exportado.


2.  ESTRUCTURA DE ARCHIVOS
------------------------------------------------------------

    ```
    src/
    +-- app.module.ts
    |
    +-- auth/
    |   +-- auth.module.ts
    |   +-- auth.controller.ts
    |   +-- auth.service.ts
    |   +-- strategies/
    |   |   +-- jwt.strategy.ts
    |   |   +-- jwt-refresh.strategy.ts
    |   +-- guards/
    |   |   +-- jwt-auth.guard.ts
    |   |   +-- roles.guard.ts
    |   +-- decorators/
    |       +-- current-user.decorator.ts
    |       +-- public.decorator.ts
    |       +-- roles.decorator.ts
    |
    +-- users/
    |   +-- users.module.ts
    |   +-- users.controller.ts
    |   +-- users.service.ts
    |   +-- schemas/
    |       +-- user.schema.ts
    |
    +-- monitors/
    |   +-- monitors.module.ts
    |   +-- monitors.controller.ts
    |   +-- monitors.service.ts
    |   +-- schemas/
    |   |   +-- monitor.schema.ts
    |   |   +-- assertion.schema.ts    <- discriminators por tipo
    |   +-- dto/
    |       +-- create-monitor.dto.ts
    |       +-- update-monitor.dto.ts
    |
    +-- checker/
    |   +-- checker.module.ts
    |   +-- checker.service.ts         <- ejecuta el HTTP check
    |   +-- checker.processor.ts       <- BullMQ worker
    |   +-- checker.scheduler.ts       <- encola jobs
    |   +-- assertion-evaluator.ts     <- evalúa assertions
    |
    +-- checks/
    |   +-- checks.module.ts
    |   +-- checks.controller.ts
    |   +-- checks.service.ts
    |   +-- schemas/
    |       +-- check.schema.ts        <- TTL index en checkedAt
    |
    +-- alerts/
    |   +-- alerts.module.ts
    |   +-- alerts.service.ts          <- evalúa umbrales
    |
    +-- notifications/
    |   +-- notifications.module.ts
    |   +-- notifications.service.ts
    |   +-- channels/
    |       +-- email.channel.ts
    |       +-- webhook.channel.ts
    |
    +-- stats/
    |   +-- stats.module.ts
    |   +-- stats.controller.ts
    |   +-- stats.service.ts           <- aggregation pipelines
    |
    +-- gateway/
    |   +-- gateway.module.ts
    |   +-- pulse.gateway.ts
    |
    +-- common/
    |   +-- interceptors/
    |   |   +-- logging.interceptor.ts
    |   |   +-- transform.interceptor.ts
    |   +-- filters/
    |   |   +-- http-exception.filter.ts
    |   +-- pipes/
    |       +-- validation.pipe.ts
    |
    +-- database/
        +-- database.module.ts
    ```


3.  FLUJO PRINCIPAL - CICLO DE UN CHEQUEO
------------------------------------------------------------

    ```
    CheckerScheduler  (cron global cada 10 segundos)
          |
          |  monitors.find({ nextCheckAt: { $lte: now },
          |                  active: true })
          v
    BullMQ Queue  ("pulse:checks")
          |
          |  job: { monitorId, url, method, headers,
          |         assertions, timeoutMs }
          v
    CheckerProcessor  (@Processor)
          |
          +-- CheckerService.executeCheck()
          |         +-- axios.request()
          |               -> { statusCode, responseTimeMs,
          |                   body, headers, error? }
          |
          +-- AssertionEvaluator.evaluate(result, assertions)
          |         -> { passed: bool, failures: string[] }
          |
          +-- ChecksService.save()
          |         +-- inserta en colección checks (TTL activo)
          |
          +-- MonitorsService.updateStatus()
          |         +-- actualiza status y nextCheckAt
          |
          +-- AlertsService.evaluate()
          |         +-- fallos >= umbral?
          |               +-- NotificationsService.send()
          |
          +-- PulseGateway.emit('check.completed', result)
                    +-- room del usuario recibe el update
    ```


4.  EVALUACIÓN DE ASSERTIONS
------------------------------------------------------------

    ```
    AssertionEvaluator.evaluate(httpResult, assertions[])
          |
          +-- type = statusCode   -> result.statusCode === expected
          +-- type = responseTime -> result.responseTimeMs <= maxMs
          +-- type = bodyContains -> result.body.includes(value)
          +-- type = jsonPath     -> jsonpath.query(body, path) === expected
          +-- type = sslExpiry    -> cert.validTo - now >= minDays
          |
          +-- todas passed?
                +-- YES -> CheckStatus: UP
                +-- NO  -> CheckStatus: DOWN / failures: [...]
    ```

    ~  El resultado final es DOWN si cualquier assertion falla.
       El campo `failures` registra cuáles fallaron y por qué.


5.  FLUJO DE ALERTAS
------------------------------------------------------------

    ```
    AlertsService.evaluate(monitor, checkStatus)
          |
          +-- checkStatus = DOWN
          |     +-- monitor.consecutiveFails++
          |     +-- fails >= threshold  AND  fuera de cooldown?
          |               +-- NotificationsService.send('DOWN')
          |
          +-- checkStatus = UP  AND  monitor.status era DOWN
                    +-- monitor.consecutiveFails = 0
                    +-- notifyOnRecovery = true?
                              +-- NotificationsService.send('RECOVERY')
    ```


6.  PATRONES NESTJS UTILIZADOS
------------------------------------------------------------

6.1  Guards

    | GUARD           | ALCANCE | FUNCIÓN                              |
    |-----------------|---------|--------------------------------------|
    | JwtAuthGuard    | Global  | Valida Bearer token en cada request  |
    | RolesGuard      | Ruta    | Verifica rol con @Roles()            |

    !  Rutas públicas marcadas con @Public() omiten JwtAuthGuard.

6.2  Interceptors

    | INTERCEPTOR          | FUNCIÓN                                    |
    |----------------------|--------------------------------------------|
    | LoggingInterceptor   | Loguea método, ruta, duración y status     |
    | TransformInterceptor | Envuelve respuestas en { success, data }   |

6.3  Configuración global  (main.ts)

    | ELEMENTO             | CONFIGURACIÓN                              |
    |----------------------|--------------------------------------------|
    | ValidationPipe       | whitelist: true / transform: true          |
    | HttpExceptionFilter  | Estandariza formato de errores             |
    | TransformInterceptor | Aplicado globalmente                       |
    | LoggingInterceptor   | Aplicado globalmente                       |
    | Prefijo de rutas     | /api                                       |

6.4  BullMQ

    - CheckerModule registra la cola  pulse:checks.
    - CheckerScheduler encola jobs con datos del monitor.
    - CheckerProcessor declara el worker con @Processor.
    - Concurrencia configurable por variable de entorno.

6.5  WebSocket Gateway

    - Namespace:  /monitors
    - Autenticación en el handshake con el access token.
    - Cada cliente se une al room de su userId.
    - Eventos:  check.completed / monitor.status_changed


7.  VARIABLES DE ENTORNO
------------------------------------------------------------

    | VARIABLE               | REQUERIDA | DESCRIPCIÓN                  |
    |------------------------|-----------|------------------------------|
    | PORT                   | o         | Default: 3000                |
    | NODE_ENV               | o         | development / production     |
    | MONGODB_URI            | *         | Connection string MongoDB    |
    | REDIS_HOST             | *         | Host de Redis                |
    | REDIS_PORT             | *         | Puerto de Redis              |
    | JWT_SECRET             | *         | Secreto access tokens        |
    | JWT_EXPIRES_IN         | o         | Default: 15m                 |
    | JWT_REFRESH_SECRET     | *         | Secreto refresh tokens       |
    | JWT_REFRESH_EXPIRES_IN | o         | Default: 7d                  |
    | SMTP_HOST              | !         | Requerido si canal = EMAIL   |
    | SMTP_PORT              | !         | Requerido si canal = EMAIL   |
    | SMTP_USER              | !         | Requerido si canal = EMAIL   |
    | SMTP_PASS              | !         | Requerido si canal = EMAIL   |
    | SMTP_FROM              | !         | Requerido si canal = EMAIL   |
    | CHECKER_CONCURRENCY    | o         | Jobs paralelos. Default: 5   |
    | CHECK_RETENTION_DAYS   | o         | TTL checks. Default: 90      |


============================================================

| REV | FECHA      | DESCRIPCIÓN                        |
|-----|------------|------------------------------------|
| 1.0 | 2026-04-13 | Creación inicial                   |
| 1.1 | 2026-04-13 | MongoDB / Mongoose / assertions    |
