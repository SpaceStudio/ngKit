import { Component, Injectable } from '@angular/core';
import {
    Http as HTTP, Headers, Response, URLSearchParams
} from '@angular/http';
import { Observable } from 'rxjs';
import { Config } from './../config';
import { Event } from './event';
import { Token } from './token';

@Injectable()
export class Http {
    /**
     * Assignable base url for http calls.
     *
     * @type {string}
     */
    baseUrl: string = '';

    /**
     * Headers to be sent with all http calls.
     *
     * @type {any}
     */
    public headers: any;

    /**
     * Constructor.
     *
     * @param  {Http}   http
     */
    constructor(
        public http: HTTP,
        public config?: Config,
        public event?: Event,
        public token?: Token
    ) {
        this.setDefaultHeaders();
        this.eventListeners();
    }

    /**
     * Event listeners.
     *
     * @return {void}
     */
    private eventListeners(): void {
        if (this.event) {
            this.event.listen('auth:loggingIn').subscribe(() => {
                this.setDefaultHeaders();
            });

            this.event.listen('auth:loggedOut').subscribe(() => {
                this.setDefaultHeaders();
            });

            this.event.listen('auth:check').subscribe(() => {
                this.setDefaultHeaders();
            });
        }
    }

    /**
     * Adds headers to http requests.
     *
     * @param  {Headers} headers Angular header provider
     * @return {Headers}

     */
    createHeaders(headers: Headers): Headers {
        let configHeaders = (this.config) ? this.config.get('http.headers') : null;

        if (configHeaders) {
            Object.keys(configHeaders).forEach(key => {
                headers.append(key, configHeaders[key]);
            });
        }

        headers = this.tokenHeader(headers);

        return headers;
    }

    /**
     * Add a token header to the request.
     *
     * @param  {Headers} headers
     * @return {Headers}
     */
    tokenHeader(headers: Headers): Headers {
        if (this.config && this.config.get('authentication.method.token')) {

            this.token.get().then(token => {
                let scheme = this.config.get('token.scheme');
                let header_value = (scheme) ? `${scheme} ${token}` : token;

                headers.append('Authorization', header_value);
            }, error => { })
        }

        return headers;
    }

    /**
     * Set the default headers for http request.
     *
     * @return {void}
     */
    setDefaultHeaders(): void {
        let headers = new Headers();

        headers = this.createHeaders(headers);

        this.headers = headers;
    }

    /**
     * Add headers to created headers.
     *
     * @param headers
     * @return {Headers}
     */
    addHeaders(headers): Headers {
        let currentHeaders = this.headers;

        Object.keys(headers).forEach(key => {
            currentHeaders.set(key, headers[key]);
        });

        return currentHeaders;
    }

    /**
     * Build url parameters for requests.
     *
     * @param  {object} params
     * @return {URLSearchParams}
     */
    buildParams(params): URLSearchParams {
        var query_params = new URLSearchParams();

        if (params) {
            Object.keys(params).forEach((key) => {
                if (params[key]) query_params.set(key, params[key]);
            });
        }

        return query_params;
    }

    /**
     * Get location for http request.
     *
     * @param  {string} url
     * @return {string} url
     */
    private getLocation(url) {
        let baseUrl = this.baseUrl || this.config.get('http.baseUrl') || '';

        return (baseUrl) ? baseUrl + '/' + url : url;
    }

    /**
     * Perform a GET http request to API.
     *
     * @param  {string} url
     * @param  {object} params
     * @param  {object} headers
     * @return {Observable}
     */
    get(url, params?, headers = {}): any {
        return this.http.get(this.getLocation(url), {
            headers: this.addHeaders(headers),
            search: this.buildParams(params)
        }).map(res => res.json()).catch(this.handleError.bind(this));
    }

    /**
    * Perform a POST http request.
    *
    * @param  {string} url
    * @param  {object} data Data to pass to the API
    * @param  {object} headers
    * @return {Observable}
    */
    post(url: string, data: any, headers = {}): any {
        return this.http.post(this.getLocation(url), JSON.stringify(data), {
            headers: this.addHeaders(headers)
        }).map(res => res.json()).catch(this.handleError.bind(this))
    }

    /**
     * Perform a file upload via POST.
     *
     * @param  {string} url
     * @param  {File[]} files
     * @param  {object} options
     * @return {Observable}
     */
    postFile(url: string, files: any[], options = {}): any {
        let defaultOptions = { inputName: 'file[]' };
        let fileOptions = Object.assign(defaultOptions, options);

        return Observable.create(observer => {
            let formData: FormData = new FormData();
            let xhr: XMLHttpRequest = new XMLHttpRequest();

            if (typeof files == 'object') {
                files = Object.keys(files).map(key => files[key]);
            }

            if (Array.isArray(files)) {
                files.forEach((file, i) => {
                    formData.append(fileOptions.inputName, file, file.name)
                });
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        observer.next(JSON.parse(xhr.response));
                        observer.complete();
                    } else {
                        observer.error(xhr.response);
                    }
                }
            };

            // TODO: Add Progress
            // xhr.upload.onprogress = (event) => {
            //     this.progress = Math.round(event.loaded / event.total * 100);
            //
            //     this.progressObserver.next(this.progress);
            // };

            xhr.open('POST', this.getLocation(url), true);

            this.headers.keys().forEach((header) => {
                if (header.toLowerCase() != 'content-type') {
                    xhr.setRequestHeader(header, this.headers.get(header));
                }
            });

            xhr.send(formData);
        });
    }

    /**
    * Perform a PUT http request.
    *
    * @param  {string} url
    * @param  {object} data
    * @param  {object} headers
    * @return {Observable}
    */
    put(url: string, data: any, headers = {}): any {
        return this.http.put(this.getLocation(url), JSON.stringify(data), {
            headers: this.addHeaders(headers)
        }).map(res => res.json()).catch(this.handleError.bind(this));
    }

    /**
    * Perform a DELETE http request.
    *
    * @param  {string} url
    * @param  {object} headers
    * @return {Observable}
    */
    delete(url: string, headers = {}): any {
        return this.http.delete(this.getLocation(url), {
            headers: this.addHeaders(headers)
        }).map(res => res.json()).catch(this.handleError.bind(this));
    }

    /**
     * Catch errors from response.
     *
     * @param {objet} error Response
     * @return {object} Observable
     */
    private handleError(response: Response) {
        let error = null;

        if (this.config && this.config.get('debug')) {
            console.error(response);
        }

        if (typeof response.json === 'function') {
            error = response.json();
        }

        if (response.status === 401 && this.event) {
            this.event.broadcast('auth:required', {
                error: error,
                response: response
            });
        }

        return Observable.throw(error || 'Server Error');
    }
}
