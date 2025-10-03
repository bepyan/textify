/**
 * blogId와 logNo를 받아 표준화된 네이버 블로그 URL을 생성합니다.
 *
 * @param blogId - 블로그 ID
 * @param logNo - 게시글 번호
 * @returns 표준화된 네이버 블로그 URL
 */
export function createStandardNaverBlogUrl(
  blogId: string,
  logNo: string,
): string {
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
}
