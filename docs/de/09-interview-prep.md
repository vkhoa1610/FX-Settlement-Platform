---
id: interview-prep
title: Khó khăn, Q&A phỏng vấn & Cheat sheet
sidebar_position: 10
---

## Khó khăn lớn nhất trong nghiệp vụ FX

### Khó khăn nghiệp vụ (Business)

- **Đa dạng loại giao dịch:** Spot (T/T), Forward, Swap, Option, Remittance, Deposit, Loan — mỗi loại có value date, rate ghi sổ, rate thanh toán, quy trình kế toán khác nhau.
- **Revaluation:** khi tỷ giá thị trường đổi, phải đánh giá lại tài sản ngoại tệ, ảnh hưởng trực tiếp P/L.
- **Đa múi giờ, ngày nghỉ quốc tế:** giao dịch USD xử lý ở Nhật thứ Hai nhưng ngân hàng Mỹ nghỉ Chủ Nhật → phải check settlement date hợp lệ theo từng quốc gia, sai thì tiền bị "pending"/"bounce back".
- **Giao dịch liên ngân hàng (SWIFT/HULFT/BOJ-NET):** phải tuân chuẩn quốc tế; lỗi format nhỏ (ví dụ sai 1 ký tự field `:59A:`) có thể khiến giao dịch bị reject toàn bộ.

### Khó khăn kỹ thuật (Technical)

- **Đa hệ thống, đa kênh:** `Front → BFF → Core (CBS) → HULFT → BOJ/SWIFT → Accounting` — mỗi bước format khác nhau (CSV/XML/fixed-length), dễ mismatch nếu mapping không chặt.
- **Định dạng HULFT phức tạp:** fixed-length, multi-record type, header/footer checksum, xử lý phải chính xác từng byte (đặc biệt Shift_JIS); đổi format phải update toàn bộ parser.
- **Reconciliation khó trace:** phải đối chiếu giữa front, core banking, treasury, kế toán — nếu sai lệch phải trace từ file HULFT/log API, rất tốn công.
- **Bảo mật & tuân thủ:** liên quan AML, OFAC, FATF — hệ thống phải log đầy đủ, audit được toàn chuỗi xử lý.

### Bảng tổng hợp

| Nhóm | Khó khăn chính | Hậu quả nếu xử lý sai |
|---|---|---|
| Nghiệp vụ | Xác định đúng tỷ giá, ngày giá trị, loại giao dịch | Sai lệch hạch toán, lỗ tỷ giá |
| Kỹ thuật | Mapping định dạng file, encoding, xử lý byte | File lỗi, không gửi được HULFT |
| Hệ thống | Đồng bộ dữ liệu nhiều hệ thống | Chênh lệch front vs core |
| Kiểm soát | Reconciliation và audit | Không truy vết được giao dịch |
| Tuân thủ | AML, OFAC, FATF | Rủi ro pháp lý, bị phạt nặng |

---


## Cách trả lời khi phỏng vấn

**Nếu Head hỏi: "Can you explain the overall FX transaction flow?"**

> "Theo những gì em hiểu, WebShokin là channel để teller thực hiện giao dịch remittance tại quầy — đây là dòng tiền thật. Transaction được quản lý bằng status trong DB. Sau khi teller hoàn tất, Tenpo đóng vai trò kiểm soát/approval tại branch — kiểm tra KYC/AML, tỷ giá — trước khi chuyển sang BizForex.
>
> BizForex xử lý phần exchange transaction: tính accounting rate (khác với customer rate mà khách hàng thấy), phần chênh lệch giữa 2 rate chính là FX gain/loss của ngân hàng. BizForex sinh denpyo/tanpyo và gọi API xuống CBS. CBS ghi sổ kế toán, và nếu là giao dịch quốc tế thì tiếp tục đẩy qua SWIFT để thực sự chuyển tiền ra ngân hàng nước ngoài.
>
> Vì gọi API xong không chắc có kết quả ngay, hệ thống có job đồng bộ định kỳ (polling) để đối chiếu trạng thái thật với CBS, cộng với reconciliation cuối ngày để phát hiện mismatch. Ngoài online processing, hệ thống có batch/job xử lý HULFT fixed-length files, retry transaction chưa hoàn tất, và generate output file.
>
> Với hệ thống tài chính, em nghĩ phần quan trọng không chỉ là CRUD mà còn là transaction management, status control, idempotency, retry và reconciliation để tránh duplicate hoặc mất trạng thái giao dịch — vì rollback DB không rollback được giao dịch đã thành công ở hệ thống bên ngoài."

---


## Cheat sheet

```text
WebShokin    = Teller channel (Remittance – dòng tiền thật)
Tenpo        = Branch control & approval (KYC/AML, JFSA compliance)
BizForex     = FX business processing (Exchange – kế toán, rate, gain/loss)
CBS        = Banking/accounting downstream (Denpyo/Tanpyo)
SWIFT        = Message quốc tế (MT103/MT202/MX) — sau CBS nếu ra nước ngoài
HULFT        = File transfer nội địa Nhật (fixed-length, checksum)
ViewCreator  = SQL View → UI
Batch        = Large-volume processing
Job          = Scheduled automation (import/sync/retry/reconciliation)
DB Status    = Workflow control (số hiệu tùy hệ thống)
Denpyo       = Accounting slip/document tổng
Tanpyo       = Bút toán con (debit/credit chi tiết)
Kanryo       = Complete current business step (chưa chắc downstream đã xong)
Customer Rate    = Rate khách hàng thấy (WebShokin)
Accounting Rate  = Rate kế toán ghi sổ (BizForex) — chênh lệch = FX Gain/Loss
Historical Rate  = Rate tại thời điểm giao dịch gốc (dùng khi reprocess/revaluation)
Current Rate     = Rate hiện hành (dùng cho giao dịch mới)
Revaluation      = Đánh giá lại tài sản ngoại tệ định kỳ (thường cuối tháng)
Remittance   = 送金取引 — chuyển tiền thật
Exchange     = 為替取引 — hạch toán kế toán ngoại hối
Idempotency  = Prevent duplicate processing
Retry        = Re-process failed/uncertain transaction
Reconciliation = Compare internal vs downstream result
Rollback     = Undo DB transaction, nhưng KHÔNG undo được external transaction đã xong
AML/KYC/JFSA/OFAC/FATF = Các khung tuân thủ liên quan giao dịch ngoại tệ
```

---

