# Telegram Bot Service

Service Aplikasi Node.js untuk memproses pengiriman pesan ke telegram personal ataupun grup (bisa ke topik/thread juga) menggunakan redis untuk cache dan queue dan BullMQ Worker.

---

## Deskripsi

Telegram Bot Service adalah REST API berbasis Node.js yang menerima request kemudia mengirimkan hasil teks ke Telegram secara otomatis.

Aplikasi ini dirancang untuk:
- Output teks polos aman untuk Telegram
- Pemrosesan asynchronous (queue-based)
- Mudah diintegrasikan dengan sistem lain (PHP, Laravel, Go, Pytho, Node, dll)

---


## Kirim dengan Gemini AI

 Dapat proses prompt menggunakan Google Gemini AI dan mengirimkan hasil respons langsung ke Telegram melalui Bot API. Cocok untuk kebutuhan laporan otomatis, notifikasi presensi, ringkasan data, dan pesan AI berbasis template.

---

## Fungsi Utama

- Menerima request API berbentuk JSON
- Validasi request menggunakan schema
- Mengirim prompt dan payload ke Google Gemini AI
- Memproses hasil respons AI
- Mengirim hasil teks ke Telegram Bot
- Mendukung job queue (Bull + Redis)
- Logging error dan retry otomatis

---

## Tech Stack

**Backend**
- Node.js
- Express.js
- Axios

**AI**
- Google Gemini API

**Queue & Cache**
- Bull Queue
- Redis

**Messaging**
- Telegram Bot API

**Deployment**
- Docker
- Docker Compose (opsional)
- PM2 (non-docker)

---

## Instalasi (Tanpa Docker)

### 1. Clone Repository

```bash
git clone https://github.com/username/node-gemini-telegram.git
cd node-gemini-telegram
```

### 2. Install Dependency

```bash
npm install
```

### 3. Konfigurasi Environtment

Salin file .env-example menjadi .env

```bash
cp .env-example .env
```

Kemudian sesuaikan isinya

### 4. Jalankan Aplikasi

#### a. Development

Jalankan Redis Server

```bash
redis-server
```

```bash
npm run dev
```

Jalankan AI worker

```bash
npm run ai-worker
```

Jalankan Send worker

```bash
npm run send-worker
```

#### b. Production

Jalankan Redis Server

```bash
redis-server
```

```bash
npm start
```
Jalankan AI worker

```bash
npm start ai-worker
```

Jalankan Send worker

```bash
npm start send-worker
```

#### c. API akan berjalan default di port 3000:

```bash
http://localhost:3000
```


## Contoh Endpoint API

### Kirim pakai Gemini AI

**POST** <mark>/api/ai/ask</mark>

**Header**

```bash
Content-Type: application/json
x-secret-key: SUPER_SECRET_KEY
```


**Body**
```bash
{
  "telegram_bot_key": "BOT_TOKEN",
  "telegram_receiver_id": "CHAT_ID",
  "gemini_api_key": "GEMINI_API_KEY",
  "prompt": "Prompt instruksi AI",
  "payloads": {}
  "message_thread_id": "isi dengan id thread di grup (INTEGER) atau NULL jika tidak kirim ke topik/thread"
}
```

### Kirim langsung (tanpa Gemini AI)


**POST** <mark>/api/send/message</mark>

**Header**

```bash
Content-Type: application/json
x-secret-key: SUPER_SECRET_KEY
```


**Body**
```bash
{
  "telegram_bot_key": "BOT_TOKEN",
  "telegram_receiver_id": "CHAT_ID",
  "text": "PESAN ANDA",
  "message_thread_id": "isi dengan id thread di grup (INTEGER) atau NULL jika tidak kirim ke topik/thread"
}
```

## Deployment Tanpa Docker (PM2)

### 1. Install PM2

```bash
npm install -g pm2
```
### 3. Jalankan Redis

```bash
redis-server
```

### 3. Jalankan Aplikasi

```bash
pm2 start src/index.ts --name telegram-sender
pm2 start src/worker/ai.worker.ts --name ai-worker
pm2 start src/worker/send.worker.ts --name send-worker
```

### 4. Simpan Konfigurasi

```bash
pm2 save
pm2 startup
```

### 5. Cek status

```bash
pm2 list
```

Harus terlihat:

```bash
telegram-sender  online
ai-worker        online
send-worker      online
```

## Deployment Dengan Docker

### 1. Buat File

```bash
docker-compose.yml
```

### 2. kemudian isikan script berikut :

```bash
services:
  api:
    build: 
    command: node dist/index.js
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - redis

  ai-worker:
    build: .
    command: node dist/worker/ai.worker.js
    env_file:
      - .env
    depends_on:
      - redis

  send-worker:
    build: .
    command: node dist/worker/send.worker.js
    env_file:
      - .env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

```

### 3. Jalankan

```bash
docker-compose up -d
```

## Catatan Keamanan

- Jangan expose gemini_api_key dan telegram_bot_key ke client publik

- Gunakan x-secret-key untuk proteksi API

- Disarankan simpan API key di server (database / env)

- Batasi rate request jika digunakan publik

## Use Case Contoh

- Laporan presensi harian ke Telegram

- Notifikasi otomatis berbasis data

- AI assistant internal perusahaan

- Summary laporan tanpa UI

## Lisensi

MIT License

## Author

Dikembangkan untuk kebutuhan otomasi dan AI messaging internal.


