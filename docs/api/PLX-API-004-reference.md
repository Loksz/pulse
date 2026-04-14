============================================================
[PLX-API-004]  PULSE - REFERENCIA DE API
               rev. 1.1  /  2026-04-13  /  VIGENTE
============================================================


1.  CONVENCIONES GENERALES
------------------------------------------------------------

1.1  Base URL

    http://localhost:3000/api

1.2  Autenticación

    Los endpoints marcados * en la columna AUTH requieren:

    ```
    Authorization: Bearer <accessToken>
    ```

1.3  Formato de respuesta

    Éxito:
    ```json
    { "success": true, "data": { ... } }
    ```

    Error:
    ```json
    { "success": false, "error": { "code": "...", "message": "..." } }
    ```

1.4  Tabla de endpoints

    | MÉTODO | RUTA                        | AUTH | DESCRIPCIÓN               |
    |--------|-----------------------------|------|---------------------------|
    | POST   | /auth/register              | x    | Crear cuenta              |
    | POST   | /auth/login                 | x    | Iniciar sesión            |
    | POST   | /auth/refresh               | x    | Renovar tokens            |
    | POST   | /auth/logout                | *    | Cerrar sesión             |
    | GET    | /monitors                   | *    | Listar monitores          |
    | POST   | /monitors                   | *    | Crear monitor             |
    | GET    | /monitors/:id               | *    | Obtener monitor           |
    | PATCH  | /monitors/:id               | *    | Actualizar monitor        |
    | DELETE | /monitors/:id               | *    | Eliminar monitor          |
    | PATCH  | /monitors/:id/toggle        | *    | Activar / pausar          |
    | GET    | /monitors/:id/checks        | *    | Historial de chequeos     |
    | GET    | /monitors/:id/alert         | *    | Obtener alerta            |
    | POST   | /monitors/:id/alert         | *    | Crear / reemplazar alerta |
    | PATCH  | /monitors/:id/alert         | *    | Actualizar alerta         |
    | DELETE | /monitors/:id/alert         | *    | Eliminar alerta           |
    | GET    | /monitors/:id/stats         | *    | Estadísticas de monitor   |
    | GET    | /stats/summary              | *    | Resumen global            |


2.  AUTH
------------------------------------------------------------

2.1  POST /auth/register

    Body:
    | CAMPO    | TIPO   | REQ | DESCRIPCIÓN         |
    |----------|--------|-----|---------------------|
    | name     | string | *   | Nombre del usuario  |
    | email    | string | *   | Email único         |
    | password | string | *   | Mínimo 8 caracteres |

    Response 201:
    ```json
    {
      "success": true,
      "data": {
        "user": { "id": "...", "name": "...", "email": "..." },
        "accessToken": "...",
        "refreshToken": "..."
      }
    }
    ```

2.2  POST /auth/login

    Body:
    | CAMPO    | TIPO   | REQ |
    |----------|--------|-----|
    | email    | string | *   |
    | password | string | *   |

    Response 200: igual que register.

2.3  POST /auth/refresh

    Body:
    | CAMPO        | TIPO   | REQ |
    |--------------|--------|-----|
    | refreshToken | string | *   |

    Response 200:
    ```json
    { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
    ```

2.4  POST /auth/logout

    Response 200: `{ "success": true, "data": null }`


3.  MONITORS
------------------------------------------------------------

3.1  Campos de monitor

    | CAMPO        | TIPO       | REQ | DEFAULT | DESCRIPCIÓN                     |
    |--------------|------------|-----|---------|---------------------------------|
    | name         | string     | *   | -       | Nombre descriptivo              |
    | url          | string     | *   | -       | URL con protocolo               |
    | method       | enum       | o   | GET     | GET/POST/PUT/PATCH/DELETE/HEAD  |
    | headers      | object     | o   | -       | Headers adicionales             |
    | body         | string     | o   | -       | Body para métodos con payload   |
    | timeoutMs    | number     | o   | 10000   | Máximo 30000                    |
    | intervalSecs | number     | o   | 60      | 30/60/300/900/1800/3600         |
    | assertions   | Assertion[]| o   | []      | Reglas de validación            |

3.2  Estructura de assertions en body

    ```json
    "assertions": [
      { "type": "statusCode",   "expected": 200 },
      { "type": "responseTime", "maxMs": 800 },
      { "type": "bodyContains", "value": "healthy" },
      { "type": "jsonPath",     "path": "$.status", "expected": "ok" },
      { "type": "sslExpiry",    "minDaysRemaining": 14 }
    ]
    ```

    | TIPO            | CAMPOS ADICIONALES                    | REQ  |
    |-----------------|---------------------------------------|------|
    | statusCode      | expected: number                      | *    |
    | responseTime    | maxMs: number                         | *    |
    | bodyContains    | value: string                         | *    |
    | jsonPath        | path: string / expected: any          | *    |
    | sslExpiry       | minDaysRemaining: number              | *    |

3.3  GET /monitors

    Response 200:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "664a...", "name": "API producción",
          "url": "https://...", "method": "GET",
          "status": "UP", "intervalSecs": 60, "active": true,
          "lastCheckedAt": "2026-04-13T10:00:00Z",
          "uptime24h": 99.8, "avgResponseMs": 142,
          "assertionCount": 3
        }
      ]
    }
    ```

3.4  POST /monitors

    Body: campos de monitor (sección 3.1).
    Response 201: monitor creado completo.

3.5  GET /monitors/:id

    Response 200: documento Monitor completo con `lastCheck`.

3.6  PATCH /monitors/:id

    Body: subconjunto de campos de monitor.
    Response 200: monitor actualizado.

3.7  DELETE /monitors/:id

    Response 200: `{ "success": true, "data": null }`

3.8  PATCH /monitors/:id/toggle

    Response 200:
    ```json
    { "success": true, "data": { "active": false } }
    ```


4.  CHECKS
------------------------------------------------------------

4.1  GET /monitors/:id/checks

    Query params:
    | PARAM  | DEFAULT | DESCRIPCIÓN                              |
    |--------|---------|------------------------------------------|
    | limit  | 50      | Máximo 200                               |
    | cursor | -       | _id del último check visto (paginación)  |
    | from   | -       | ISO 8601 - desde esta fecha              |
    | to     | -       | ISO 8601 - hasta esta fecha              |

    Response 200:
    ```json
    {
      "success": true,
      "data": {
        "checks": [
          {
            "id": "...", "status": "DOWN",
            "statusCode": 200, "responseTimeMs": 134,
            "assertionFailures": ["responseTime: 134ms > 800ms maxMs - PASS"],
            "checkedAt": "2026-04-13T10:00:00Z"
          }
        ],
        "nextCursor": "664b..."
      }
    }
    ```


5.  ALERTS
------------------------------------------------------------

5.1  Campos de alerta

    | CAMPO               | TIPO    | REQ          | DEFAULT | DESCRIPCIÓN              |
    |---------------------|---------|--------------|---------|--------------------------|
    | channel             | enum    | *            | -       | EMAIL / WEBHOOK          |
    | emailTo             | string  | ! si EMAIL   | -       | Destinatario             |
    | webhookUrl          | string  | ! si WEBHOOK | -       | URL del receptor         |
    | webhookSecret       | string  | o            | -       | Secreto HMAC             |
    | failureThreshold    | number  | o            | 2       | Fallos antes de alertar  |
    | cooldownMins        | number  | o            | 30      | Minutos entre alertas    |
    | notifyOnRecovery    | boolean | o            | true    | Alertar en recovery      |

5.2  GET /monitors/:id/alert

    Response 200: config de alerta embebida o `data: null`.

5.3  POST /monitors/:id/alert

    Body: campos de alerta (sección 5.1).
    Response 201: alerta creada.
    ~  Si ya existía una alerta, la reemplaza.

5.4  PATCH /monitors/:id/alert

    Body: subconjunto de campos de alerta.
    Response 200: alerta actualizada.

5.5  DELETE /monitors/:id/alert

    Response 200: `{ "success": true, "data": null }`


6.  STATS
------------------------------------------------------------

6.1  GET /monitors/:id/stats

    Query params:
    | PARAM  | DEFAULT | VALORES        |
    |--------|---------|----------------|
    | period | 24h     | 24h / 7d / 30d |

    Response 200:
    ```json
    {
      "success": true,
      "data": {
        "uptime": 99.72,
        "totalChecks": 1440,
        "failedChecks": 4,
        "avgResponseMs": 138,
        "p95ResponseMs": 310,
        "p99ResponseMs": 520,
        "downtime": [
          {
            "from": "2026-04-12T03:14:00Z",
            "to":   "2026-04-12T03:18:00Z",
            "durationMins": 4
          }
        ]
      }
    }
    ```

6.2  GET /stats/summary

    Response 200:
    ```json
    {
      "success": true,
      "data": {
        "total": 8, "up": 7, "down": 1,
        "paused": 0, "avgUptime24h": 98.9
      }
    }
    ```


7.  WEBSOCKET
------------------------------------------------------------

7.1  Conexión

    Endpoint:  ws://localhost:3000/monitors

    ```js
    const socket = io('http://localhost:3000/monitors', {
      auth: { token: '<accessToken>' }
    });
    ```

7.2  Eventos emitidos por el servidor

    | EVENTO                  | DESCRIPCIÓN                               |
    |-------------------------|-------------------------------------------|
    | check.completed         | Se completó un chequeo                    |
    | monitor.status_changed  | Estado del monitor cambió (UP <-> DOWN)     |

    Payload check.completed:
    ```json
    {
      "monitorId": "...", "monitorName": "...",
      "status": "DOWN",
      "statusCode": 200,
      "responseTimeMs": 145,
      "assertionFailures": ["jsonPath: $.status expected 'ok' got 'degraded'"],
      "checkedAt": "2026-04-13T10:01:00Z"
    }
    ```

    Payload monitor.status_changed:
    ```json
    {
      "monitorId": "...",
      "previousStatus": "UP",
      "currentStatus": "DOWN",
      "changedAt": "2026-04-13T10:01:00Z"
    }
    ```


8.  CÓDIGOS DE ERROR
------------------------------------------------------------

    | CÓDIGO            | HTTP | DESCRIPCIÓN                       |
    |-------------------|------|-----------------------------------|
    | UNAUTHORIZED      | 401  | Token ausente o inválido          |
    | FORBIDDEN         | 403  | Sin acceso al recurso             |
    | NOT_FOUND         | 404  | Recurso no encontrado             |
    | CONFLICT          | 409  | Recurso duplicado                 |
    | VALIDATION_ERROR  | 422  | DTO inválido                      |
    | INTERNAL_ERROR    | 500  | Error inesperado del servidor     |


============================================================

| REV | FECHA      | DESCRIPCIÓN                       |
|-----|------------|-----------------------------------|
| 1.0 | 2026-04-13 | Creación inicial                  |
| 1.1 | 2026-04-13 | assertions en endpoints / MongoDB |
