// Frontend TypeScript interfaces for Textify Content Extraction Tool
// Re-export common types from worker and add frontend-specific types

export type {
  URL,
  ExtractedContent,
  ContentMetadata,
  ExtractionResult,
  ExtractionError,
  ErrorCode,
  UserSession,
  UserPreferences,
  ExtractionRequest,
  ExtractionResponse,
  ValidationRequest,
  ValidationResponse,
  HealthResponse,
} from '../../worker/types';

// Frontend-specific types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface ExtractionUIState extends UIState {
  result: ExtractedContent | null;
  showTimestamps: boolean;
  selectedLanguage: string;
}

export interface URLInputState {
  value: string;
  isValid: boolean;
  type: 'youtube' | 'naver' | 'unknown';
  validationMessage?: string;
}

export interface ClipboardState {
  isSupported: boolean;
  lastCopied: string | null;
  copySuccess: boolean;
}

// Component Props types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  type?: 'text' | 'url';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export interface ContentDisplayProps {
  content: ExtractedContent;
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  onCopy: () => void;
  className?: string;
}

export interface LanguageSelectorProps {
  availableLanguages: string[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

// API Client types
export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface APIError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

// Service layer types
export interface YouTubeService {
  extractContent(
    url: string,
    options?: { language?: string; includeTimestamps?: boolean },
  ): Promise<ExtractedContent>;
  validateUrl(url: string): Promise<boolean>;
  getAvailableLanguages(url: string): Promise<string[]>;
}

export interface NaverService {
  extractContent(
    url: string,
    options?: { format?: 'plain' | 'markdown' },
  ): Promise<ExtractedContent>;
  validateUrl(url: string): Promise<boolean>;
}

export interface APIService {
  extract(request: ExtractionRequest): Promise<ExtractionResponse>;
  validate(request: ValidationRequest): Promise<ValidationResponse>;
  health(): Promise<HealthResponse>;
}

// Router types (TanStack Router)
export interface RouteContext {
  user?: UserSession;
  preferences: UserPreferences;
}

export interface SearchParams {
  url?: string;
  lang?: string;
}

// Local Storage types
export interface StoredSession {
  sessionId: string;
  recentExtractions: ExtractedContent[];
  preferences: UserPreferences;
  createdAt: string; // ISO string
  lastActivity: string; // ISO string
}

export interface StoredPreferences {
  defaultLanguage: string;
  showTimestamps: boolean;
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

// Form types
export interface ExtractionFormData {
  url: string;
  language?: string;
  includeTimestamps?: boolean;
  format?: 'plain' | 'markdown';
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Analytics/Tracking types (for future use)
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface ExtractionAnalytics {
  url: string;
  sourceType: 'youtube' | 'naver';
  success: boolean;
  processingTime: number;
  errorCode?: string;
}
