# Quickstart Guide: Textify Content Extraction Tool

**Date**: 2025-09-27  
**Feature**: Content extraction from YouTube videos and Naver blogs  
**Prerequisites**: Bun 1.0+ (권장) 또는 Node.js 22+, Cloudflare account

## Quick Setup (5 minutes)

### 1. Environment Setup

```bash
# Clone and setup (Bun 권장)
cd /Users/edward.kk/vscode/textify
bun install

# 또는 npm 사용
# npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your YouTube API key
```

### 2. Development Server

```bash
# Bun 사용 (권장 - 더 빠른 시작)
bun run dev          # Frontend development server
bun run dev:cf       # Backend development server (separate terminal)

# 또는 npm 사용
# npm run dev
# npm run dev:cf
```

### 3. Test Basic Functionality

```bash
# Test API health
curl http://localhost:8787/api/health

# Test URL validation
curl -X POST http://localhost:8787/api/validate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## User Journey Testing

### Scenario 1: YouTube Video Extraction

**Goal**: Extract subtitles from a YouTube video

1. **Open Application**
   - Navigate to `http://localhost:8787`
   - Verify main interface loads with URL input field

2. **Input YouTube URL**

   ```
   URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

   - Paste URL into input field
   - Verify URL validation indicator shows green

3. **Extract Content**
   - Click "Extract" button
   - Verify loading indicator appears
   - Wait for extraction to complete (< 3 seconds)

4. **Review Results**
   - Verify extracted subtitle text appears
   - Check language selection dropdown (if multiple languages available)
   - Test timestamp toggle functionality

5. **Copy Content**
   - Click "Copy to Clipboard" button
   - Verify success message appears
   - Test clipboard content in external application

**Expected Result**: Clean subtitle text copied to clipboard

### Scenario 2: Naver Blog Extraction

**Goal**: Extract main content from a Naver blog post

1. **Input Naver Blog URL**

   ```
   URL: https://blog.naver.com/example/123456789
   ```

   - Paste URL into input field
   - Verify URL validation indicator shows green

2. **Extract Content**
   - Click "Extract" button
   - Verify loading indicator appears
   - Wait for extraction to complete (< 3 seconds)

3. **Review Results**
   - Verify main blog content appears
   - Check that ads and navigation elements are removed
   - Verify text formatting is clean and readable

4. **Copy Content**
   - Click "Copy to Clipboard" button
   - Verify success message appears

**Expected Result**: Clean blog post content without ads or navigation

### Scenario 3: Error Handling

**Goal**: Test error handling for invalid URLs

1. **Test Invalid URL**

   ```
   URL: https://invalid-url-example.com
   ```

   - Input invalid URL
   - Click "Extract" button
   - Verify clear error message appears

2. **Test Unsupported Platform**

   ```
   URL: https://twitter.com/example/status/123
   ```

   - Input unsupported platform URL
   - Verify appropriate error message

3. **Test Private/Deleted Content**

   ```
   URL: https://www.youtube.com/watch?v=deleted_video
   ```

   - Input URL to private/deleted content
   - Verify helpful error message

**Expected Result**: Clear, user-friendly error messages for all failure cases

## API Testing

### Test Suite 1: Content Extraction API

```bash
# Test YouTube extraction
curl -X POST http://localhost:8787/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "options": {
      "language": "en",
      "includeTimestamps": true
    }
  }'

# Expected: 200 OK with extracted content
```

### Test Suite 2: URL Validation API

```bash
# Test valid YouTube URL
curl -X POST http://localhost:8787/api/validate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Expected: {"valid": true, "type": "youtube", "normalizedUrl": "..."}

# Test invalid URL
curl -X POST http://localhost:8787/api/validate \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'

# Expected: {"valid": false, "type": "unknown", "reason": "Invalid URL format"}
```

### Test Suite 3: Unit & Integration Tests

```bash
# Run all tests with Vitest + Bun
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/utils/url-parser.test.ts

# Run tests with coverage
bun test --coverage

# Expected: All colocation tests pass with good coverage
```

## Performance Validation

### Frontend Performance

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run performance audit
lighthouse http://localhost:8787 --only-categories=performance
```

**Performance Targets**:

- First Contentful Paint: < 2s
- Largest Contentful Paint: < 4s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Backend Performance

```bash
# Test API response time
time curl -X POST http://localhost:8787/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Performance Targets**:

- API response time: < 3s (typical)
- Health check: < 100ms
- URL validation: < 200ms

## Mobile Testing

### Responsive Design

1. Open browser developer tools
2. Switch to mobile viewport (iPhone 12, Galaxy S21)
3. Test all user scenarios on mobile
4. Verify touch interactions work properly
5. Check text readability and button sizes

### PWA Installation

1. Open application in mobile browser
2. Look for "Add to Home Screen" prompt
3. Install PWA and test offline functionality
4. Verify app icon and splash screen

## Deployment Validation

### Cloudflare Workers 통합 배포

```bash
# 프론트엔드 빌드 + Worker 배포 (통합)
bun run build    # React SPA 빌드
bun run deploy   # Worker에 정적 자산 + API 통합 배포

# 또는 npm 사용
# npm run build && npm run deploy

# 배포된 애플리케이션 테스트
curl https://textify.bepyan.workers.dev/api/health  # API 테스트
curl https://textify.bepyan.workers.dev/            # 프론트엔드 테스트
```

### End-to-End Production Test

1. Deploy application to production
2. Test all user scenarios on production URL
3. Verify HTTPS and security headers
4. Test from different geographic locations
5. Monitor error rates and performance metrics

## Troubleshooting

### Common Issues

**Issue**: YouTube API quota exceeded
**Solution**: Check API key and usage limits in Google Cloud Console

**Issue**: Naver blog content not extracting
**Solution**: Check if blog structure has changed, update selectors

**Issue**: CORS errors in development
**Solution**: Verify Hono CORS middleware configuration

**Issue**: Slow extraction times
**Solution**: Check network connectivity and API response times

### Debug Commands

```bash
# Check API logs
wrangler tail

# Test with verbose output
curl -v http://localhost:8787/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "test-url"}'

# Check bundle size
npm run build
ls -la dist/
```

## Success Criteria Validation

### Functional Requirements

- [ ] YouTube subtitle extraction works for public videos
- [ ] Naver blog content extraction removes ads and navigation
- [ ] Multiple subtitle languages supported for YouTube
- [ ] Timestamp toggle works for YouTube subtitles
- [ ] Copy to clipboard functionality works
- [ ] Error messages are clear and helpful
- [ ] Mobile-responsive design works on all screen sizes
- [ ] PWA installation works on mobile devices

### Performance Requirements

- [ ] Content extraction completes within 3 seconds
- [ ] Frontend loads within 4 seconds (LCP)
- [ ] API responds within acceptable limits
- [ ] Application works offline (basic functionality)

### Quality Requirements

- [ ] No TypeScript errors
- [ ] All unit and integration tests pass (colocation structure)
- [ ] Test coverage > 60% for core business logic
- [ ] Code follows style guidelines (Prettier + ESLint)
- [ ] Accessibility requirements met (basic level)
- [ ] Security best practices followed

## Next Steps

After successful quickstart validation:

1. Run full test suite: `bun test` (colocation tests)
2. Deploy to staging environment
3. Conduct manual user acceptance testing
4. Monitor production metrics
5. Gather user feedback for improvements
