# Reporte de Implementación: FASE 6 - Trabajos y Actividades (Orden de Trabajo)

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 6 (Trabajos/Jobs)**, de acuerdo con el diseño aprobado.

---

## 1. Estructuras Creadas

### 1.1 Tablas Creadas
1.  **`jobs`:** Representa la cabecera de la orden de trabajo (Work Order) vinculada al requerimiento de cliente y cotización.
2.  **`job_activities`:** Desglose detallado de las actividades/tareas asociadas al trabajo, con responsable, fechas y estados planificados obligatorios.

### 1.2 Funciones y Triggers PL/pgSQL
1.  **`handle_job_sequences()`:** Trigger `BEFORE INSERT` que asigna códigos secuenciales `JOB-000001` (por tenant) y códigos jerárquicos de actividades `JOB-000001-01` automáticamente.
2.  **`validate_activity_dates()` & `validate_job_dates_update()`:** Triggers that enforce planned date consistency. They prevent creating or updating child activities outside the parent Job's range, and prevent updating the parent Job's range if it would leave any active activity out of bounds (bi-directional range verification).
3.  **`enforce_job_permissions()`:** Trigger de seguridad que:
    *   Permite la creación de Trabajos automáticos desde el trigger del sistema (`pg_trigger_depth() > 0`).
    *   Restringe la creación manual de Trabajos (`pg_trigger_depth() = 0`) únicamente a los roles autorizados (`GERENTE`, `GERENTE_GENERAL`, `JEFE_PROYECTOS`, `COORDINADOR_OPERACIONES`).
    *   Bloquea cualquier edición si el Job está en estado `'CERRADO'`.
4.  **`validate_job_state_transitions()`:**
    *   Enforza la inmutabilidad de OTs en estado `'CERRADO'`.
    *   Valida que un Trabajo `'ENTREGADO'` solo pase a `'CERRADO'`.
    *   Valida que un Trabajo `'FINALIZADO'` no regrese a `'PENDIENTE'` o `'PROGRAMADO'`.
    *   Valida la presencia obligatoria de la fecha de inicio real (`actual_start_date`) al pasar a `'EN_EJECUCION'`.
    *   Valida que para cambiar a `'ENTREGADO'` exista Acta de Entrega cargada en documentos (`document_type = 'DELIVERY_NOTE'`, estado `'PUBLICADO'`).
    *   Valida la obligatoriedad de `cancel_reason` (mínimo 10 caracteres) al pasar a `'CANCELADO'`.
    *   Valida que no queden actividades activas (pendientes, programadas, en ejecución o suspendidas) al finalizar el Job, permitiendo la presencia de actividades en estado `'COMPLETADA'` y `'CANCELADA'`.
5.  **`handle_activity_status_propagation()`:** Trigger que propaga estados:
    *   Si una actividad pasa a `'EN_EJECUCION'`, el Job pasa a `'EN_EJECUCION'`.
    *   Si todas las actividades no canceladas se marcan como `'COMPLETADA'`, el Job pasa automáticamente a `'FINALIZADO'`.
6.  **`handle_job_cancellation_propagation()`:** Trigger que propaga cancelación: al cancelar un Trabajo, cancela automáticamente todas sus actividades abiertas.
7.  **`create_job_on_ot_generation()`:** Trigger `AFTER UPDATE OF status ON requirements` que crea automáticamente el Trabajo en estado `'PENDIENTE'` al pasar el requerimiento a `'OT_GENERADA'`.
8.  **`dispatch_job_events()`:** Dispara eventos de negocio semánticos inmutables a `business_events` (`JOB_CREATED`, `JOB_SCHEDULED`, `JOB_STARTED`, `JOB_SUSPENDED`, `JOB_COMPLETED`, `JOB_DELIVERED`, `JOB_CLOSED`, `JOB_CANCELLED`, `JOB_ACTIVITY_CREATED`, etc.).
9.  **`block_physical_job_delete()`:** Trigger de inmutabilidad física que bloquea sentencias `DELETE` directas sobre los registros de trabajo.

### 1.3 Políticas RLS
Habilitado Row Level Security (RLS) en todas las tablas del módulo para aislamiento multiempresa por `tenant_id` en lecturas y escrituras.

---

## 2. Reporte de Pruebas Ejecutadas

Se ejecutó la validación estática local para verificar la integridad del esquema y sintaxis del script DDL:
```bash
npm run test:jobs
```
**Resultado:** ÉXITO. Se comprobó la correcta creación de todas las tablas, triggers de secuencias, ruteo automático desde requerimientos, propagación automática de estados actividad-job, validación de Acta de Entrega, inmutabilidad de registros y políticas de Row Level Security (RLS).
