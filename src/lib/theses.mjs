/** Thesis list helpers in plain JS, so the People page and node:test can both import them. */

/** True when the text contains a Chinese character. */
export function hasCjk(text) {
  return /\p{Script=Han}/u.test(text);
}

/** BCP 47 tag for a piece of text shown on the page: Chinese characters mean zh-Hant-TW, otherwise en. */
export function langOfText(text) {
  return hasCjk(text) ? 'zh-Hant-TW' : 'en';
}

/**
 * Split theses (entries with data.degree and data.ay) into master and phd,
 * each grouped by academic year, newest first; entries keep their input order within a year.
 */
export function splitTheses(list) {
  const group = (degree) => {
    const items = list.filter((x) => x.data.degree === degree);
    return [...new Set(items.map((x) => x.data.ay))]
      .sort((a, b) => b - a)
      .map((ay) => ({ ay, list: items.filter((x) => x.data.ay === ay) }));
  };
  return { master: group('master'), phd: group('phd') };
}

/**
 * The student's name for a page. A record whose zh name has no Chinese character (an international
 * student, recorded in capitals) shows student.en on both pages; otherwise zh page = zh, en page = en ?? zh.
 */
export function studentName(student, lang) {
  if (lang === 'zh') return !hasCjk(student.zh) && student.en ? student.en : student.zh;
  return student.en ?? student.zh;
}
