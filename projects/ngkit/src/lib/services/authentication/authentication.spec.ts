import { Authentication } from './authentication';
import { Config } from '../../config';
import { NgKitModule } from '../../ngkit.module';
import { LocalStorage } from '../storage';
import { Token } from '../token/token';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { defer, of } from 'rxjs';

describe("Authentication", () => {
  let service: Authentication;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgKitModule],
      providers: [
        {
          provide: HttpClient,
          useValue: httpSpy = jasmine.createSpyObj("HttpClient", [
            "get",
            "post",
          ]),
        },
      ],
    });

    service = TestBed.inject(Authentication);
  });

  afterEach(() => {
    service.logout();
  });

  it("should return false on auth check without a token", async () => {
    const check = await service.check();
    expect(check).toBeFalsy();
  });

  it("should return true on auth check with a token", async () => {
    httpSpy.get.and.returnValue(of({}));
    const check = service.check();
    expect(check).toBeTruthy();
  });

  it("should return true on auth check after login", async () => {
    httpSpy.post.and.returnValue(
      of({
        user: {},
        token: {},
      })
    );

    httpSpy.get.and.returnValue(
      of({
        data: {},
      })
    );

    await service.login({
      username: "username",
      password: "password",
    });

    const check = await service.check();
    expect(check).toBeTruthy();

    const localStorage = TestBed.inject(LocalStorage);
    const loggedIn = await localStorage.get("logged_in");
    expect(loggedIn).toBeTruthy();
  });

  it("can force check if the user is authenticated", () => {});

  it("should send a forgot password request", () => {});

  it("should return a redirect value", () => {});

  it("should return the authenticated state", () => {});

  it("should set the authenticated state", () => {});

  it("should log users in", () => {});

  it("should log users out", () => {});

  it("should return the redirect and remove it", () => {});

  it("should send a request to refresh the user token", async () => {
    const localStorage = TestBed.inject(LocalStorage);
    const token = TestBed.inject(Token);
    await localStorage.set("logged_in", true);
    await token.set("REFRESH_TOKEN", "_refresh_token");

    httpSpy.post.and.returnValue(
      of({
        access_token: "NEW_ACCESS_TOKEN",
        refresh_token: "REFRESH_TOKEN",
      })
    );

    httpSpy.get.and.returnValue(
      of({
        data: {
          id: 1,
          email: "test@test.com",
        },
      })
    );

    service.setDriver("token");
    const refresh = await service.refresh({});
    const accessToken = await service.getToken("_token");

    expect(refresh).toBeTruthy();
    expect(accessToken).toEqual("NEW_ACCESS_TOKEN");
  });

  it("should send a request to register a user", () => {
    httpSpy.get.and.returnValue(
      of({
        data: {
          id: 1,
          email: "test@test.com",
        },
      })
    );

    httpSpy.get.and.returnValue(
      of({
        data: {
          id: 1,
          email: "test@test.com",
        },
      })
    );
  });

  it("throws an error when register fails", async (done) => {
    const response = JSON.stringify({
      message: "The given data was invalid.",
      errors: {
        password: "Password is weak.",
      },
    });

    httpSpy.post.and.throwError(response);

    await expectAsync(
      service.register({
        username: "username",
        password: "password",
      })
    ).toBeRejected();

    done();
  });

  it("should set the remember state", () => {
    const config = TestBed.inject(Config);
    service.remember(false);
    expect(config.get("authentication.shouldRemember")).toBeFalsy();
  });

  it("should send a request to reset password", () => {});

  it("should allow callback functions to be called when unauthenticated", () => {});

  it("should allow a redirect to be set", () => {});

  it("should allow a authenticated user to be set", () => {});

  it("can logout the current user", async () => {
    const localStorage = TestBed.inject(LocalStorage);
    await localStorage.set("logged_in", true);

    httpSpy.post.and.returnValue(
      defer(() =>
        Promise.reject(
          new HttpErrorResponse({
            error: "Unauthenticated",
            status: 401,
          })
        )
      )
    );

    expect(await service.logout()).toBeTruthy();
    const check = await service.check();
    expect(check).toBeFalsy();
    expect(service.user()).toBeNull();
    const loggedIn = await localStorage.get("logged_in");
    expect(loggedIn).toBeFalsy();
  });

  it("should unauthenticate", async () => {
    const localStorage = TestBed.inject(LocalStorage);
    await localStorage.set("logged_in", true);

    await service.unauthenticate();
    const check = await service.check();
    expect(check).toBeFalsy();
    const loggedIn = await localStorage.get("logged_in");
    expect(loggedIn).toBeFalsy();
  });

  it("should return the authenticated user", () => {});
});
