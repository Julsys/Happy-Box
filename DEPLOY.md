# Deploy Happy Box len internet

Project nay da san sang chay nhu mot web Node.js co backend that.

## Cach de moi nguoi truy cap duoc

### 1. Dua code len GitHub

Tao mot repository moi tren GitHub, vi du `happy-box`, roi upload toan bo cac file trong folder nay:

- `index.html`
- `styles.css`
- `script.js`
- `server.js`
- `package.json`
- `render.yaml`
- `assets/happy-box-bgm.mp3`
- cac file huong dan khac neu muon

### 2. Deploy bang Render

1. Mo https://render.com
2. Chon **New** -> **Web Service**
3. Ket noi repository `happy-box`
4. Cau hinh:
   - Runtime: `Node`
   - Build Command: de trong
   - Start Command: `npm start`
5. Bam **Deploy**

Sau khi deploy xong, Render se tao mot URL dang:

```text
https://happy-box.onrender.com
```

Gui URL do cho moi nguoi de dung chung Happy Box.

## Luu y ve du lieu

Mac dinh server luu cau chuyen vao `data/capsules.json`. Neu hosting restart/redeploy ma khong co persistent disk, du lieu co the bi reset.

De dung lau dai tren Render:

1. Tao persistent disk trong Render.
2. Mount disk, vi du `/var/data`.
3. Them environment variable:

```text
DATA_DIR=/var/data
```

Khi do moi cau chuyen, tim va loi cam on se duoc luu trong disk chung.
