---
id: bizforex-exchange
title: BizForex — Exchange, FX Gain/Loss & Rate
sidebar_position: 5
---

## 為替取引 (Kawase Torihiki) và vị trí của 送金 (Remittance) bên trong

> **Đã kiểm chứng qua 2 nguồn pháp lý độc lập** (án lệ Tòa án Tối cao Nhật + giáo trình 詳解銀行法, và tạp chí nghiệp vụ ngân hàng khki.co.jp) — đây KHÔNG phải 2 phạm trù song song như bản nháp ban đầu từng mô tả, mà là quan hệ **bao trùm / loại con**.

### Cấu trúc pháp lý chuẩn (đã xác nhận)

**為替取引 (Kawase Torihiki)** là khái niệm pháp lý bao trùm — 1 trong 3 nghiệp vụ cốt lõi của ngân hàng theo Luật Ngân hàng Nhật (nhận tiền gửi, cho vay, và 為替取引/kawase). Bên trong nó có **4 nhóm con**:

```text
為替取引 (Exchange — nghĩa pháp lý rộng)
├── ① 送金 (Soukin — Remittance)        ví dụ: 普通送金, 国庫送金
├── ② 振込 (Furikomi — Chuyển khoản)     ví dụ: 振込, 国庫金振込
├── ③ 代金取立 (Daikin Toritate — Thu hộ) ví dụ: 代金取立
└── ④ 雑為替 (Zatsu-kawase — Khác)       ví dụ: 付替, 請求
```

`送金 (Remittance)` **là 1 trong 4 loại con** nằm trong 為替取引, không phải khái niệm ngang hàng/song song với nó.

### Cách hệ thống thực tế tổ chức trên màn hình (UI logic)

Dù về mặt pháp lý 送金 nằm trong 為替取引, nhưng **trên màn hình nghiệp vụ thực tế (BizForex), hệ thống tách 送金取引 thành field tổng riêng biệt**, dùng "為替取引" trên UI theo **nghĩa hẹp hơn** (chỉ gộp 3 nhóm còn lại: 振込/代金取立/雑為替) — vì 送金 thường có khối lượng lớn, logic phí/xử lý quốc tế (SWIFT) khác biệt, nên tách riêng cho dễ quản lý:

```text
Màn hình Receipt có 10 category con (thuộc 4 nhóm pháp lý ở trên)
        │
        ▼ User chọn 1 trong 10 category
        │
   ┌────┴────────────────────────┐
   │  Category thuộc nhóm 送金?   │
   └────┬───────────────────┬────┘
       Có                   Không
        │                    │
        ▼                    ▼
┌───────────────┐    ┌───────────────┐
│ 送金取引 field │    │ 為替取引 field │
│ (tổng tiền)    │    │ (tổng tiền)    │
└───────────────┘    └───────────────┘
        │                    │
        └─────────┬──────────┘
                   ▼
        Khi Kanryo: hệ thống check số tiền
        ở field tương ứng (送金取引 hoặc 為替取引)
        + tổng lại 10 fee bên dưới 1 lần nữa
        để đối chiếu (double-check trước khi commit)
```

> **Lưu ý quan trọng:** đây là cách tổ chức UI thực dụng của hệ thống cụ thể, không mâu thuẫn với luật — chỉ là "為替取引" trên màn hình đang được dùng với phạm vi hẹp hơn (loại trừ 送金 vì đã có field riêng), khác với nghĩa pháp lý đầy đủ (bao gồm cả 送金) đã nêu ở mục 7.1. Khi trao đổi với người khác về hệ thống, nên làm rõ đang nói "為替取引 theo nghĩa luật" hay "為替取引 theo field trên màn hình" để tránh nhầm lẫn.

### Ví dụ bút toán minh họa (mang tính khái niệm)

- Remittance (送金): `外貨預金 (Debit) / 当座預金 (Credit)` — phản ánh dòng tiền chuyển thật.
- Các loại còn lại trong 為替取引 (振込/代金取立/雑為替): tùy loại mà bút toán khác nhau, đều là hạch toán ghi nhận dòng tiền/nghĩa vụ tài chính tương ứng, không phải "không có dòng tiền thực" như bản nháp cũ từng mô tả — vì cả 4 nhóm đều là 為替取引 hợp pháp, chỉ khác về hình thức/kênh xử lý.

### Mã Kamoku (科目) — nội tệ vs ngoại tệ (đã xác nhận từ kinh nghiệm thực tế)

Song song với 4 nhóm giao dịch ở trên, tài khoản còn được phân loại theo mã **科目 (Kamoku)**. Chuẩn quốc gia (Zengin) dùng **1 chữ số**:

```text
1 = 普通 (Futsuu — tài khoản thường)
2 = 当座 (Touza — tài khoản vãng lai)
4 = 定期 (Teiki — tiền gửi có kỳ hạn)
9 = その他 (Sonota — khác)
```

Hệ thống WebShoukin/BizForex mở rộng thành **2 chữ số**, ghép thêm 1 chữ số domain phía trước (không phải chuẩn quốc gia công khai, đây là quy ước nội bộ nhưng có logic kế thừa từ chuẩn Zengin):

```text
11 = Nội tệ + 普通 (Futsuu)     — WebShoukin (cũ) chỉ hỗ trợ 2 mã này
12 = Nội tệ + 当座 (Touza)
31 = Ngoại tệ + 普通 (Futsuu)   — BizForex mở rộng thêm 2 mã này
32 = Ngoại tệ + 当座 (Touza)
```

→ Chữ số thứ 2 (1=普通, 2=当座) giữ đúng chuẩn Zengin quốc gia; chữ số đầu (1=nội tệ, 3=ngoại tệ) là quy ước riêng để phân biệt domain — cách mở rộng có logic kế thừa, không phải hệ mã hoàn toàn mới.

---


## FX Gain/Loss — Customer Rate vs Accounting Rate

### Hai thời điểm xử lý, hai tỷ giá

| Thời điểm | Hệ thống | Tỷ giá | Ý nghĩa |
|---|---|---|---|
| T1 | WebShokin | 28,000 | Khách hàng mua USD (customer rate) |
| T2 | BizForex | 27,000 | Kế toán ghi sổ (accounting/book rate) |

### Ví dụ số cụ thể

```text
Customer rate = 28,000 → khách trả 10,000 × 28,000 = 280,000,000 JPY
Accounting rate = 27,000 → hệ thống ghi sổ 10,000 × 27,000 = 270,000,000 JPY
→ Chênh lệch = 10,000,000 JPY = FX Gain (為替差益) của ngân hàng
```

Nếu accounting rate CAO hơn customer rate → ngân hàng ghi **為替差損 (FX Loss)**.

### Ba bút toán (tanpyo) khi có chênh lệch rate

```text
a) Giao dịch gốc:      Cash JPY / Foreign Deposit USD    280,000,000
b) Giao dịch kế toán:  Foreign Deposit USD / Cash JPY    270,000,000
c) FX Gain/Loss entry: Cash JPY / 為替差益 (FX Gain)       10,000,000
```

### Vì sao có chênh lệch này

- WebShokin dùng **customer rate** (TTS + margin) — giá bán cho khách.
- BizForex/Treasury cập nhật **daily TTS, TTB** từ ngân hàng trung ương mỗi ngày, dùng làm accounting rate.
- Chênh lệch giữa 2 rate = spread/lợi nhuận hoặc rủi ro tỷ giá của ngân hàng.

### Database fields liên quan

```text
FX_TRANSACTION: amount_usd, customer_rate, accounting_rate, fx_gain_loss, status
FX_RATE_MST:    tts_rate (rate hiện hành theo ngày)
FX_DENPYO:      denpyo_no
FX_TANPYO:      type = GAIN/LOSS
```

---


## Historical Rate vs Current Rate + Revaluation

### Khái niệm

| Thuật ngữ | Giải thích |
|---|---|
| Current rate (現行レート) | Tỷ giá hiện tại do ngân hàng công bố, thay đổi hằng ngày/theo phiên. Dùng cho giao dịch mới. |
| Historical rate (履歴レート) | Tỷ giá đã áp dụng tại thời điểm giao dịch gốc. Dùng khi reprocess, hoàn tiền, revaluation, hủy giao dịch. |

**Khác biệt với mục 8:** mục 8 nói về 2 rate tại **cùng một thời điểm** (customer thấy gì vs kế toán ghi gì); mục này nói về rate theo **trục thời gian** (rate hôm nay khác rate lúc giao dịch gốc do độ trễ xử lý).

### Vì sao cần lưu cả hai

**Giao dịch có độ trễ:** khách mua USD ngày 01/10 (rate 24,000), nhưng hệ thống kế toán xử lý ngày 03/10 lúc rate đã đổi thành 24,100 → nếu không lưu historical rate sẽ tính sai giá trị sổ sách.

**Revaluation (đánh giá lại) cuối tháng:**
```text
Revaluation = (Current Rate - Historical Rate) × Số dư ngoại tệ
Ví dụ: (24,200 - 24,000) × 10,000 = 2,000,000 VND (FX gain)
```

### Bảng DB quản lý

| Table | Mục đích |
|---|---|
| FX_RATE_MST | Lưu tỷ giá hiện hành theo ngày (TTS, TTB, TTN) |
| FX_RATE_HIS | Lưu tỷ giá đã sử dụng trong từng giao dịch |
| FX_TRANSACTION | Có field FX_RATE_ID trỏ tới FX_RATE_HIS |

### Logic xác định rate dùng theo trường hợp

| Trường hợp | Tỷ giá dùng |
|---|---|
| Giao dịch mới trong ngày | Current rate |
| Giao dịch chuyển tiếp qua ngày | Historical rate của ngày phát sinh |
| Revaluation cuối tháng | So sánh Historical vs Current |
| Hủy giao dịch | Historical rate gốc |

### Code minh họa

```java
// Lấy tỷ giá hiện tại và lưu vào transaction
FxRate currentRate = fxRateRepo.findByDate(LocalDate.now());
FxTransaction tx = new FxTransaction();
tx.setAmount(10000);
tx.setCurrency("USD");
tx.setFxRate(currentRate.getTts());
tx.setFxRateDate(LocalDate.now());
fxTransactionRepo.save(tx);

// Khi revaluation cuối tháng
BigDecimal revalRate = fxRateRepo.findByDate(monthEnd).getTts();
BigDecimal fxGainLoss = tx.getAmount()
    .multiply(revalRate.subtract(tx.getFxRate()));
```

---

