import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class SeleniumPressKey extends BaseStep implements StepInterface {

  protected stepName: string = 'Press a Key';
  protected stepExpression: string = 'use selenium to press the (?<key>.+) key';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'key',
    type: FieldDefinition.Type.STRING,
    description: 'Key to be pressed',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const key: string = stepData.key;

    try {
      await this.client.pressKey(key);
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.pass('Successfully pressed key: %s', [key], [binaryRecord]);
    } catch (e) {
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.error(
        'There was a problem pressing key %s: %s',
        [
          key,
          e.toString(),
        ],
        [
          binaryRecord,
        ]);
    }
  }

}

export { SeleniumPressKey as Step };
