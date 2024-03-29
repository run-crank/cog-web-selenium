import { BaseStep, ExpectedRecord, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../proto/cog_pb';

export class SeleniumEnterValueIntoField extends BaseStep implements StepInterface {

  protected stepName: string = 'Fill out a form field';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'use selenium to fill out (?<domQuerySelector>.+) with (?<value>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['interact'];
  protected targetObject: string = 'Fill out field';
  protected expectedFields: Field[] = [{
    field: 'selectBy',
    type: FieldDefinition.Type.STRING,
    description: 'Select by',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'domQuerySelector',
    type: FieldDefinition.Type.STRING,
    description: "Field's Selector",
  }, {
    field: 'value',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Field Value',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'form',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'selector',
      type: FieldDefinition.Type.STRING,
      description: 'Selector of the element',
    }, {
      field: 'input',
      type: FieldDefinition.Type.STRING,
      description: 'Value input on the Field',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const selectBy: string = stepData.selectBy || 'css';
    const selector: string = stepData.domQuerySelector;
    const value: any = stepData.value;

    if (selectBy && !['css', 'xpath', 'partialLinkText'].includes(selectBy)) {
      return this.error('Unsupported selection strategy. Please use css, xpath, or partialLinkText', [], []);
    }

    // Determine how to fill out the field, and then try.
    console.time('fillOutTime');
    console.log(`Fill out field ${selector} with value: ${value}`);
    try {
      await this.client.fillOutField(selector, value, selectBy);
      console.timeEnd('fillOutTime');
      return this.pass('Successfully filled out %s with %s', [selector, value], []);
    } catch (e) {
      console.timeEnd('fillOutTime');
      return this.error('There was a problem filling out %s with %s: %s', [selector, value, e.toString()], []);
    }
  }

  public createRecord(selector, input): StepRecord {
    const obj = {
      selector,
      input,
    };
    const record = this.keyValue('form', 'Filled out Field', obj);

    return record;
  }

  public createOrderedRecord(selector, input, stepOrder = 1): StepRecord {
    const obj = {
      selector,
      input,
    };
    const record = this.keyValue(`form.${stepOrder}`, `Filled out Field from Step ${stepOrder}`, obj);

    return record;
  }

}

export { SeleniumEnterValueIntoField as Step };
