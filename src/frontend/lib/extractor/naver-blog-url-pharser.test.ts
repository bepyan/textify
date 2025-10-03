import { describe, expect, it } from 'vitest';

import { parseNaverBlogUrl } from './naver-blog-url-pharser';

describe('parseNaverBlogUrl', () => {
  describe('유효한 URL 파싱', () => {
    const TEST_BLOG_ID = 'ranto28';
    const TEST_LOG_NO = '224028693561';
    const TEST_LOG_NO_2 = '224023632772';

    const VALID_NAVER_BLOG_URLS = [
      // 간편 URL 형태 (blog.naver.com)
      {
        url: `https://blog.naver.com/${TEST_BLOG_ID}/${TEST_LOG_NO}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },
      {
        url: `http://blog.naver.com/${TEST_BLOG_ID}/${TEST_LOG_NO}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },
      {
        url: `blog.naver.com/${TEST_BLOG_ID}/${TEST_LOG_NO}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },
      {
        url: `https://m.blog.naver.com/${TEST_BLOG_ID}/${TEST_LOG_NO}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },

      // PostView.naver 형태
      {
        url: `https://blog.naver.com/PostView.naver?blogId=${TEST_BLOG_ID}&logNo=${TEST_LOG_NO}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },
      {
        url: `https://m.blog.naver.com/PostView.naver?blogId=${TEST_BLOG_ID}&logNo=${TEST_LOG_NO_2}`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO_2,
      },
      {
        url: `https://blog.naver.com/PostView.naver?blogId=${TEST_BLOG_ID}&logNo=${TEST_LOG_NO}&redirect=Dlog&widgetTypeCall=true&topReferer=https%3A%2F%2Fblog.naver.com%2FPostView.naver%3FblogId%3Dranto28%26logNo%3D224023632772%26proxyReferer%3D%26noTrackingCode%3Dtrue&trackingCode=blog_postview&directAccess=false`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO,
      },
      {
        url: `https://m.blog.naver.com/PostView.naver?blogId=${TEST_BLOG_ID}&logNo=${TEST_LOG_NO_2}&proxyReferer=&noTrackingCode=true`,
        blogId: TEST_BLOG_ID,
        logNo: TEST_LOG_NO_2,
      },
    ];

    it.each(VALID_NAVER_BLOG_URLS)(
      'should parse valid Naver Blog URL: $url',
      ({ url, blogId, logNo }) => {
        const result = parseNaverBlogUrl(url);
        expect(result).not.toBeNull();
        expect(result?.blogId).toBe(blogId);
        expect(result?.logNo).toBe(logNo);
      },
    );
  });

  describe('잘못된 URL 처리', () => {
    const INVALID_NAVER_BLOG_URLS = [
      // 잘못된 호스트
      'https://www.naver.com',
      'https://www.google.com/blog/test/123',

      // 네이버 블로그지만 필수 정보 누락
      'https://blog.naver.com',
      'https://blog.naver.com/ranto28',
      'https://blog.naver.com/PostView.naver',
      'https://blog.naver.com/PostView.naver?blogId=test',
      'https://blog.naver.com/PostView.naver?logNo=123',

      // 잘못된 형식
      'not a url',
      '',
      'https://',
    ];

    it.each(INVALID_NAVER_BLOG_URLS)(
      'should return null for invalid URL: %s',
      (url) => {
        expect(parseNaverBlogUrl(url)).toBeNull();
      },
    );
  });
});
