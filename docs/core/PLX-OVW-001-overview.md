============================================================
[PLX-OVW-001]  PULSE - VISIÓN GENERAL
               rev. 1.1  /  2026-04-13  /  VIGENTE
============================================================


1.  DEFINICIÓN
------------------------------------------------------------

    Pulse es una plataforma de monitoreo de APIs y servicios
    web. Ejecuta chequeos HTTP periódicos contra endpoints
    registrados, evalúa assertions configurables por monitor,
    persiste el historial de resultados y emite alertas cuando
    el estado de un servicio cambia.

    El estado de todos los monitores se refleja en un
    dashboard en tiempo real vía WebSockets.

    Repositorio:  github.com/Loksz/pulse
    Autor:        github.com/Loksz


2.  PROBLEMA
------------------------------------------------------------

2.1  Situación

    Los servicios en producción fallan sin previo aviso.
    El momento en que el equipo se entera del fallo determina
    el tiempo de respuesta.

2.2  Alternativas existentes

    | PRODUCTO       | SELF-HOSTED | PLAN GRATUITO | LÍMITE       |
    |----------------|-------------|---------------|--------------|
    | Better Uptime  | x           | !             | 10 monitores |
    | Uptime Robot   | x           | !             | 50 monitores |
    | Pingdom        | x           | x             | -            |
    | Pulse          | *           | *             | Sin límite   |

    ~  Pulse se despliega en infraestructura propia. Los datos
       no salen del entorno del usuario.


3.  FUNCIONALIDADES
------------------------------------------------------------

3.1  Monitores

    | FUNCIONALIDAD          | DESCRIPCIÓN                               |
    |------------------------|-------------------------------------------|
    | Registro de endpoints  | URL, método HTTP, headers, body           |
    | Assertions             | Reglas de validación polimórficas         |
    | Intervalos             | 30s / 1m / 5m / 15m / 30m / 1h           |
    | Control                | Activar / pausar sin eliminar             |

3.2  Assertions disponibles

    | TIPO            | PARÁMETROS                        | EJEMPLO                      |
    |-----------------|-----------------------------------|------------------------------|
    | statusCode      | expected: number                  | status = 200                 |
    | responseTime    | maxMs: number                     | latencia < 800ms             |
    | bodyContains    | value: string                     | body incluye "healthy"       |
    | jsonPath        | path: string, expected: any       | $.status === "ok"            |
    | sslExpiry       | minDaysRemaining: number          | SSL expira en > 14 días      |

    ~  Cada monitor puede tener múltiples assertions de
       distintos tipos combinadas.

3.3  Chequeos

    | FUNCIONALIDAD          | DESCRIPCIÓN                               |
    |------------------------|-------------------------------------------|
    | Ejecución asíncrona    | Cola BullMQ, el servidor no se bloquea    |
    | Historial              | Status, latencia, assertions fallidas     |
    | Retención automática   | TTL index en MongoDB - sin cron manual    |
    | Reintentos             | Automáticos ante fallo de red             |

3.4  Alertas y notificaciones

    | FUNCIONALIDAD          | DESCRIPCIÓN                               |
    |------------------------|-------------------------------------------|
    | Canales                | Email (SMTP) / Webhook (POST)             |
    | Umbral de fallo        | N fallos consecutivos antes de alertar    |
    | Recovery               | Notificación cuando el servicio vuelve UP |
    | Cooldown               | Intervalo mínimo entre alertas repetidas  |
    | Firma de webhook       | HMAC-SHA256 opcional en header            |

3.5  Estadísticas

    | MÉTRICA              | PERIODOS DISPONIBLES    |
    |----------------------|-------------------------|
    | Uptime %             | 24h / 7d / 30d          |
    | Latencia promedio    | 24h / 7d / 30d          |
    | Latencia p95 / p99   | 24h / 7d / 30d          |
    | Historial de caídas  | Inicio / fin / duración |

3.6  Dashboard en tiempo real

    - Estado de todos los monitores actualizado por WebSocket.
    - Sin polling desde el cliente.
    - Eventos: check completado / estado cambiado.


4.  STACK TECNOLÓGICO
------------------------------------------------------------

4.1  Backend

    | CAPA                | TECNOLOGÍA              |
    |---------------------|-------------------------|
    | Framework           | NestJS                  |
    | Lenguaje            | TypeScript              |
    | Base de datos       | MongoDB                 |
    | ODM                 | Mongoose                |
    | Cola de jobs        | BullMQ + Redis          |
    | Tareas programadas  | @nestjs/schedule        |
    | WebSockets          | @nestjs/websockets      |
    | Validación          | class-validator         |
    | Autenticación       | @nestjs/jwt + Passport  |
    | HTTP checks         | Axios                   |
    | Email               | Nodemailer              |
    | Testing             | Jest + Supertest        |

4.2  Frontend

    | CAPA                | TECNOLOGÍA              |
    |---------------------|-------------------------|
    | Framework           | React 18                |
    | Build tool          | Vite                    |
    | Lenguaje            | TypeScript              |
    | Estilos             | Tailwind CSS            |
    | Estado global       | Zustand                 |
    | WebSocket cliente   | socket.io-client        |
    | HTTP cliente        | Axios                   |
    | Gráficos            | Recharts                |


5.  CASOS DE USO
------------------------------------------------------------

    | CASO                   | DESCRIPCIÓN                                  |
    |------------------------|----------------------------------------------|
    | Desarrollador solo     | Monitorea apps desplegadas en Railway/Render |
    | Equipo pequeño         | Monitoreo centralizado de múltiples servicios|
    | Portfolio técnico      | Demostración de arquitectura NestJS          |


============================================================

| REV | FECHA      | DESCRIPCIÓN                        |
|-----|------------|------------------------------------|
| 1.0 | 2026-04-13 | Creación inicial                   |
| 1.1 | 2026-04-13 | MongoDB + React/Vite / assertions  |
