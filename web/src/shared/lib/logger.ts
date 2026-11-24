type LogLevel = "INFO" | "WARNING" | "ERROR";

/**
 * エラーの分類カテゴリ
 *
 * エラーの性質を分類することで、アラート設計とデバッグ効率を向上させる。
 * Cloud Loggingでの集計・分析を容易にするために使用。
 */
export type ErrorCategory =
  | "validation" // ユーザー入力エラー（400系）
  | "notFound" // リソース未発見（404）
  | "authentication" // 認証失敗（401）
  | "authorization" // 権限不足（403）
  | "rateLimit" // レート制限（429）
  | "external" // 外部APIエラー
  | "database" // DB接続エラー
  | "internal"; // 予期しないエラー（500系）

interface StructuredLog {
  severity: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Cloud Logging向けの構造化ログを出力する
 *
 * @param level - ログレベル (INFO, WARNING, ERROR)
 * @param message - ログメッセージ
 * @param context - 追加のコンテキスト情報（任意）
 *
 * @remarks
 * 重大度は JSON の severity フィールドで決まります（console のメソッドでは決まりません）。
 * JSON文字列として出力することで、Cloud Loggingが構造化データとして認識します。
 *
 * @security
 * contextに含めてはいけない情報:
 * - APIキー、トークン、パスワード
 * - ユーザーの個人情報（メールアドレス、氏名）
 * - クレジットカード情報
 * - セッションID、JWT
 *
 * スタックトレースを含める場合は、ログの量を抑えるため最初の5行のみに制限してください。
 * 機密が混ざり得るのは1行目のエラーメッセージなので、その中身にも注意してください。
 *
 * @example
 * ```typescript
 * logger.info('APIリクエスト受信', {
 *   url: request.url,
 *   method: request.method,
 * })
 *
 * logger.error('データベース接続失敗', {
 *   error: error.message,
 *   stack: error.stack?.split('\n').slice(0, 5).join('\n'),
 * })
 * ```
 */
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const logData: StructuredLog = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
  };

  if (level === "ERROR") {
    console.error(JSON.stringify(logData));
  } else if (level === "WARNING") {
    console.warn(JSON.stringify(logData));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(logData));
  }
}

/**
 * Cloud Logging対応のロガー
 *
 * @example
 * ```typescript
 * import { logger } from '@/shared/lib/logger'
 *
 * // 情報ログ
 * logger.info('処理開始', { userId: user.id })
 *
 * // 警告ログ
 * logger.warn('レスポンスが遅延', { latency: 3500 })
 *
 * // エラーログ
 * logger.error('APIエラー', {
 *   error: error.message,
 *   endpoint: '/api/quiz',
 * })
 * ```
 */
export const logger = {
  /**
   * 情報レベルのログを出力 (severity=INFO)
   * @param message - ログメッセージ
   * @param context - 追加のコンテキスト情報（任意）
   */
  info: (message: string, context?: Record<string, unknown>) =>
    log("INFO", message, context),

  /**
   * 警告レベルのログを出力 (severity=WARNING)
   * @param message - ログメッセージ
   * @param context - 追加のコンテキスト情報（任意）
   */
  warn: (message: string, context?: Record<string, unknown>) =>
    log("WARNING", message, context),

  /**
   * エラーレベルのログを出力 (severity=ERROR)
   * @param message - ログメッセージ
   * @param context - 追加のコンテキスト情報（任意）
   */
  error: (message: string, context?: Record<string, unknown>) =>
    log("ERROR", message, context),
};

/**
 * エラーを分類して構造化ログとして出力する
 *
 * エラーカテゴリを明示することで、Cloud Loggingでの集計・アラート設計が容易になります。
 * ユーザーエラー（validation, notFound, rateLimit）とシステムエラーを区別できます。
 *
 * @param message - エラーメッセージ
 * @param error - エラーオブジェクト
 * @param category - エラーカテゴリ
 * @param context - 追加のコンテキスト情報（任意）
 *
 * @example
 * ```typescript
 * import { logError } from '@/shared/lib/logger'
 *
 * // ユーザー入力エラー
 * logError('Invalid quiz answer format', error, 'validation', {
 *   module: 'api/quiz',
 *   userId: user.id,
 * })
 *
 * // 外部API呼び出しエラー
 * logError('Gemini API call failed', error, 'external', {
 *   module: 'lib/gemini',
 *   attemptNumber: 2,
 * })
 *
 * // データベースエラー
 * logError('Supabase query failed', error, 'database', {
 *   module: 'api/diagnosis',
 *   query: 'select from users',
 * })
 * ```
 */
export function logError(
  message: string,
  error: unknown,
  category: ErrorCategory,
  context?: Record<string, unknown>,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack =
    error instanceof Error
      ? error.stack?.split("\n").slice(0, 5).join("\n")
      : undefined;

  const isUserError = ["validation", "notFound", "rateLimit"].includes(
    category,
  );

  logger.error(message, {
    ...context,
    errorCategory: category,
    errorMessage,
    ...(errorStack && { errorStack }),
    isUserError,
  });
}

export type { LogLevel, StructuredLog };
