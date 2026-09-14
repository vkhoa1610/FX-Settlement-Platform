---
id: settlement-sync
title: FX Settlement Synchronization
sidebar_position: 8
---

## FX Settlement Synchronization — đồng bộ dữ liệu thanh toán

### Mục tiêu

Đồng bộ giao dịch giữa hệ thống nội bộ (FX System) và CBS để hai bên có cùng dữ liệu và trạng thái cuối cùng.

### Quy trình chính

```text
1. Nhân viên nhập 10 giao dịch → tính rate, exemption → status = READY_TO_SETTLE
2. Kanryo (thủ công hoặc job tự động) → gom batch → gọi API CBS (OMT)
3. Nhận response: Tanpyo (chi tiết record) + Denpyo (chứng từ tổng batch)
   → fx_transaction.status = BANK_SUCCESS, bank_ref_no = denpyoNo
4. Bank Sync job (định kỳ vài phút/lần): GET /cbs/omt/result?date=...
   → so sánh với DB nội bộ → update SETTLED / FAILED / PENDING
5. Ack: build file phản hồi binary 1400-byte, gửi ngược Mainframe/hệ thống mẹ qua SFTP
```

### Gọi API CBS (OMT Transaction)

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

### Job đồng bộ tự động (polling)

```java
@Scheduled(cron = "0 */15 * * * *") // mỗi 15 phút
public void syncBankResultJob() {
    List<FxTransaction> pending = fxDao.findPending();
    for (FxTransaction txn : pending) {
        BankResult result = cbsClient.queryResult(txn.getBankRefNo());
        fxDao.updateStatus(txn.getId(), result.getStatus());
    }
}
```

> Đây là mô hình **async/eventual consistency**: gọi API xong chưa chắc đã có kết quả cuối cùng ngay, cần job poll lại định kỳ để đối chiếu trạng thái thật — khác với giả định "gọi API rồi nhận response ngay là xong" ở các phần trước.

### Tạo file Ack (Acknowledgement) gửi ngược Mainframe

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

> Đây là bước output riêng biệt sau đối soát — không đồng nhất với bước "output batch → HULFT → external system" chung ở mục 1; đây cụ thể là gửi ngược lên **hệ thống mẹ / Mainframe** (ví dụ nhà cung cấp core-banking tương ứng).

### Reconciliation cuối ngày (khác BankSyncJob)

Job chạy **1 lần/ngày** (khác với BankSyncJob chạy mỗi 15 phút):
1. So sánh giao dịch SETTLED nội bộ với danh sách ngân hàng.
2. Lệch (amount/currency/rate/status) → ghi log vào `FX_RECONCILE_RESULT`.
3. Gửi report qua email hoặc PDF (wkhtmltopdf).

### Status flow (ví dụ minh họa riêng cho luồng này)

| Trạng thái | Ý nghĩa |
|---|---|
| 00 | Tạo mới |
| 10 | Đã nhập đủ dữ liệu |
| 20 | Chờ hoàn tất (Ready to Settle) |
| 30 | Đã gửi ngân hàng |
| 40 | Thành công (Bank Success) |
| 41 | Lỗi (Bank Fail) |
| 50 | Đã đồng bộ và xác nhận (Settled) |
| 90 | Đã phản hồi mainframe (Ack Sent) |

> Đây là bộ status thứ 3 xuất hiện trong tài liệu (khác với 10/12/20/25/30 ở mục 5 và NEW/COMPLETED ở mục 3) — nhấn mạnh lại: **số hiệu cụ thể tùy hệ thống**, điều quan trọng là hiểu tư duy status-driven workflow.

### Mục tiêu tổng thể

| Mục tiêu | Kết quả mong muốn |
|---|---|
| Đảm bảo giao dịch nội bộ thực hiện thật tại ngân hàng | Tránh sai lệch front vs CBS |
| Tự động hóa thay vì phụ thuộc người dùng nhấn nút | Giảm lỗi thao tác |
| Log và report để kiểm toán | Truy vết được từng giao dịch |
| Phản hồi trạng thái về hệ thống mẹ | Nhất quán toàn tổ chức |

---

