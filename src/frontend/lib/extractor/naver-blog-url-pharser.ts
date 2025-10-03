export interface NaverBlogInfo {
  blogId: string;
  logNo: string;
}

/**
 * 다양한 형태의 네이버 블로그 URL을 파싱하여 blogId와 logNo를 추출합니다.
 *
 * @param url - 네이버 블로그 URL
 * @example
 * https://blog.naver.com/ranto28/224028693561
 * https://blog.naver.com/PostView.naver?blogId=ranto28&logNo=224028693561&redirect=Dlog&widgetTypeCall=true&topReferer=https%3A%2F%2Fblog.naver.com%2FPostView.naver%3FblogId%3Dranto28%26logNo%3D224023632772%26proxyReferer%3D%26noTrackingCode%3Dtrue&trackingCode=blog_postview&directAccess=false
 * https://m.blog.naver.com/ranto28/224028693561
 * https://m.blog.naver.com/PostView.naver?blogId=ranto28&logNo=224023632772&proxyReferer=&noTrackingCode=true
 * https://blog.naver.com/PostView.naver?blogId=ranto28&logNo=224028693561
 *
 * @returns NaverBlogInfo 객체 또는 null (파싱 실패 시)
 */
export function parseNaverBlogUrl(url: string): NaverBlogInfo | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

    // 호스트가 네이버 블로그가 아닌 경우
    if (!urlObj.hostname.includes('blog.naver.com')) {
      return null;
    }

    // 1. PostView.naver 형태 (쿼리 파라미터)
    // https://blog.naver.com/PostView.naver?blogId=ranto28&logNo=224028693561
    // https://m.blog.naver.com/PostView.naver?blogId=ranto28&logNo=224023632772
    if (urlObj.pathname.includes('PostView.naver')) {
      const blogId = urlObj.searchParams.get('blogId');
      const logNo = urlObj.searchParams.get('logNo');

      if (blogId && logNo) {
        return { blogId, logNo };
      }
    }

    // 2. 간편 URL 형태 (경로 기반)
    // https://blog.naver.com/ranto28/224028693561
    // https://m.blog.naver.com/ranto28/224028693561
    const pathMatch = urlObj.pathname.match(/^\/([^/]+)\/(\d+)/);
    if (pathMatch) {
      const [, blogId, logNo] = pathMatch;
      return { blogId, logNo };
    }

    return null;
  } catch {
    return null;
  }
}
