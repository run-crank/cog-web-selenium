import { Promise as Bluebird } from 'bluebird';
import { keyCodes } from '../_shared/constants/key-codes.constant';
import { WebElement, By, until, Key } from 'selenium-webdriver';

export class BasicInteractionAware {
  // public client: Page;
  public client: any;
  public lighthouse: any;
  public clientReady: Promise<boolean>;
  public blobContainerClient: any;

  public async navigateToUrl(url: string, browser: string = 'chrome', size: string = null) {
    console.log('>>>>> inside navigateToUrl basic interaction');
    console.timeLog('time');

    let response;
    switch (size) {
      case 'small':
        await this.client.manage().window().setRect({
          height: 800,
          width: 360,
        });
        break;
      case 'medium':
        await this.client.manage().window().setRect({
          height: 720,
          width: 1280,
        });
        break;
      case 'large':
        await this.client.manage().window().setRect({
          height: 1080,
          width: 1920,
        });
        break;
      default:
        await this.client.manage().window().maximize();
    }

    try {
      response = await this.client.get(url);
    } catch (e) {
      throw Error(`Error navigating to ${url} - Error: ${e}`);
    }
    console.log('response', response);
    console.log('>>>>> checkpoint: finished navigating to page or timed out');
    console.timeLog('time');
    return;
  }

  public async fillOutField(selector: string, value: any, selectBy: string = 'css') {
    let webElement;
    let fieldMethod;
    try {
      await this.client.wait(until.elementLocated(By[selectBy](selector)), 5000);
      webElement = await this.client.findElement(By[selectBy](selector));
    } catch (e) {
      throw Error(`Could not find field with selector: ${selector} - Error: ${e}`);
    }

    try {
      fieldMethod = await this.getFieldMethod(webElement);
    } catch (e) {
      throw Error(`Unable to fill out field: ${e}`);
    }

    switch (fieldMethod) {
      case 'choose':
        try {
          await this.selectOption(webElement, value);
        } catch (e) {
          throw Error("Drop down may not be visible or isn't selectable.");
        }
        break;

      case 'tick':
        if (value) {
          try {
            const checked = await webElement.getAttribute('checked');
            if (!!value !== !!checked) {
              await webElement.click();
            }
          } catch (e) {
            throw Error("Checkbox may not be visible or isn't checkable.");
          }
        }
        break;

      case 'type':
        try {
          await webElement.sendKeys(value);
        } catch (e) {
          throw Error("Field may not be visible, or exist, or it can't be typed in.");
        }
        break;
    }
  }

  public async clickElement(selector: string, selectBy: string = 'css') {
    try {
      await this.client.wait(until.elementLocated(By[selectBy](selector)), 5000);
      const webElement =  await this.client.findElement(By[selectBy](selector));
      await this.client.wait(until.elementIsEnabled(webElement), 1000);
      await webElement.click();
    } catch (e) {
      throw Error(`Element may not be visible or clickable: ${e}`);
    }
  }

  public async focusFrame(domQuerySelector: string, selectBy: string = 'css') {
    if (domQuerySelector === 'main') {
      await this.client.switchTo().defaultContent();
    } else if (domQuerySelector.startsWith('index=')) {
      const index = domQuerySelector.slice(6);
      try {
        await this.client.wait(until.ableToSwitchToFrame(Number(index)), 5000);
        await this.client.switchTo().frame(Number(index));
      } catch (e) {
        throw Error(`Could not find frame with index: ${index} - Error: ${e}`);
      }
    } else {
      try {
        await this.client.wait(until.elementLocated(By[selectBy](domQuerySelector)), 5000);
        await this.client.switchTo().frame(await this.client.findElement(By[selectBy](domQuerySelector)));
      } catch (e) {
        throw Error(`Could not find frame with selector: ${domQuerySelector} - Error: ${e}`);
      }
    }
  }

  public async scrollTo(depth: number, units: string = '%') {
    try {
      // Perform scroll.
      await this.client.executeScript(
        (d, units) => {
          const floatValue = d / 100;
          window.scroll({
            left: 0,
            top: units === '%' ? document.body.scrollHeight * floatValue : d,
            behavior: 'smooth',
          });
        },
        depth,
        units,
      );

      // Wait until scroll completes. @see https://stackoverflow.com/a/57867348/12064302
      await this.client.executeScript(() => {
        return new Promise((resolve) => {
          let lastPos = null;
          let sameCount = 0;
          window.requestAnimationFrame(checkScrollY);

          // This function will be called every painting frame for the duration
          // of the smooth scroll operation.
          function checkScrollY() {
            // Check our current position
            const newPos = window.scrollY;

            // If the current position is the same as the last, and it was the
            // same as the last for two frames in a row, then scroll completed.
            if (newPos === lastPos) {
              sameCount = sameCount + 1;
              if (sameCount > 2) {
                // Once a scroll completes, regardless of if it landed at the
                // exact right location, we can consider the scroll complete.
                return resolve(null);
              }
            } else {
              // Otherwise, reset our counter and set our current position.
              sameCount = 0;
              lastPos = newPos;
            }

            // Check again during next painting frame
            window.requestAnimationFrame(checkScrollY);
          }
        });
      });
    } catch (e) {
      throw Error(`Unable to scroll to ${depth} percent depth: ${e}`);
    }
  }

  public async pressKey(key: string) {
    if (!keyCodes[key]) throw Error('Key is invalid');
    try {
      await this.client.actions().keyDown(Key[keyCodes[key]]).perform();
    } catch (e) {
      throw Error(`Unable to press key: ${e}`);
    }
  }

  // public async clickElement(selector: string) {
  //   try {
  //     let response;
  //     await this.client['___currentFrame'].waitForTimeout(selector);
  //     await Promise.all([
  //       new Promise(async (resolve, reject) => {
  //         try {
  //           response = await this.client['___currentFrame'].waitForNavigation({ timeout: 15000 });
  //           resolve(null);
  //         } catch (e) {
  //           // If the page does not navigate, resolve and do nothing
  //           resolve(null);
  //         }
  //       }),
  //       new Promise(async (resolve, reject) => {
  //         try {
  //           // In the event a click handler prevents others from firing,
  //           // always resolve after 5s.
  //           setTimeout(resolve.bind(null, true), 5000);

  //           let clickSuccess;
  //           // First, try clicking using document.querySelector().click()
  //           try {
  //             clickSuccess = await this.client['___currentFrame'].waitForFunction(
  //               (selector) => {
  //                 try {
  //                   document.querySelector(selector).click();
  //                   return true;
  //                 } catch (e) {
  //                   return false;
  //                 }
  //               },
  //               { timeout: 2500},
  //               selector,
  //             );
  //           } catch (error) {
  //             clickSuccess = false;
  //           }

  //           // If the first click fails, try using the frame.click from puppeteer
  //           if (!clickSuccess) {
  //             await this.client['___currentFrame'].waitForSelector(selector);
  //             await this.client['___currentFrame'].click(selector);
  //           }

  //           resolve(null);
  //         } catch (e) {
  //           // Stringify the error so that it yields useful info when caught
  //           // outside the context of the evaulation.
  //           reject(e.toString());
  //         }
  //       }),
  //     ]);
  //     if (response) {
  //       // Stash this response on the client. Adding the data to the client is the
  //       // only way to persist this response object between steps.
  //       // @see this.getCurrentPageInfo()
  //       this.client['___lastResponse'] = response;
  //     }
  //   } catch (e) {
  //     throw Error('Element may not be visible or clickable');
  //   }
  // }

  // /**
  //  * Attempts to navigate to the given URL. If an error occurred, this method
  //  * throws an error. Otherwise, it will resolve on successful navigation.
  //  *
  //  * @param {String} url - The URL of the page to nagivate to.
  //  * @param {Boolean} throttle - Will throttle down the browser speed. Defaults to false.
  //  * @param {Number} maxInflightRequests - Max number of network connections in flight before navigation is considered done. Defaults to 0.
  //  * @param {Number} networkIdleTime - Time in ms that the network must be idle before navigation is considered done. Defaults to 500.
  //  */
  // public async navigateToUrl(url: string, throttle: boolean = false, maxInflightRequests: number = 0) {
  //   console.log('>>>>> inside navigateToUrl basic interaction');
  //   console.timeLog('time');
  //   this.client['__networkRequests'] = null;
  //   const browser = await this.client.browser();
  //   const ua = await browser.userAgent();
  //   console.log('>>>>> checkpoint 1: finished setting up browser');
  //   console.timeLog('time');
  //   if (throttle) {
  //     // Connect to Chrome DevTools and set throttling. Consider making this its
  //     // own step in the future.
  //     // @see https://fdalvi.github.io/blog/2018-02-05-puppeteer-network-throttle/
  //     const devTools = await this.client.target().createCDPSession();
  //     await devTools.send('Network.emulateNetworkConditions', {
  //       offline: false,
  //       downloadThroughput: 1.5 * 1024 * 1024 / 8,
  //       uploadThroughput: 750 * 1024 / 8,
  //       latency: 40,
  //     });
  //   }
  //   const waitUntilSetting = maxInflightRequests === 0 ? 'networkidle0' : 'networkidle2';
  //   // Make ourselves identifiable and set a more realistic desktop browser size.
  //   // Note: We do not use "Headless" in our UA name, because Marketo's Cloudfront
  //   // configuration blocks requests from UAs matching that pattern.
  //   await this.client.setUserAgent(ua.replace(' Chrome', ' AutomatonChrome'));
  //   await this.client.setViewport({ width: 1280, height: 960 });
  //   console.log('>>>>> checkpoint 2: finished setting UA and viewport');
  //   console.timeLog('time');
  //   const response = await this.client.goto(url, { waitUntil: waitUntilSetting, timeout: 90000 });
  //   console.log('>>>>> RESPONSE:', response);
  //   console.log('>>>>> checkpoint 3: finished navigating to page or timed out after 90s');
  //   console.timeLog('time');
  //   // Run solveRecaptchas() as soon as page loads, will automatically solve captchas even if they appear later
  //   if (process.env.CAPTCHA_TOKEN) {
  //     await this.client.solveRecaptchas();
  //     // Also loops through all iFrames to solve captchas within
  //     for (const frame of this.client.mainFrame().childFrames()) {
  //       await frame.solveRecaptchas();
  //     }
  //   }
  //   console.log('>>>>> checkpoint 4: finished finding/solving captchas');
  //   console.timeLog('time');

  //   // Stash this response on the client. Adding the data to the client is the
  //   // only way to persist this response object between steps.
  //   // @see this.getCurrentPageInfo()
  //   this.client['___lastResponse'] = response;

  //   // Set the current active frame by:
  //   this.client['___currentFrame'] = this.client.mainFrame();
  //   console.log('>>>>> checkpoint 5: end of navigateToUrl basic interaction');
  //   console.timeLog('time');
  // }

  // /**
  //  * Attempts to fill in the given value into the field denoted by the given
  //  * DOM query selector. If there was an error, this method throws an error.
  //  * Otherwise, it will resolve on successful form field fill.
  //  *
  //  * @param {String} selector - The DOM Query Selector of the element.
  //  * @param {*} value - The value to enter into the field.
  //  */
  // public async fillOutField(selector: string, value: any) {
  //   const fieldMethod = await this.getFieldMethod(selector);

  //   // Based on type of field, fill out / click / select value.
  //   switch (fieldMethod) {
  //     case 'choose':
  //       try {
  //         await this.client['___currentFrame'].select(selector, value);
  //       } catch (e) {
  //         throw Error("Drop down may not be visible or isn't selectable.");
  //       }
  //       break;

  //     case 'tick':
  //       if (value) {
  //         try {
  //           await this.client['___currentFrame'].evaluate(
  //             (selector) => {
  //               document.querySelector(selector).click();
  //               if (!document.querySelector(selector).checked) {
  //                 document.querySelector(selector).checked = true;
  //               }
  //               return true;
  //             },
  //             selector,
  //           );
  //         } catch (e) {
  //           throw Error("Checkbox may not be visible or isn't checkable.");
  //         }
  //       }
  //       break;

  //     case 'radio':
  //       try {
  //         await this.client['___currentFrame'].evaluate(
  //           (selector) => {
  //             document.querySelector(selector).click();
  //             if (!document.querySelector(selector).checked) {
  //               document.querySelector(selector).checked = true;
  //             }
  //             return true;
  //           },
  //           `${selector}[value="${value}"]`,
  //         );
  //       } catch (e) {
  //         throw Error("Radio button may not be visible or isn't selectable.");
  //       }
  //       break;

  //     case 'type':
  //       try {
  //         await this.client['___currentFrame'].waitForSelector(selector, { visible: true, timeout: 5000 });
  //         await this.client['___currentFrame'].type(selector, value);
  //         await this.client['___currentFrame'].evaluate(
  //           (selector, value) => {
  //             document.querySelector(selector).blur();
  //             return true;
  //           },
  //           selector, value,
  //         );
  //       } catch (e) {
  //         try {
  //           await this.client['___currentFrame'].evaluate(
  //             (selector, value) => {
  //               document.querySelector(selector).focus();
  //               document.querySelector(selector).value = value;
  //               document.querySelector(selector).blur();
  //               return true;
  //             },
  //             selector, value,
  //           );
  //         } catch (e) {
  //           throw Error("Field may not be visible, or exist, or it can't be typed in.");
  //         }
  //       }
  //       break;
  //   }
  // }

  // /**
  //  * Attempts to submit a form by clicking a button with a given DOM Query
  //  * Selector. If there was a problem submitting the form, this method will
  //  * throw an error. If the form was submitted successfully, it will resolve.
  //  *
  //  * @param {String} selector - DOM Query Selector of the button to click.
  //  */
  // public async submitFormByClickingButton(selector: string) {
  //   // Set up wait handlers and attempt to click the button. Uses Bluebird.some()
  //   // set to 3/4 to catch as many cases as possible, including:
  //   // - Click worked, redirected, and therefore button is gone.
  //   // - Click worked, no redirect, but button is gone and it's been 10s
  //   await this.client['___currentFrame'].waitForSelector(selector);
  //   await Bluebird.some(
  //     [
  //       new Promise((res, rej) => {
  //         this.client['___currentFrame'].waitForNavigation({ timeout: 15000 })
  //           .then((response) => {
  //             if (!response) {
  //               throw new Error;
  //             }
  //             // Stash this response on the client. Adding the data to the client is the
  //             // only way to persist this response object between steps.
  //             // @see this.getCurrentPageInfo()
  //             this.client['___lastResponse'] = response;
  //           })
  //           .then(res)
  //           .catch((e) => rej(Error('Page did not redirect')));
  //       }),
  //       new Promise((res, rej) => {
  //         this.client['___currentFrame'].waitForFunction(
  //           (selector) => {
  //             const el = document.querySelector(selector);
  //             return !el || el.offsetParent === null;
  //           },
  //           { timeout: 15000 },
  //           selector,
  //         )
  //           .then(res)
  //           .catch((e) => rej(Error('Submit button still there')));
  //       }),
  //       new Promise((res, rej) => {
  //         this.client['___currentFrame'].waitForFunction(
  //           (selector) => {
  //             try {
  //               document.querySelector(selector).click();
  //               return true;
  //             } catch (e) {
  //               return false;
  //             }
  //           },
  //           {},
  //           selector,
  //         )
  //           .then(res)
  //           .catch((e) => rej(Error('Unable to click submit button')));
  //       }),
  //       new Promise((res, rej) => {
  //         this.client['___currentFrame'].waitFor(10000)
  //           .then(res)
  //           .catch((e) => rej(Error('Waited for 10 seconds')));
  //       }),
  //     ],
  //     3,
  //   );
  // }

  /**
   * Returns a method name representing how to enter a value into an element,
   * found using the given DOM Query Selector.
   *
   * @param {String} webElement - The webElement to evaluate.
   * @returns {String} - One of choose (for select elements), tick (for
   *   checkbox inputs), or type (for any other input).
   */
  private async getFieldMethod(webElement: WebElement) {
    let method: string;
    const tagName = await webElement.getTagName();
    const type = await webElement.getAttribute('type');

    if (tagName === 'select') {
      method = 'choose';
    } else if (tagName === 'input' && ['checkbox', 'radio'].includes(type)) {
      method = 'tick';
    } else {
      method = 'type';
    }
    return method;
  }

  private async selectOption(webElement, value) {
    let desiredOption;
    // Click to open up dropdown
    await webElement.click();

    const options = await webElement.findElements(By.css('option'));
    // Evaluate all of the options to find the desired option.
    console.time('evaluatingOptions');
    for (let i = 0; i < options.length; i = i + 1) {
      const text = await options[i].getText();
      if (value === text) {
        console.log('Found Option: ', text);
        desiredOption = options[i];
        break;
      }
    }
    console.timeEnd('evaluatingOptions');

    if (desiredOption) {
      console.log('DESIRED OPTION FOUND');
      await desiredOption.click();
    } else {
      console.log('ERROR - DESIRED OPTION NOT FOUND');
    }
  }
}
