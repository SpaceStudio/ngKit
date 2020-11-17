import { Config } from './config';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptor } from './services/http-interceptor';
import { AuthInterceptor } from './services/http-auth-interceptor';
import { Authentication } from './services/authentication/authentication';
import { CookieStorage } from './services/storage/cookie';
import { LocalStorage } from './services/storage/local';
import { SessionStorage } from './services/storage/session';
import { Token } from './services/token/token';
import { Http } from './services/http';
import { Authorization } from './services/authentication/authorization';
import { AuthResolveGuard } from './guards/auth-resolve-guard';
import { AuthGuard } from './guards/auth-guard';
import { Cache } from './services/cache/cache';
import { Event } from './services/event';
import { Crypto } from './services/encryption/crypto';

/**
 * ngKit Services.
 */
export const NGKIT_PROVIDERS: any[] = [
  Authentication,
  AuthGuard,
  AuthResolveGuard,
  Authorization,
  Cache,
  Config,
  Event,
  CookieStorage,
  Crypto,
  Http,
  LocalStorage,
  SessionStorage,
  Token,
  {
    provide: HTTP_INTERCEPTORS,
    useClass: HttpInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
];
