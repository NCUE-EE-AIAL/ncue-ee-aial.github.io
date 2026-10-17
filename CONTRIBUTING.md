# 貢獻指南 / Contributing

## English summary

- This is the hand-over guide for the lab website of the AI Application Laboratory (人工智慧應用實驗室), Dept. of Electrical Engineering, NCUE. PI: Prof. Wen-Ren Yang. Live site: https://ncue-ee-aial.github.io/
- All content is plain files under `src/content/`. To add a paper, person, project, funded grant, award, FAQ entry, news post, research area or piece of equipment you add (or edit) **one file**, open a pull request to `main`, and GitHub Actions rebuilds and publishes the site in about 2 minutes.
- Event albums (`albums/<YYYY-MM>-<slug>/index.yaml` plus the photos) and the yearly group photo (`group-photos/<year>.yaml` plus the photo) are folders/files too. **Every photo goes through `npm run photos -- <files or folders> --out <folder> [--group]` before `git add`**: the repository is public, and a phone original with GPS stays in the history for good. Photos of people need everyone's consent (`consent` field). The page that shows albums goes live with the first album.
- English is the default (`/`), Traditional Chinese is at `/zh/`. Bilingual fields are `{ en, zh }`; a missing `zh` falls back to English.
- The Zod schemas in `src/content.config.ts` are the single source of truth for every field. A wrong or missing field makes `npm run build` fail and names the file.
- No git? Edit a file on github.com (pencil icon, then "Create a new branch and start a pull request"), or open the "Add a publication" issue form.
- Local preview: `npm ci`, `npm run dev` (http://localhost:4321), `npm run build`, `npm test`, `npm run links`.
- Lab rules: a paper is listed only if Wen-Ren Yang is an author; `verified: true` needs a `source` URL you actually opened; PDFs only for arXiv / accepted manuscripts (IEEE/IET: DOI only); no student personal emails; no portraits without consent; no hot-linked images; the industry-sponsored project and the battery sponsor are never named (`tests/privacy.test.mjs` enforces it); research pages describe problems and methods only; only public repos and published papers.
- Questions: ncueaial@gmail.com or a GitHub issue in `NCUE-EE-AIAL/ncue-ee-aial.github.io`.

---

## 目錄

1. [網站如何運作](#1-網站如何運作)
2. [四個最常做的操作](#2-四個最常做的操作)
3. [其他內容：研究方向、設備、計畫、相簿、照片](#3-其他內容研究方向設備計畫相簿照片)
4. [欄位對照表](#4-欄位對照表)
5. [實驗室內容規則](#5-實驗室內容規則)
6. [不用 git 也能修改](#6-不用-git-也能修改)
7. [本機預覽與檢查](#7-本機預覽與檢查)
8. [常見 build 錯誤解讀](#8-常見-build-錯誤解讀)
9. [誰在維護、去哪裡問](#9-誰在維護去哪裡問)

---

## 1. 網站如何運作

這是一個用 [Astro](https://astro.build) 建出來的靜態網站。**所有內容都是 `src/content/` 底下的純文字檔**（YAML 或 Markdown），不需要資料庫，也不需要改程式。

```
你新增 / 修改一個檔案  →  推到 main（或開 PR 並合併）  →  GitHub Actions「Deploy to GitHub Pages」自動 build  →  約 2 分鐘後上線
```

- 英文是預設語言，網址為 `/`；繁體中文在 `/zh/`，頁面結構完全相同。
- 雙語欄位寫成 `{ en, zh }`。**`zh` 可以不寫**，沒寫時中文頁會顯示英文內容（所以一定要有 `en`）。
- 欄位的唯一標準是 `src/content.config.ts`（Zod schema）。欄位寫錯、漏填，`npm run build` 會失敗並告訴你是哪個檔案（見[第 8 節](#8-常見-build-錯誤解讀)），不會把壞資料發佈出去。

### 內容檔與網頁的對應

| 資料夾 | 一個檔案 = | 顯示在 | 中文鏡像 |
|---|---|---|---|
| `src/content/research/<slug>/{en,zh}.md` | 一個研究方向（每種語言一個檔） | `/research/`（列表）與 `/research/<slug>/` | `/zh/research/`、`/zh/research/<slug>/` |
| `src/content/publications/<年>-<key>.yaml` | 一篇論文 | `/publications/` | `/zh/publications/` |
| `src/content/projects/<slug>.yaml` | 一個專案（程式 / 系統） | `/projects/`（頁名「計畫與專案」，在研究計畫之下） | `/zh/projects/` |
| `src/content/grants/<YYYY-MM>-<slug>.yaml` | 一個研究計畫（有經費補助的） | `/projects/`（進行中的卡片，之後是已結束的清單） | `/zh/projects/` |
| `src/content/people/<id>.yaml` | 一位成員 | `/people/`（指導教授、現任成員、國際學生、校友分組） | `/zh/people/` |
| `src/content/news/<YYYY-MM-DD>-<slug>/{en,zh}.md` | 一則動態（每種語言一個檔） | `/news/`（列表）與 `/news/<slug>/` | `/zh/news/`、`/zh/news/<slug>/` |
| `src/content/facilities/<id>.yaml` | 一項（或一類）設備 | `/join/#facilities`（加入我們頁的「設備」區） | `/zh/join/#facilities` |
| `src/content/theses/<學年度>-<handle>.yaml` | 一篇指導的碩士論文 | `/people/#theses`（成員頁最後一區，依學年度分組） | `/zh/people/#theses` |
| `src/content/honors/<YYYY-MM>-<slug>.yaml` | 一項獎項或榮譽 | `/people/`（「榮譽與獲獎」區）；若寫了 `publication`，該論文會多一個獎項標籤 | `/zh/people/` |
| `src/content/faq/<對象>-<slug>.yaml` | 一個常見問題 | `/join/`（加入與聯絡，依對象分組） | `/zh/join/` |
| `src/content/albums/<YYYY-MM>-<slug>/index.yaml` + 照片 | 一本活動相簿（活動相簿） | 「實驗室生活」頁（**尚未上線**，見[第 3 節](#活動相簿-albums)） | 同左 |
| `src/content/group-photos/<年>.yaml` + 照片 | 一年的團體合照 | 首頁（`/`）「關於實驗室」區，顯示最新的一張 | `/zh/` |

另外：專案卡片的 stars、主要語言、最後 push 時間，是 build 時用 GitHub API 向 `repo` 欄位指定的 repo 取得（離線時也能 build，只是沒有這些數字）。首頁（`/`）會自動帶出所有研究方向卡片、最新 3 篇論文、最近 12 個月內最新的 3 則動態（沒有就不顯示這一欄），以及「關於實驗室」區的介紹與 build 時自動計算的數字，不需要另外編輯。

研究計畫的「進行中」是 build 時依 `end` 判斷的，所以網站每週一會自動重建一次（見[第 7 節](#上線流程與每週重建)）。

---

## 2. 四個最常做的操作

> 通用小技巧：**複製一個現有檔案再改**，比從零寫安全。YAML 縮排一律用 **2 個空格**（不能用 Tab）；值裡有冒號 `:`、井號 `#` 或引號時，整段用雙引號包起來。

### 2.1 新增一篇論文

先確認符合[內容規則](#5-實驗室內容規則)：作者必須包含楊文然老師。

1. 在 `src/content/publications/` 新增 `<年>-<key>.yaml`，例如 `2026-emotion-as-distribution.yaml`。`key` 用小寫英文、數字、連字號。
2. 內容（可複製 `2024-two-step-auth.yaml` 修改）：

   ```yaml
   title:
     en: "Two-step Authentication: Multi-biometric System Using Voice and Facial Recognition"
     zh: "雙階段身分驗證：結合語音與人臉辨識的多生物特徵系統"
   authors:
     - Kuan Wei Chen
     - Wen Ren Yang
   venue: "IET International Conference on Engineering Technologies and Applications (ICETA 2024)"
   year: 2024
   type: conference          # journal | conference | thesis | preprint | other
   doi: "10.1049/icp.2024.4141"
   url: "https://digital-library.theiet.org/doi/abs/10.1049/icp.2024.4141"
   areas: [biometrics-security]
   verified: false           # 沒親自核對出版社頁面就維持 false
   ```
3. `verified: true` 只在你**真的打開了出版社頁面並核對標題、作者、年份**之後才寫，且必須同時填 `source`（那個頁面的網址）。`verified: false` 的論文會在頁面上顯示「待確認 / to verify」標記，這是正常的。
4. 在本機執行 `npm run build`（見[第 7 節](#7-本機預覽與檢查)），再開 PR。

### 2.2 新增成員

1. 在 `src/content/people/` 新增 `<id>.yaml`。**檔名（不含 `.yaml`）就是這個人的 id**，專案的 `members` 欄位用的就是它，所以請用穩定的小寫英文，例如 `ting-yi-lin.yaml`。之後不要隨便改檔名，否則要同步改所有專案裡的 `members`。
2. 內容：

   ```yaml
   name:
     en: "Ting-Yi Lin"
     zh: "林庭毅"
   role: master              # pi | phd | master | undergrad | intern | staff
   years: "2025–"
   areas: [biomedical-ai]
   bio:
     en: "M.S. student working on ..."
     zh: "碩士生，研究 ..."
   links:
     github: "https://github.com/your-name"
   order: 10                 # 數字小的排前面
   ```
3. 畢業或離開：加上 `alumni: true`，並把 `years` 改成 `"2022–2024"` 的形式。校友若同意公開現況，可加 `destination`（`en` / `zh` 兩種語言，例如「某公司工程師」），成員卡片上會顯示「現況：」；`destination` 只能用在校友（沒有 `alumni: true` 會 build 失敗），而且**一定要本人同意**。
4. **學生不要填 `links.email`**（schema 會直接擋下）。聯絡方式一律是實驗室信箱 ncueaial@gmail.com 或指導教授。
5. 要放照片請先讀[第 3 節的照片說明](#照片)與[內容規則](#5-實驗室內容規則)（需本人同意）。

### 2.3 新增專案

1. 在 `src/content/projects/` 新增 `<slug>.yaml`，例如 `patrolbot.yaml`。
2. 內容：

   ```yaml
   title:
     en: "PatrolBot"
     zh: "PatrolBot 自主巡邏系統"
   summary:
     en: "Design and construction of an autonomous patrol robot vehicle ..."
     zh: "設計並建置自主巡邏機器車 ..."
   repo: "NCUE-EE-AIAL/PatrolBot"    # 格式 owner/name，不是完整網址；必須是公開 repo
   areas: [international-programs]    # 至少一個
   year: 2023
   members: [ting-yi-lin]             # people/ 底下的檔名（不含 .yaml）
   status: active                     # active | archived
   ```
3. 沒有公開 repo 的專案可以省略 `repo`。`members` 裡的 id 必須真的存在於 `people/`；打錯時 build 會失敗，並指出是哪個專案檔、哪個 id。

### 2.4 新增動態（最新消息）

1. 建立資料夾 `src/content/news/<YYYY-MM-DD>-<slug>/`，例如 `2026-11-05-ieee-conference-accepted/`。
2. 資料夾內放 `en.md` 與 `zh.md`，內容各用該語言寫。**也可以只寫一種語言**（只有 `en.md` 或只有 `zh.md`）：另一個語言的網站會照樣顯示這則動態，並標註它的語言（「In Chinese」／「僅有英文」）。
3. 每個檔案長這樣：

   ```markdown
   ---
   title: "Paper accepted at ..."
   date: 2026-11-05
   summary: "One-sentence summary shown in the list."
   ---

   內文用 Markdown 寫。
   ```
   `date` 請用 `YYYY-MM-DD`，且要與資料夾名稱的日期一致。`title` 裡若有冒號，務必加雙引號。

---

## 3. 其他內容：研究方向、設備、計畫、相簿、照片

### 研究方向

- 檔案位置：`src/content/research/<slug>/en.md` 與 `zh.md`，各自有 front matter（`title`、`summary`、`icon`、`order`，其餘選填，見[欄位表](#研究方向-research)）。
- 修改既有方向：直接改這兩個檔。
- **新增一個全新的研究方向**，除了建立 `research/<新slug>/{en,zh}.md`，還必須把 slug 加進 `src/content.config.ts` 最上面的 `AREA_SLUGS`，否則論文 / 專案 / 成員的 `areas` 欄位不能使用它，build 會失敗。這是整個流程中唯一需要改程式檔的地方。方向名稱、首頁卡片與專案頁的篩選按鈕都會自動從 `en.md` / `zh.md` 的 front matter 產生，不需要改 `src/i18n/ui.ts`；`icon` 只能從 `camera` `arm` `heart` `shield` `globe` `chip` `bolt` 選一個。目前的 slug：`stereo-3d-vision` `robotic-arm` `biomedical-ai` `biometrics-security` `smart-grid-energy`（智慧電網與儲能）`international-programs`。
- 內容規則：只描述問題與方法，不寫未發表的細節（見第 5 節）。
- 有研究影片：把 YouTube 網址寫在 `video`；訪客點擊後才會載入，不會拖慢頁面。

### 設備

- `src/content/facilities/<id>.yaml`，一項或一類設備一個檔，只寫到「類別」層級，不要逐台列規格。
- 範例：

  ```yaml
  name:
    en: "X299 workstation server"
    zh: "X299 工作站伺服器"
  category: compute    # compute | fpga | edge | sensor | robot | other
  qty: 1               # 選填
  order: 2
  ```
- 顯示在 `/join/#facilities`。
- 選填 `photo`（照片放在 YAML 旁邊；格式見下方[照片](#照片)）。照片裡不要有人，也不要拍到有個人資料的螢幕。

### 指導的碩士論文

- `src/content/theses/<學年度>-<handle>.yaml`，一篇論文一個檔，例如 `113-eums9d.yaml`（`handle` 是永久網址最後一段）。顯示在 `/people/#theses`，依學年度由新到舊分組，最新三個學年度直接展開，其餘收在「顯示更早的論文」裡。
- 欄位：`student`（`zh` 必填，`en` 選填）、`degree`（`master` 或 `phd`）、`ay`（民國學年度，整數，例如 `113`）、`dept`（選填，只有系所不是電機工程學系時才寫，例如 `"資訊工程學系"`）、`title`（`zh` 必填，`en` 選填）、`coAdvisors`（選填，除楊文然以外的指導教授，中文姓名清單，不含「博士」）、`url`（必填，`https://hdl.handle.net/11296/<handle>`）。
- 所有資料只從臺灣博碩士論文知識加值系統（NDLTD）該筆論文的詳細頁抄錄，`url` 用頁面上的「論文永久網址」。不要自己翻譯題名。`title.en` 照紀錄原文，只去掉頭尾空白與結尾句點；紀錄沒有英文題名就不要寫 `title.en`。
- 不放學生的 email 與照片。
- **`student.en` 的規則**：只有當紀錄上的「研究生」欄位本身不是中文字，或是外國姓名的音譯時，才把該紀錄的「外文」姓名抄進 `student.en`（例如 `student.zh: "羅倪可"` 對應 `en: "Nikola Radakovic"`，或紀錄寫成全大寫 `"MONICA"` 的國際生）。**絕不自己把中文姓名轉成羅馬拼音**（紀錄上的拼音不一致，我們不統一）。`student.zh` 沒有任何中文字且有 `student.en` 時，中英文頁都顯示 `student.en`（不會顯示全大寫的原始紀錄）。
- **`degree` 的用法**：`master` 的論文列在「指導碩士論文」（英文頁 "Master’s theses advised"）；`phd` 的論文另列在「指導博士論文」（"PhD dissertations advised"），只有存在博士論文時這一區才會出現，不需要改程式。每一區都依學年度由新到舊分組。
- **`ay` 的範圍**：民國學年度，最小 95，最大為「今年的民國年 + 1」（超出範圍 build 會失敗並說明）。

### 研究計畫 grants

- `src/content/grants/<YYYY-MM>-<slug>.yaml`，一個有經費補助的研究計畫一個檔，檔名前面是開始月份，例如 `2026-08-moe-chip-design-course.yaml`（可複製它當範例）。顯示在 `/projects/`（頁名「計畫與專案」）：進行中的計畫是卡片，已結束的排成清單。
- **「進行中」是 build 時依 `end` 判斷的**（`end` 那個月還算進行中），網站每週一重建一次，所以不需要手動搬動。
- 範例：

  ```yaml
  title:
    en: "Cross-Domain Smart Chip Design Course Promotion Program"
    zh: "跨域智慧晶片設計課程推廣計畫"
  sponsor: moe             # nsc | most | nstc | moe | industry | other
  start: "2026-08"         # YYYY-MM，一定要加引號
  end: "2027-07"
  role: co-pi              # pi | co-pi
  source: "誰、何時提供，或計畫公告的網址"
  ```
- 規則（schema 會檢查，見[第 8 節](#8-常見-build-錯誤解讀)）：
  - `sponsor` 是 `nsc` `most` `nstc` 時，名稱必須符合**開始月份**：2014-03 以前是 `nsc`（國科會），2014-03 到 2022-07 是 `most`（科技部），2022-07 起是 `nstc`（國科會）；而且一定要有 `number`，格式像 `112-2221-E-018-009-MY2`，**不含**機構前綴。
  - `sponsorName`（雙語）只能搭配 `sponsor: other`，例如縣市政府。
  - `source` 一定要填：網址，或「誰在什麼時候提供的」，之後才查得到來源。
  - **不寫經費金額**。
  - **產學計畫（`sponsor: industry`）絕不具名合作廠商**：不寫 `number`、`sponsorName`、`grb`，標題與摘要裡也不能有公司名稱（見[第 5 節規則 10](#5-實驗室內容規則)）。
- 選填：`areas`、`summary`、`grb`（政府研究資訊系統 GRB 上該計畫的網址）、`related.publications` / `related.theses`（對應論文與指導論文的檔名，不含 `.yaml`）。

### 活動相簿 albums

- 每場活動一個資料夾：`src/content/albums/<YYYY-MM>-<slug>/index.yaml`，照片放在**同一個資料夾**。
- 照片先用 `npm run photos` 處理（見下方[照片](#照片)），再寫進 YAML：

  ```yaml
  title:
    en: "Lab outing 2026"
    zh: "2026 實驗室出遊"
  date: 2026-11-02
  consent: people-agreed        # people-agreed | no-people
  consentBy: "Brian Lin, 2026-11-02"   # 選填：誰、何時徵得同意
  photos:
    - src: ./img-0001.jpg
      alt:
        en: "Members around a table"
        zh: "成員圍坐在桌邊"
  ```
- **每本相簿最多 12 張**（照片會永遠留在 repo 裡）。**每張照片都要有 `alt`，而且 `en` 與 `zh` 兩種語言都要寫**（給視障讀者；不能省略 `zh`）。
- `consent` 必填：`people-agreed` = 可辨識的人都同意上網；`no-people` = 照片裡沒有可辨識的人。
- 顯示相簿的「實驗室生活」頁（phase B）會**跟第一本相簿一起上線**，所以目前新增相簿檔案不會出現在網站上。

### 團體合照 group-photos

- `src/content/group-photos/<年>.yaml` 加上同資料夾的 `<年>.jpg`；一年一張。用 `npm run photos -- <檔案> --out src/content/group-photos --group`（長邊上限 2000 px）。
- 欄位：`year`、`photo`（`src`、`alt` 雙語必填，`caption` 選填）、`consent: people-agreed`（**必填**，照片裡每個人都同意上網）、`names`（選填，雙語，例如「前排左起：…」）。
- 最新一年的合照會顯示在首頁「關於實驗室」區。

### 榮譽與獲獎 honors

- `src/content/honors/<YYYY-MM>-<slug>.yaml`，一個獎項一個檔。顯示在成員頁（`/people/`）的「榮譽與獲獎」區；若 `publication` 指向某篇論文，該論文旁會多一個標籤。
- `source` 必填（頒獎單位的公告網址，或誰何時提供）。`recipients` 填 `people/` 的 id；沒有成員檔的得獎人寫在 `recipientNames`。
- 目前還沒有任何榮譽檔：build 時看到 `The collection "honors" does not exist or is empty` 是正常的警告（見[第 8 節](#8-常見-build-錯誤解讀)），加入第一個檔後就會消失。

### 常見問題 faq

- `src/content/faq/<對象>-<slug>.yaml`，一個問題一個檔，顯示在 `/join/`（加入與聯絡），依 `audience` 分組：`master`（碩士）、`undergrad`（大學部）、`intl`（國際生）、`all`（所有人）。
- `order` 小的排前面。`source` 選填，但建議寫（答案的出處，之後才能核對）。可複製 `intl-skills.yaml` 修改。

### 照片

- **所有照片一律先經過 `npm run photos`，再 `git add`**：

  ```sh
  npm run photos -- <檔案或資料夾> --out <輸出資料夾> [--group]
  # 例：npm run photos -- ~/Downloads/outing --out src/content/albums/2026-11-outing
  ```
  它會把長邊縮到 1600 px（加 `--group` 是 2000 px，給團體合照）、壓到 400 KB 以內，並**移除 EXIF 與 GPS**，檔名轉成小寫。
- **為什麼一定要先處理**：這個 repo 是公開的。手機原檔帶有 GPS 位置與拍攝資訊，一旦 commit，就算之後刪掉，仍會留在 git 歷史裡。
- HEIC（iPhone 預設格式）請先匯出成 JPEG 再處理。
- 有人入鏡的照片，**每個可辨識的人都要同意**（見[第 5 節規則 11](#5-實驗室內容規則)）。
- 相簿、團體合照、設備的照片放在 YAML 旁邊，用 `src: ./檔名.jpg` 引用（相對於那個 YAML），並附雙語 `alt`。路徑寫錯時，`npm run build` 會報錯（見[第 8 節](#8-常見-build-錯誤解讀)）。
- 成員大頭照維持原本的規則：放 `public/images/people/`，240×240 的 WebP，在 `people` 的 `photo` 用 `/images/people/檔名.webp`（開頭是 `/`、不含 `public`）。
- 研究頁的 `image` 仍放在 `public/images/research/` 之類的資料夾，用以 `/` 開頭、不含 `public` 的路徑引用，而且一定要同時寫 `imageAlt`。這些照片一樣要先跑 `npm run photos`。
- `tests/photos.test.mjs` 會檢查所有已 commit 的照片：有 metadata（EXIF / GPS）或太大就會失敗（見[第 8 節](#8-常見-build-錯誤解讀)）。
- **不要**直接引用別的網站上的圖片網址，也不要放沒有授權的圖片。

### 字體

- 網站用的 Inter 字體是自行託管的：`src/assets/fonts/inter-latin-wght.woff2` 與授權檔 `OFL.txt`。檔案取自 `npm pack @fontsource-variable/inter@5.3.0`（包裡的 `files/inter-latin-wght-normal.woff2` 與 `LICENSE`）。
- 網站不會從別的網站載入任何東西（沒有 Google Fonts 或其他外部資源）。

### 搜尋引擎資訊（SEO）

- JSON-LD 結構化資料與每個頁面的 description 都是自動產生的，不需要手動編輯。
- `public/apple-touch-icon.png` 由 `npm run icons` 從 `public/favicon.svg` 產生，**不要手動修改**；要改就改 `favicon.svg` 後重新執行。

### 背景插圖

- 頁首與卡片的背景線稿放在 `src/assets/art/*.svg`，由 `scripts/art-gen.mjs` **產生**：要改圖，請改這支 script 再執行 `npm run art`（會重寫全部 SVG）；直接改 SVG 會在下次執行時被蓋掉。
- 規格：頁首圖的 `viewBox` 為 `0 0 480 240`、`preserveAspectRatio="xMaxYMid meet"`；格狀卡片的填充圖（`opamp`、`chip`）為 `0 0 320 180`、`xMidYMid meet`（`404` 與 `bench` 是特例，照現有檔案）。
- 第一個元素是帶 `mask="url(#art-vignette)"` 的 `.dots` 矩形；`class` 只能用 `dots` `con` `dim` `ink` `thin` `sig` `key` `paper` `holes` `web` `node`。
- 不要寫顏色（`fill`、`stroke`、色碼、`style` 都不行），顏色由 `src/styles/global.css` 的 CSS 變數決定；每個元素都要有成對的結尾標籤（`<path ...></path>`，不能寫 `/>`）。
- 新研究方向要有自己的插圖：在 script 裡新增一張並在 `NOTES` 補一行說明，輸出為 `src/assets/art/<slug>.svg`（`<slug>` 與 `research/` 資料夾同名）；沒有這個檔案時，研究頁會自動改用通用的 `research` 插圖。
- 改完執行 `npm test`（檢查顏色、結尾標籤、檔案大小與 `npm run art` 的輸出是否與 SVG 一致；其餘規格要自己遵守）。

### 首頁動畫（hero）

- 首頁右側的輪播插圖是 `src/components/HeroArt.astro`，由 `scripts/hero-gen.mjs` **產生**：要改圖，請改這支 script 再執行 `npm run hero`（會重寫整個元件；也可加輸出路徑：`node scripts/hero-gen.mjs <檔案>`）；直接改 `HeroArt.astro` 會在下次執行時被蓋掉，`npm test` 也會因為兩者不一致而失敗。
- 新增或移除一個場景：在 script 的 `SCENES` 物件加（刪）一個函式，順序就是播放順序；然後 `src/styles/global.css` 裡「同一組數字」要一起改，設 N 為場景數、C 為 `--cycle`（20–30 秒），每個場景的時段 S = C ÷ N：
  - `.hero-art` 的 `--cycle: C`；
  - 第 k 個場景（`.scene:nth-child(k)`，k ≥ 2）的 `--at: -(C − (k − 1) × S)`（第 1 個不用設）；
  - `@keyframes hero-slot`：場景在時段結束（100 ÷ N %）淡出，淡出前 0.6 秒開始，所以「可見到」的百分比是 100 ÷ N − 0.6 ÷ C × 100（現為 17.86%），淡出結束為 100 ÷ N（20%），其後（20.01%）起隱藏；
  - `hero-fade`、`hero-draw`、`hero-trace`、`hero-pop` 四組 keyframes 的「釋放」百分比（結尾的 `20.5%, 20.6%`）要落在時段結束之後，即 ≥ 100 ÷ N %；
  - 每個元素的 `--dt`（`.t1`–`.t10`，每級 0.3 秒）加上它最慢動畫的完成點（以秒計：百分比 × C ÷ 100，例如 `hero-trace` 的 7.14%）必須在淡出開始之前結束，也就是 `最大 --dt + 完成點 ≤ (100 ÷ N − 0.6 ÷ C × 100) × C ÷ 100`（現為 3 + 2 = 5 秒 ≤ 5 秒）；
  - `tests/hero.test.mjs` 開頭的 `SCENES` 陣列（名稱與順序要和 script 一致）。
- 改完執行 `npm run build` 與 `npm test`（`tests/hero.test.mjs` 會檢查上面每一項是否彼此吻合）。
- `npm run verify:hero` 是選用的瀏覽器檢查（需要本機的 `google-chrome` 與 `python3`，**不**在 CI 或 `npm test` 裡執行）：先 `npm run build`，它會用無頭 Chrome 開 `dist/` 的首頁，檢查暫停按鈕、離開畫面時暫停、鍵盤操作、減少動態與無 JS 的狀態，並把 1280／390 px、淺色／深色下各場景的截圖放到暫存資料夾（路徑印在最後一行）。

### 網站標誌與圖示

- 頁首的標誌是 `src/components/Nav.astro` 裡的內嵌 SVG（座標為 32×32 的 `viewBox`）；要改標誌就改這段 SVG。
- `public/favicon.svg` 是同一個標誌放在主色底塊上。`public/apple-touch-icon.png` 是由它產生的（`npm run icons`），不要手動修改。
- `public/og.png` 是社群分享用的 1200×630 PNG，以手工編輯，沒有產生程式。要重做時，用 `design/logo/`（不會被網站發布）裡的來源 SVG（`c-signal-mark.svg`、`c-signal-favicon.svg`、`c-signal-lockup-en.svg`、`c-signal-lockup-zh.svg`）組合，並維持 1200×630 的尺寸。

---

## 4. 欄位對照表

「必填」欄：是 = 沒有就 build 失敗；否 = 可省略（括號為預設值）。`bi` 代表雙語物件：

```yaml
title:
  en: "必填"
  zh: "選填，沒寫就顯示 en"
```

### 論文 publications

檔案：`src/content/publications/<年>-<key>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | bi | `en: "Two-step Authentication ..."` | |
| `authors` | 是 | 字串清單，至少 1 位 | `- Wen Ren Yang` | 依發表順序；必須含楊文然老師（規則） |
| `venue` | 是 | 字串 | `"ICETA 2024, pp. 11-12"` | 期刊 / 會議全名，可含卷期頁碼 |
| `year` | 是 | 整數 1990–2100 | `2024` | 不要加引號 |
| `type` | 是 | `journal` `conference` `thesis` `preprint` `other` | `conference` | |
| `doi` | 否 | 字串 | `"10.1049/icp.2024.4141"` | 不含 `https://doi.org/` |
| `url` | 否 | 完整網址 | `"https://digital-library.theiet.org/..."` | 出版社頁面 |
| `pdf` | 否 | 字串（網址或站內路徑） | `"https://arxiv.org/pdf/2601.06218"` | 只限 arXiv / 作者接受稿 |
| `code` | 否 | 完整網址 | `"https://github.com/NCUE-EE-AIAL/..."` | 公開 repo |
| `tags` | 否（`[]`） | 字串清單 | `[face recognition, VGG16]` | 自由關鍵字 |
| `areas` | 否（`[]`） | 研究方向 slug 清單：`stereo-3d-vision` `robotic-arm` `biomedical-ai` `biometrics-security` `smart-grid-energy` `international-programs` | `[biometrics-security]` | 拼錯會 build 失敗 |
| `featured` | 否（`false`） | true / false | `true` | 保留欄位，目前頁面未使用（首頁固定顯示最新 3 篇） |
| `verified` | 否（`false`） | true / false | `true` | `false` 會顯示「待確認 / to verify」標記 |
| `source` | 條件必填 | 字串（網址或說明） | `"https://digital-library.theiet.org/... (opened; title, authors match)"` | **`verified: true` 時必填** |

### 成員 people

檔案：`src/content/people/<id>.yaml`（檔名 = id）

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `name` | 是 | bi | `en: "Ting-Yi Lin"` `zh: "林庭毅"` | |
| `role` | 是 | `pi` `phd` `master` `undergrad` `intern` `staff` | `master` | |
| `program` | 否 | `TEEP` `IIPP` | `TEEP` | 國際交流計畫（如有） |
| `alumni` | 否（`false`） | true / false | `true` | 畢業或離開 |
| `years` | 否 | 字串 | `"2025–"`、`"2022–2024"` | 含 `–` 請加引號 |
| `areas` | 否（`[]`） | 研究方向 slug 清單 | `[biomedical-ai]` | |
| `bio` | 否 | bi | `en: "M.S. student ..."` | 簡短、僅寫公開資訊 |
| `photo` | 否 | 字串，路徑 | `/images/people/ting-yi.webp` | 檔案放 `public/images/people/`（240×240 WebP）；需本人同意 |
| `links.github` | 否 | 完整網址 | `"https://github.com/brian10420"` | |
| `links.scholar` | 否 | 完整網址 | | Google Scholar |
| `links.linkedin` | 否 | 完整網址 | | |
| `links.website` | 否 | 完整網址 | | 個人網站 |
| `links.orcid` | 否 | 必須符合 `https://orcid.org/0000-0000-0000-0000` | `"https://orcid.org/0000-0002-1825-0097"` | 四組各 4 碼，最後一碼可為 `X`；不是只寫數字 |
| `links.email` | 否 | email | `"wry87c@cc.ncue.edu.tw"` | **僅限 `role: pi` 或 `staff`**，學生填了會 build 失敗 |
| `destination` | 否 | bi | `en: "Engineer, ..."` `zh: "...工程師"` | **僅限校友**（要有 `alumni: true`）；一定要本人同意；卡片上顯示為「現況：」 |
| `order` | 否（`100`） | 整數 | `10` | 小的排前面（PI 是 1） |

### 專案 projects

檔案：`src/content/projects/<slug>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | bi | | |
| `summary` | 是 | bi | | 一兩句話 |
| `areas` | 是 | 研究方向 slug 清單，**至少 1 個** | `[international-programs]` | |
| `repo` | 否 | `owner/name`（英數、`_`、`.`、`-`） | `"NCUE-EE-AIAL/PatrolBot"` | 不是完整網址；公開 repo；用來抓 stars / 語言 / 最後 push |
| `year` | 否 | 整數 | `2023` | |
| `members` | 否（`[]`） | people 的 id 清單 | `[ting-yi-lin]` | 檔名（不含 `.yaml`）；不存在的 id 會讓 build 失敗 |
| `links.demo` | 否 | 完整網址 | | |
| `links.video` | 否 | 完整網址（YouTube） | | 點擊後才載入 |
| `links.paper` | 否 | 字串 | | 對應論文的網址（或 DOI 連結） |
| `status` | 否（`active`） | `active` `archived` | `archived` | |
| `featured` | 否（`false`） | true / false | | 精選：專案頁中排在同狀態（active / archived）的專案前面 |

### 動態 news

檔案：`src/content/news/<YYYY-MM-DD>-<slug>/en.md`、`zh.md`（front matter + Markdown 內文）

| 欄位 | 必填 | 型別 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | 字串 | `"Lab website relaunched"` | 有冒號請加引號 |
| `date` | 是 | 日期 `YYYY-MM-DD` | `2026-10-17` | 不是日期格式會失敗 |
| `summary` | 否 | 字串 | | 列表顯示的一句話 |

### 研究方向 research

檔案：`src/content/research/<slug>/en.md`、`zh.md`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | 字串 | `"Robotic Arm Control"` | 這個檔的語言 |
| `summary` | 是 | 字串 | | 一句話摘要 |
| `icon` | 是 | `camera` `arm` `heart` `shield` `globe` `chip` `bolt` | `arm` | |
| `order` | 是 | 整數 | `2` | 小的排前面 |
| `keywords` | 否（`[]`） | 字串清單 | `["motion control"]` | |
| `image` | 否 | 以 `/` 開頭的路徑 | `/images/research/arm.jpg` | **有 `image` 就必須有 `imageAlt`** |
| `imageAlt` | 條件必填 | 字串 | `"A robotic arm picking a cube"` | 一句話描述圖片 |
| `video` | 否 | 完整網址（YouTube） | `"https://www.youtube.com/watch?v=..."` | 點擊才載入 |

### 設備 facilities

檔案：`src/content/facilities/<id>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `name` | 是 | bi | | 類別層級，不逐台列規格 |
| `category` | 是 | `compute` `fpga` `edge` `sensor` `robot` `other` | `compute` | |
| `qty` | 否 | 正整數 | `4` | |
| `note` | 否 | bi | | 補充說明 |
| `photo` | 否 | 物件：`src`（照片檔，相對於這個 YAML）、`alt`（雙語，**兩種語言都必填**）、`caption`（bi，選填） | `src: ./x299.jpg` | 照片放在 YAML 旁邊，先跑 `npm run photos`；不要有人入鏡 |
| `order` | 否（`100`） | 整數 | `1` | 小的排前面 |

### 研究計畫 grants

檔案：`src/content/grants/<YYYY-MM>-<slug>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | bi | | 產學計畫不可含公司名稱 |
| `sponsor` | 是 | `nsc` `most` `nstc` `moe` `industry` `other` | `moe` | `nsc` / `most` / `nstc` 必須符合 `start`（見下） |
| `sponsorName` | 否 | bi | `en: "Changhua County Government"` | **只能搭配 `sponsor: other`** |
| `number` | 條件必填 | 字串 | `"112-2221-E-018-009-MY2"` | `nsc` / `most` / `nstc` **必填**，不含機構前綴；`industry` 不可填 |
| `start` | 是 | `YYYY-MM`（加引號） | `"2026-08"` | |
| `end` | 是 | `YYYY-MM`（加引號） | `"2027-07"` | 不可早於 `start`；決定「進行中」或「已結束」 |
| `role` | 是 | `pi` `co-pi` | `co-pi` | |
| `areas` | 否（`[]`） | 研究方向 slug 清單 | `[smart-grid-energy]` | |
| `summary` | 否 | bi | | 產學計畫不可含公司名稱 |
| `grb` | 否 | 完整網址 | | GRB 上該計畫的紀錄；`industry` 不可填 |
| `related.publications` | 否（`[]`） | publications 的檔名清單（不含 `.yaml`） | `[2024-two-step-auth]` | 不存在的會讓 build 失敗 |
| `related.theses` | 否（`[]`） | theses 的檔名清單（不含 `.yaml`） | `[113-eums9d]` | 同上 |
| `source` | 是 | 字串（不可空白） | `"Brian Lin, 2026-10-18; MOE call for proposals: https://..."` | 網址，或誰在何時提供 |

沒有經費欄位，**不要寫金額**。

### 活動相簿 albums

檔案：`src/content/albums/<YYYY-MM>-<slug>/index.yaml`（照片在同一資料夾）

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | bi | | |
| `date` | 是 | 日期 `YYYY-MM-DD` | `2026-11-02` | |
| `summary` | 否 | bi | | |
| `cover` | 否 | 照片檔路徑 | `./img-0001.jpg` | 沒寫就用第一張 |
| `photos` | 是 | 清單，**1 到 12 張** | | 每一項有下面三個欄位 |
| `photos[].src` | 是 | 照片檔路徑（相對於 YAML） | `./img-0001.jpg` | 檔案不存在 build 會失敗 |
| `photos[].alt` | 是 | 雙語物件，**`en` 與 `zh` 都必填** | | 給視障讀者的一句話描述 |
| `photos[].caption` | 否 | bi | | |
| `consent` | 是 | `people-agreed` `no-people` | `people-agreed` | 見規則 11 |
| `consentBy` | 否 | 字串 | `"Brian Lin, 2026-11-02"` | 誰、何時徵得同意 |

### 團體合照 group-photos

檔案：`src/content/group-photos/<年>.yaml`（照片在同一資料夾）

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `year` | 是 | 整數，2006 到今年 | `2026` | 不要加引號 |
| `photo.src` | 是 | 照片檔路徑（相對於 YAML） | `./2026.jpg` | 用 `npm run photos -- ... --group` 處理 |
| `photo.alt` | 是 | 雙語物件，**`en` 與 `zh` 都必填** | | |
| `photo.caption` | 否 | bi | | |
| `names` | 否 | bi | `en: "Front row, from left: ..."` | 人名說明 |
| `consent` | 是 | 只能是 `people-agreed` | `people-agreed` | 照片裡每個人都同意上網 |

### 榮譽 honors

檔案：`src/content/honors/<YYYY-MM>-<slug>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | bi | | 獎項名稱 |
| `by` | 是 | bi | | 頒獎單位或活動 |
| `date` | 是 | 日期 `YYYY-MM-DD` | `2026-10-20` | |
| `recipients` | 否（`[]`） | people 的 id 清單 | `[ting-yi-lin]` | 不存在的 id 會讓 build 失敗 |
| `recipientNames` | 否（`[]`） | 字串清單 | `["林庭毅"]` | 沒有成員檔的得獎人，照獎狀上的寫法 |
| `publication` | 否 | publications 的檔名（不含 `.yaml`） | `2024-two-step-auth` | 該論文會多一個獎項標籤 |
| `url` | 否 | 完整網址 | | |
| `source` | 是 | 字串（不可空白） | | 網址，或誰在何時提供 |

### 常見問題 faq

檔案：`src/content/faq/<對象>-<slug>.yaml`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `audience` | 是 | `master` `undergrad` `intl` `all` | `intl` | 顯示在 `/join/` 的哪一組 |
| `q` | 是 | bi | | 問題 |
| `a` | 是 | bi | | 答案 |
| `order` | 否（`100`） | 整數 | `20` | 小的排前面 |
| `source` | 否 | 字串 | | 答案的出處，建議寫 |

### 兩個容易被忽略的地方

- **欄位名拼錯或多寫一個 schema 沒有的欄位，build 會直接失敗**（訊息是 `Unrecognized key: "featurd"`）。需要新欄位請找維護者改 `src/content.config.ts`。
- 清單縮排不整齊仍可能**不報錯但內容被黏在一起**（論文的 `authors` 有特別檢查，其他清單沒有；見[第 8 節](#8-常見-build-錯誤解讀)的第 12 項）。

---

## 5. 實驗室內容規則

以下是實驗室的政策，不是建議。PR 審核時會逐項確認。

1. **論文**：只有楊文然（Wen-Ren Yang，楊文然老師）為作者之一的論文才收錄。
2. **`verified: true`**：沒有 `source`（你實際打開過的出版社頁面網址）絕不可設為 `true`。沒核對就保持 `false`。
3. **PDF**：只能連 arXiv 或作者接受稿（accepted manuscript）。IEEE / IET 等出版社版本只放 DOI 連結，不放 PDF。
4. **學生個人 email 不公開**：聯絡請寄實驗室信箱 ncueaial@gmail.com 或指導教授；`links.email` 僅限 PI 與 staff。
5. **人像照片**：沒有本人同意，不放肖像照（相簿與合照見規則 11）。所有照片先用 `npm run photos` 處理，去掉 GPS 與 EXIF。
6. **圖片**：不得外連其他網站的圖片（hot-link）；檔案一律放進 `public/`。也要確認有權使用該圖片。
7. **研究頁**只寫「問題與方法」；不寫尚未發表的進行中細節、資料集、模型設定。
8. **只列公開的 repo 與已公開的論文**（已發表，或已有 arXiv 等公開版本）。私有 repo 不放進專案；沒有公開版本的投稿中論文不要列入。
9. **影片**：把 YouTube 網址放在 `video`（專案則為 `links.video`）；它只在訪客點擊後才載入。
10. **產學計畫與電池贊助商一律不具名**：網站與 repo 的任何地方都不寫他們與合作夥伴的名稱。`tests/privacy.test.mjs` 會掃描 repo 裡的每個文字檔與建好的網站（`dist/`），名稱只以雜湊值（長度、32 位元雜湊、sha256）存在測試裡，repo 內沒有明文。要把另一個名稱加入黑名單，又不想把它寫進 repo：
    1. 在終端機執行下面的指令（最後的 `"名稱"` 換成要擋的名稱；比對時不分大小寫與重音符號）：

       ```sh
       node -e 'const {createHash}=require("node:crypto");const n=process.argv[1].normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[øØ]/g,"o").toLowerCase();let h=0;for(let i=0;i<n.length;i++)h=(Math.imul(h,0x01000193)+n.charCodeAt(i))>>>0;console.log(`  [${n.length}, 0x${h.toString(16).padStart(8,"0")}, "${createHash("sha256").update(n).digest("hex")}"],`)' "名稱"
       ```
    2. 把印出來的那一行（例如 `  [5, 0x050e5aba, "676c…"],`）原樣貼進 `tests/privacy.test.mjs` 的 `DENY` 陣列，放在最後一項之後，再跑 `npm test` 確認通過。
    3. 名稱本身不要寫在 commit 訊息、PR 或 Issue 裡。
11. **相簿與合照必須取得入鏡者同意**：每本相簿要填 `consent`（`people-agreed` = 可辨識的人都同意上網；`no-people` = 沒有可辨識的人，`consentBy` 建議寫誰何時徵得同意）；團體合照一定是 `consent: people-agreed`。沒填，或不是這兩個值，build 會失敗。

---

## 6. 不用 git 也能修改

**方法 A：直接在 github.com 上改檔**

1. 打開 repo `NCUE-EE-AIAL/ncue-ee-aial.github.io`，進到要改的檔案（例如 `src/content/people/ting-yi-lin.yaml`）。
2. 點右上角的**鉛筆圖示**（Edit this file）。
3. 改完，按 Commit changes，選 **「Create a new branch for this commit and start a pull request」**（建立新分支並發起 PR）。
4. 填好 PR 範本的檢查清單。維護者核對後合併，網站約 2 分鐘後更新。

新增檔案：在資料夾頁面按 **Add file → Create new file**，檔名欄輸入完整路徑（例如 `src/content/news/2026-11-05-xxx/en.md`），其餘同上。

**方法 B：論文用 Issue 表單**

到 Issues → New issue → **「Add a publication / 新增論文」**，填表送出，會有實驗室成員幫你建檔。

> 開 PR 後，GitHub 會自動執行「Check site」（build、測試、站內連結檢查，約 2 分鐘）。PR 頁面下方若顯示紅色叉叉，點 Details 看錯誤訊息，對照[第 8 節](#8-常見-build-錯誤解讀)修正；出現綠色勾勾才合併。

---

## 7. 本機預覽與檢查

需要 Node.js **22.22 以上**與 git。

```sh
git clone https://github.com/NCUE-EE-AIAL/ncue-ee-aial.github.io.git
cd ncue-ee-aial.github.io
npm ci              # 第一次（或 package-lock.json 有變動時）
npm run dev         # 開發伺服器 http://localhost:4321 ，存檔後自動更新
npm run build       # 型別檢查 (astro check) + 建置到 dist/ ；錯誤會在這裡出現
npm test            # 執行 tests/ 的測試（需先 npm run build）
npm run links       # 檢查 dist/ 的連結（需先 npm run build）
```

- `npm run links` 等同 `node scripts/check-links.mjs dist`。**ERROR**（內部連結或圖片不存在、外部網址 404/410）必須修；**WARNING**（`#錨點`找不到、外部網站 403/429/5xx 或連不上）請看一下，通常是對方網站擋機器人，可以忽略。只想檢查站內連結：`node scripts/check-links.mjs dist --no-external`。
- 想只驗證內容欄位（比 build 快）：`npx astro sync`。
- 專案卡片的 stars 等數字來自 GitHub API：沒有 token 時每小時約可 build 8 次，超過時 build 仍會成功，只是卡片沒有數字，終端機會出現 `[github] ... HTTP 403` 之類的警告。`npm test` 中檢查 stars 的那一項在沒有設定 `GITHUB_TOKEN` 時會自動略過（CI 會檢查）。
- 照片：`npm run photos -- <檔案或資料夾> --out <資料夾> [--group]`（見[第 3 節](#照片)）。
- 流程：`git checkout -b add-paper-xxx` → 改檔 → `npm run build` → `git add` / `git commit` / `git push` → 在 GitHub 開 PR。

### 上線流程與每週重建

- 每次推到 `main`（包括在 github.com 上直接改檔）都會先執行 **build、`npm test`、站內連結檢查**，全部通過才會部署。所以只要有一項失敗，網站就**不會更新**：到 repo 的 **Actions** 分頁，點進紅色叉叉的那次執行，看是哪一步失敗，再對照[第 8 節](#8-常見-build-錯誤解讀)。
- 網站**每週一台北時間 05:17 也會自動重建一次**，讓依日期決定的內容自己更新（首頁最近 12 個月的動態、研究計畫的「進行中」、GitHub stars 等）。
- GitHub 在 repo **連續 60 天沒有 commit** 時會停用排程的 workflow，並寄信給最後一位 committer。收到通知時：到 **Actions** 分頁，選「Deploy to GitHub Pages」，按 **Enable workflow**；或推任何一個 commit 也可以。

---

## 8. 常見 build 錯誤解讀

以下訊息都是在拋棄式的複本裡故意把一個欄位弄壞、實際執行 `npx astro sync` 得到的原文（只擷取關鍵行）。`npm run build` 會顯示同樣的訊息。**第一行 `[...Error]` 加上 `publications → 檔名` 告訴你是哪個檔案**；`Location:` 的行號對 schema 錯誤永遠是 `:0:0`，不用理它。

### 1. `verified: true` 卻沒有 `source`

```
[InvalidContentEntryDataError] publications → 2024-two-step-auth data does not match collection schema.
  ****: verified: true requires a source URL
```
修正：補上 `source: "出版社頁面網址"`；如果你其實沒核對過，改成 `verified: false`。

### 2. 研究方向 slug 拼錯（`areas`）

```
[InvalidContentEntryDataError] publications → 2024-two-step-auth data does not match collection schema.
  areas.0: Invalid option: expected one of "stereo-3d-vision"|"robotic-arm"|"biomedical-ai"|"biometrics-security"|"smart-grid-energy"|"international-programs"
```
`areas.0` 表示清單的第 1 個（從 0 起算）。修正：照訊息列出的選項改。如果是要新增研究方向，見[第 3 節](#研究方向)的 `AREA_SLUGS`。同樣格式的 `type: Invalid option: expected one of ...`、`icon: Invalid option ...` 也是改成列出的其中一個。

### 3. 網址格式不對

```
[InvalidContentEntryDataError] publications → 2024-two-step-auth data does not match collection schema.
  url: Invalid URL
```
修正：網址要完整，含 `https://`（我們故意把它刪掉測試）。欄位名在訊息裡（`url`、`code`、`links.github` ...）。

### 4. 學生填了 `links.email`

```
[InvalidContentEntryDataError] people → brian-lin data does not match collection schema.
  ****: links.email is only for the PI or staff; students are contacted through the lab email
```
修正：刪掉 `email` 那一行。

### 5. ORCID 格式錯誤

```
[InvalidContentEntryDataError] people → wen-ren-yang data does not match collection schema.
  links.orcid: orcid must look like https://orcid.org/0000-0002-1825-0097
```
修正：寫成完整網址 `https://orcid.org/0000-0000-0000-0000`（只貼數字不行）。

### 6. 漏填必填欄位（或欄位名拼錯）

```
publications → 2024-two-step-auth data does not match collection schema.
  year**: **year: Required
```
把 `Venue:` 大小寫寫錯，會同時得到 `Unrecognized key: "Venue"` 與 `venue: Required`。修正：補上欄位，注意 YAML 的欄位名**區分大小寫**。

### 7. 型別不對

```
  year**: **year: Expected type `"number"`, received `"string"`
  name**: **name: Expected type `"object"`, received `"string"`
  date**: **date: Expected type `"date"`, received `"object"`
```
- `year: "2024"` 加了引號變成字串，拿掉引號。
- `name: "Ting-Yi Lin"` 應該寫成 `name:` 底下縮排 `en:` / `zh:` 的雙語物件。
- 動態的 `date: soon` 要改成 `2026-11-05` 這種 `YYYY-MM-DD`。

### 8. `repo` 寫成完整網址

```
[InvalidContentEntryDataError] projects → patrolbot data does not match collection schema.
  repo: Invalid string: must match pattern /^[\w.-]+\/[\w.-]+$/
```
修正：只寫 `owner/name`，例如 `NCUE-EE-AIAL/PatrolBot`，不要 `https://github.com/`。

### 9. `image` 沒有 `imageAlt`

```
[InvalidContentEntryDataError] research → robotic-arm/en data does not match collection schema.
  ****: image needs imageAlt (a one-line description for screen readers)
```
修正：補一行 `imageAlt: "一句話描述圖片"`。

### 10. YAML 本身語法錯誤（引號沒配對）

```
[DataCollectionEntryParseError] publications/2024-two-step-auth.yaml failed to parse: Unexpected scalar at node end at line 10, column 14:
venue: "IET "quoted"  International Conference ...
```
這類錯誤會直接指出**行號與欄位**。常見原因：雙引號字串裡又有雙引號（改用 `'單引號'` 包整段，或把內部引號拿掉）。

### 11. Markdown front matter 裡有冒號

```
Nested mappings are not allowed in compact mappings at line 2, column 8:
title: Lab: website relaunched
Location: .../news/2026-10-17-new-website/en.md:1:7
```
修正：含冒號的標題要加雙引號：`title: "Lab: website relaunched"`。

### 12. 不會報錯、但結果不對的情況（請小心）

欄位名拼錯、多寫欄位、`title` 底下的 `zh:` 少縮排而變成頂層欄位，現在都會 build 失敗（`Unrecognized key`）。仍會**通過 build** 的是清單縮排不一致：

```yaml
keywords:
  - stereo vision
   - depth estimation   # 多了一個空格
```
會被解讀成一個關鍵字 `stereo vision - depth estimation`。論文的 `authors` 有特別檢查（名字裡出現 ` - ` 會報錯：`an author contains " - "`），其他清單沒有。

預防方式：複製現有檔案再改、縮排只用 2 的倍數的空格，並在 `npm run dev` 預覽頁面目視確認。

### 13. 研究計畫的 `end` 早於 `start`

```
[InvalidContentEntryDataError] grants → 2026-08-moe-chip-design-course data does not match collection schema.
  ****: end is before start
```
修正：`start` 與 `end` 都是 `"YYYY-MM"`，`end` 不可早於 `start`。

### 14. 計畫機構（nsc / most / nstc）與開始月份不符

```
  ****: sponsor must match the start month: nsc until 2014-03, most from 2014-03 to 2022-07, nstc from 2022-07
```
修正：`sponsor` 依 `start` 填：2014-03 以前 `nsc`，2014-03 到 2022-07 `most`，2022-07 起 `nstc`（這兩個換名的月份兩個名稱都可以）。

### 15. 計畫編號格式不對（或沒填）

```
  ****: NSC/MOST/NSTC grants need a number like 112-2221-E-018-009-MY2 (without the agency prefix)
```
修正：`nsc` / `most` / `nstc` 的計畫一定要有 `number`，格式像 `"112-2221-E-018-009-MY2"`，前面不要加「NSTC」「MOST」之類的機構名稱。

### 16. `sponsorName` 用在 `other` 以外

```
  ****: sponsorName is only for sponsor: other
```
修正：刪掉 `sponsorName`，或把 `sponsor` 改成 `other`。

### 17. 產學計畫寫了合作廠商

```
  ****: industry projects never name the partner: no number, sponsorName or grb
  ****: industry projects never name the partner: take the company name out of the title and summary
```
第一則：`sponsor: industry` 的計畫不可有 `number`、`sponsorName`、`grb`，全部刪掉。第二則：標題或摘要裡出現公司名稱的字樣（如「公司」「有限公司」「Co.」「Ltd」「Inc.」），改成不具名的描述（見[規則 10](#5-實驗室內容規則)）。

### 18. 相簿超過 12 張

```
[InvalidContentEntryDataError] albums → 2026-11-outing data does not match collection schema.
  photos: at most 12 photos per album: they stay in the repository for good
```
修正：挑出最多 12 張，其餘不要放進相簿資料夾。

### 19. 沒有 `consent`

```
[InvalidContentEntryDataError] albums → 2026-11-outing data does not match collection schema.
  consent: consent is required: people-agreed or no-people
```
修正：相簿補上 `consent: people-agreed` 或 `consent: no-people`（見[規則 11](#5-實驗室內容規則)）。團體合照的對應訊息是 `consent: people-agreed (everyone in the photo agreed to be online)`，只能填 `people-agreed`。

### 20. `destination` 沒有 `alumni: true`

```
[InvalidContentEntryDataError] people → ting-yi-lin data does not match collection schema.
  ****: destination is for alumni: add alumni: true
```
修正：`destination` 只給校友；確定這個人已畢業並同意公開現況後，加上 `alumni: true`，否則刪掉 `destination`。

### 21. 照片漏了 `alt`（或只寫一種語言）

```
[InvalidContentEntryDataError] albums → 2026-11-outing data does not match collection schema.
  photos.0.alt.zh**: **photos.0.alt.zh: Required
```
修正：`alt` 要同時有 `en` 與 `zh`（相簿、合照、設備的照片都一樣）。`photos.0` 表示清單的第 1 張（從 0 起算）。

### 22. 找不到照片檔

```
[ImageNotFound] Could not find requested image `./nope.jpg`. Does it exist?
  Hint:
    This is often caused by a typo in the image path. Please make sure the file exists, and is spelled correctly.
```
修正：YAML 的 `src` 是**相對於那個 YAML 檔**的路徑（`./檔名.jpg`），檢查檔名拼字，並確認 `npm run photos` 輸出到了同一個資料夾（它會把檔名轉成小寫）。這個錯誤在 `npm run build` 才會出現，`npx astro sync` 看不到。

### 23. 警告：`The collection "honors" does not exist or is empty`

這只是警告，不是錯誤，build 仍會成功：`honors/` 還沒有任何檔案。加入第一個榮譽檔之後就會消失。

### 24. `tests/privacy.test.mjs` 或 `tests/photos.test.mjs` 失敗

- `privacy.test.mjs`：`remove the sponsor's or partner's name from: <檔案清單>`。表示列出的檔案（或 `dist/` 裡建出來的檔案）含有不可公開的名稱。把名稱從那些檔案刪掉（不要在 commit 訊息或 PR 裡重複它），再重新 build 與測試（見[規則 10](#5-實驗室內容規則)）。
- `photos.test.mjs`：訊息會指出是哪張照片，例如 `carries metadata: run it through `npm run photos``（照片還帶著 EXIF / GPS）、格式不是 JPEG / PNG / WebP，或超過 400 KB，或長邊超過上限（一般照片 1600 px，團體合照 2000 px）。修正：把原始照片重新跑一次 `npm run photos`，用輸出的檔案取代。**如果這張照片已經 commit 並推上去**，GPS 仍留在 git 歷史裡，請立刻通知維護者處理。

### 其他

- `npm run build` 的第一步是 `astro check`（型別檢查）。如果錯誤訊息指向 `.astro` / `.ts` 檔，而不是 `src/content/` 的檔案，那是程式問題而非內容問題，請找維護者。

---

## 9. 誰在維護、去哪裡問

- 網站由實驗室成員共同維護，指導教授：楊文然老師。**網站不屬於任何單一學生**；畢業前請確認你負責的內容已交接，並確保 GitHub 組織 `NCUE-EE-AIAL` 至少有兩位 owner。
- 問題與討論：實驗室信箱 **ncueaial@gmail.com**，或在 GitHub 開 Issue（repo：`NCUE-EE-AIAL/ncue-ee-aial.github.io`）。
- 網站上的線上版：https://ncue-ee-aial.github.io/（英文）、https://ncue-ee-aial.github.io/zh/（繁體中文）。
