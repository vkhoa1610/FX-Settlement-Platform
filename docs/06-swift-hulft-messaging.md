---
id: swift-hulft-messaging
title: SWIFT vs HULFT — Messaging Layer
sidebar_position: 7
---

## SWIFT và HULFT

### SWIFT là gì?

**SWIFT** (Society for Worldwide Interbank Financial Telecommunication) — mạng lưới quốc tế truyền **thông điệp** tài chính giữa các ngân hàng. **SWIFT không chuyển tiền thật**, chỉ truyền message.

Các loại message chính:
- **MT103** – chuyển tiền khách hàng (Customer Transfer)
- **MT202** – chuyển tiền ngân hàng (Bank Transfer)
- **MT940** – sao kê tài khoản
- **MX ISO20022** – dạng XML thay cho MT cũ

### HULFT là gì?

**HULFT (ヒュルト)** — middleware truyền file an toàn, do **Saison Information Systems** phát triển, gần như chuẩn mặc định giữa các ngân hàng nội địa Nhật (tương tự FTP + checksum + retry logic).

Đặc điểm: gửi file binary fixed-length (1400 byte/record), có header/footer checksum đảm bảo integrity, gửi định kỳ qua job cshell/batch (ví dụ mỗi 15 phút).

**Ví dụ file HULFT thật (có header/trailer):**
```text
HDR0138FX20251030
001YOKOHAMA BANK      28000JPYUSD00010000
002YOKOHAMA BANK      28000JPYUSD00020000
TRL000000002
```

### So sánh SWIFT vs HULFT

| Mục | SWIFT | HULFT |
|---|---|---|
| Mục đích | Trao đổi message tài chính giữa ngân hàng quốc tế | Truyền file nội bộ giữa các hệ thống/ngân hàng Nhật |
| Phạm vi | Quốc tế (interbank) | Nội địa (domestic) |
| Dữ liệu | Message (MT/MX format) | File (fixed-length, XML) |
| Thời điểm | Real-time/near real-time | Batch định kỳ |
| Giao thức | SWIFTNet, ISO20022 | TCP/IP, HULFT protocol |
| Ví dụ | Ngân hàng ABC ↔ Ngân hàng XYZ (quốc tế) | WebShokin ↔ BizForex ↔ CBS |

### Vị trí trong toàn flow

```text
WebShokin → Tenpo → BizForex     (HULFT, nội bộ)
BizForex → CBS                  (API/XML hoặc HULFT, denpyo/tanpyo)
CBS → SWIFT Gateway             (MT103/MX, nếu là giao dịch ra quốc tế)
```

> Điểm quan trọng: CBS không phải là điểm cuối. Nếu giao dịch là chuyển tiền quốc tế, sau CBS còn có bước gửi SWIFT message thật sự đẩy tiền ra ngân hàng nước ngoài.

---

