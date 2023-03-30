import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';
import { URL } from 'url';

export class SeleniumCheckNetworkRequestStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check for a specific network request';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'use selenium to find (?<reqCount>\\d+) matching network requests? for (?<baseUrl>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Network Request (Specific)';
  protected expectedFields: Field[] = [{
    field: 'reqCount',
    type: FieldDefinition.Type.NUMERIC,
    description: '# of Requests',
  }, {
    field: 'baseUrl',
    type: FieldDefinition.Type.URL,
    description: 'Base URL Is',
  }, {
    field: 'pathContains',
    type: FieldDefinition.Type.STRING,
    description: 'Path Contains',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'withParameters',
    type: FieldDefinition.Type.MAP,
    description: 'Parameters Include',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const reqCount = stepData.reqCount;
    const baseUrl = stepData.baseUrl;
    const pathContains = stepData.pathContains || '';
    const withParameters = stepData.withParameters;

    try {
      //// This will ensure that NavigateTo was called
      await this.client.client.getCurrentUrl();

      console.time('networkRequestTime');
      console.log('Evaluating network requests')
      const matchingRequests = await this.client.getNetworkRequests(baseUrl, pathContains);
      const evaluatedRequests = this.client.evaluateRequests(matchingRequests, withParameters);
      console.timeEnd('networkRequestTime');

      const records = [];
      if (evaluatedRequests.length !== reqCount) {
        let table;
        if (evaluatedRequests.length > 1) {
          table = this.createTable(evaluatedRequests);
          records.push(table);
        }
        return this.fail(
          'Expected %d matching network request(s), but %d were found:\n\n', [
            reqCount,
            evaluatedRequests.length,
          ],
          records);
      }
      if (evaluatedRequests.length > 0) {
        records.push(this.createTable(evaluatedRequests));
      }
      return this.pass(
        '%d network requests found, as expected',
        [
          evaluatedRequests.length,
        ],
        records);
    } catch (e) {
      return this.error('There was a problem checking network request: %s', [
        e.toString(),
      ]);
    }
  }

  private createTable(requests) {
    const headers = {};
    const rows = [];
    headers['url'] = 'url';
    requests.forEach((request) => {
      const url = new URL(request.name);
      const params = this.getUrlParams(request.name);
      params['url'] = `${url.origin}${url.pathname}`;
      rows.push(params);
    });
    const headerKeys = Object.keys(rows[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    return this.table('networkRequests', 'Network Requests', headers, rows);
  }
}

export { SeleniumCheckNetworkRequestStep as Step };
