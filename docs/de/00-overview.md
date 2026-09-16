---
id: overview
title: System Overview
sidebar_position: 1
slug: /
---

> Documentation describing **Foreign Exchange (FX)** business operations in a banking system: the end-to-end FX transaction flow, from order entry at the teller counter to rate calculation, accounting entries, and reconciliation with downstream systems.

## System overview

```text
External System
      │
    HULFT
      ▼
 Input Batch
      │
      ▼
Parse fixed-length 1400 bytes (per DB-configured layout)
      │
      ▼
     DB
      │
      ▼
ViewCreator
      │
      ▼
WebShokin  (Remittance – front, teller order entry)
      │
      ▼
Tenpo      (Branch control – review/approval)
      │
      ▼
BizForex   (Exchange – business processing, rate, FX gain/loss)
      │
      ▼
CBS      (Downstream banking/accounting, Denpyo/Tanpyo — e.g. BeSTA)
      │
      ▼
SWIFT Gateway (MT103/MX – for international transactions)
      │
      ▼
Result / Status → BankSync job → Report → Output Batch → HULFT → External System
```

### Role of each component

| Component | Role |
|---|---|
| HULFT | File transfer between systems (domestic Japan) |
| SWIFT | International financial messaging between banks (MT103, MT202, MX ISO20022) |
| Batch | Large-volume file/data processing |
| Job | Scheduled/automated business runs (import, sync, retry, reconciliation) |
| Common | Shared logic/helpers (parser, date util, HTTP client...) |
| DB | Stores transactions, status, audit information, rate history |
| SQL View | Prepares data for screens |
| ViewCreator | Maps SQL View to screen/list |
| WebShokin | Channel for tellers to execute transactions (Remittance – front) |
| Tenpo | Control/review/approval layer at branch/store |
| BizForex | Handles FX business logic (Exchange – back office, FX accounting) |
| CBS | Downstream banking/accounting transaction |
| Report | Generates business reports/results |

---


## DB and status — the workflow control center

Transactions have a lifecycle managed via status. Example generic status flow:

```text
NEW → REGISTERED → PROCESSING → COMPLETED → WAIT_BIZFOREX → SENT → SUCCESS → IN_REPORT
```

Status helps: identify the current step, avoid reprocessing, let jobs know which records need processing, retry failures, support reconciliation, and control the workflow.

**Important note:** the status codes shown are illustrative examples — each system/channel may use different names/codes (see the specific status sets in the Tenpo and BizForex chapters).

---


## The four most important algorithm groups

```text
① Rate Calculation:      Amount + TTS + Exemption + Customer rule + Rounding → Final amount
② Accounting Generator:  Transactions → Grouping → Denpyo → Tanpyo → CBS
③ Reconciliation:        Internal transaction ↕ CBS transaction → MATCH/MISMATCH
④ Idempotency/Retry:     Transaction ID → Already processed? → Skip/Process
```

---


## Full transaction lifecycle (end-to-end)

```text
1. External input → 2. HULFT → 3. Fixed-length parsing (layout from DB)
→ 4. Validate → 5. Insert DB → 6. Initial status → 7. ViewCreator
→ 8. Teller opens WebShokin → 9. Pre-processing → 10. Role/authorization check
→ 11. FX input (Remittance) → 12. Rate/TTS/exemption calculation (Customer rate)
→ 13. Kanryo → 14. Ready for downstream → 15. Tenpo review/approval
→ 16. BizForex processing (Exchange, Accounting rate, FX Gain/Loss)
→ 17. Generate Denpyo/Tanpyo (XML) → 18. Call CBS API
→ 19. CBS response → 20. Update status → 21. Bank Sync job (polling)
→ 22. Reconciliation/retry if needed → 23. Ack file → Mainframe
→ 24. Report status → 25. Scheduled output batch → 26. Generate fixed-length file
→ 27. HULFT → 28. External system (or SWIFT for international transactions)
```

---

