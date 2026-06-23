# Reporte de Implementación: FASE 4 - Cotizaciones (Ajustes de Decisiones Oficiales)

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 4 (Cotizaciones)**, incorporando las 11 decisiones funcionales oficiales aprobadas por el usuario.

---

## 1. Estructuras Creadas y Ajustadas

### 1.1 Tablas Ajustadas
1.  **`quotes`:** Se agregaron columnas de auditoría avanzada y justificación:
    *   `reject_reason` (motivo de rechazo).
    *   `cancel_code` y `cancel_reason` (motivo y código de catálogo de cancelación).
    *   `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `cancelled_by`, `cancelled_at` (trazabilidad exacta de transiciones críticas).
    *   Default en `valid_until` a `(CURRENT_DATE + 30)` para asegurar los 30 días de validez.
2.  **`quote_items`:** Desglose detallado de partidas presupuestarias.

### 1.2 Funciones Creadas/Ajustadas (PL/pgSQL)
1.  **`handle_quote_versioning()`:** Trigger BEFORE INSERT que calcula automáticamente la versión de la cotización (`max_version + 1`) y actualiza el estado de la versión previa a `VENCIDA`.
2.  **`calculate_quote_item_totals()`:** Trigger BEFORE INSERT OR UPDATE en `quote_items` que calcula automáticamente el impuesto y total de línea.
3.  **`update_quote_totals()`:** Trigger AFTER que recalcula el subtotal en cabecera a partir de las líneas.
4.  **`handle_quote_header_calculations()`:** Trigger BEFORE UPDATE que recalcula el total de la cotización aplicando cargos/descuentos globales.
5.  **`validate_quote_state_transitions()`:**
    *   Valida la obligatoriedad de `reject_reason` al pasar a `RECHAZADA`.
    *   Valida la obligatoriedad de `cancel_code` y `cancel_reason` al pasar a `CANCELADA`.
    *   Enforza estrictamente la inmutabilidad de estados finales (`APROBADA`, `RECHAZADA`, `CANCELADA`) bloqueando cualquier edición o borrado.
6.  **`handle_quote_traceability()`:** Asigna de forma automática el usuario ejecutor y la marca de tiempo correspondiente para `approved_by`/`approved_at`, `rejected_by`/`rejected_at`, y `cancelled_by`/`cancelled_at` en base a la transición de estado realizada.
7.  **`enforce_quote_permissions()`:** Restringe la creación y cambio de estados comerciales de cotizaciones según los roles oficiales.
8.  **`dispatch_quote_events()`:** Emite los 7 eventos semánticos inmutables aprobados a la tabla `business_events`:
    *   `QUOTE_CREATED`
    *   `QUOTE_SENT`
    *   `QUOTE_REVISED`
    *   `QUOTE_APPROVED`
    *   `QUOTE_REJECTED`
    *   `QUOTE_EXPIRED`
    *   `QUOTE_CANCELLED`
9.  **`block_physical_quote_delete()`:** Bloquea de forma definitiva borrados físicos `DELETE` en cotizaciones e ítems.

### 1.3 Políticas RLS creadas
Habilitado Row Level Security (RLS) en `quotes` y `quote_items` con aislamiento multiempresa estricto por `tenant_id`.

---

## 2. Reporte de Pruebas Ejecutadas

Se ejecutó el script de verificación sintáctica:
```bash
npm run test:quotes
```
**Resultado:** ÉXITO. Se validaron la existencia e integridad de los esquemas, triggers de autocalculo, versionado, trazabilidad avanzada, obligatoriedad de motivos en rechazo y cancelación, emisión de los 7 eventos semánticos e inmutabilidad de estados finales.
