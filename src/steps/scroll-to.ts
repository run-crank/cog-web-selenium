import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class SeleniumScrollTo extends BaseStep implements StepInterface {

  protected stepName: string = 'Scroll on a web page';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'use selenium to scroll to (?<depth>\\d+)(?<units>px|%) of the page';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['interact'];
  protected targetObject: string = 'Scroll';
  protected expectedFields: Field[] = [{
    field: 'depth',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Depth',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const depth: number = stepData.depth;
    const units: string = stepData.units || '%';

    if (!['%', 'px'].includes(units)) {
      return this.error('Invalid units. Please use either % or px.', [], []);
    }

    console.time('scrollTime');
    console.log(`Scrolling to depth: ${depth}${units}`);
    try {
      await this.client.scrollTo(depth, units);
      console.timeEnd('scrollTime');
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.pass('Successfully scrolled to %s%s of the page', [depth, units], [binaryRecord]);
    } catch (e) {
      console.timeEnd('scrollTime');
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.error(
        'There was a problem scrolling to %s%s of the page: %s',
        [
          depth,
          units,
          e.toString(),
        ],
        [
          binaryRecord,
        ]);
    }
  }

}

export { SeleniumScrollTo as Step };
