---
id: interview-prep
title: Challenges, Interview Q&A & Cheat Sheet
sidebar_position: 10
---

## The biggest challenges in FX operations

### Business challenges

- **Diverse transaction types:** Spot (T/T), Forward, Swap, Option, Remittance, Deposit, Loan — each type has its own value date, booking rate, settlement rate, and accounting process.
- **Revaluation:** when the market rate changes, foreign-currency assets must be revalued, directly affecting P/L.
- **Multiple time zones, international holidays:** a USD transaction processed in Japan on Monday, but the US bank is closed on Sunday → must check the settlement date is valid per country, otherwise money ends up "pending"/"bounced back".
- **Interbank transactions (SWIFT/HULFT/BOJ-NET):** must follow international standards; a small format error (e.g. one wrong character in field `:59A:`) can get the entire transaction rejected.

### Technical challenges

- **Multiple systems, multiple channels:** `Front → BFF → Core (CBS) → HULFT → BOJ/SWIFT → Accounting` — each step uses a different format (CSV/XML/fixed-length), easy to mismatch without strict mapping.
- **Complex HULFT format:** fixed-length, multi-record type, header/footer checksum, processing must be exact down to the byte (especially Shift_JIS); a format change requires updating the entire parser.
- **Reconciliation is hard to trace:** must cross-check between front-end, core banking, treasury, and accounting — if there's a mismatch, tracing through HULFT files/API logs is very labor-intensive.
- **Security & compliance:** relates to AML, OFAC, FATF — the system must log everything fully, with the entire processing chain auditable.

### Summary table

| Group | Main challenge | Consequence if handled wrong |
|---|---|---|
| Business | Determining the correct rate, value date, transaction type | Accounting mismatches, FX losses |
| Technical | File format mapping, encoding, byte-level processing | Corrupted files, failed HULFT sends |
| System | Syncing data across multiple systems | Front vs. core mismatches |
| Control | Reconciliation and audit | Transactions can't be traced |
| Compliance | AML, OFAC, FATF | Legal risk, heavy penalties |

---


## How to answer in an interview

**If asked: "Can you explain the overall FX transaction flow?"**

> "From what I understand, WebShokin is the channel where the teller executes the remittance transaction at the counter — this is the real money movement. The transaction is managed via status in the DB. After the teller completes it, Tenpo acts as the control/approval layer at the branch — checking KYC/AML, the rate — before passing it to BizForex.
>
> BizForex handles the exchange transaction: calculating the accounting rate (different from the customer rate the customer sees), and the difference between the two rates is the bank's FX gain/loss. BizForex generates the denpyo/tanpyo and calls the API down to CBS. CBS posts the accounting entries, and if it's an international transaction, it then goes through SWIFT to actually move the money to the foreign bank.
>
> Since calling the API doesn't guarantee an immediate final result, the system has a periodic sync job (polling) to reconcile the real status with CBS, plus end-of-day reconciliation to catch mismatches. Besides online processing, the system has batch/jobs handling HULFT fixed-length files, retrying incomplete transactions, and generating output files.
>
> For a financial system, I think what matters isn't just CRUD but also transaction management, status control, idempotency, retry, and reconciliation to avoid duplicating or losing transaction state — because a DB rollback can't undo a transaction that already succeeded on an external system."

---


## Cheat sheet

```text
WebShokin    = Teller channel (Remittance – real cash flow)
Tenpo        = Branch control & approval (KYC/AML, JFSA compliance)
BizForex     = FX business processing (Exchange – accounting, rate, gain/loss)
CBS          = Banking/accounting downstream (Denpyo/Tanpyo)
SWIFT        = International messaging (MT103/MT202/MX) — after CBS for cross-border
HULFT        = Domestic Japanese file transfer (fixed-length, checksum)
ViewCreator  = SQL View → UI
Batch        = Large-volume processing
Job          = Scheduled automation (import/sync/retry/reconciliation)
DB Status    = Workflow control (codes are system-specific)
Denpyo       = Overall accounting slip/document
Tanpyo       = Sub-entry (detailed debit/credit)
Kanryo       = Complete the current business step (downstream isn't necessarily done yet)
Customer Rate    = Rate the customer sees (WebShokin)
Accounting Rate  = Rate accounting books (BizForex) — the difference = FX Gain/Loss
Historical Rate  = Rate at the time of the original transaction (used for reprocess/revaluation)
Current Rate     = Prevailing rate (used for new transactions)
Revaluation      = Periodic revaluation of foreign-currency assets (usually month-end)
Remittance   = 送金取引 — real money transfer
Exchange     = 為替取引 — FX accounting entries
Idempotency  = Prevent duplicate processing
Retry        = Re-process a failed/uncertain transaction
Reconciliation = Compare internal vs downstream result
Rollback     = Undoes a DB transaction, but does NOT undo an external transaction that already succeeded
AML/KYC/JFSA/OFAC/FATF = Compliance frameworks relevant to FX transactions
```

---

