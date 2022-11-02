import { BaseStep, ExpectedRecord, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../proto/cog_pb';

export class SeleniumNavigateToPage extends BaseStep implements StepInterface {

  protected stepName: string = 'Navigate to a webpage';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'navigate using selenium (?<browser>.+) to (?<webPageUrl>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'browser',
    type: FieldDefinition.Type.STRING,
    description: 'On which browser would you want to navigate?',
  }, {
    field: 'webPageUrl',
    type: FieldDefinition.Type.URL,
    description: 'Page URL',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'form',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'url',
      type: FieldDefinition.Type.STRING,
      description: 'Url to navigate to',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    console.log('>>>>> INSIDE NAVIGATE-TO-PAGE STEP');
    const stepData: any = step.getData().toJavaScript();
    const browser: string = stepData.browser;
    const url: string = stepData.webPageUrl;
    try {
      console.time('time');
      console.log('>>>>> STARTED TIMER FOR NAVIGATE-TO-PAGE STEP');
      await this.client.navigateToUrl(url, browser);
      console.log('>>>>> checkpoint: finished navigating, ending timer');
      console.timeEnd('time');
      return this.pass('Successfully navigated to %s', [url], []);
    } catch (e) {
      console.log(e);
      return this.error('Unable to navigate to %s: %s', [url, JSON.stringify(e)], []);
    }
  }

  public createRecord(url): StepRecord {
    const obj = {
      url,
    };
    const record = this.keyValue('form', 'Navigated to Page', obj);

    return record;
  }

  public createOrderedRecord(url, stepOrder = 1): StepRecord {
    const obj = {
      url,
    };
    const record = this.keyValue(`form.${stepOrder}`, `Navigated to Page from Step ${stepOrder}`, obj);

    return record;
  }

}

export { SeleniumNavigateToPage as Step };
