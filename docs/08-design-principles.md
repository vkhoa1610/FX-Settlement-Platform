---
id: design-principles
title: Design Principles — Rollback, Idempotency, Reconciliation
sidebar_position: 9
---

## Rollback, Idempotency, Reconciliation (nguyên tắc nền tảng)

### Rollback không hoàn hảo

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

**Nuance quan trọng:** DB rollback **không** rollback được transaction đã thành công ở hệ thống bên ngoài (CBS). Ví dụ: DB update → CBS SUCCESS → network timeout → app nghĩ FAIL → rollback DB, nhưng CBS đã xử lý tiền rồi. Do đó cần: Transaction ID, idempotency, status, retry, audit log, reconciliation.

### Idempotency

```text
Transaction ID = FX202609030001
Lần đầu: BizForex → CBS → SUCCESS (nhưng response timeout)
Job retry: BizForex → CBS
Không có idempotency: ❌ có thể xử lý 2 lần
Có idempotency: CBS kiểm tra Transaction ID đã xử lý → return previous result ✅
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


## Design principle xuyên suốt (đáng nhớ nhất)

> **Không hardcode cấu trúc dữ liệu trong code — cấu hình trong DB.**

Áp dụng nhất quán ở 2 chiều:
- **Input (đọc file HULFT vào):** layout byte-offset lưu trong bảng `FILE_LAYOUT`, parser đọc động.
- **Output (build XML gửi CBS):** template field-mapping lưu trong DB theo `transactionCode`, builder đọc động.

Khi format thay đổi (thêm field, đổi vị trí, thêm loại giao dịch mới), chỉ cần cập nhật cấu hình DB — không cần sửa/deploy lại code. Đây là nguyên tắc thiết kế đáng nói nhất khi phỏng vấn về khả năng maintain hệ thống lâu dài.
