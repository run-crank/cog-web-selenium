import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord } from '../proto/cog_pb';

export class SeleniumFocusOnFrame extends BaseStep implements StepInterface {

  protected stepName: string = 'Focus on Frame';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'use selenium to focus on the (?<domQuerySelector>.+) frame';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['interact'];
  protected targetObject: string = 'Focus on frame';
  protected expectedFields: Field[] = [{
    field: 'selectBy',
    type: FieldDefinition.Type.STRING,
    description: 'Select by',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'domQuerySelector',
    type: FieldDefinition.Type.STRING,
    description: 'The iframe\'s DOM query selector, or "main" for the main frame',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const selectBy: string = stepData.selectBy || 'css';
    const iframeSelector: string = stepData.domQuerySelector;

    if (selectBy && !['css', 'xpath', 'partialLinkText'].includes(selectBy)) {
      return this.error('Unsupported selection strategy. Please use css, xpath, or partialLinkText', [], []);
    }

    console.time('focusFrameTime');
    console.log('Focusing on iframe: ', iframeSelector);
    try {
      await this.client.focusFrame(iframeSelector, selectBy);
      console.timeEnd('focusFrameTime');
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      const record = this.createRecord(iframeSelector);
      const orderedRecord = this.createOrderedRecord(iframeSelector, stepData['__stepOrder']);
      return this.pass('Successfully focused on frame %s', [iframeSelector], [binaryRecord, record, orderedRecord]);
    } catch (e) {
      console.timeEnd('focusFrameTime');
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.error(
        'Unable to focus on frame %s, the frame may no longer exist on the page: %s',
        [
          iframeSelector,
          e.toString(),
        ],
        [
          binaryRecord,
        ]);
    }
  }

  public createRecord(frame): StepRecord {
    const obj = {
      frame,
    };
    const record = this.keyValue('form', 'Focused on Frame', obj);

    return record;
  }

  public createOrderedRecord(frame, stepOrder = 1): StepRecord {
    const obj = {
      frame,
    };
    const record = this.keyValue(`form.${stepOrder}`, `Focused on Frame from Step ${stepOrder}`, obj);

    return record;
  }

}

export { SeleniumFocusOnFrame as Step };
