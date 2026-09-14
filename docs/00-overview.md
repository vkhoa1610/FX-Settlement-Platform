---
id: overview
title: System Overview
sidebar_position: 1
slug: /
---

> Tài liệu mô tả nghiệp vụ **Foreign Exchange (FX)** trong hệ thống ngân hàng: luồng xử lý giao dịch ngoại tệ end-to-end, từ nhập lệnh tại quầy (teller) đến tính tỷ giá, hạch toán kế toán và đối soát với hệ thống downstream.

## Tổng quan toàn bộ hệ thống

```text
External System
      │
    HULFT
      ▼
 Input Batch
      │
      ▼
Parse fixed-length 1400 bytes (theo layout cấu hình DB)
      │
      ▼
     DB
      │
      ▼
ViewCreator
      │
      ▼
WebShokin  (Remittance – front, teller nhập lệnh)
      │
      ▼
Tenpo      (Branch control – review/approval)
      │
      ▼
BizForex   (Exchange – business processing, rate, FX gain/loss)
      │
      ▼
CBS      (Downstream banking/accounting, Denpyo/Tanpyo — vd: BeSTA)
      │
      ▼
SWIFT Gateway (MT103/MX – nếu là giao dịch quốc tế)
      │
      ▼
Result / Status → BankSync job → Report → Output Batch → HULFT → External System
```

### Vai trò từng thành phần

| Thành phần | Vai trò |
|---|---|
| HULFT | Truyền file giữa các hệ thống (nội địa Nhật) |
| SWIFT | Truyền message tài chính quốc tế giữa các ngân hàng (MT103, MT202, MX ISO20022) |
| Batch | Xử lý file/dữ liệu số lượng lớn |
| Job | Chạy nghiệp vụ định kỳ/tự động (import, sync, retry, reconciliation) |
| Common | Logic/helper dùng chung (parser, date util, HTTP client...) |
| DB | Lưu transaction, status, audit information, rate lịch sử |
| SQL View | Chuẩn bị dữ liệu cho màn hình |
| ViewCreator | Mapping SQL View thành màn hình/list |
| WebShokin | Channel để teller thực hiện giao dịch (Remittance – front) |
| Tenpo | Lớp kiểm soát/review/approval tại branch/store |
| BizForex | Xử lý nghiệp vụ ngoại tệ (Exchange – back, kế toán FX) |
| CBS | Downstream banking/accounting transaction |
| Report | Sinh báo cáo/kết quả nghiệp vụ |

---


## DB và Status — trung tâm điều khiển workflow

Transaction có lifecycle, quản lý bằng status. Ví dụ status generic:

```text
NEW → REGISTERED → PROCESSING → COMPLETED → WAIT_BIZFOREX → SENT → SUCCESS → IN_REPORT
```

Status giúp: xác định bước hiện tại, tránh xử lý lại, job biết record nào cần xử lý, retry lỗi, hỗ trợ reconciliation, kiểm soát workflow.

**Lưu ý quan trọng:** số hiệu status là ví dụ minh họa, mỗi hệ thống/mỗi channel có thể đặt tên/mã khác nhau (xem thêm các bộ status cụ thể ở mục 5 và mục 9).

---


## Bốn nhóm thuật toán quan trọng nhất

```text
① Rate Calculation:      Amount + TTS + Exemption + Customer rule + Rounding → Final amount
② Accounting Generator:  Transactions → Grouping → Denpyo → Tanpyo → CBS
③ Reconciliation:        Internal transaction ↕ CBS transaction → MATCH/MISMATCH
④ Idempotency/Retry:     Transaction ID → Already processed? → Skip/Process
```

---


## Full transaction lifecycle (end-to-end)

```text
1. External input → 2. HULFT → 3. Fixed-length parsing (layout từ DB)
→ 4. Validate → 5. Insert DB → 6. Initial status → 7. ViewCreator
→ 8. Teller mở WebShokin → 9. Pre-processing → 10. Role/authorization check
→ 11. FX input (Remittance) → 12. Rate/TTS/exemption calculation (Customer rate)
→ 13. Kanryo → 14. Ready for downstream → 15. Tenpo review/approval
→ 16. BizForex processing (Exchange, Accounting rate, FX Gain/Loss)
→ 17. Generate Denpyo/Tanpyo (XML) → 18. Call CBS API
→ 19. CBS response → 20. Update status → 21. Bank Sync job (polling)
→ 22. Reconciliation/retry nếu cần → 23. Ack file → Mainframe
→ 24. Report status → 25. Scheduled output batch → 26. Generate fixed-length file
→ 27. HULFT → 28. External system (hoặc SWIFT nếu là giao dịch quốc tế)
```

---

