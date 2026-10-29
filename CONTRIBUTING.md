# 貢獻指南 / Contributing

## English summary

- This is the hand-over guide for the lab website of the AI Application Laboratory (人工智慧應用實驗室), Dept. of Electrical Engineering, NCUE. PI: Prof. Wen-Ren Yang. Live site: https://ncue-ee-aial.github.io/
- All content is plain files under `src/content/`. To add a paper, person, project, funded grant, award, FAQ entry, news post, research area or piece of equipment you add (or edit) **one file**, open a pull request to `main`, and GitHub Actions rebuilds and publishes the site in about 2 minutes.
- Event albums (`albums/<YYYY-MM>-<slug>/index.yaml` plus the photos) and the yearly group photo (`group-photos/<year>.yaml` plus the photo) are folders/files too. **Every photo goes through `npm run photos -- <files or folders> --out <folder> [--group | --headshot]` before `git add`** (`--headshot` makes the 240×240 WebP for `public/images/people/`): the repository is public, and a phone original with GPS stays in the history for good. Photos of people need everyone's consent (`consent` field). The page that shows albums goes live with the first album.
- English is the default (`/`), Traditional Chinese is at `/zh/`. Bilingual fields are `{ en, zh }`; a missing `zh` falls back to English.
- The Zod schemas in `src/content.config.ts` are the single source of truth for every field. A wrong or missing field makes `npm run build` fail and names the file.
- New members and alumni fill in one Google Form (one page per group: EE graduate students, undergraduate project students, TEEP / IIPP, IMPE, alumni). Link, owner account and the answer-to-YAML table are in §3 「新成員資料表」; `scripts/newcomer-form.gs` rebuilds the form.
- No git? Edit a file on github.com (pencil icon, then "Create a new branch and start a pull request"), or use an issue form (publication, news post, member, project).
- Weekly automation: a pull request with papers found on ORCID / Crossref (`scripts/pubs-sync.mjs`, check them before merging) and an issue when outside links break. Search Console, GoatCounter and a custom domain are set up once in `src/i18n/ui.ts` (section 10).
- Local preview: `npm ci`, `npm run dev` (http://localhost:4321), `npm run build`, `npm test`, `npm run links`.
- Lab rules: a paper is listed only if Wen-Ren Yang is an author; `verified: true` needs a `source` URL you actually opened; PDFs only for arXiv / accepted manuscripts (IEEE/IET: DOI only); no student personal emails; no portraits without consent; no hot-linked images; industry partners and the battery sponsor are never named (`tests/privacy.test.mjs` enforces it); research pages describe problems and methods only; only public repos and published papers.
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
10. [搜尋引擎、瀏覽統計與自訂網域](#10-搜尋引擎瀏覽統計與自訂網域)

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
| `src/content/people/<id>.yaml` | 一位成員 | `/people/`（指導教授、現任成員、國際學生、歷屆成員分組） | `/zh/people/` |
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

**自動找新論文**：每週一，workflow「Suggest new publications」會用 `scripts/pubs-sync.mjs` 到老師的 ORCID 與 Crossref 找網站上還沒有的論文，替每篇建一個 `verified: false` 的檔案，開成一個 PR「New publications to check」。收到時逐篇打開出版社頁面核對、補上 `areas`，改成 `verified: true` 並填 `source` 後再合併。不該列出的論文：刪掉那個檔案，並把 DOI 加進 `scripts/pubs-sync-ignore.txt`，之後就不會再被找出來。本機想先看會找到什麼：`node scripts/pubs-sync.mjs --dry-run`。開 PR 需要兩個設定都打開：組織 NCUE-EE-AIAL 的 Settings → Actions → General → Workflow permissions 勾選「Allow GitHub Actions to create and approve pull requests」（只有組織 owner 能改），repo 的同一個位置也要勾選；沒打開時 workflow 會在「Open or update the pull request」這一步失敗，論文只會留在 `bot/new-publications` 分支上。

### 2.2 新增成員

新成員和畢業學長姐的資料先用 [新成員資料表（Google 表單）](#新成員資料表google-表單) 收，再依回覆建檔。

1. 在 `src/content/people/` 新增 `<id>.yaml`。**檔名（不含 `.yaml`）就是這個人的 id**，專案的 `members` 欄位用的就是它，所以請用穩定的小寫英文，例如 `brian-lin.yaml`。id 不必等於英文姓名（`brian-lin.yaml` 的 `name.en` 是 Ting-Yi Lin）。之後不要隨便改檔名，否則要同步改所有專案裡的 `members`。
2. 內容：

   ```yaml
   name:
     en: "Ting-Yi Lin"
     zh: "林庭毅"
   role: master              # pi | phd | master | undergrad | intern | staff
   years: "2025–"
   areas: [biomedical-ai]
   bio:
     en: "Master’s student working on ..."
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
   tagline:                           # 選填：一句外行人也看得懂的白話說明，顯示在技術摘要上方
     en: "A small robot car that patrols on its own ..."
     zh: "會自己巡邏的機器小車 ..."
   summary:
     en: "Design and construction of an autonomous patrol robot vehicle ..."
     zh: "設計並建置自主巡邏機器車 ..."
   repo: "NCUE-EE-AIAL/PatrolBot"    # 格式 owner/name，不是完整網址；必須是公開 repo
   areas: [international-programs]    # 至少一個
   year: 2023
   members: [brian-lin]               # people/ 底下的檔名（不含 .yaml）
   status: active                     # active | archived
   ```
3. 沒有公開 repo 的專案可以省略 `repo`。`members` 裡的 id 必須真的存在於 `people/`；打錯時 build 會失敗，並指出是哪個專案檔、哪個 id。
4. 專案卡最上方的示意圖（選填）見第 3 節「專案示意圖」；沒有圖的專案卡照常顯示，只是沒有圖。

### 2.4 新增動態

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
- **新增一個全新的研究方向**，除了建立 `research/<新slug>/{en,zh}.md`，還必須把 slug 加進 `src/content.config.ts` 最上面的 `AREA_SLUGS`，否則論文 / 專案 / 成員的 `areas` 欄位不能使用它，build 會失敗。也要在 `.github/ISSUE_TEMPLATE/add-publication.yml` 的 `id: areas` 清單加一行 `- label: "<新slug> (<中文名>)"`，否則 `npm test` 會失敗（訊息 `add-publication.yml lists …`），部署停在測試這一步，網站不會更新。除了這兩個檔，方向名稱、首頁卡片與專案頁的篩選按鈕都會自動從 `en.md` / `zh.md` 的 front matter 產生，不需要改 `src/i18n/ui.ts`；`icon` 只能從 `camera` `arm` `heart` `shield` `globe` `chip` `bolt` `wave` 選一個。目前的 slug：`wavelet-signal-analysis`（小波轉換與訊號分析）`stereo-3d-vision` `robotic-arm` `biomedical-ai` `biometrics-security` `smart-grid-energy`（智慧電網與儲能）`international-programs`。
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
  - **產學計畫（`sponsor: industry`）絕不具名合作廠商**：不寫 `number`、`sponsorName`、`grb`，標題、摘要與 `source` 裡也不能有公司名稱；`source` 寫誰在何時提供（見[第 5 節規則 10](#5-實驗室內容規則)）。
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

- `src/content/group-photos/<年>.yaml` 加上同資料夾的 `<年>.jpg`；一年一張。先把原檔改名為 `<年>.jpg`（例如 `2026.jpg`），再執行 `npm run photos -- 2026.jpg --out src/content/group-photos --group`（長邊上限 2000 px）。輸出檔名沿用輸入檔名（小寫，`IMG_1234.JPG` → `img-1234.jpg`）；沒有先改名的話，YAML 的 `src` 要填輸出的檔名。
- 欄位：`year`、`photo`（`src`、`alt` 雙語必填，`caption` 選填）、`consent: people-agreed`（**必填**，照片裡每個人都同意上網）、`names`（選填，雙語，例如「前排左起：…」）。
- 最新一年的合照會顯示在首頁「關於實驗室」區。

### 榮譽與獲獎 honors

- `src/content/honors/<YYYY-MM>-<slug>.yaml`，一個獎項一個檔。顯示在成員頁（`/people/`）的「榮譽與獲獎」區；若 `publication` 指向某篇論文，該論文旁會多一個標籤。
- `source` 必填（頒獎單位的公告網址，或誰何時提供）。`recipients` 填 `people/` 的 id；沒有成員檔的得獎人寫在 `recipientNames`。
- 目前還沒有任何榮譽檔：build 時看到 `The collection "honors" does not exist or is empty` 是正常的警告（見[第 8 節](#8-常見-build-錯誤解讀)），加入第一個檔後就會消失。

### 常見問題 faq

- `src/content/faq/<對象>-<slug>.yaml`，一個問題一個檔，顯示在 `/join/`（加入與聯絡），依 `audience` 分組：`master`（碩士）、`undergrad`（大學部）、`intl`（國際生）、`all`（所有人）。
- `order` 小的排前面。`source` 選填，但建議寫（答案的出處，之後才能核對）。可複製 `intl-skills.yaml` 修改。

### 國際實習生 interns

- `src/content/interns/<slug>.yaml`，一位 TEEP／IIPP 實習生一個檔。全部列在成員頁（`/people/`）的「過往國際實習生」區，依 `year` 分組（新的在前），沒寫 `year` 的歸在「更早」；有寫 `quote` 的，心得也會出現在國際交流研究方向頁（`/research/international-programs/`）。
- 欄位：`name`、`program`（`TEEP` 或 `IIPP`）、`year`（選填，實習年份，例如 `2026`；**從 2026 年起請填**）、`quote`（選填，雙語物件，保留本人原文；只有 `en` 時中文站顯示英文原文）、`photo`（選填，用 `npm run photos -- <照片> --out public/images/people --headshot` 做成 `/images/people/<slug>.webp`）、`video`（選填，見下方「影片」）、`order`（同一年內排序）。

### 新成員資料表（Google 表單）

- 新成員（電機系碩博士生、電機系專題生、TEEP／IIPP、國際工程碩士學位學程 IMPE）和畢業學長姐都填同一份表單：第 1 頁選身分，跳到自己的那一頁（國際生的兩頁是英文），最後都到「照片與同意」頁上傳大頭照。
- 填寫連結（傳給新成員）：https://docs.google.com/forms/d/e/1FAIpQLSdvJida2zsDgzfYSYTZZhPARk_diSubv0qaHldEr56EA3zt5g/viewform
- 擁有者是實驗室 Google 帳號 **wry87cncue@gmail.com**：編輯表單（https://docs.google.com/forms/d/1uf5k4qhwVMpKVVPj-K2wWPH8c3ifwAs4iO3W4ATKUlo/edit ）、回覆試算表「新成員資料表（回覆）」（在表單的「回覆」分頁開啟）和上傳的照片（雲端硬碟裡表單旁的資料夾）都在這個帳號。
- 有上傳題的表單一定要登入 Google 才能填；Email 由登入帳號自動記錄，**不放上網站**。送出後填寫者會收到回覆副本，裡面有「編輯回覆」連結，TEEP／IIPP 實習生可以在實習結束時回來補心得。
- 表單由 `scripts/newcomer-form.gs`（Google Apps Script）建立。要重建時，用實驗室帳號開 script.google.com → 新專案 → 貼上 → 執行 `createNewcomerForm`，再手動做腳本做不到的四件事：(1) 在第 7 頁最上面加「檔案上傳」題「大頭照（選填）/ Headshot (optional)」，只允許圖片、1 個檔案、10 MB、非必填；(2) 設定 → 回覆 →「傳送回覆副本」選「一律」；(3) 回覆 → 連結至試算表；(4) 回覆 → ⋮ → 勾選「收到新回覆時傳送電子郵件通知」，有人送出時實驗室信箱會收到一封通知（不含照片，照片在雲端硬碟的「(File responses)」資料夾）。最後把本節的兩個連結換成新的。
- **先查證才上網站。** 回覆試算表最右邊有兩欄是人工填的：「已查證」與「查證備註」。跟楊老師確認過這個人真的是實驗室成員之後，才在「已查證」填「是」，並在「查證備註」寫怎麼確認的。沒有填「是」的人，不要替他建檔。重建試算表時，記得把這兩欄加回去。
- **每週檢查（2026-10 起）。** Brian 的 claude.ai 帳號上有一個雲端排程「Lab website: weekly newcomer-form check」，每週一 09:00 執行。它會讀回覆試算表，檢查有沒有可疑的填寫（短時間內大量送出、重複送出、內容裡有程式碼或連結），把週報寫進 Brian 的 Claude 文件，並只替「已查證」且同意公開的人開 PR，合併仍由人來按。Brian 畢業後這個排程就會停止，接手的人照本節的步驟手動處理即可。

把一筆回覆變成網站檔案：

1. 先看「網站公開同意」：選「不同意」就不建檔，資料只留在試算表。
2. 說明寫「不公開」的欄位（國家、學校、論文題目、在實驗室做什麼、Email）不進 repo。
3. 照片從雲端硬碟下載，用 `npm run photos -- <照片> --out public/images/people --headshot` 處理後再 `git add`。
4. 依下表填欄位，再照 [2.2 新增成員](#22-新增成員) 開 PR。

| 表單頁 | 題目 | 寫進 |
|---|---|---|
| 碩博士生、專題生、IMPE | 中文姓名、英文姓名（IMPE：Full name、Chinese name） | `people/<id>.yaml` 的 `name.zh`、`name.en`（沒有中文名就不寫 `zh`） |
| 同上 | 英文暱稱／Name you go by | `nickname` |
| 碩博士生 | 學位：碩士班／博士班 | `role: master`／`role: phd`（專題生 `undergrad`，IMPE `master`） |
| 碩博士生、專題生、IMPE | 入學年／開始做專題的年份 | `years: "2026–"` |
| 同上 | 研究方向 | `areas`：小波 `wavelet-signal-analysis`、智慧電網 `smart-grid-energy`、生醫 `biomedical-ai`、生物辨識 `biometrics-security`、立體視覺 `stereo-3d-vision`、機械手臂 `robotic-arm`；「尚未決定」就不寫；「其他」填的方向沒有對應的 slug，寫進 `bio` |
| 同上 | 研究簡介／Short bio（專題生：專題方向） | `bio.zh`、`bio.en`（沒寫英文就翻譯後請本人確認） |
| 同上 | GitHub、LinkedIn、其他公開連結 | `links.github`、`links.linkedin`、`links.scholar`／`links.orcid`／`links.website` |
| TEEP／IIPP | Name to show、Program、Internship year、Testimonial | `interns/<slug>.yaml` 的 `name`、`program`（`TEEP`／`IIPP`）、`year`、`quote.en`（照原文） |
| 畢業學長姐 | 中英文姓名、在實驗室時的身分、期間 | 找到原本的 `people/<id>.yaml`（沒有就新增，`role` 依身分），加 `alumni: true`、`years: "2019–2021"` |
| 畢業學長姐 | 公司、職稱、英文、公開方式 | `destination`：「公開公司與職稱」兩個都寫；「只公開公司」只寫公司；「只寫產業類別」寫成例如 `{ en: "Engineer, semiconductor industry", zh: "半導體業工程師" }`；「不公開」就不寫 `destination` |

### 影片 video

- 動態（news）和國際實習生（interns）可以附一段短影片，直接放在網站上，不用 YouTube。影片、封面和字幕都放在 `public/videos/`：`<名稱>.mp4`（H.264，建議 10 MB 以內）、`<名稱>.webp`（封面，可用 `ffmpeg -ss 10 -i 影片.mp4 -frames:v 1 封面.webp` 截一張）、`<名稱>.en.vtt`（選填，WebVTT 字幕）。訪客按下播放前只會下載封面。
- 欄位寫法：

  ```yaml
  video:
    src: "/videos/muskan-ncue-exchange.mp4"
    poster: "/videos/muskan-ncue-exchange.webp"
    captions: "/videos/muskan-ncue-exchange.en.vtt"   # 選填
    captionsLang: en                                 # 字幕語言，en 或 zh，預設 en
    title: { en: "What the video shows", zh: "影片內容" }
    credit: "Presidency University Bangalore"        # 影片出處，顯示在影片下方
    source: "https://www.linkedin.com/posts/..."     # 選填，原始貼文
  ```
- 別人拍的影片，請先取得對方同意再放上來。

### 照片

- **所有照片一律先經過 `npm run photos`，再 `git add`**：

  ```sh
  npm run photos -- <檔案或資料夾> --out <輸出資料夾> [--group | --headshot]
  # 例：npm run photos -- ~/Downloads/outing --out src/content/albums/2026-11-outing
  ```
  它會把長邊縮到 1600 px（加 `--group` 是 2000 px，給團體合照）、壓到 400 KB 以內，並**移除 EXIF 與 GPS**，檔名轉成小寫。加 `--headshot` 則裁成 240×240 的 WebP，給成員大頭照。
- **為什麼一定要先處理**：這個 repo 是公開的。手機原檔帶有 GPS 位置與拍攝資訊，一旦 commit，就算之後刪掉，仍會留在 git 歷史裡。
- HEIC（iPhone 預設格式）請先匯出成 JPEG 再處理。
- 有人入鏡的照片，**每個可辨識的人都要同意**（見[第 5 節規則 11](#5-實驗室內容規則)）。
- 相簿、團體合照、設備的照片放在 YAML 旁邊，用 `src: ./檔名.jpg` 引用（相對於那個 YAML），並附雙語 `alt`。路徑寫錯時，`npm run build` 會報錯（見[第 8 節](#8-常見-build-錯誤解讀)）。
- 成員大頭照：用 `npm run photos -- <照片> --out public/images/people --headshot` 產生 240×240 的 WebP（自動裁切，並移除 EXIF 與 GPS），在 `people` 的 `photo` 用 `/images/people/檔名.webp`（開頭是 `/`、不含 `public`）。需本人同意。
- 研究頁的 `image` 也放在 Markdown 旁邊（例如 `src/content/research/robotic-arm/arm.jpg`），在 `en.md` 和 `zh.md` 各寫一次 `image: ./arm.jpg`，而且一定要同時寫該語言的 `imageAlt`。這些照片一樣要先跑 `npm run photos`。
- `tests/photos.test.mjs` 會檢查所有已 commit 的照片：有 metadata（EXIF / GPS）或太大就會失敗（見[第 8 節](#8-常見-build-錯誤解讀)）。
- **不要**直接引用別的網站上的圖片網址，也不要放沒有授權的圖片。

### 字體

- 網站用的 Inter 字體是自行託管的：`src/assets/fonts/inter-latin-wght.woff2` 與授權檔 `OFL.txt`。檔案取自 `npm pack @fontsource-variable/inter@5.3.0`（包裡的 `files/inter-latin-wght-normal.woff2` 與 `LICENSE`）。
- 網站不會從別的網站載入任何東西（沒有 Google Fonts 或其他外部資源）。
- 每頁 `<head>` 都有 Content-Security-Policy（`src/layouts/Base.astro` 的 `csp`）：腳本、樣式、圖片、字體只能來自本站，iframe 只允許 `www.youtube-nocookie.com`。要加其他網站的嵌入（例如 Google 地圖）得先改 `csp`，否則瀏覽器會擋下；`tests/security.test.mjs` 會檢查每一頁。

### 搜尋引擎資訊（SEO）

- JSON-LD 結構化資料與每個頁面的 description 都是自動產生的，不需要手動編輯。論文頁會替每篇論文產生 `ScholarlyArticle`，每篇論文也有「BibTeX」與「IEEE」兩個複製按鈕。
- 站內搜尋（`/search/`）由 [Pagefind](https://pagefind.app/) 在 `npm run build` 的最後一步建立索引（`dist/pagefind/`），只索引 `<main>` 的內容。`npm run dev` 時沒有索引，搜尋頁會是空的，這是正常的。
- 動態有 RSS：`/rss.xml`（英文）與 `/zh/rss.xml`（中文），新增動態後自動更新。
- `public/apple-touch-icon.png` 由 `npm run icons` 從 `public/favicon.svg` 產生，**不要手動修改**；要改就改 `favicon.svg` 後重新執行。

### 背景插圖

- 頁首與卡片的背景線稿放在 `src/assets/art/*.svg`，由 `scripts/art-gen.mjs` **產生**：要改圖，請改這支 script 再執行 `npm run art`（會重寫全部 SVG）；直接改 SVG 會在下次執行時被蓋掉。
- 規格：頁首圖的 `viewBox` 為 `0 0 480 240`、`preserveAspectRatio="xMaxYMid meet"`；格狀卡片的填充圖（`opamp`、`chip`）為 `0 0 320 180`、`xMidYMid meet`（`404` 與 `bench` 是特例，照現有檔案）。
- 第一個元素是帶 `mask="url(#art-vignette)"` 的 `.dots` 矩形；`class` 只能用 `dots` `con` `dim` `ink` `thin` `sig` `key` `paper` `holes` `web` `node`。
- 不要寫顏色（`fill`、`stroke`、色碼、`style` 都不行），顏色由 `src/styles/global.css` 的 CSS 變數決定；每個元素都要有成對的結尾標籤（`<path ...></path>`，不能寫 `/>`）。
- 新研究方向要有自己的插圖：在 script 裡新增一張並在 `NOTES` 補一行說明，輸出為 `src/assets/art/<slug>.svg`（`<slug>` 與 `research/` 資料夾同名）；沒有這個檔案時，研究頁會自動改用通用的 `research` 插圖。
- 改完執行 `npm test`（檢查顏色、結尾標籤、檔案大小與 `npm run art` 的輸出是否與 SVG 一致；其餘規格要自己遵守）。

### 專案示意圖

- 專案卡最上方的小圖放在 `src/assets/project-art/<專案 slug>.svg`，由 `scripts/project-art-gen.mjs` **產生**：要新增或修改，改這支 script 再執行 `npm run project-art`；直接改 SVG 會被蓋掉。檔名必須和 `src/content/projects/` 的檔名相同。
- 每張圖由左到右讀：輸入 → 方法 → 輸出（例如：臉 → 模型 → 打勾的點名表），`viewBox` 為 `0 0 320 140`，不寫文字。
- `class` 只能用 `ink`（主線）`thin`（輔助線）`con`（虛線）`sig`（主色訊號，一張圖一到兩條）`key`（主色圓點）`mark`（灰點）`paper`（底色填滿）`draw`（卡片捲入畫面或滑鼠移上去時逐筆畫出）。顏色同樣由 `global.css` 決定，不能寫顏色，每個元素要有結尾標籤。
- 改完執行 `npm run build` 與 `npm test`（`tests/project-art.test.mjs` 檢查 script 輸出、顏色、class、檔案大小與每張卡片都有圖）。

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
| `doi` | 否 | 字串 | `"10.1049/icp.2024.4141"` | 不含 `https://doi.org/`（含了會 build 失敗，見[第 8 節](#8-常見-build-錯誤解讀)） |
| `url` | 否 | 完整網址 | `"https://digital-library.theiet.org/..."` | 出版社頁面 |
| `pdf` | 否 | 字串（網址或站內路徑） | `"https://arxiv.org/pdf/2601.06218"` | 只限 arXiv / 作者接受稿 |
| `code` | 否 | 完整網址 | `"https://github.com/NCUE-EE-AIAL/..."` | 公開 repo |
| `tags` | 否（`[]`） | 字串清單 | `[face recognition, VGG16]` | 自由關鍵字 |
| `areas` | 否（`[]`） | 研究方向 slug 清單：`stereo-3d-vision` `robotic-arm` `biomedical-ai` `biometrics-security` `smart-grid-energy` `international-programs` | `[biometrics-security]` | 拼錯會 build 失敗 |
| `summary` | 否 | bi | `{ en: "Recognizes …", zh: "以…辨識…" }` | 讀過摘要後寫的一兩句白話簡介，顯示在研究方向頁的論文下方（論文總表不顯示）；寫在 `areas` 有填的論文上才看得到 |
| `featured` | 否（`false`） | true / false | `true` | 保留欄位，目前頁面未使用（首頁固定顯示最新 3 篇） |
| `verified` | 否（`false`） | true / false | `true` | `false` 會顯示「待確認 / to verify」標記 |
| `source` | 條件必填 | 字串（網址或說明） | `"https://digital-library.theiet.org/... (opened; title, authors match)"` | **`verified: true` 時必填** |

### 成員 people

檔案：`src/content/people/<id>.yaml`（檔名 = id）

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `name` | 是 | bi | `en: "Ting-Yi Lin"` `zh: "林庭毅"` | |
| `nickname` | 否 | 字串 | `"Brian"` | 本人常用的英文暱稱，中英文頁都顯示在名字後的括號裡 |
| `role` | 是 | `pi` `phd` `master` `undergrad` `intern` `staff` | `master` | |
| `program` | 否 | `TEEP` `IIPP` | `TEEP` | 國際交流計畫（如有） |
| `alumni` | 否（`false`） | true / false | `true` | 畢業或離開 |
| `years` | 否 | 字串 | `"2025–"`、`"2022–2024"` | 含 `–` 請加引號 |
| `areas` | 否（`[]`） | 研究方向 slug 清單 | `[biomedical-ai]` | |
| `bio` | 否 | bi | `en: "Master’s student ..."` | 簡短、僅寫公開資訊 |
| `expertise` | 否（`[]`） | bi 清單 | `- en: "Digital signal processing"` `zh: "數位訊號處理"` | 專長，每項一個短語；卡片上顯示為「專長」，用在老師或職員 |
| `experience` | 否（`[]`） | 清單，每項 `years`（選填字串）＋ `text`（bi） | `- years: "2006–"` `text: { en: "...", zh: "..." }` | 經歷，新的在前；每項要有公開出處，寫在 yaml 註解 |
| `photo` | 否 | 字串，路徑 | `/images/people/brian-lin.webp` | 檔案放 `public/images/people/`（240×240 WebP，用 `npm run photos -- <照片> --out public/images/people --headshot` 產生）；需本人同意 |
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
| `tagline` | 否 | bi | | 一句白話說明，給不是這個領域的人看；顯示在 `summary` 上方 |
| `summary` | 是 | bi | | 一兩句話 |
| `areas` | 是 | 研究方向 slug 清單，**至少 1 個** | `[international-programs]` | |
| `repo` | 否 | `owner/name`（英數、`_`、`.`、`-`） | `"NCUE-EE-AIAL/PatrolBot"` | 不是完整網址；公開 repo；用來抓 stars / 語言 / 最後 push |
| `year` | 否 | 整數 | `2023` | |
| `members` | 否（`[]`） | people 的 id 清單 | `[brian-lin]` | 檔名（不含 `.yaml`）；不存在的 id 會讓 build 失敗 |
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
| `date` | 是 | 日期 `YYYY-MM-DD` | `2026-10-17` | 其他寫法（例如 `2026/10/17`）會 build 失敗 |
| `summary` | 是 | 字串（不可空白） | `"The lab has a new bilingual website."` | 一句話，顯示在動態列表，也是搜尋結果與分享預覽的描述 |
| `video` | 否 | 物件 | 見第 3 節「影片 video」 | 放在內文下方的短影片 |

### 研究方向 research

檔案：`src/content/research/<slug>/en.md`、`zh.md`

| 欄位 | 必填 | 型別 / 可用值 | 範例 | 說明 |
|---|---|---|---|---|
| `title` | 是 | 字串 | `"Robotic Arm Control"` | 這個檔的語言 |
| `summary` | 是 | 字串 | | 一句話摘要 |
| `icon` | 是 | `camera` `arm` `heart` `shield` `globe` `chip` `bolt` `wave` | `arm` | |
| `order` | 是 | 整數 | `2` | 小的排前面 |
| `keywords` | 否（`[]`） | 字串清單 | `["motion control"]` | |
| `image` | 否 | 照片檔路徑（相對於 .md） | `./arm.jpg` | 照片放在 .md 旁邊，先跑 `npm run photos`；**有 `image` 就必須有 `imageAlt`** |
| `imageAlt` | 條件必填 | 字串 | `"A robotic arm picking a cube"` | 一句話描述圖片 |
| `showcase` | 否 | 清單，每項 `title`、`image`、`alt`，選填 `text`、`href` | 見 `biomedical-ai/en.md` | 「代表性成果」：寬版代表圖放在內文下方，整張卡片可點，`href` 是 GitHub 時按鈕顯示「前往 GitHub」。圖一樣放在 .md 旁邊、先跑 `npm run photos` |
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
| `source` | 是 | 字串（不可空白） | `"Brian Lin, 2026-10-18; MOE call for proposals: https://..."` | 網址，或誰在何時提供；產學計畫不可含公司名稱 |

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
| `recipients` | 否（`[]`） | people 的 id 清單 | `[brian-lin]` | 不存在的 id 會讓 build 失敗 |
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
10. **產學計畫與電池贊助商一律不具名**：網站與 repo 的任何地方都不寫他們與合作夥伴的名稱，也不寫以贊助商命名的能源中心。`tests/privacy.test.mjs` 會掃描 repo 裡的每個文字檔、每個檔名與資料夾名，以及建好的網站（`dist/`），名稱只以雜湊值（長度、32 位元雜湊、sha256）存在測試裡，repo 內沒有明文。要把另一個名稱加入黑名單，又不想把它寫進 repo：
    1. 在終端機執行下面的指令（最後的 `"名稱"` 換成要擋的名稱；比對時不分大小寫與重音符號）：

       ```sh
       node -e 'const {createHash}=require("node:crypto");const n=process.argv[1].normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[øØ]/g,"o").toLowerCase();let h=0;for(let i=0;i<n.length;i++)h=(Math.imul(h,0x01000193)+n.charCodeAt(i))>>>0;console.log(`  [${n.length}, 0x${h.toString(16).padStart(8,"0")}, "${createHash("sha256").update(n).digest("hex")}"],`)' "名稱"
       ```
    2. 把印出來的那一行（例如 `  [5, 0x050e5aba, "676c…"],`）原樣貼進 `tests/privacy.test.mjs` 的 `DENY` 陣列，放在最後一項之後，再跑 `npm test` 確認通過。
    3. 名稱本身不要寫在 commit 訊息、PR 或 Issue 裡。
11. **相簿與合照必須取得入鏡者同意**：每本相簿要填 `consent`（`people-agreed` = 可辨識的人都同意上網；`no-people` = 沒有可辨識的人，`consentBy` 建議寫誰何時徵得同意）；團體合照一定是 `consent: people-agreed`。沒填，或不是這兩個值，build 會失敗。

12. **不要 commit 個人或本機設定**：`.claude/`、`CLAUDE.local.md`、`.env*`、金鑰檔、本機路徑（`/home/…`、`/Users/…`、`C:\Users\…`）、AI 助理（Claude Code 等）的對話連結與存取權杖都不能進 repo。`.gitignore` 已排除前三種，`tests/security.test.mjs` 會檢查其餘項目。
---

## 6. 不用 git 也能修改

**方法 A：直接在 github.com 上改檔**

1. 打開 repo `NCUE-EE-AIAL/ncue-ee-aial.github.io`，進到要改的檔案（例如 `src/content/people/brian-lin.yaml`）。
2. 點右上角的**鉛筆圖示**（Edit this file）。
3. 改完，按 Commit changes，選 **「Create a new branch for this commit and start a pull request」**（建立新分支並發起 PR）。
4. 填好 PR 範本的檢查清單。維護者核對後合併，網站約 2 分鐘後更新。

新增檔案：在資料夾頁面按 **Add file → Create new file**，檔名欄輸入完整路徑（例如 `src/content/news/2026-11-05-xxx/en.md`），其餘同上。

**方法 B：用 Issue 表單**

到 Issues → New issue，選一個表單填寫送出，會有實驗室成員幫你建檔：

- **Add a publication / 新增論文**
- **Add a news post / 新增實驗室動態**（可附照片，需照片中每個人同意）
- **Add or update a lab member / 新增或更新成員**（新成員、畢業、修改自己的介紹）
- **Add a project / 新增專案**

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
- 另外兩個每週一的自動工作：**06:43「Suggest new publications」**（見 [2.1](#21-新增一篇論文)）、**07:29「Check external links」**檢查 DOI、GitHub 等外部連結，有壞掉的就開（或更新）一個標籤為 `broken-links` 的 issue，全部恢復正常時自動關閉。
- 網站**每週一臺北時間 05:17 也會自動重建一次**，讓依日期決定的內容自己更新（首頁最近 12 個月的動態、研究計畫的「進行中」、GitHub stars 等）。
- GitHub 在 repo **連續 60 天沒有 commit** 時會停用排程的 workflow，並寄信給最後一位 committer。收到通知時：到 **Actions** 分頁，選「Deploy to GitHub Pages」，按 **Enable workflow**（GitHub 文件只寫了這個方法，沒有說推 commit 會自動恢復）。停用期間推上去的修改不會部署，所以按下 Enable 之後，在同一頁按 **Run workflow** 手動部署一次。網站本身不會因此下線，只是停在最後一次部署的內容。

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
  ****: industry projects never name the partner: take the company name out of the title, summary and source
```
第一則：`sponsor: industry` 的計畫不可有 `number`、`sponsorName`、`grb`，全部刪掉。第二則：標題、摘要或 `source` 裡出現公司名稱的字樣（如「公司」「有限公司」「Co.」「Ltd」「Inc.」），改成不具名的描述，`source` 改寫成誰在何時提供（見[規則 10](#5-實驗室內容規則)）。

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
[InvalidContentEntryDataError] people → brian-lin data does not match collection schema.
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

- `privacy.test.mjs`：`remove the sponsor's or partner's name from these files or file names: <清單>`。表示列出的檔案（或 `dist/` 裡建出來的檔案）的內容或檔名、資料夾名含有不可公開的名稱。把名稱從內容刪掉，或把檔案、資料夾改名（不要在 commit 訊息或 PR 裡重複它），再重新 build 與測試（見[規則 10](#5-實驗室內容規則)）。
- `photos.test.mjs`：訊息會指出是哪張照片，例如 `carries metadata: run it through `npm run photos``（照片還帶著 EXIF / GPS）、格式不是 JPEG / PNG / WebP，或超過 400 KB，或長邊超過上限（一般照片 1600 px，團體合照 2000 px，成員大頭照 800 px）。修正：把原始照片重新跑一次訊息裡寫的指令（大頭照要加 `--headshot`，團體合照要加 `--group`），用輸出的檔案取代。**如果這張照片已經 commit 並推上去**，GPS 仍留在 git 歷史裡，請立刻通知維護者處理。

### 25. 動態漏了 `summary`

```
  summary: summary is required: one sentence for the news list and search results
```
每則動態的 `en.md` / `zh.md` 都要有一句 `summary`：它顯示在動態列表，也是搜尋結果與分享預覽的描述。在 front matter 加上 `summary: "…"` 即可。

### 26. `doi` 含了網址

```
  doi: doi is the bare identifier, for example 10.1049/icp.2024.4141 (without https://doi.org/)
```
從出版社頁面複製時常會連 `https://doi.org/` 一起貼上。只留 `10.` 開頭的那一段，網站會自己補上 `https://doi.org/`。

### 27. 日期格式不對

```
  date: use YYYY-MM-DD, for example 2026-11-05
```
日期一律寫成 `2026-11-05`（年-月-日，月和日都是兩位數）。`2026/11/05` 這類寫法在臺北的電腦上會被讀成前一天，所以 build 會直接擋下。

注意：不存在的日期如果**沒加引號**（例如 `date: 2026-02-30`），YAML 會先把它讀成 3 月 2 日，build 不會報錯。發布前請在顯示該日期的頁面（動態是 `/news/`）核對一次。

### 28. `tests/site.test.mjs`：頁面上出現了 email

```
student emails never go on the site (CONTRIBUTING §5 rule 4): write the lab email instead
```
訊息會列出頁面與那個地址。網站上只能出現實驗室信箱和 PI 或 staff 的 `links.email`；動態、研究頁、FAQ 或成員介紹裡的學生信箱，請改寫成實驗室信箱 ncueaial@gmail.com。

### 其他

- `npm run build` 的第一步是 `astro check`（型別檢查）。如果錯誤訊息指向 `.astro` / `.ts` 檔，而不是 `src/content/` 的檔案，那是程式問題而非內容問題，請找維護者。

---

## 9. 誰在維護、去哪裡問

- 網站由實驗室成員共同維護，指導教授：楊文然老師。**網站不屬於任何單一學生**；畢業前請確認你負責的內容已交接，並確保 GitHub 組織 `NCUE-EE-AIAL` 至少有兩位 owner。
- 問題與討論：實驗室信箱 **ncueaial@gmail.com**，或在 GitHub 開 Issue（repo：`NCUE-EE-AIAL/ncue-ee-aial.github.io`）。
- 網站上的線上版：https://ncue-ee-aial.github.io/（英文）、https://ncue-ee-aial.github.io/zh/（繁體中文）。

---

## 10. 搜尋引擎、瀏覽統計與自訂網域

以下三項都需要有權限的人做一次設定，設定值都在 `src/i18n/ui.ts` 的 `site` 裡。

**Google Search Console（讓 Google 收錄並看搜尋成效）**

1. 到 https://search.google.com/search-console ，新增資源，選「網址前置字元」，填 `https://ncue-ee-aial.github.io/`。
2. 驗證方法選 **HTML 標記**，複製 `content="..."` 引號裡的那串字，貼到 `site.verification.google`，開 PR 合併。
3. 部署完成（約 2 分鐘）後回 Search Console 按「驗證」。
4. 左側 **Sitemap**，提交 `sitemap-index.xml`。
5. Bing Webmaster Tools（https://www.bing.com/webmasters ）可以直接從 Search Console 匯入；若要用 HTML 標記，貼到 `site.verification.bing`。

提升排名最有效的是**其他網站連過來**：請系辦在電機系網站的實驗室介紹放上 `https://ncue-ee-aial.github.io/`，老師的學校個人頁、ORCID、Google Scholar 個人檔案也放上網址。

**瀏覽統計（GoatCounter）**

1. 到 https://www.goatcounter.com/signup 用實驗室信箱註冊，選一個代碼（例如 `ncue-aial`，網址會是 `ncue-aial.goatcounter.com`）。
2. 把代碼填到 `site.goatcounter`，開 PR 合併（`Base.astro` 的 CSP 會自動放行 `<代碼>.goatcounter.com` 的圖片請求）。之後每次瀏覽會送出頁面路徑、標題與來源網址，不用 cookie、不記錄個人資料，所以不需要 cookie 同意視窗。
3. 要停用：把 `site.goatcounter` 改回 `''`。

**自訂網域（例如 `aial.ncue.edu.tw`）**

1. 請學校電算中心在 `ncue.edu.tw` 加一筆 DNS：`aial` CNAME `ncue-ee-aial.github.io.`。
2. repo 的 **Settings → Pages → Custom domain** 填 `aial.ncue.edu.tw`，等 DNS 生效後勾選 **Enforce HTTPS**。（本站用 GitHub Actions 部署，不需要 `CNAME` 檔。）
3. 把下列地方的 `https://ncue-ee-aial.github.io` 換成新網址，開同一個 PR：`astro.config.mjs` 的 `site`、`public/robots.txt`、`scripts/check-links.mjs` 的預設 `site`、`tests/` 裡的 `SITE` 常數。可以先用 `grep -rn "ncue-ee-aial.github.io" --exclude-dir=node_modules --exclude-dir=dist .` 找出全部。
4. 舊網址會由 GitHub 自動轉到新網址；Search Console 用「網址變更」工具通知 Google。

