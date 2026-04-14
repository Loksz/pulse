============================================================
[PLX-UC-005]  PULSE - CASOS DE USO
              rev. 1.0  /  2026-04-14  /  VIGENTE
============================================================


1.  ACTOR Y CONTEXTO
------------------------------------------------------------

    Actor único:  Usuario autenticado
    Contexto:     Aplicación web (React + Vite), acceso
                  desde navegador de escritorio o móvil.

    | ID    | CASO DE USO                              | SECCIÓN |
    |-------|------------------------------------------|---------|
    | UC-01 | Registrarse                              | 2.1     |
    | UC-02 | Iniciar sesión                           | 2.2     |
    | UC-03 | Cerrar sesión                            | 2.3     |
    | UC-04 | Ver el dashboard global                  | 3.1     |
    | UC-05 | Crear un monitor                         | 4.1     |
    | UC-06 | Editar un monitor                        | 4.2     |
    | UC-07 | Pausar / reactivar un monitor            | 4.3     |
    | UC-08 | Eliminar un monitor                      | 4.4     |
    | UC-09 | Ver detalle de un monitor                | 5.1     |
    | UC-10 | Ver historial de chequeos                | 5.2     |
    | UC-11 | Ver estadísticas de un monitor           | 5.3     |
    | UC-12 | Configurar una alerta                    | 6.1     |
    | UC-13 | Editar una alerta                        | 6.2     |
    | UC-14 | Eliminar una alerta                      | 6.3     |
    | UC-15 | Recibir notificación de caída            | 7.1     |
    | UC-16 | Recibir notificación de recovery         | 7.2     |


2.  AUTENTICACIÓN
------------------------------------------------------------

2.1  UC-01 - Registrarse

    PRECONDICIÓN
        El usuario no tiene cuenta en el sistema.

    FLUJO PRINCIPAL
        1. El usuario accede a /register.
        2. Completa nombre, email y contraseña.
        3. Envía el formulario.
        4. El sistema crea la cuenta y lo autentica
           automáticamente.
        5. El sistema redirige al dashboard.

    FLUJOS ALTERNATIVOS
        3a. El email ya existe en el sistema.
              -> Se muestra error: "Este email ya está registrado."
              -> El formulario permanece con los datos ingresados.
        3b. La contraseña tiene menos de 8 caracteres.
              -> Validación inline antes de enviar el formulario.

    POSTCONDICIÓN
        El usuario tiene sesión activa y ve el dashboard vacío.

2.2  UC-02 - Iniciar sesión

    PRECONDICIÓN
        El usuario tiene una cuenta registrada.

    FLUJO PRINCIPAL
        1. El usuario accede a /login.
        2. Ingresa email y contraseña.
        3. Envía el formulario.
        4. El sistema valida las credenciales.
        5. El sistema redirige al dashboard.

    FLUJOS ALTERNATIVOS
        4a. Las credenciales son incorrectas.
              -> Se muestra error: "Email o contraseña incorrectos."
              -> El campo de contraseña se vacía.
        4b. La sesión anterior sigue activa (token válido en
            localStorage).
              -> El sistema redirige al dashboard directamente
                sin mostrar el formulario.

    POSTCONDICIÓN
        El usuario tiene sesión activa y accede al dashboard.

2.3  UC-03 - Cerrar sesión

    PRECONDICIÓN
        El usuario tiene sesión activa.

    FLUJO PRINCIPAL
        1. El usuario hace clic en "Cerrar sesión".
        2. El sistema invalida el refresh token.
        3. El sistema limpia el estado local.
        4. El sistema redirige a /login.

    POSTCONDICIÓN
        La sesión queda cerrada. El acceso al dashboard
        requiere autenticarse nuevamente.


3.  DASHBOARD
------------------------------------------------------------

3.1  UC-04 - Ver el dashboard global

    PRECONDICIÓN
        El usuario tiene sesión activa.

    FLUJO PRINCIPAL
        1. El usuario accede a /dashboard.
        2. El sistema carga el resumen global:
           - Total de monitores.
           - Cantidad en estado UP / DOWN / PAUSED.
           - Uptime promedio de las últimas 24h.
        3. El sistema muestra la lista de monitores con:
           - Nombre, URL, estado actual, último chequeo,
             latencia del último check.
        4. El cliente establece conexión WebSocket.
        5. Cada vez que se completa un chequeo, la tarjeta
           del monitor afectado se actualiza en tiempo real
           sin acción del usuario.

    FLUJOS ALTERNATIVOS
        2a. El usuario no tiene monitores creados.
              -> Se muestra un estado vacío con llamada a
                la acción: "Crear tu primer monitor."
        5a. La conexión WebSocket se interrumpe.
              -> El sistema intenta reconectar automáticamente.
              -> Se muestra un indicador de "reconectando..."

    POSTCONDICIÓN
        El usuario ve el estado actualizado de todos sus
        monitores en tiempo real.


4.  GESTIÓN DE MONITORES
------------------------------------------------------------

4.1  UC-05 - Crear un monitor

    PRECONDICIÓN
        El usuario tiene sesión activa.

    FLUJO PRINCIPAL
        1. El usuario hace clic en "Nuevo monitor".
        2. El sistema muestra el formulario de creación.
        3. El usuario completa:
           - Nombre descriptivo.
           - URL del endpoint.
           - Método HTTP (GET por defecto).
           - Intervalo de chequeo.
           - Headers adicionales (opcional).
           - Body (opcional, para POST/PUT).
        4. El usuario agrega al menos una assertion:
           - Selecciona el tipo de assertion.
           - Completa los parámetros según el tipo.
           - Puede agregar múltiples assertions.
        5. El usuario guarda el monitor.
        6. El sistema crea el monitor con estado PENDING.
        7. El sistema redirige al detalle del monitor.
        8. En el próximo ciclo del scheduler, el primer
           chequeo se ejecuta automáticamente.

    FLUJOS ALTERNATIVOS
        3a. La URL ingresada no es válida.
              -> Validación inline: "Ingresa una URL válida
                con protocolo (https://)."
        4a. El usuario no agrega ninguna assertion.
              -> El sistema agrega automáticamente una
                assertion de statusCode = 200 por defecto.
        5a. El usuario cancela.
              -> Regresa al dashboard sin crear el monitor.

    POSTCONDICIÓN
        El monitor existe en el sistema y el scheduler
        lo incluye en el próximo ciclo de chequeos.

4.2  UC-06 - Editar un monitor

    PRECONDICIÓN
        El monitor existe y pertenece al usuario.

    FLUJO PRINCIPAL
        1. El usuario accede al detalle del monitor.
        2. Hace clic en "Editar".
        3. El sistema muestra el formulario con los datos
           actuales precargados.
        4. El usuario modifica los campos que desea.
        5. Guarda los cambios.
        6. El sistema actualiza el monitor.
        7. Si se modificó el intervalo, se recalcula
           el nextCheckAt.

    FLUJOS ALTERNATIVOS
        4a. El usuario modifica la URL a un valor inválido.
              -> Validación inline antes de guardar.

    POSTCONDICIÓN
        El monitor refleja los cambios. El historial de
        chequeos anteriores se conserva.

4.3  UC-07 - Pausar / reactivar un monitor

    PRECONDICIÓN
        El monitor existe y pertenece al usuario.

    FLUJO PRINCIPAL
        1. El usuario hace clic en el toggle de estado
           del monitor (en la lista o en el detalle).
        2. Si el monitor está activo:
           - El sistema lo marca como PAUSED.
           - El scheduler deja de encolar jobs para él.
        3. Si el monitor está pausado:
           - El sistema lo marca como activo.
           - El scheduler retoma los chequeos en el
             próximo ciclo.

    POSTCONDICIÓN
        El monitor cambia de estado. Un monitor pausado
        no genera chequeos ni alertas.

4.4  UC-08 - Eliminar un monitor

    PRECONDICIÓN
        El monitor existe y pertenece al usuario.

    FLUJO PRINCIPAL
        1. El usuario hace clic en "Eliminar".
        2. El sistema muestra confirmación:
           "¿Eliminar este monitor? Se perderá todo
           su historial."
        3. El usuario confirma.
        4. El sistema elimina el monitor, sus chequeos
           y su configuración de alerta.

    FLUJOS ALTERNATIVOS
        3a. El usuario cancela.
              -> No se realiza ninguna acción.

    POSTCONDICIÓN
        El monitor y todos sus datos asociados son
        eliminados permanentemente.


5.  DETALLE Y ANÁLISIS
------------------------------------------------------------

5.1  UC-09 - Ver detalle de un monitor

    PRECONDICIÓN
        El monitor existe y pertenece al usuario.

    FLUJO PRINCIPAL
        1. El usuario hace clic sobre un monitor.
        2. El sistema muestra:
           - Estado actual y tiempo desde el último cambio.
           - Configuración del monitor (URL, método,
             intervalo, assertions).
           - Último resultado de chequeo con desglose
             de assertions.
           - Configuración de alerta activa (si existe).
        3. El estado se actualiza en tiempo real vía
           WebSocket igual que en el dashboard.

    POSTCONDICIÓN
        El usuario ve la información completa y actualizada
        del monitor.

5.2  UC-10 - Ver historial de chequeos

    PRECONDICIÓN
        El monitor existe y tiene al menos un chequeo
        registrado.

    FLUJO PRINCIPAL
        1. Dentro del detalle del monitor, el usuario
           accede a la pestaña "Historial".
        2. El sistema muestra una tabla paginada con:
           - Timestamp del chequeo.
           - Estado (UP / DOWN).
           - Código HTTP recibido.
           - Latencia en ms.
           - Assertions que fallaron (si las hay).
        3. El usuario puede filtrar por rango de fechas.
        4. El usuario navega entre páginas con cursor
           de paginación.

    FLUJOS ALTERNATIVOS
        2a. El monitor no tiene chequeos aún.
              -> Se muestra: "Aún no hay chequeos registrados."

    POSTCONDICIÓN
        El usuario puede revisar cualquier chequeo pasado
        dentro del periodo de retención (90 días).

5.3  UC-11 - Ver estadísticas de un monitor

    PRECONDICIÓN
        El monitor existe y tiene chequeos suficientes
        para el periodo seleccionado.

    FLUJO PRINCIPAL
        1. Dentro del detalle del monitor, el usuario
           accede a la pestaña "Estadísticas".
        2. Selecciona el periodo: 24h / 7d / 30d.
        3. El sistema muestra:
           - Uptime % del periodo.
           - Latencia promedio, p95 y p99.
           - Gráfico de latencia a lo largo del tiempo.
           - Lista de incidentes: inicio, fin y duración.

    FLUJOS ALTERNATIVOS
        3a. No hay datos suficientes para el periodo.
              -> Se muestra el periodo disponible con nota
                indicando desde cuándo hay datos.

    POSTCONDICIÓN
        El usuario entiende el comportamiento histórico
        del servicio en el periodo seleccionado.


6.  ALERTAS
------------------------------------------------------------

6.1  UC-12 - Configurar una alerta

    PRECONDICIÓN
        El monitor existe y no tiene alerta configurada.

    FLUJO PRINCIPAL
        1. Dentro del detalle del monitor, el usuario
           hace clic en "Configurar alerta".
        2. Selecciona el canal: EMAIL o WEBHOOK.
        3. Completa los campos según el canal:
           EMAIL   -> dirección de destino.
           WEBHOOK -> URL del receptor y secret opcional.
        4. Define el comportamiento:
           - Fallos consecutivos antes de alertar (default 2).
           - Minutos de cooldown entre alertas (default 30).
           - Activar notificación de recovery (default: sí).
        5. Guarda la alerta.

    FLUJOS ALTERNATIVOS
        3a. Canal = WEBHOOK y la URL ingresada no es válida.
              -> Validación inline antes de guardar.
        5a. Ya existe una alerta para este monitor.
              -> La nueva configuración reemplaza la anterior.

    POSTCONDICIÓN
        El monitor tiene alerta activa. Los próximos fallos
        consecutivos que superen el umbral generarán
        una notificación.

6.2  UC-13 - Editar una alerta

    PRECONDICIÓN
        El monitor tiene una alerta configurada.

    FLUJO PRINCIPAL
        1. El usuario hace clic en "Editar alerta".
        2. El sistema muestra el formulario con los
           valores actuales precargados.
        3. El usuario modifica los campos deseados.
        4. Guarda los cambios.

    POSTCONDICIÓN
        La alerta refleja la nueva configuración.
        El contador de fallos consecutivos se preserva.

6.3  UC-14 - Eliminar una alerta

    PRECONDICIÓN
        El monitor tiene una alerta configurada.

    FLUJO PRINCIPAL
        1. El usuario hace clic en "Eliminar alerta".
        2. El sistema muestra confirmación.
        3. El usuario confirma.
        4. El sistema elimina la configuración de alerta
           del monitor.

    POSTCONDICIÓN
        El monitor sigue activo y chequeándose pero ya
        no genera notificaciones ante fallos.


7.  NOTIFICACIONES
------------------------------------------------------------

7.1  UC-15 - Recibir notificación de caída

    PRECONDICIÓN
        El monitor tiene alerta configurada y ha
        acumulado fallos consecutivos >= threshold.

    FLUJO
        1. El sistema detecta que el contador de fallos
           consecutivos alcanzó el umbral configurado.
        2. Verifica que no está en periodo de cooldown.
        3. Envía la notificación por el canal configurado.

        Canal EMAIL - el usuario recibe:
        - Asunto:  "[Pulse] nombre-monitor está DOWN"
        - Cuerpo:  URL afectada, assertion que falló,
                   timestamp del primer fallo, fallos
                   consecutivos acumulados.

        Canal WEBHOOK - el sistema hace POST a la URL:
        ```json
        {
          "event": "DOWN",
          "monitor": { "id": "...", "name": "...", "url": "..." },
          "failedAssertions": ["responseTime: 1200ms > 800ms"],
          "consecutiveFails": 2,
          "timestamp": "2026-04-14T03:14:00Z"
        }
        ```
        Si hay webhookSecret, incluye header:
        X-Pulse-Signature: sha256=<hmac>

    POSTCONDICIÓN
        El usuario fue notificado. Se registra la
        notificación en el historial. Se actualiza
        lastNotifiedAt para calcular el próximo cooldown.

7.2  UC-16 - Recibir notificación de recovery

    PRECONDICIÓN
        El monitor tenía estado DOWN, el último chequeo
        fue UP y notifyOnRecovery = true.

    FLUJO
        1. El sistema detecta la transición DOWN -> UP.
        2. Resetea el contador consecutiveFails a 0.
        3. Envía la notificación de recovery.

        Canal EMAIL - el usuario recibe:
        - Asunto:  "[Pulse] nombre-monitor está UP"
        - Cuerpo:  URL, duración total de la caída,
                   timestamp de recovery.

        Canal WEBHOOK - el sistema hace POST:
        ```json
        {
          "event": "RECOVERY",
          "monitor": { "id": "...", "name": "...", "url": "..." },
          "downtimeMins": 4,
          "timestamp": "2026-04-14T03:18:00Z"
        }
        ```

    POSTCONDICIÓN
        El usuario sabe que el servicio se recuperó y
        cuánto tiempo estuvo caído.


============================================================

| REV | FECHA      | DESCRIPCIÓN      |
|-----|------------|------------------|
| 1.0 | 2026-04-14 | Creación inicial |
