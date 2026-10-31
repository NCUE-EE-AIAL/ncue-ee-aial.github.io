// Builds the new-member Google Form (7 pages, one branch per identity). Google Apps Script, not Node.
// Usage: signed in as the lab Google account wry87cncue@gmail.com, open script.google.com → New project,
// paste this file, run createNewcomerForm, then do the steps in CONTRIBUTING.md「新成員資料表」 (the photo
// question and the Sheets link cannot be made by a script). Each run creates a NEW form; the live one is linked there.
// The questions follow the people / interns schemas in src/content.config.ts.

const AREAS = [
  { en: 'Wavelet and Signal Analysis', zh: '小波轉換與訊號分析' },
  { en: 'Smart Grid and Energy Storage', zh: '智慧電網與儲能' },
  { en: 'Biomedical AI', zh: '生醫人工智慧' },
  { en: 'Biometrics and Security', zh: '生物辨識與資訊安全' },
  { en: 'Stereo 3D Vision', zh: '立體三維視覺' },
  { en: 'Robotic Arm Control', zh: '機械手臂控制' },
];
const SHOWN = '網站公開';
const PRIVATE = '不公開，只給實驗室紀錄';
const SHOWN_EN = 'Shown on the website.';
const PRIVATE_EN = 'Lab records only, not on the website.';
const WHO_HINT = '已經畢業或離開實驗室，請選第一項「畢業學長姐」。/ Graduated or left the lab? Choose the first option, Alumni.';

function createNewcomerForm() {
  const form = FormApp.create('人工智慧應用實驗室 新成員資料表 / AI Application Laboratory — Member Information');
  form.setDescription([
    '歡迎加入人工智慧應用實驗室！你的回答會用來建立實驗室網站 https://ncue-ee-aial.github.io/ 上的成員卡片。'
      + '說明寫「網站公開」的欄位會放上網站，寫「不公開」的只留在實驗室。最後一頁可以上傳大頭照（需要登入 Google）。送出後還可以回來修改。',
    '',
    'Welcome to the AI Application Laboratory! Your answers are used to make your card on the lab website '
      + 'https://ncue-ee-aial.github.io/. Fields marked "Shown on the website" appear online; fields marked '
      + '"Lab records only" stay inside the lab. On the last page you can upload a headshot (this needs a Google '
      + 'sign-in). You can edit your answers after you submit.',
  ].join('\n'));
  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);
  form.setLimitOneResponsePerUser(false);
  try {
    form.setEmailCollectionType(FormApp.EmailCollectionType.VERIFIED);
  } catch (e) {
    form.setCollectEmail(true);
  }
  form.setConfirmationMessage([
    '謝謝你撥空填寫！新成員，歡迎加入人工智慧應用實驗室；畢業的學長姐，謝謝你們一直和實驗室保持聯絡。',
    '我們會依照你的回覆更新實驗室網站，照片和公開內容都照你在最後一頁選的同意方式處理。'
      + '之後想修改，用同一個 Google 帳號點本頁下方的編輯連結就可以。',
    '',
    'Thank you for taking the time to fill this in! New members: welcome to the AI Application Laboratory. '
      + 'Alumni: thank you for staying in touch with the lab.',
    'We will update the lab website from your answers, and your photo and public details follow the consent '
      + 'you chose on the last page. To change anything later, sign in with the same Google account and use '
      + '"Edit your response" below.',
  ].join('\n'));

  // Page 1: identity. Its choices point at the page breaks made below.
  // Alumni come first with a hint: on 2026-10-30/31 three graduates picked 電機系碩博士生 and never saw the alumni page.
  const who = form.addMultipleChoiceItem()
    .setTitle('你的身分 / Who are you?')
    .setHelpText(WHO_HINT)
    .setRequired(true);

  // Page 2: EE master's and PhD students (Chinese).
  const pbGrad = form.addPageBreakItem()
    .setTitle('電機系碩博士生')
    .setHelpText('這一頁的資料會用來建立你在「成員」頁的卡片。');
  addNames(form);
  form.addMultipleChoiceItem().setTitle('學位').setChoiceValues(['碩士班', '博士班']).setRequired(true);
  text(form, '入學年（西元）', `例如 2026，網站會顯示「2026–」。${SHOWN}`, true, yearRule());
  areas(form, 'zh');
  para(form, '研究簡介（中文）',
    `1–2 句，說你在做什麼，例如「研究雙攝影機 3D 成像，結合電腦視覺與影像處理。」進行中的題目寫大方向即可。${SHOWN}`, true);
  para(form, '研究簡介（英文，選填）', `沒寫的話實驗室會翻譯，再請你確認。${SHOWN}`, false);
  links(form, 'zh');

  // Page 3: EE undergraduate project students (Chinese).
  const pbUndergrad = form.addPageBreakItem()
    .setTitle('電機系專題生（大學部）')
    .setHelpText('這一頁的資料會用來建立你在「成員」頁的卡片。');
  addNames(form);
  text(form, '開始做專題的年份（西元）', `例如 2026。${SHOWN}`, true, yearRule());
  areas(form, 'zh');
  para(form, '專題方向（選填）', `一句話，例如「用 sEMG 訊號偵測肌肉疲勞」。進行中的題目寫大方向即可。${SHOWN}`, false);
  text(form, 'GitHub 個人頁（選填）', `例如 https://github.com/yourname 。${SHOWN}`, false, urlRule());

  // Page 4: TEEP / IIPP interns (English). Matches src/content/interns/<slug>.yaml.
  const pbIntern = form.addPageBreakItem()
    .setTitle('TEEP / IIPP intern')
    .setHelpText('Past interns are listed by year on the People page; testimonials also appear on the International Programs page.');
  text(form, 'Name to show on the website', `Your first name or your full name, as you like it to appear. ${SHOWN_EN}`, true);
  form.addMultipleChoiceItem().setTitle('Program')
    .setChoiceValues(['TEEP (Taiwan Experience Education Program)', 'IIPP (International Internship Pilot Program)'])
    .setRequired(true);
  text(form, 'Internship year', `For example 2026. ${SHOWN_EN}`, true, yearRule());
  text(form, 'Home university and country', `For example "Anna University, India". ${PRIVATE_EN}`, true);
  para(form, 'What you work on in the lab (optional)', PRIVATE_EN, false);
  para(form, 'Testimonial (optional)',
    'A few sentences about your time in the lab. We publish it exactly as you write it, with your name. '
      + `You can come back with "Edit your response" and add it at the end of your internship. ${SHOWN_EN}`, false);

  // Page 5: International Master Program in Engineering (English).
  const pbImpe = form.addPageBreakItem()
    .setTitle('International Master Program in Engineering (IMPE)')
    .setHelpText('These answers make your card on the People page.');
  text(form, 'Full name (as in your passport)', SHOWN_EN, true);
  text(form, 'Name you go by (optional)', `A nickname shown after your name, e.g. "Sam". ${SHOWN_EN}`, false);
  text(form, 'Chinese name (optional)', `Only if you have one. ${SHOWN_EN}`, false);
  text(form, 'Country', PRIVATE_EN, true);
  text(form, 'Entry year', `For example 2026; the website shows "2026–". ${SHOWN_EN}`, true, yearRule());
  areas(form, 'en');
  para(form, 'Short bio',
    `One or two sentences about what you work on. For work in progress, the general direction is enough. ${SHOWN_EN}`, true);
  links(form, 'en');

  // Page 6: alumni (Chinese, English optional). Current job becomes `destination`, only as far as they allow.
  const pbAlumni = form.addPageBreakItem()
    .setTitle('畢業學長姐')
    .setHelpText('你的資料會放在「成員」頁的歷屆成員區。公司與職稱公開到什麼程度，由你在這頁最後一題決定。');
  text(form, '中文姓名', SHOWN, true);
  text(form, '英文姓名', `名在前、姓在後，例如 Kuan-Wei Chen。${SHOWN}`, true);
  form.addCheckboxItem().setTitle('在實驗室時的身分（可複選）')
    .setChoiceValues(['專題生', '碩士生', '博士生', 'TEEP / IIPP 實習生', '國際工程碩士學位學程（IMPE）'])
    .setRequired(true);
  text(form, '在實驗室期間（西元）', `例如 2019–2021。${SHOWN}`, true, periodRule());
  para(form, '畢業論文或專題題目（選填）', `用來對照網站上的論文列表。${PRIVATE}`, false);
  text(form, '目前任職公司／單位', '最近一份工作；是否公開見本頁最後一題。', true);
  text(form, '職稱', '是否公開見本頁最後一題。', true);
  text(form, '公司與職稱的英文（選填）', '例如 "Firmware Engineer, ABC Corp."；沒寫的話實驗室會翻譯。', false);
  form.addMultipleChoiceItem().setTitle('公司與職稱在網站上要怎麼寫？')
    .setChoiceValues(['公開公司與職稱', '只公開公司', '只寫產業類別（例如「半導體業工程師」）', '不公開'])
    .setRequired(true);
  text(form, 'LinkedIn（選填）', SHOWN, false, urlRule());

  // Page 7: everyone. The headshot (File upload) question is added at the top of this page by hand.
  const pbEnd = form.addPageBreakItem()
    .setTitle('照片與同意 / Photo and consent')
    .setHelpText('大頭照：清楚、正面、只有你一人，網站會裁成正方形。\nHeadshot: a clear, front-facing photo of just you; the website crops it square.');
  form.addMultipleChoiceItem().setTitle('網站公開同意 / Consent to publish')
    .setChoiceValues([
      '同意：網站可以公開我的照片和標示「網站公開」的資料 / Yes: the website may show my photo and the details marked "Shown on the website"',
      '不同意：只給實驗室內部紀錄 / No: keep my answers for lab records only',
    ])
    .setRequired(true);
  para(form, '備註 / Anything else? (optional)', '', false);

  who.setChoices([
    who.createChoice('畢業學長姐（已畢業／已離開）/ Alumni (graduated or left)', pbAlumni),
    who.createChoice('電機系碩博士生（在學中）/ Current EE graduate student (Master\'s or PhD)', pbGrad),
    who.createChoice('電機系專題生（大學部）/ EE undergraduate project student', pbUndergrad),
    who.createChoice('TEEP / IIPP intern', pbIntern),
    who.createChoice('國際工程碩士學位學程 / International Master Program in Engineering (IMPE)', pbImpe),
  ]);
  // A page break's go-to applies to the page before it: pages 2–5 jump to page 7; page 6 flows into it.
  [pbUndergrad, pbIntern, pbImpe, pbAlumni].forEach((pb) => pb.setGoToPage(pbEnd));

  try {
    form.setPublished(true);
  } catch (e) {
    Logger.log('Publish the form by hand (Publish button in the editor).');
  }
  Logger.log('Edit link: ' + form.getEditUrl());
  Logger.log('Responder link: ' + form.getPublishedUrl());
}

function addNames(form) {
  text(form, '中文姓名', SHOWN, true);
  text(form, '英文姓名', `依護照或羅馬拼音，名在前、姓在後，例如 Heng-Jun Wang。${SHOWN}`, true);
  text(form, '英文暱稱（選填）', `平常用的英文名，例如 Brian，會顯示在姓名後面。${SHOWN}`, false);
}

function areas(form, lang) {
  const zh = lang === 'zh';
  form.addCheckboxItem()
    .setTitle(zh ? '研究方向（可複選）' : 'Research areas (choose any)')
    .setHelpText(zh ? SHOWN : SHOWN_EN)
    .setChoiceValues(AREAS.map((a) => (zh ? `${a.zh} ${a.en}` : a.en)).concat(zh ? ['尚未決定'] : ['Not decided yet']))
    .showOtherOption(true)
    .setRequired(true);
}

function links(form, lang) {
  const zh = lang === 'zh';
  const note = zh ? SHOWN : SHOWN_EN;
  text(form, zh ? 'GitHub 個人頁（選填）' : 'GitHub profile (optional)', `https://github.com/yourname — ${note}`, false, urlRule());
  text(form, zh ? 'LinkedIn（選填）' : 'LinkedIn (optional)', note, false, urlRule());
  para(form, zh ? '其他公開連結（選填）' : 'Other public links (optional)',
    (zh ? 'Google Scholar、ORCID、個人網站，一行一個。' : 'Google Scholar, ORCID, personal website — one per line. ') + note, false);
}

function text(form, title, help, required, validation) {
  const item = form.addTextItem().setTitle(title).setHelpText(help).setRequired(required);
  if (validation) item.setValidation(validation);
  return item;
}

function para(form, title, help, required) {
  return form.addParagraphTextItem().setTitle(title).setHelpText(help).setRequired(required);
}

function yearRule() {
  return FormApp.createTextValidation()
    .setHelpText('請填西元年，例如 2026 / Please enter a year, e.g. 2026')
    .requireTextMatchesPattern('^(19|20)[0-9]{2}$')
    .build();
}

function periodRule() {
  return FormApp.createTextValidation()
    .setHelpText('例如 2019–2021')
    .requireTextMatchesPattern('^(19|20)[0-9]{2} ?[–-] ?((19|20)[0-9]{2})?$')
    .build();
}

function urlRule() {
  return FormApp.createTextValidation()
    .setHelpText('請貼完整網址 / Please paste the full link (https://…)')
    .requireTextIsUrl()
    .build();
}
