# Cycle Time Perilisan (PWA + Firebase Auth)

Struktur file (upload semuanya ke root repo GitHub):

```
index.html          # dashboard (dilindungi login)
login.html          # halaman login
manifest.json       # PWA manifest
sw.js               # service worker
offline.html        # fallback saat offline
favicon.ico / favicon.svg
icons/              # logo & ikon PWA (PNG + SVG + maskable + apple-touch)
```

## Deploy ke GitHub Pages
1. Upload semua file ke repo -> Settings -> Pages -> Deploy from branch (`main`, folder `/root`).
2. Firebase Console -> Authentication -> Sign-in method: aktifkan **Email/Password** (dan **Google** bila dipakai).
3. Authentication -> Settings -> **Authorized domains**: tambahkan `USERNAME.github.io`.
4. Authentication -> Users -> **Add user** untuk membuat akun.
5. Setiap mengubah file, naikkan `CACHE_VERSION` di `sw.js`.

## Sinkronisasi antar perangkat (Firestore)
1. Firebase Console -> **Build -> Firestore Database -> Create database** (mode production, pilih region mis. `asia-southeast2` Jakarta).
2. Tab **Rules** -> tempel isi `firestore.rules` -> **Publish**.
3. Login di perangkat pertama: bila cloud masih kosong, data lokal otomatis diunggah. Perangkat lain akan mengikuti.
4. Data: `workspaces/main/batches` dan `workspaces/main/products` (satu dokumen per batch/produk).
File `firestore.rules` tidak perlu di-upload ke GitHub Pages (hanya untuk Firebase Console).

## Menghapus data / mulai dari awal
- **Hapus satu batch:** tombol "Hapus" di baris tabel, atau "Hapus Batch" di dalam modal Detail.
- **Mulai dari awal:** tombol "Kosongkan Data" di header (ketik HAPUS untuk konfirmasi; bisa sekaligus menghapus Master Produk).
- Setelah dikosongkan, data demo tidak akan muncul lagi, termasuk di perangkat lain (ada dokumen penanda di `workspaces/main/meta`).
- Rules Firestore sudah mencakup koleksi `meta`: tempel ulang `firestore.rules` terbaru ke Console -> Rules -> Publish.
