---
id: settlement-sync
title: FX Settlement Synchronization
sidebar_position: 8
---

## FX Settlement Synchronization — settlement data sync

### Objective

Synchronize transactions between the internal system (FX System) and CBS so both sides end up with the same data and final status.

### Main process

```text
1. Staff enter 10 transactions → calculate rate, exemption → status = READY_TO_SETTLE
2. Kanryo (manual or automated job) → batch them up → call the CBS API (OMT)
3. Receive response: Tanpyo (per-record detail) + Denpyo (batch-level voucher)
   → fx_transaction.status = BANK_SUCCESS, bank_ref_no = denpyoNo
4. Bank Sync job (every few minutes): GET /cbs/omt/result?date=...
   → compare against the internal DB → update SETTLED / FAILED / PENDING
5. Ack: build a 1400-byte binary response file, send it back to the Mainframe/parent system via SFTP
```

### Calling the CBS API (OMT Transaction)

```java
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_XML);
String body = omtXmlBuilder.build(batchTransactions);
HttpEntity<String> entity = new HttpEntity<>(body, headers);
ResponseEntity<String> response = restTemplate.postForEntity(
    "https://cbs.bank.local/api/omt/execute", entity, String.class);
```

Response:
```xml
<response>
  <tanpyo><record id="001" status="OK" amount="10000"/></tanpyo>
  <denpyo><voucherNo>TXN20251030-01</voucherNo></denpyo>
</response>
```

### Automatic sync job (polling)

```java
@Scheduled(cron = "0 */15 * * * *") // every 15 minutes
public void syncBankResultJob() {
    List<FxTransaction> pending = fxDao.findPending();
    for (FxTransaction txn : pending) {
        BankResult result = cbsClient.queryResult(txn.getBankRefNo());
        fxDao.updateStatus(txn.getId(), result.getStatus());
    }
}
```

> This is an **async/eventual consistency** model: after calling the API, the final result isn't necessarily available yet — a job needs to poll periodically to reconcile the real status — different from the "call the API and get a response, done" assumption used in earlier sections.

### Generating the Ack (Acknowledgement) file sent back to the Mainframe

```java
FileOutputStream out = new FileOutputStream("ACK_20251030.DAT");
for (FxTransaction txn : settledTxns) {
    byte[] record = buildAckRecord(txn); // 1400 bytes
    out.write(record);
}
out.close();
```

```bash
sftp user@host <<EOF
put ACK_20251030.DAT /outbox/
EOF
```

> This is a separate output step after reconciliation — not the same as the general "output batch → HULFT → external system" step from the System Overview chapter; this specifically sends data back up to the **parent system / Mainframe** (e.g. the corresponding core-banking vendor).

### End-of-day reconciliation (different from BankSyncJob)

A job that runs **once a day** (unlike BankSyncJob, which runs every 15 minutes):
1. Compares internally SETTLED transactions against the bank's list.
2. Discrepancies (amount/currency/rate/status) → logged to `FX_RECONCILE_RESULT`.
3. Sends a report via email or PDF (wkhtmltopdf).

### Status flow (illustrative example specific to this flow)

| Status | Meaning |
|---|---|
| 00 | Newly created |
| 10 | Data entry complete |
| 20 | Awaiting completion (Ready to Settle) |
| 30 | Sent to bank |
| 40 | Success (Bank Success) |
| 41 | Error (Bank Fail) |
| 50 | Synced and confirmed (Settled) |
| 90 | Mainframe acknowledged (Ack Sent) |

> This is the 3rd status set to appear in this documentation (different from 10/12/20/25/30 in the Tenpo chapter and NEW/COMPLETED in the Overview chapter) — reiterating: **the exact codes are system-specific**, what matters is understanding status-driven workflow thinking.

### Overall goals

| Goal | Desired outcome |
|---|---|
| Ensure internal transactions are actually executed at the bank | Avoid mismatches between front-end and CBS |
| Automate instead of relying on users clicking a button | Reduce operator error |
| Log and report for auditing | Full traceability per transaction |
| Report status back to the parent system | Organization-wide consistency |

---

