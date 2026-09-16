---
id: webshokin-screen
title: WebShokin — Screen & Pre-processing
sidebar_position: 3
---

## ViewCreator, WebShokin, Pre-processing, JSP+AJAX

### ViewCreator

```text
DB Table → SQL View → ViewCreator → List Screen
```

```sql
CREATE OR REPLACE VIEW V_FX_TRANSACTION AS
SELECT transaction_id, customer_no, currency, amount, status
FROM FX_TRANSACTION
WHERE status IN ('10', '12');
```

### WebShokin flow

```text
Login → Transaction List → Select transaction → Transaction Screen
→ Input FX information → Calculate rate → Confirm → Kanryo
```

### Pre-processing when opening a transaction

```text
Request → Controller/Servlet → Pre-processing → Check user → Check role
→ Check transaction status → Update status/information → Load transaction → JSP init
```

**Important:** role should not only be used to show/hide buttons on the frontend. The backend must always re-check:

```javascript
// NOT enough — only hides/shows UI:
if (role === "MANAGER") { $("#approveButton").show(); }
```

```java
// MUST exist on the backend:
if (!user.hasRole("MANAGER")) {
    throw new UnauthorizedException();
}
```

### JSP + jQuery AJAX pattern

```text
JSP → document.ready() → AJAX → Controller/Servlet → Service → DAO → DB
→ JSON/XML response → jQuery → Update HTML
```

Why use AJAX instead of rendering directly via JSP: the UI doesn't need to reload the whole page, data loading is decoupled from the page, multiple APIs can be handled at once, and individual DOM sections can be updated separately.

---


## ViewCreator & Transaction Screen — implementation details

### ViewCreator maps directly to a DB view

ViewCreator maps 1-to-1 to a view/table, e.g. `vw_foreign_exchange_list`. When the screen opens, the system queries this view directly via DAO/mapper. Records are filtered by status, e.g. (a different illustrative status set — once again, the exact codes are system-specific):

```text
'01' = not processed
'10' = processing
'20' = sent to CBS
'30' = report printed
```

### Navigating from list to detail

Clicking the "+" button → redirects to the detail screen following a URL pattern:

```text
/fxTransactionDetail?id=12345
```

### Pre-processing when entering the detail screen

```java
transactionService.prepareTransaction(id, userRole);
```

This service: checks role, checks status (e.g. status = 12 and role = manager → transitions to 10), writes an audit log, updates `updated_by`/`update_date`, then returns the full data (header, detail, status, permission) for the screen.

### Transaction screen — submit

JS validates input (e.g. `amount > 0`) then calls the API when Submit/Execute is clicked:

```text
POST /api/fx/executeTransaction
```

> Note the ordering: `executeTransaction` (entering/executing the transaction on the WebShokin screen) happens **before** `completeTransaction` (Kanryo, see the Tenpo chapter — completing the step so it can be sent downstream). These are two distinct steps in the same flow.

### Batch report delivery channel

Besides HULFT/SFTP (see the FX Settlement Synchronization chapter), batch reports can also be sent via a **direct socket** depending on the business need — not limited to FTP only.

---

