# Factory Queue Management System (Fabrika Hammadde Kabul ve Sıra Yönetim Sistemi)

Gerçek zamanlı fabrika lojistik operasyonlarını dijitalleştiren; araç kayıt, sıra yönetimi, kantar tartımları ve boşaltım süreçlerini uçtan uca yöneten kurumsal seviyede bir **Sıra Yönetim Sistemi**.

Bu sistem, manuel yönetilen fabrika giriş-çıkış süreçlerini otomatize ederek operasyonel verimliliği maksimuma çıkarmayı ve kantar önündeki sıkışıklıkları engellemeyi amaçlar.

---

## 🚀 Öne Çıkan Özellikler & İş Kuralları

- **Clean Architecture & Domain-Driven Design (DDD):** İş mantığını arayüzden ve veritabanından tamamen izole eden, test edilebilir ve sürdürülebilir mimari.
- **Tek Kantar İş Kuralı (Single Scale Constraint):** Aynı anda sadece tek bir aracın aktif operasyonel süreçte (`Called`, `OnScale`, `Unloading`, `UnloadCompleted`) kalmasını sağlayan katı backend servis validasyonu. Kantar doluyken yeni araç çağrılamaz.
- **FIFO Tabanlı Akıllı Kuyruk:** İlk gelen aracın ilk çağrılmasını güvence altına alan otomatik sıra algoritması.
- **Anlık Veri Senkronizasyonu (SignalR):** Web dashboard ve Flutter mobil uygulaması arasında yenileme gerektirmeyen, event-driven gerçek zamanlı veri akışı.
- **Gelişmiş Sıra Takibi:** Sürücülere anlık olarak tesisteki toplam bekleyen araç sayısını ve önlerinde bekleyen araç sayısını (`vehiclesAheadCount`) dinamik gösteren kuyruk metriği.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### Backend
- **Framework:** ASP.NET Core 9 (C#)
- **ORM / DB:** Entity Framework Core & SQL Server
- **Güvenlik:** JWT Authentication & BCrypt Password Hashing
- **Real-time:** ASP.NET Core SignalR (Hub: `/hubs/queue`)
- **Dokümantasyon:** Swagger API UI

### Web Admin Panel (React)
- **Framework:** React 18 + TypeScript + Vite
- **UI Tasarımı:** Material UI (MUI)
- **State / Network:** Axios & Protected Routes

### Mobile Driver App (Flutter)
- **Framework:** Flutter (Dart) & Material 3 Adaptive UI
- **Network & Güvenlik:** Dio & flutter_secure_storage
- **Anlık Güncelleme:** SignalR Client (with Automatic Reconnect)

---

## 📐 Mimari Katmanlar (Clean Architecture)

```text
FactoryQueue.Domain (Entity & Enum)
       ▲
       │
FactoryQueue.Application (DTO, Interface, BusinessException)
       ▲
       │
FactoryQueue.Infrastructure (EF Core, DbContext, SignalR Hub)
       ▲
       │
FactoryQueue.Api (Controllers, Auth, Authorization)
```

- **Domain:** Enterprise iş kuralları, çekirdek varlıklar (Entities) ve veri tipleri. Hiçbir dış katmana bağımlılığı yoktur.
- **Application:** CQRS/Service kontratları, veri transfer nesneleri (DTOs) ve iş kurallarına özel istisnalar (BusinessException).
- **Infrastructure:** Veritabanı context yönetimi, SQL Server entegrasyonu ve harici dünya ile iletişim kuran servisler (SignalR Hub implementasyonları).
- **Api:** REST API uç noktaları, rol tabanlı yetkilendirme (Admin/Driver) ve middleware katmanları.

---

## 🚦 Gerçekçi Lojistik Akışı ve Durum Sözlüğü

Sistem, gerçek dünya fabrika lojistiğine tam uyum sağlamak adına teknik terimlerden arındırılmış kullanıcı dostu bir terminoloji kullanır:

| Teknik Statü | Kullanıcı Arayüzü Karşılığı (UX Text) | Tetiklenen SignalR Event'i |
|---|---|---|
| `OnTheWay` | Yolda / Transit | İlk kayıt anı |
| `Waiting` | Sırada / Kabul Bekliyor | `QueueUpdated` |
| `Called` | Perona Çağrıldı / Kantara İlerliyor | `ShipmentUpdated`, `QueueUpdated` |
| `OnScale` | Kantar Tartımında (Brüt) | `ShipmentUpdated` |
| `Unloading` | Boşaltım Alanında | `ShipmentUpdated` |
| `UnloadCompleted` | Boşaltım Tamamlandı / Son Tartım Bekliyor | `ShipmentUpdated` |
| `Completed` | İşlem Tamamlandı / Çıkış Yapıldı | `ShipmentUpdated` |

---

## 🔌 SignalR Event Mimarisi

Sistem genelinde durum değişimleri yaşandığında, backend servis katmanı üzerinden tüm istemcilere ilgili event'ler broadcast edilir:

- **QueueUpdated:** Yeni bir araç tesise giriş yaptığında (Arrive) veya bir araç sıradan çağrıldığında (Call) tetiklenir. Mobil uygulamalar sıra sayılarını arka planda otomatik yeniler.
- **ShipmentUpdated** (payload: `shipmentId`): Aracın tartım, boşaltma ve onay süreçlerindeki her adımında tetiklenir. İlgili sürücü uygulaması eşleşen ID'yi yakalayıp ekranı anlık günceller.

---

## 📦 Kurulum ve Çalıştırma

### 1. Veritabanı ve API (Backend)

```bash
# Api dizinine geçiş yapın
cd FactoryQueue.Api

# Paketleri yükleyin ve veritabanını güncelleyin
dotnet restore
dotnet ef database update

# Uygulamayı başlatın
dotnet run
```

### 2. Yönetim Paneli (React Web)

```bash
cd frontend/admin-panel
npm install
npm run dev
```

### 3. Sürücü Uygulaması (Flutter Mobile)

```bash
cd mobile/driver_app
flutter pub get
flutter run
```

> ⚠️ **Önemli Not:** Android Emülatör üzerinden yerel bilgisayarınızdaki (localhost) API'ye bağlanırken bağlantı adresini `http://10.0.2.2:{PORT}/api/` köprüsüyle güncellemeyi unutmayınız.

---

## 🎯 Production Yayına Alım Notları

- Canlı ortamda Admin Register ucu güvenlik sebebiyle kapatılmalıdır.
- User ve Vehicle kayıtları için veri kaybını önlemek adına Soft Delete mekanizması uygulanmaktadır; Shipment geçmişi ise denetim (Audit) amacıyla fiziksel olarak asla silinmez.
- Eşzamanlı işlemlerde yarış durumunu (Race Condition) engellemek amacıyla veritabanı seviyesinde RowVersion tabanlı Optimistic Concurrency protokolü işletilir.
