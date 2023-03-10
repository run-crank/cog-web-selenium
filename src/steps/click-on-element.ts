import { BaseStep, ExpectedRecord, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../proto/cog_pb';

export class SeleniumClickOnElement extends BaseStep implements StepInterface {

  protected stepName: string = 'Click an element on a page';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'use selenium to click the page element (?<domQuerySelector>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['interact'];
  protected targetObject: string = 'Click an element';
  protected expectedFields: Field[] = [{
    field: 'selectBy',
    type: FieldDefinition.Type.STRING,
    description: 'Select by',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'domQuerySelector',
    type: FieldDefinition.Type.STRING,
    description: 'Element\'s Selector',
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
    const selectBy: string = stepData.selectBy || 'css';
    const selector: string = stepData.domQuerySelector;

    if (selectBy && !['css', 'xpath', 'partialLinkText'].includes(selectBy)) {
      return this.error('Unsupported selection strategy. Please use css, xpath, or partialLinkText', [], []);
    }

    const selectorMap = {
      css: 'CSS Selector',
      xpath: 'XPath',
      partialLinkText: 'Link Text',
    };

    try {
      this.client.clickElement(selector, selectBy);
      return this.pass('Successfully clicked element using %s: %s', [selectorMap[selectBy], selector], []);
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

export { SeleniumClickOnElement as Step };
