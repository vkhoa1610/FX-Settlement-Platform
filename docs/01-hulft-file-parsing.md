---
id: hulft-file-parsing
title: HULFT File Parsing (Input Layer)
sidebar_position: 2
---

## HULFT → DB: Fixed-length parsing (data-driven layout)

### Nguyên tắc cơ bản

File input từ HULFT là **fixed-length record**, ví dụ 1400 byte/record:

```text
1400 bytes = 1 record
Record 1: 1400 bytes
Record 2: 1400 bytes
...
```

### Vì sao phải cắt theo BYTE chứ không phải String?

Với hệ thống Nhật, encoding có thể là Shift-JIS (MS932), EUC-JP... Nếu dùng `String.substring()`, vị trí có thể sai khi một ký tự chiếm nhiều byte. Flow an toàn:

```text
InputStream → byte[1400] → offset/length → decode theo encoding → String → DB
```

### Cách làm THỰC TẾ: layout không hardcode, quản lý qua DB

Không hardcode offset trong code Java. Layout được lưu trong bảng cấu hình, khi format file đổi chỉ cần sửa DB, không cần sửa code:

**Bảng `FILE_LAYOUT`:**

> **Type codes đã xác nhận theo chuẩn COBOL PIC clause** (không phải ký hiệu tự đặt "N=Numeric/C=Character" như bản nháp minh họa ban đầu):
> - **`9`** = Numeric, không dấu (PIC 9) — chỉ số dương, 1 byte/chữ số.
> - **`S9`** = Signed Numeric, có dấu (PIC S9) — cho phép âm/dương, dùng cho field như AMOUNT (số tiền có thể cần biểu diễn điều chỉnh âm).
> - **`X`** = Alphanumeric (PIC X) — chuỗi ký tự thường/half-width, **1 byte/ký tự**.
> - **`N`** = National/Japanese (PIC N) — ký tự tiếng Nhật full-width (kanji/kana), **2 byte/ký tự cố định**.

| FIELD_NAME | START_POS | LENGTH | TYPE | DESCRIPTION |
|---|---|---|---|---|
| SEQ_NO | 1 | 5 | 9 | Số thứ tự (không dấu) |
| ACCOUNT_NO | 6 | 12 | X | Số tài khoản |
| AMOUNT | 18 | 10 | S9 | Số tiền (có dấu — có thể âm khi điều chỉnh/Nợ-Có) |
| CURRENCY | 28 | 3 | X | Mã tiền tệ |
| DATE | 31 | 8 | X | Ngày giao dịch (yyyymmdd) |
| CUSTOMER_NAME | 39 | 40 | N | Tên khách hàng (full-width, 2 byte/ký tự → 40 byte = tối đa 20 ký tự kanji) |

**Parser động đọc layout từ DB:**

```java
public class HulftFileParser {
    public List<Map<String, String>> parseFile(String filePath, List<FileLayout> layouts) throws IOException {
        List<Map<String, String>> records = new ArrayList<>();
        List<String> lines = Files.readAllLines(Paths.get(filePath), StandardCharsets.UTF_8);
        for (String line : lines) {
            Map<String, String> record = new LinkedHashMap<>();
            for (FileLayout layout : layouts) {
                int start = layout.getStartPos() - 1;
                String value = substringByByte(line, start, layout.getLength());
                record.put(layout.getFieldName(), value.trim());
            }
            records.add(record);
        }
        return records;
    }

    // Cắt chuỗi theo byte — quan trọng khi file có ký tự đa byte (SJIS)
    private String substringByByte(String str, int start, int length) throws UnsupportedEncodingException {
        byte[] bytes = str.getBytes("MS932");
        byte[] sub = Arrays.copyOfRange(bytes, start, start + length);
        return new String(sub, "MS932");
    }
}
```

**Lợi ích của thiết kế data-driven:**
- Format file đổi → chỉ update DB, không sửa code.
- Reuse layout cho nhiều loại file (FX_TRX, DENPYO, TANPYO...).
- Mapping layout theo loại giao dịch (`FILE_TYPE` hoặc `SYUNO_BC` trong CBS).

> **Nguyên tắc thiết kế xuyên suốt hệ thống**: cấu hình trong DB, không hardcode trong code — áp dụng cả cho chiều đọc file vào (layout parsing) lẫn chiều build XML gửi đi (xem mục 8).

> **Lưu ý về encoding:** khi field chỉ chứa mã số/ký tự Latin (record type, branch code, account no...), có thể decode bằng UTF-8 mà không lỗi. Nhưng khi field có khả năng chứa ký tự tiếng Nhật (tên khách hàng, ghi chú...), **bắt buộc dùng Shift-JIS/MS932** như đã nêu ở mục 2.2 — không nên mặc định UTF-8 cho toàn bộ file chỉ vì một vài field số không lỗi.

### Ví dụ layout thứ hai (minh họa thêm)

| Byte Range | Field Name | Length | Type | Ghi chú |
|---|---|---|---|---|
| 0-3 | Record Type | 4 | X | `"FEXR"` |
| 4-13 | Branch Code | 10 | X | Mã chi nhánh |
| 14-33 | Account No | 20 | X | Số tài khoản |
| 34-53 | Currency | 20 | X | USD, JPY... |

> Type codes theo chuẩn COBOL PIC đã xác nhận ở mục 2.3 (`9`/`S9`/`X`/`N`) — ví dụ này chỉ dùng field dạng chuỗi thường (`X`, half-width), không có field tiếng Nhật.

Cấu trúc package thường gặp cho loại hệ thống này: `common/` (parse layout, convert binary) — `batch/` (import/export job) — `service/` (gọi API) — `view/` (cho user xử lý) — `report/` (in PDF/CSV).

---

