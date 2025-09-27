// Main Content Extractor Component for Textify
// Handles URL input, validation, extraction, and content display

import { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import type {
  ExtractionRequest,
  ExtractionResponse,
  ValidationRequest,
  ValidationResponse,
  ExtractedContent,
  URLInputState,
  ExtractionUIState,
} from '../../types';

export function ContentExtractor() {
  const [urlState, setUrlState] = useState<URLInputState>({
    value: '',
    isValid: false,
    type: 'unknown',
  });

  const [extractionState, setExtractionState] = useState<ExtractionUIState>({
    isLoading: false,
    error: null,
    success: false,
    result: null,
    showTimestamps: false,
    selectedLanguage: 'en',
  });

  const [copySuccess, setCopySuccess] = useState(false);

  // Validate URL as user types
  const handleUrlChange = useCallback(async (value: string) => {
    setUrlState((prev) => ({ ...prev, value }));

    if (!value.trim()) {
      setUrlState((prev) => ({
        ...prev,
        isValid: false,
        type: 'unknown',
        validationMessage: undefined,
      }));
      return;
    }

    try {
      const request: ValidationRequest = { url: value };
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result: ValidationResponse = await response.json();

      setUrlState((prev) => ({
        ...prev,
        isValid: result.valid,
        type: result.type,
        validationMessage: result.valid ? undefined : result.reason,
      }));
    } catch (error) {
      setUrlState((prev) => ({
        ...prev,
        isValid: false,
        type: 'unknown',
        validationMessage: '유효성 검사 중 오류가 발생했습니다.',
      }));
    }
  }, []);

  // Extract content from URL
  const handleExtract = useCallback(async () => {
    if (!urlState.isValid || !urlState.value.trim()) return;

    setExtractionState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false,
      result: null,
    }));

    try {
      const request: ExtractionRequest = {
        url: urlState.value,
        options: {
          language: extractionState.selectedLanguage,
          includeTimestamps: extractionState.showTimestamps,
          format: 'plain',
        },
      };

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result: ExtractionResponse = await response.json();

      if (result.success && result.data) {
        setExtractionState((prev) => ({
          ...prev,
          isLoading: false,
          success: true,
          result: result.data!,
        }));
      } else {
        setExtractionState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error?.message || '콘텐츠 추출에 실패했습니다.',
          success: false,
        }));
      }
    } catch (error) {
      setExtractionState((prev) => ({
        ...prev,
        isLoading: false,
        error: '네트워크 오류가 발생했습니다.',
        success: false,
      }));
    }
  }, [
    urlState.isValid,
    urlState.value,
    extractionState.selectedLanguage,
    extractionState.showTimestamps,
  ]);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    if (!extractionState.result?.content) return;

    try {
      await navigator.clipboard.writeText(extractionState.result.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [extractionState.result?.content]);

  // Toggle timestamps for YouTube content
  const handleToggleTimestamps = useCallback(() => {
    setExtractionState((prev) => ({
      ...prev,
      showTimestamps: !prev.showTimestamps,
    }));
  }, []);

  // Change language for YouTube content
  const handleLanguageChange = useCallback((language: string) => {
    setExtractionState((prev) => ({
      ...prev,
      selectedLanguage: language,
    }));
  }, []);

  const getUrlInputClassName = () => {
    const baseClass =
      'w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors';

    if (!urlState.value.trim()) {
      return `${baseClass} border-gray-300`;
    }

    if (urlState.isValid) {
      return `${baseClass} border-green-500 bg-green-50`;
    }

    return `${baseClass} border-red-500 bg-red-50`;
  };

  return (
    <div
      className="mx-auto max-w-4xl space-y-6 p-6"
      data-testid="content-extractor"
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Textify</h1>
        <p className="text-lg text-gray-600">
          YouTube 비디오와 Naver 블로그에서 깔끔한 텍스트를 추출하세요
        </p>
      </div>

      {/* URL Input Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-gray-700"
          >
            URL 입력
          </label>
          <input
            id="url-input"
            type="url"
            value={urlState.value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="YouTube 또는 Naver 블로그 URL을 입력하세요"
            className={getUrlInputClassName()}
            aria-label="URL 입력"
            aria-describedby="url-help"
          />
          <div id="url-help" className="text-sm text-gray-500">
            지원 플랫폼: YouTube (youtube.com, youtu.be), Naver 블로그
            (blog.naver.com)
          </div>

          {/* Validation Message */}
          {urlState.validationMessage && (
            <div className="text-sm text-red-600" role="alert">
              {urlState.validationMessage}
            </div>
          )}

          {/* URL Type Indicator */}
          {urlState.isValid && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {urlState.type === 'youtube'
                  ? 'YouTube 비디오'
                  : 'Naver 블로그'}{' '}
                감지됨
              </span>
            </div>
          )}
        </div>

        {/* YouTube Options */}
        {urlState.isValid && urlState.type === 'youtube' && (
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <h3 className="text-sm font-medium text-blue-900">YouTube 옵션</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Language Selector */}
              <div>
                <label
                  htmlFor="language-select"
                  className="mb-1 block text-sm font-medium text-blue-700"
                >
                  자막 언어
                </label>
                <select
                  id="language-select"
                  value={extractionState.selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full rounded-md border border-blue-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  data-testid="language-selector"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              {/* Timestamp Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  id="timestamps-toggle"
                  type="checkbox"
                  checked={extractionState.showTimestamps}
                  onChange={handleToggleTimestamps}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="timestamps-toggle"
                  className="text-sm font-medium text-blue-700"
                >
                  타임스탬프 포함
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Extract Button */}
        <Button
          onClick={handleExtract}
          disabled={!urlState.isValid || extractionState.isLoading}
          loading={extractionState.isLoading}
          size="lg"
          className="w-full"
          aria-describedby="extract-help"
        >
          {extractionState.isLoading
            ? '콘텐츠를 추출하고 있습니다...'
            : '추출하기'}
        </Button>

        <div id="extract-help" className="text-center text-xs text-gray-500">
          추출 시간은 콘텐츠 크기에 따라 최대 3초까지 소요될 수 있습니다
        </div>
      </div>

      {/* Loading State */}
      {extractionState.isLoading && (
        <div className="py-8 text-center" role="status" aria-live="polite">
          <div
            className="border-primary-600 mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            data-testid="loading-spinner"
          ></div>
          <p className="mt-2 text-gray-600">콘텐츠를 추출하고 있습니다</p>
        </div>
      )}

      {/* Error State */}
      {extractionState.error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-sm font-medium text-red-800">추출 실패</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{extractionState.error}</p>
          <Button
            onClick={handleExtract}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* Success State - Extracted Content */}
      {extractionState.success && extractionState.result && (
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-medium text-green-800">추출 완료</h3>
            </div>

            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {copySuccess ? '복사됨!' : '클립보드에 복사'}
            </Button>
          </div>

          {/* Content Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="font-medium text-gray-600">플랫폼:</span>
              <span className="ml-1 text-gray-900">
                {extractionState.result.sourceType === 'youtube'
                  ? 'YouTube'
                  : 'Naver 블로그'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">처리 시간:</span>
              <span className="ml-1 text-gray-900">
                {extractionState.result.metadata.processingTime}ms
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">콘텐츠 길이:</span>
              <span className="ml-1 text-gray-900">
                {extractionState.result.metadata.contentLength.toLocaleString()}
                자
              </span>
            </div>
            {extractionState.result.language && (
              <div>
                <span className="font-medium text-gray-600">언어:</span>
                <span className="ml-1 text-gray-900">
                  {extractionState.result.language}
                </span>
              </div>
            )}
          </div>

          {/* Content Title */}
          <div data-testid="content-title">
            <h4 className="mb-2 font-medium text-gray-900">제목</h4>
            <p className="text-gray-800">{extractionState.result.title}</p>
          </div>

          {/* Extracted Content */}
          <div data-testid="content-text">
            <h4 className="mb-2 font-medium text-gray-900">추출된 텍스트</h4>
            <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white p-4">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                {extractionState.result.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Message */}
      {copySuccess && (
        <div className="animate-slide-up fixed right-4 bottom-4 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
          클립보드에 복사되었습니다
        </div>
      )}
    </div>
  );
}
