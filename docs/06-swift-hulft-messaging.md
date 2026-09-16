---
id: swift-hulft-messaging
title: SWIFT vs HULFT — Messaging Layer
sidebar_position: 7
---

## SWIFT and HULFT

### What is SWIFT?

**SWIFT** (Society for Worldwide Interbank Financial Telecommunication) — an international network for transmitting financial **messages** between banks. **SWIFT does not move real money**, it only transmits messages.

Main message types:
- **MT103** – customer transfer (Customer Transfer)
- **MT202** – bank transfer (Bank Transfer)
- **MT940** – account statement
- **MX ISO20022** – XML format replacing the older MT format

### What is HULFT?

**HULFT (ヒュルト)** — a secure file-transfer middleware developed by **Saison Information Systems**, essentially the de facto standard among domestic Japanese banks (similar to FTP + checksum + retry logic).

Characteristics: sends fixed-length binary files (1400 bytes/record), has header/footer checksums to ensure integrity, sent periodically via a cshell/batch job (e.g. every 15 minutes).

**Example of a real HULFT file (with header/trailer):**
```text
HDR0138FX20251030
001YOKOHAMA BANK      28000JPYUSD00010000
002YOKOHAMA BANK      28000JPYUSD00020000
TRL000000002
```

### SWIFT vs HULFT comparison

| Aspect | SWIFT | HULFT |
|---|---|---|
| Purpose | Exchange financial messages between international banks | Transfer files internally between Japanese systems/banks |
| Scope | International (interbank) | Domestic |
| Data | Message (MT/MX format) | File (fixed-length, XML) |
| Timing | Real-time/near real-time | Scheduled batch |
| Protocol | SWIFTNet, ISO20022 | TCP/IP, HULFT protocol |
| Example | Bank ABC ↔ Bank XYZ (international) | WebShokin ↔ BizForex ↔ CBS |

### Position in the overall flow

```text
WebShokin → Tenpo → BizForex     (HULFT, internal)
BizForex → CBS                  (API/XML or HULFT, denpyo/tanpyo)
CBS → SWIFT Gateway             (MT103/MX, for international transfers)
```

> Important point: CBS is not the end point. If the transaction is an international transfer, after CBS there's still a step sending a real SWIFT message that actually pushes the money out to the foreign bank.

---

