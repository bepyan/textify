import * as cheerio from 'cheerio';
import { htmlToMarkdown } from 'mdream';

export async function extractNaverBlogContent({
  blogId,
  logNo,
}: {
  blogId: string;
  logNo: string;
}): Promise<string> {
  const url = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;

  const response = await fetch(url);
  const html = await response.text();

  const $ = cheerio.load(html);
  const title = $('.se-title-text').html();
  const content = $('.se-main-container').html();

  return htmlToMarkdown(`${title}${content}`);
}
