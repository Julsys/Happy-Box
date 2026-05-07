# Happy Box

Prototype web tinh cho ung dung gap vien nhong hanh phuc.

## Chay app

Ban co the mo truc tiep file `index.html` bang trinh duyet de xem ban demo offline.

De chay ban tuong tac that co backend dung chung:

```bash
npm start
```

Sau do mo `http://localhost:3000`.

Khi chay qua server, du lieu duoc luu chung trong `data/capsules.json` hoac folder trong bien moi truong `DATA_DIR`. Khi mo bang `file://`, app tu dong fallback ve `localStorage` cua trinh duyet theo schema:

```json
{
  "id": "unique-id",
  "content": "Noi dung cau chuyen hanh phuc",
  "color": "pink | blue | yellow | green | purple",
  "createdAt": "ISO date",
  "hearts": 0,
  "thanks": 0
}
```

## Chuc nang

- Man hinh may gap capsule phong cach pixel pastel.
- Animation can cau di xuong, kep capsule, keo len va mo popup.
- Boc ngau nhien mot cau chuyen khi bam `Gap Hanh Phuc`.
- Form gui cau chuyen an danh.
- Phan hoi cam xuc bang tha tim va loi cam on.
- Nhac nen nhe tu file `assets/happy-box-bgm.mp3`, chi bat sau khi nguoi dung bam nut nhac.

## API

Frontend hien da goi API that khi app duoc phuc vu qua server:

- `GET /api/capsules/random`
- `POST /api/capsules`
- `POST /api/capsules/:id/reactions`
- `GET /api/stats`

## Deploy cong khai

Deploy folder nay len mot dich vu Node.js nhu Render, Railway, Fly.io hoac VPS. Lenh start la:

```bash
npm start
```

Dat bien moi truong `PORT` neu nen tang hosting yeu cau. Neu nen tang hosting co persistent disk, dat them `DATA_DIR` vao duong dan disk de du lieu khong mat khi restart/deploy. Sau khi deploy, moi nguoi truy cap cung URL se doc, gui va tha cam xuc vao cung mot kho capsule.
