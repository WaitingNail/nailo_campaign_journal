# 奈羅的團務手記｜閱讀前台

部署於 GitHub Pages 的唯讀團務網誌，包含首頁、團務誌、角色名鑑、冒險統計與各團篇章頁。

公開資料位於 `dist/data/campaigns.json`，角色立繪放在 `dist/assets/characters/`。前台不包含管理頁面或後台連結；資料由獨立管理站發布。

## GitHub Pages

Repository 的 **Settings → Pages → Build and deployment** 請選擇 **GitHub Actions**。推送到 `main` 後，`.github/workflows/pages.yml` 會部署 `dist`。

## 本機檢查

```bash
node scripts/build-static-bundle.mjs
node scripts/check-static-bundle.mjs
```
