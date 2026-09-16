---
id: bizforex-exchange
title: BizForex — Exchange, FX Gain/Loss & Rate
sidebar_position: 5
---

## 為替取引 (Kawase Torihiki) and where 送金 (Remittance) sits within it

> **Verified against 2 independent legal sources** (a Japanese Supreme Court precedent + the 詳解銀行法 textbook, and the banking-operations journal khki.co.jp) — this is NOT two parallel categories as an earlier draft once described, but rather a **containing / sub-type** relationship.

### Standard legal structure (confirmed)

**為替取引 (Kawase Torihiki)** is the overarching legal concept — one of the 3 core banking operations under Japan's Banking Act (taking deposits, lending, and 為替取引/kawase). Inside it there are **4 sub-groups**:

```text
為替取引 (Exchange — broad legal meaning)
├── ① 送金 (Soukin — Remittance)        e.g.: 普通送金, 国庫送金
├── ② 振込 (Furikomi — Transfer)         e.g.: 振込, 国庫金振込
├── ③ 代金取立 (Daikin Toritate — Collection) e.g.: 代金取立
└── ④ 雑為替 (Zatsu-kawase — Other)       e.g.: 付替, 請求
```

`送金 (Remittance)` **is one of the 4 sub-types** inside 為替取引, not a concept parallel/equal to it.

### How the real system organizes it on screen (UI logic)

Although legally 送金 sits inside 為替取引, on the **actual business screen (BizForex), the system splits 送金取引 out into its own separate total field**, using "為替取引" on the UI in a **narrower sense** (only covering the other 3 groups: 振込/代金取立/雑為替) — because 送金 typically has a large volume and different fee/international-processing (SWIFT) logic, so it's separated out for easier management:

```text
The Receipt screen has 10 sub-categories (belonging to the 4 legal groups above)
        │
        ▼ User selects 1 of the 10 categories
        │
   ┌────┴────────────────────────┐
   │  Does the category belong    │
   │  to the 送金 group?          │
   └────┬───────────────────┬────┘
       Yes                  No
        │                    │
        ▼                    ▼
┌───────────────┐    ┌───────────────┐
│ 送金取引 field │    │ 為替取引 field │
│ (total amount) │    │ (total amount) │
└───────────────┘    └───────────────┘
        │                    │
        └─────────┬──────────┘
                   ▼
        On Kanryo: the system checks the amount
        in the corresponding field (送金取引 or 為替取引)
        + re-sums the 10 fees below once more
        for cross-checking (double-check before commit)
```

> **Important note:** this is a pragmatic UI organization choice of a specific system, and doesn't contradict the law — it's just that "為替取引" on the screen is used with a narrower scope (excluding 送金 since it has its own field), different from the full legal meaning (including 送金) covered above. When discussing the system with others, it's worth clarifying whether you mean "為替取引 in the legal sense" or "為替取引 as the on-screen field" to avoid confusion.

### Illustrative journal entry example (conceptual)

- Remittance (送金): `外貨預金 (Debit) / 当座預金 (Credit)` — reflects a real money transfer.
- The remaining types within 為替取引 (振込/代金取立/雑為替): journal entries vary by type, but all record a corresponding cash flow/financial obligation — not "no real cash flow" as an earlier draft once described, since all 4 groups are legally valid 為替取引, differing only in form/processing channel.

### Kamoku code (科目) — local vs. foreign currency (confirmed from real-world experience)

Alongside the 4 transaction groups above, accounts are also classified by a **科目 (Kamoku)** code. The national standard (Zengin) uses **1 digit**:

```text
1 = 普通 (Futsuu — ordinary account)
2 = 当座 (Touza — current account)
4 = 定期 (Teiki — time deposit)
9 = その他 (Sonota — other)
```

The WebShoukin/BizForex system extends this to **2 digits**, prefixing an extra domain digit (not a public national standard — this is an internal convention, but one with logic inherited from the Zengin standard):

```text
11 = Local currency + 普通 (Futsuu)     — WebShoukin (legacy) only supports these 2 codes
12 = Local currency + 当座 (Touza)
31 = Foreign currency + 普通 (Futsuu)   — BizForex adds these 2 more codes
32 = Foreign currency + 当座 (Touza)
```

→ The 2nd digit (1=普通, 2=当座) exactly follows the national Zengin standard; the 1st digit (1=local, 3=foreign) is a proprietary convention to distinguish domain — an extension with inherited logic, not a completely new coding scheme.

---


## FX Gain/Loss — Customer Rate vs Accounting Rate

### Two processing points, two rates

| Point in time | System | Rate | Meaning |
|---|---|---|---|
| T1 | WebShokin | 28,000 | Customer buys USD (customer rate) |
| T2 | BizForex | 27,000 | Accounting posts the entry (accounting/book rate) |

### Concrete numeric example

```text
Customer rate = 28,000 → customer pays 10,000 × 28,000 = 280,000,000 JPY
Accounting rate = 27,000 → the system books 10,000 × 27,000 = 270,000,000 JPY
→ Difference = 10,000,000 JPY = FX Gain (為替差益) for the bank
```

If the accounting rate is HIGHER than the customer rate → the bank records **為替差損 (FX Loss)**.

### Three journal entries (tanpyo) when there's a rate difference

```text
a) Original transaction:   Cash JPY / Foreign Deposit USD    280,000,000
b) Accounting transaction: Foreign Deposit USD / Cash JPY    270,000,000
c) FX Gain/Loss entry:     Cash JPY / 為替差益 (FX Gain)       10,000,000
```

### Why this difference exists

- WebShokin uses the **customer rate** (TTS + margin) — the sell price to the customer.
- BizForex/Treasury update **daily TTS, TTB** from the central bank each day, used as the accounting rate.
- The difference between the two rates = the bank's spread/profit or FX risk.

### Related database fields

```text
FX_TRANSACTION: amount_usd, customer_rate, accounting_rate, fx_gain_loss, status
FX_RATE_MST:    tts_rate (current rate by day)
FX_DENPYO:      denpyo_no
FX_TANPYO:      type = GAIN/LOSS
```

---


## Historical Rate vs Current Rate + Revaluation

### Concept

| Term | Explanation |
|---|---|
| Current rate (現行レート) | The current rate published by the bank, changing daily/per session. Used for new transactions. |
| Historical rate (履歴レート) | The rate applied at the time of the original transaction. Used for reprocessing, refunds, revaluation, transaction cancellation. |

**Difference from the FX Gain/Loss section:** that section is about 2 rates at the **same point in time** (what the customer sees vs. what accounting books); this section is about rate along a **time axis** (today's rate differs from the rate at the original transaction due to processing lag).

### Why both must be stored

**Transactions have a lag:** a customer buys USD on 01/10 (rate 24,000), but the accounting system processes it on 03/10 when the rate has changed to 24,100 → without storing the historical rate, the book value would be calculated incorrectly.

**End-of-month revaluation:**
```text
Revaluation = (Current Rate - Historical Rate) × Foreign currency balance
Example: (24,200 - 24,000) × 10,000 = 2,000,000 VND (FX gain)
```

### DB tables that manage this

| Table | Purpose |
|---|---|
| FX_RATE_MST | Stores the current rate by day (TTS, TTB, TTN) |
| FX_RATE_HIS | Stores the rate used in each transaction |
| FX_TRANSACTION | Has an FX_RATE_ID field pointing to FX_RATE_HIS |

### Logic for which rate to use, by case

| Case | Rate used |
|---|---|
| New transaction, same day | Current rate |
| Transaction carried over to the next day | Historical rate from the origination day |
| End-of-month revaluation | Compare Historical vs Current |
| Transaction cancellation | Original historical rate |

### Illustrative code

```java
// Fetch the current rate and store it into the transaction
FxRate currentRate = fxRateRepo.findByDate(LocalDate.now());
FxTransaction tx = new FxTransaction();
tx.setAmount(10000);
tx.setCurrency("USD");
tx.setFxRate(currentRate.getTts());
tx.setFxRateDate(LocalDate.now());
fxTransactionRepo.save(tx);

// At end-of-month revaluation
BigDecimal revalRate = fxRateRepo.findByDate(monthEnd).getTts();
BigDecimal fxGainLoss = tx.getAmount()
    .multiply(revalRate.subtract(tx.getFxRate()));
```

---

