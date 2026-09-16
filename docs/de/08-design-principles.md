---
id: design-principles
title: Design Principles — Rollback, Idempotency, Reconciliation
sidebar_position: 9
---

## Rollback, Idempotency, Reconciliation (foundational principles)

### Rollback is not perfect

```java
connection.setAutoCommit(false);
try {
    updateTransaction();
    insertAccountingRecord();
    connection.commit();
} catch (Exception e) {
    connection.rollback();
}
```

**Important nuance:** a DB rollback **cannot** roll back a transaction that already succeeded on an external system (CBS). Example: DB update → CBS SUCCESS → network timeout → the app thinks it FAILed → rolls back the DB, but CBS has already processed the money. Hence the need for: Transaction ID, idempotency, status, retry, audit log, reconciliation.

### Idempotency

```text
Transaction ID = FX202609030001
First attempt: BizForex → CBS → SUCCESS (but response timed out)
Job retry: BizForex → CBS
Without idempotency: ❌ could be processed twice
With idempotency: CBS checks the Transaction ID has already been processed → returns the previous result ✅
```

### Reconciliation

```text
BizForex                 CBS
TX001 10k     MATCH      TX001 10k
TX002 20k     MATCH      TX002 20k
TX003 30k     MISMATCH   TX003 FAILED
```
Mismatch → ERROR / RETRY / MANUAL REVIEW.

---


## The single design principle running through everything (most worth remembering)

> **Don't hardcode data structure in code — configure it in the DB.**

Applied consistently in both directions:
- **Input (reading HULFT files in):** byte-offset layout stored in the `FILE_LAYOUT` table, parser reads it dynamically.
- **Output (building outbound XML for CBS):** field-mapping template stored in the DB by `transactionCode`, builder reads it dynamically.

When the format changes (add a field, move a position, add a new transaction type), only the DB config needs updating — no code changes/redeployment needed. This is the single most worthwhile design principle to bring up in an interview about long-term system maintainability.
