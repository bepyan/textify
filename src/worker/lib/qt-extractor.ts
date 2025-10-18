import * as cheerio from 'cheerio';

export async function extractQtLatest() {
  const response = await fetch('https://sum.su.or.kr:8888/bible/today');
  const html = await response.text();

  const $ = cheerio.load(html);
  const title = $('#bible_text').text().trim();
  const description = $('#bibleinfo_box').text().trim();

  return {
    title,
    description,
  };
}
