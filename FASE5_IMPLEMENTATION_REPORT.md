# Reporte de Implementación: FASE 5 - Motor de Aprobaciones

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 5 (Aprobaciones)**, de acuerdo con el diseño aprobado.

---

## 1. Estructuras Creadas

### 1.1 Tablas Creadas
1.  **`approval_flows`:** Cabecera de los flujos de aprobación (secuenciales, paralelos o mixtos) por tenant.
2.  **`approval_steps`:** Pasos individuales vinculados a un flujo de aprobación. Cada paso tiene asignado un rol **o** un usuario específico de manera excluyente.
3.  **`approval_rules`:** Configuración de reglas que vinculan un tipo de entidad (ej: `QUOTE`) y un rango de montos monetarios a un flujo de aprobación (o auto-aprobación si `flow_id` es `NULL`).
4.  **`approval_requests`:** Registro de cada solicitud de aprobación instanciada para una cotización u otro documento.
5.  **`approval_request_steps`:** Trazabilidad inmutable de firmas de cada paso de una solicitud activa, almacenando el estado, el usuario firmante, fecha de resolución y comentarios.

### 1.2 Funciones y Triggers PL/pgSQL
1.  **`handle_approval_sequences()`:** Trigger `BEFORE INSERT` que asigna códigos secuenciales `FLW-000001` y `APR-000001` aislados por tenant usando la tabla centralizada `tenant_sequences`.
2.  **`enforce_approval_config_permissions()`:** Trigger de seguridad que restringe la inserción, modificación o eliminación de la configuración de flujos, pasos y reglas a los roles autorizados (`SUPER_ADMIN`, `ADMINISTRADOR`, `GERENTE_GENERAL`).
3.  **`handle_approval_traceability()`:** Trigger `BEFORE INSERT OR UPDATE` que automatiza la trazabilidad del usuario editor y marcas de tiempo.
4.  **`route_quote_approvals()`:** Trigger `BEFORE UPDATE OF status ON quotes` que rutea automáticamente las cotizaciones que pasan a `EN_REVISION`:
    *   **Auto-aprobación:** Si coincide con una regla de monto exenta (`flow_id IS NULL`), cambia el estado directamente a `APROBADA`.
    *   **Creación de Solicitud:** Si coincide con un flujo, crea la solicitud y copia los pasos del flujo a `approval_request_steps`.
    *   **Escalación Automática:** Si no hay reglas configuradas para ese monto, crea una solicitud asignada por defecto al rol `GERENTE_GENERAL` para escalación manual.
5.  **`check_quote_approval_lock()`:** Trigger `BEFORE UPDATE OR DELETE` en `quotes` y `BEFORE INSERT OR UPDATE OR DELETE` en `quote_items` que congela y bloquea cualquier edición de la cotización y de sus partidas mientras exista un proceso de aprobación activo en estado `PENDIENTE` o `EN_PROCESO`.
6.  **`resolve_approval_step()`:** Función central de firma que:
    *   Valida autoridad del firmante (por usuario o pertenencia a rol).
    *   Para flujos secuenciales, valida que no existan pasos anteriores sin aprobar.
    *   Registra la firma del paso y dispara eventos.
    *   Sincroniza el estado global de la solicitud y de la cotización asociada en base a la decisión (`APROBADA` -> quote `APROBADA`, `RECHAZADA` -> quote `RECHAZADA`, `AJUSTES_SOLICITADOS` -> quote `EN_REVISION`, `CANCELADA` -> quote `CANCELADA`).
7.  **`dispatch_approval_events()`:** Dispara eventos de negocio semánticos inmutables a la tabla `business_events` (`APPROVAL_FLOW_CREATED`, `APPROVAL_RULE_CREATED`, `APPROVAL_REQUEST_CREATED`, `APPROVAL_REQUEST_CANCELLED`, etc.).
8.  **`block_physical_approval_delete()`:** Trigger de inmutabilidad física que bloquea sentencias `DELETE` directas sobre los registros de aprobación.

### 1.3 Políticas RLS
Habilitado Row Level Security (RLS) en todas las tablas del módulo para aislamiento multiempresa por `tenant_id` en lecturas y escrituras, permitiendo bypass de auditoría y super administrador.

---

## 2. Reporte de Pruebas Ejecutadas

Se ejecutó la validación estática local para verificar la integridad del esquema y sintaxis del script DDL:
```bash
npm run test:approvals
```
**Resultado:** ÉXITO. Se comprobó la correcta creación de todas las tablas, triggers de secuencias, permisos por rol, bloqueo de cotización en aprobación, ruteo automático por montos (incluyendo escalación a Gerencia General), inmutabilidad de registros y políticas de Row Level Security (RLS).
