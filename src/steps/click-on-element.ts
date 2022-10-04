import { BaseStep, ExpectedRecord, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../proto/cog_pb';

export class ClickOnElement extends BaseStep implements StepInterface {

  protected stepName: string = 'Click an element on a page';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'click the page element (?<domQuerySelector>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'domQuerySelector',
    type: FieldDefinition.Type.STRING,
    description: 'Element\'s DOM Query Selector',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'form',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'selector',
      type: FieldDefinition.Type.STRING,
      description: 'Selector of the element',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const selector: string = stepData.domQuerySelector;

    try {
      this.client.clickElement(selector);
      return this.pass('Successfully clicked element: %s', [selector], []);
    } catch (e) {
      return this.error(
        'There was a problem clicking element %s: %s', [selector, e.toString()], []);
    }
  }

  public createRecord(selector): StepRecord {
    const obj = {
      selector,
    };
    const record = this.keyValue('form', 'Clicked Element', obj);

    return record;
  }

  public createOrderedRecord(selector, stepOrder = 1): StepRecord {
    const obj = {
      selector,
    };
    const record = this.keyValue(`form.${stepOrder}`, `Clicked Element from Step ${stepOrder}`, obj);

    return record;
  }

}

export { ClickOnElement as Step };
