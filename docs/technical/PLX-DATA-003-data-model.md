============================================================
[PLX-DATA-003]  PULSE - MODELO DE DATOS
                rev. 1.1  /  2026-04-13  /  VIGENTE
============================================================


1.  COLECCIONES
------------------------------------------------------------

    | COLECCIÓN     | DESCRIPCIÓN                                   |
    |---------------|-----------------------------------------------|
    | users         | Cuentas de usuario                            |
    | refresh_tokens| Tokens de refresco activos                    |
    | monitors      | Endpoints monitoreados con assertions embebidas|
    | checks        | Resultados de chequeos (TTL: 90 días)         |
    | notifications | Registro de notificaciones enviadas           |

    ~  No existe una colección alerts independiente. La
       configuración de alertas y su estado operacional
       viven embebidos dentro del documento Monitor.


2.  RELACIONES
------------------------------------------------------------

    ```
    User ---------------- Monitor       (1 : N, ref)
    User ---------------- RefreshToken  (1 : N, ref)
    Monitor ------------- Check         (1 : N, ref)
    Monitor ------------- Alert         (1 : 1, embebido)
    Monitor ------------- Assertion[]   (1 : N, embebido)
    Alert --------------- Notification  (1 : N, ref)
    ```


3.  SCHEMAS MONGOOSE
------------------------------------------------------------

3.1  User

    ```typescript
    @Schema({ timestamps: true, collection: 'users' })
    export class User {
      @Prop({ required: true, unique: true })
      email: string;

      @Prop({ required: true })
      name: string;

      @Prop({ required: true })
      passwordHash: string;
    }
    ```

    | CAMPO        | TIPO   | RESTRICCIÓN  | DESCRIPCIÓN          |
    |--------------|--------|--------------|----------------------|
    | _id          | ObjectId | AUTO PK    | Identificador único  |
    | email        | String | UNIQUE / REQ | Email de acceso      |
    | name         | String | REQ          | Nombre visible       |
    | passwordHash | String | REQ          | Hash bcrypt          |
    | createdAt    | Date   | AUTO         | Timestamp creación   |
    | updatedAt    | Date   | AUTO         | Timestamp update     |

3.2  RefreshToken

    ```typescript
    @Schema({ collection: 'refresh_tokens' })
    export class RefreshToken {
      @Prop({ required: true, unique: true })
      token: string;

      @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
      userId: ObjectId;

      @Prop({ required: true })
      expiresAt: Date;

      @Prop({ default: Date.now })
      createdAt: Date;
    }
    ```

3.3  Assertion  (subdocumento polimórfico)

    ```typescript
    // Discriminator base
    @Schema({ discriminatorKey: 'type', _id: false })
    export class Assertion {
      @Prop({ required: true })
      type: string;
    }

    // Discriminators por tipo
    @Schema({ _id: false })
    export class StatusCodeAssertion extends Assertion {
      @Prop({ required: true })
      expected: number;            // ej. 200
    }

    @Schema({ _id: false })
    export class ResponseTimeAssertion extends Assertion {
      @Prop({ required: true })
      maxMs: number;               // ej. 800
    }

    @Schema({ _id: false })
    export class BodyContainsAssertion extends Assertion {
      @Prop({ required: true })
      value: string;               // ej. "healthy"
    }

    @Schema({ _id: false })
    export class JsonPathAssertion extends Assertion {
      @Prop({ required: true })
      path: string;                // ej. "$.status"
      @Prop({ required: true, type: MongooseSchema.Types.Mixed })
      expected: any;               // ej. "ok"
    }

    @Schema({ _id: false })
    export class SslExpiryAssertion extends Assertion {
      @Prop({ required: true })
      minDaysRemaining: number;    // ej. 14
    }
    ```

    | TIPO            | CAMPOS ESPECÍFICOS                  |
    |-----------------|-------------------------------------|
    | statusCode      | expected: number                    |
    | responseTime    | maxMs: number                       |
    | bodyContains    | value: string                       |
    | jsonPath        | path: string / expected: any        |
    | sslExpiry       | minDaysRemaining: number            |

3.4  AlertConfig  (subdocumento embebido en Monitor)

    ```typescript
    @Schema({ _id: false })
    export class AlertConfig {
      @Prop({ enum: ['EMAIL', 'WEBHOOK'], required: true })
      channel: string;

      @Prop()
      emailTo?: string;

      @Prop()
      webhookUrl?: string;

      @Prop()
      webhookSecret?: string;

      @Prop({ default: 2 })
      failureThreshold: number;

      @Prop({ default: 30 })
      cooldownMins: number;

      @Prop({ default: true })
      notifyOnRecovery: boolean;

      // Estado operacional (no configurable por el usuario)
      @Prop({ default: 0 })
      consecutiveFails: number;

      @Prop()
      lastNotifiedAt?: Date;
    }
    ```

3.5  Monitor

    ```typescript
    @Schema({ timestamps: true, collection: 'monitors' })
    export class Monitor {
      @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
      userId: ObjectId;

      @Prop({ required: true })
      name: string;

      @Prop({ required: true })
      url: string;

      @Prop({ enum: HttpMethod, default: HttpMethod.GET })
      method: string;

      @Prop({ type: Map, of: String })
      headers?: Map<string, string>;

      @Prop()
      body?: string;

      @Prop({ default: 10000 })
      timeoutMs: number;

      @Prop({ enum: [30,60,300,900,1800,3600], default: 60 })
      intervalSecs: number;

      @Prop({ default: true })
      active: boolean;

      @Prop({ enum: MonitorStatus, default: MonitorStatus.PENDING })
      status: string;

      @Prop()
      lastCheckedAt?: Date;

      @Prop()
      nextCheckAt?: Date;

      @Prop({ type: [AssertionSchema], default: [] })
      assertions: Assertion[];

      @Prop({ type: AlertConfigSchema })
      alert?: AlertConfig;
    }
    ```

    Índices:
    ```typescript
    MonitorSchema.index({ userId: 1, active: 1 });
    MonitorSchema.index({ nextCheckAt: 1 });
    ```

3.6  Check

    ```typescript
    @Schema({ collection: 'checks' })
    export class Check {
      @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Monitor', required: true })
      monitorId: ObjectId;

      @Prop({ enum: CheckStatus, required: true })
      status: string;

      @Prop()
      statusCode?: number;

      @Prop()
      responseTimeMs?: number;

      @Prop()
      errorMessage?: string;

      @Prop({ type: [String], default: [] })
      assertionFailures: string[];   // mensajes de assertions fallidas

      @Prop({ default: Date.now })
      checkedAt: Date;
    }
    ```

    Índices:
    ```typescript
    // Historial paginado por monitor
    CheckSchema.index({ monitorId: 1, checkedAt: -1 });

    // TTL - elimina checks con más de CHECK_RETENTION_DAYS días
    CheckSchema.index(
      { checkedAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 90 }  // 90 días por defecto
    );
    ```

3.7  Notification

    ```typescript
    @Schema({ collection: 'notifications' })
    export class Notification {
      @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Monitor', required: true })
      monitorId: ObjectId;

      @Prop({ enum: NotificationEvent, required: true })
      event: string;

      @Prop({ enum: ['EMAIL', 'WEBHOOK'], required: true })
      channel: string;

      @Prop({ type: MongooseSchema.Types.Mixed, required: true })
      payload: Record<string, any>;

      @Prop({ required: true })
      success: boolean;

      @Prop()
      error?: string;

      @Prop({ default: Date.now })
      sentAt: Date;
    }
    ```


4.  ENUMERACIONES
------------------------------------------------------------

    | ENUM              | VALORES                                  |
    |-------------------|------------------------------------------|
    | HttpMethod        | GET / POST / PUT / PATCH / DELETE / HEAD |
    | MonitorStatus     | PENDING / UP / DOWN / PAUSED             |
    | CheckStatus       | UP / DOWN                                |
    | NotificationEvent | DOWN / RECOVERY                          |
    | AssertionType     | statusCode / responseTime / bodyContains / jsonPath / sslExpiry |


5.  EJEMPLO DE DOCUMENTO MONITOR COMPLETO
------------------------------------------------------------

    ```json
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "userId": "664a0001...",
      "name": "API producción",
      "url": "https://api.miapp.com/health",
      "method": "GET",
      "headers": { "x-api-key": "secret" },
      "timeoutMs": 5000,
      "intervalSecs": 60,
      "active": true,
      "status": "UP",
      "lastCheckedAt": "2026-04-13T10:00:00Z",
      "nextCheckAt":   "2026-04-13T10:01:00Z",
      "assertions": [
        { "type": "statusCode",   "expected": 200 },
        { "type": "responseTime", "maxMs": 800 },
        { "type": "jsonPath",     "path": "$.status", "expected": "ok" }
      ],
      "alert": {
        "channel": "EMAIL",
        "emailTo": "ops@miapp.com",
        "failureThreshold": 2,
        "cooldownMins": 30,
        "notifyOnRecovery": true,
        "consecutiveFails": 0,
        "lastNotifiedAt": null
      },
      "createdAt": "2026-04-01T08:00:00Z",
      "updatedAt": "2026-04-13T10:00:00Z"
    }
    ```


============================================================

| REV | FECHA      | DESCRIPCIÓN                          |
|-----|------------|--------------------------------------|
| 1.0 | 2026-04-13 | Creación inicial                     |
| 1.1 | 2026-04-13 | MongoDB / Mongoose / assertions / TTL|
