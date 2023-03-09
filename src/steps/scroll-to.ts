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
  }, {
    field: 'units',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: '% or px',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const depth: number = stepData.depth;
    const units: string = stepData.units || '%';

    if (!['%', 'px'].includes(units)) {
      return this.error('Invalid units. Please use either % or px.', [], []);
    }

    try {
      await this.client.scrollTo(depth, units);
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.pass('Successfully scrolled to %s%% of the page', [depth], [binaryRecord]);
    } catch (e) {
      const screenshot = await this.client.client.takeScreenshot();
      const binaryRecord = this.binary('screenshot', 'Screenshot', 'image/png', screenshot);
      return this.error(
        'There was a problem scrolling to %s%% of the page',
        [
          depth,
          e.toString(),
        ],
        [
          binaryRecord,
        ]);
    }
  }

}

export { SeleniumScrollTo as Step };
