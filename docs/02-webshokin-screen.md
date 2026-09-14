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

### Pre-processing khi mở transaction

```text
Request → Controller/Servlet → Pre-processing → Check user → Check role
→ Check transaction status → Update status/information → Load transaction → JSP init
```

**Quan trọng:** Role không nên chỉ dùng để ẩn/hiện button ở frontend. Backend luôn phải kiểm tra lại:

```javascript
// KHÔNG đủ — chỉ ẩn hiện UI:
if (role === "MANAGER") { $("#approveButton").show(); }
```

```java
// PHẢI có ở backend:
if (!user.hasRole("MANAGER")) {
    throw new UnauthorizedException();
}
```

### JSP + jQuery AJAX pattern

```text
JSP → document.ready() → AJAX → Controller/Servlet → Service → DAO → DB
→ JSON/XML response → jQuery → Update HTML
```

Lý do dùng AJAX thay vì JSP render trực tiếp: UI không phải reload toàn trang, tách data loading khỏi page, dễ xử lý nhiều API cùng lúc, update từng phần DOM riêng biệt.

---


## ViewCreator & Transaction Screen — chi tiết implementation

### ViewCreator map trực tiếp với DB view

ViewCreator map 1-1 với 1 view/table, ví dụ `vw_foreign_exchange_list`. Khi mở màn hình, hệ thống query trực tiếp view này qua DAO/mapper. Record được lọc theo status, ví dụ (bộ status minh họa khác — một lần nữa nhấn mạnh số hiệu tùy hệ thống):

```text
'01' = chưa xử lý
'10' = đang xử lý
'20' = đã gửi sang CBS
'30' = đã in báo cáo
```

### Điều hướng từ list sang detail

Click nút "+" → redirect sang màn hình chi tiết theo pattern URL:

```text
/fxTransactionDetail?id=12345
```

### Pre-processing khi vào màn hình chi tiết

```java
transactionService.prepareTransaction(id, userRole);
```

Service này: check role, check status (ví dụ status = 12 và role = manager → chuyển thành 10), ghi log audit, update `updated_by`/`update_date`, rồi trả về data đầy đủ (header, detail, status, permission) cho màn hình.

### Màn hình giao dịch — submit

JS validate input (ví dụ `amount > 0`) rồi gọi API khi bấm Submit/Execute:

```text
POST /api/fx/executeTransaction
```

> Lưu ý thứ tự: `executeTransaction` (nhập/thực hiện giao dịch tại màn hình WebShokin) diễn ra **trước** `completeTransaction` (Kanryo, mục 5B.2 — hoàn tất để gửi downstream). Đây là 2 bước khác nhau trong cùng luồng.

### Kênh truyền batch report

Ngoài HULFT/SFTP (mục 12.5), batch report cũng có thể gửi qua **socket trực tiếp** tùy nghiệp vụ, không chỉ giới hạn ở FTP.

---

