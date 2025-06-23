import { getLocaleText } from '@/locales/use-locale';
import { SettingsStateStore } from '@/stores/settings-store';

export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'offline';

export type Surface =
  | 'chat'
  | 'auth'
  | 'api'
  | 'stream'
  | 'database'
  | 'history'
  | 'vote'
  | 'document'
  | 'suggestions';

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = 'response' | 'log' | 'none';

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  stream: 'response',
  api: 'response',
  history: 'response',
  vote: 'response',
  document: 'response',
  suggestions: 'response',
};

export class ChatSDKError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(':');

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === 'log') {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: '', message: 'Something went wrong. Please try again later.' },
        { status: statusCode },
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  const currentLanguage = SettingsStateStore.getState().settings.language;
  const { t } = getLocaleText(currentLanguage as any);

  if (errorCode.includes('database')) {
    return t('errors.database');
  }
  switch (errorCode) {
    case 'bad_request:api':
      return t('errors.badRequestApi');
    case 'unauthorized:auth':
      return t('errors.unauthorizedAuth');
    case 'forbidden:auth':
      return t('errors.forbiddenAuth');
    case 'rate_limit:chat':
      return t('errors.rateLimitChat');
    case 'not_found:chat':
      return t('errors.notFoundChat');
    case 'forbidden:chat':
      return t('errors.forbiddenChat');
    case 'unauthorized:chat':
      return t('errors.unauthorizedChat');
    case 'offline:chat':
      return t('errors.offlineChat');
    case 'not_found:document':
      return t('errors.notFoundDocument');
    case 'forbidden:document':
      return t('errors.forbiddenDocument');
    case 'unauthorized:document':
      return t('errors.unauthorizedDocument');
    case 'bad_request:document':
      return t('errors.badRequestDocument');
    default:
      return t('errors.default');
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}
