---
id: hulft-file-parsing
title: HULFT File Parsing (Input Layer)
sidebar_position: 2
---

## HULFT → DB: Fixed-length parsing (data-driven layout)

### Basic principle

Input files from HULFT are **fixed-length records**, e.g. 1400 bytes/record:

```text
1400 bytes = 1 record
Record 1: 1400 bytes
Record 2: 1400 bytes
...
```

### Why cut by BYTE instead of by String?

In Japanese systems, the encoding may be Shift-JIS (MS932), EUC-JP, etc. Using `String.substring()` can land on the wrong position when a character spans multiple bytes. Safe flow:

```text
InputStream → byte[1400] → offset/length → decode per encoding → String → DB
```

### The REAL approach: layout isn't hardcoded — it's managed via DB

Offsets are never hardcoded in Java code. The layout is stored in a configuration table; when the file format changes, only the DB needs updating, no code changes needed:

**`FILE_LAYOUT` table:**

> **Type codes confirmed against the COBOL PIC clause standard** (not self-invented symbols like "N=Numeric/C=Character" as in an earlier illustrative draft):
> - **`9`** = Numeric, unsigned (PIC 9) — positive digits only, 1 byte/digit.
> - **`S9`** = Signed Numeric (PIC S9) — allows negative/positive, used for fields like AMOUNT (amounts that may need to represent negative adjustments).
> - **`X`** = Alphanumeric (PIC X) — regular/half-width character string, **1 byte/character**.
> - **`N`** = National/Japanese (PIC N) — full-width Japanese characters (kanji/kana), **fixed 2 bytes/character**.

| FIELD_NAME | START_POS | LENGTH | TYPE | DESCRIPTION |
|---|---|---|---|---|
| SEQ_NO | 1 | 5 | 9 | Sequence number (unsigned) |
| ACCOUNT_NO | 6 | 12 | X | Account number |
| AMOUNT | 18 | 10 | S9 | Amount (signed — can be negative for adjustments/Debit-Credit) |
| CURRENCY | 28 | 3 | X | Currency code |
| DATE | 31 | 8 | X | Transaction date (yyyymmdd) |
| CUSTOMER_NAME | 39 | 40 | N | Customer name (full-width, 2 bytes/char → 40 bytes = max 20 kanji characters) |

**Dynamic parser that reads the layout from DB:**

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

    // Cut string by byte — important when the file contains multi-byte characters (SJIS)
    private String substringByByte(String str, int start, int length) throws UnsupportedEncodingException {
        byte[] bytes = str.getBytes("MS932");
        byte[] sub = Arrays.copyOfRange(bytes, start, start + length);
        return new String(sub, "MS932");
    }
}
```

**Benefits of the data-driven design:**
- File format changes → only update the DB, no code changes.
- Reuse the layout across multiple file types (FX_TRX, DENPYO, TANPYO...).
- Layout mapping per transaction type (`FILE_TYPE` or `SYUNO_BC` in CBS).

> **Design principle that runs through the whole system**: configuration lives in the DB, not hardcoded in code — applied both to reading files in (layout parsing) and building outbound XML (see the Core Banking System chapter).

> **Encoding note:** when a field only contains numeric/Latin characters (record type, branch code, account no...), UTF-8 decoding may work without errors. But when a field can contain Japanese characters (customer name, remarks...), **Shift-JIS/MS932 is mandatory** as noted above — don't default to UTF-8 for the whole file just because a few numeric fields happen not to error.

### Second layout example (additional illustration)

| Byte Range | Field Name | Length | Type | Note |
|---|---|---|---|---|
| 0-3 | Record Type | 4 | X | `"FEXR"` |
| 4-13 | Branch Code | 10 | X | Branch code |
| 14-33 | Account No | 20 | X | Account number |
| 34-53 | Currency | 20 | X | USD, JPY... |

> Type codes follow the confirmed COBOL PIC standard (`9`/`S9`/`X`/`N`) — this example only uses regular string fields (`X`, half-width), no Japanese fields.

Typical package structure for this kind of system: `common/` (parse layout, convert binary) — `batch/` (import/export job) — `service/` (call API) — `view/` (for user processing) — `report/` (print PDF/CSV).

---

