# Reporte de Implementación: FASE 8 - Facturación y Pagos

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 8 (Facturación y Pagos)**, incorporando las respuestas oficiales aprobadas por el negocio.

---

## 1. Estructuras Creadas

### 1.1 Tablas Creadas
1.  **`invoices`:** Cabeceras de facturas asociadas a clientes, con trazabilidad de origen (`source_type` / `source_id`), control de cartera (`paid_amount`, `balance_amount`) y campos de pasarela (Wompi).
2.  **`invoice_items`:** Partidas desglosadas e históricas de facturas.
3.  **`invoice_taxes`:** Impuestos aplicados e históricos de la factura.
4.  **`payments`:** Registro de cobros y abonos aplicados o anticipos (PSE, Transferencia, Tarjeta, etc.).
5.  **`customer_advances`:** Control y saldo disponible de anticipos no aplicados de clientes.

### 1.2 Funciones y Triggers PL/pgSQL
1.  **`handle_invoice_sequences()`:** Trigger `BEFORE INSERT` que asigna códigos correlativos por tenant (`FAC-000001` para facturas, `PAG-000001` para pagos, `ANT-000001` para anticipos).
2.  **`validate_invoice_defaults()`:** Trigger `BEFORE INSERT OR UPDATE` que asigna la fecha de vencimiento por defecto (`invoice_date + 30 días`) y valida que `due_date >= invoice_date`.
3.  **`handle_invoice_item_totals()` & `update_invoice_headers()`:** Triggers que calculan el `line_total` en items y actualizan de forma automática los acumuladores de cabecera (`subtotal`, `discount_amount`, `tax_amount`, `total_amount`) en la factura.
4.  **`enforce_invoice_immutability()`:** Trigger que restringe cualquier modificación sobre la factura o sus partidas si su estado no es `BORRADOR`. Al pasar a `EMITIDA`, consolida los impuestos en `invoice_taxes` y congela el histórico.
5.  **`enforce_invoice_permissions()`:** Trigger de seguridad RBAC que restringe las acciones de facturación. Los auxiliares financieros (`AUXILIAR_FINANZAS`) solo crean borradores y registran pagos; la emisión y anulación está reservada a `JEFE_FINANZAS` y `GERENTE`.
6.  **`handle_payment_application()`:** Trigger que al aplicar un pago (`payments.status = 'APLICADO'`):
    *   Si tiene factura asociada: Actualiza la cartera (`paid_amount`) y cambia el estado automáticamente a `PAGADA` o `PARCIALMENTE_PAGADA`.
    *   Si es sin factura: Crea automáticamente un anticipo en `customer_advances`.
7.  **`dispatch_invoice_events()`:** Dispara eventos semánticos a `business_events` (ej. `INVOICE_CREATED`, `INVOICE_EMITTED`, `INVOICE_PAID`, `PAYMENT_APPLIED`, etc.).
8.  **`block_physical_invoice_delete()`:** Trigger de inmutabilidad física que bloquea sentencias `DELETE` directas sobre los registros financieros.

---

## 2. Decisiones de Negocio Implementadas

*   **Emisión Manual:** Facturación no automática para manejar abonos y entregas parciales. Trazabilidad garantizada desde cotizaciones, trabajos o clientes.
*   **Inmutabilidad Histórica:** Facturas emitidas son inalterables. Los ajustes posteriores se realizan mediante Notas Crédito/Débito.
*   **Gestión de Anticipos:** Pagos sin factura asociada alimentan `customer_advances` y quedan disponibles para su posterior aplicación.
*   **Roles y Permisos:** Habilitados `JEFE_FINANZAS` y `AUXILIAR_FINANZAS` con restricciones en base de datos.
*   **Pasarela de Pago:** Columnas de integración para Wompi definidas en la cabecera de la factura.
*   **Soft Delete:** Todas las tablas financieras están protegidas con soft delete e integradas al log de auditoría general.

---

## 3. Reporte de Pruebas Ejecutadas

Se ejecutó la validación estática local para verificar la integridad sintáctica y de diseño del script de migración:
```bash
npm run test:invoices
```
**Resultado:** ÉXITO. Se validó la existencia de las 5 tablas financieras, campos críticos para trazabilidad de origen y pasarela, triggers de secuencias, acumuladores, inmutabilidad y aplicación de pagos, y políticas RLS.
