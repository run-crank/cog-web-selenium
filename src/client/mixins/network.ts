import { isNullOrUndefined } from 'util';
import * as util from '@run-crank/utilities';
import { URL } from 'url';
import { ThenableWebDriver } from 'selenium-webdriver';

const OTHER_REQUEST_METHODS = ['POST', 'PATCH', 'PUT'];
const SUPPORTED_CONTENT_TYPES = ['application/json', 'application/json;charset=UTF-8', 'application/x-www-form-urlencoded', 'text/plain', 'none'];

export class NetworkAware {
  public client: ThenableWebDriver;

  async getNetworkRequests(baseUrl: string, pathContains: string) {
    return this.client.executeScript('var performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance || {}; var network = performance.getEntries() || {}; return network;')
      .then((requests: any) => {
        let matchedRequests = requests.filter(r => r.name && r.name.startsWith(baseUrl));

        if (pathContains.length) {
          matchedRequests = matchedRequests.filter(r => (new URL(r.name).pathname.includes(pathContains) && pathContains));
        }

        return matchedRequests;
      });
  }

  private convertParamsToObject(params: URLSearchParams) {
    const result = {};

    if (isNullOrUndefined(params)) return result;

    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  evaluateRequests(requests, expectedParams = {}) {
    const matches = [];
    requests.forEach((request) => {
      let actualParams = {};
      actualParams = this.convertParamsToObject(new URL(request.name).searchParams);

      let matched = true;
      if (!isNullOrUndefined(expectedParams) && Object.keys(expectedParams).length > 0) {
        const intersection = Object.keys(actualParams).filter(f => Object.keys(expectedParams).includes(f));

        //// No properties matched; No way requests are matching
        if (intersection.length == 0 || intersection.length != Object.keys(expectedParams).length) {
          return [];
        }

        for (const [key, value] of Object.entries(actualParams)) {
          if (expectedParams.hasOwnProperty(key) && matched) {
            matched =  util.compare('be', value, expectedParams[key]);
          }
        }
      }

      if (matched) {
        matches.push(request);
      }

    });
    return matches;
  }
}
