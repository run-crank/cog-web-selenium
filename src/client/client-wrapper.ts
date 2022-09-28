import * as grpc from 'grpc';
import { BasicInteractionAware } from './mixins';
import { Field } from '../core/base-step';
import { Builder, Browser, By, Key, until } from 'selenium-webdriver';

class ClientWrapper {

  public static expectedAuthFields: Field[] = [];

  public client: Browser;
  public lighthouse: any;
  public clientReady: Promise<boolean>;
  public blobContainerClient: any;

  constructor(client: any, auth: grpc.Metadata) {
    console.log('constructing............');
    this.clientReady = new Promise(async (resolve, reject) => {
      try {
        this.client = await new Builder().forBrowser(Browser.FIREFOX).build();
        console.log(this.client);
      } catch (e) {
        console.log(e);
      }
    });
  }
}

interface ClientWrapper extends BasicInteractionAware { }

applyMixins(ClientWrapper, [BasicInteractionAware]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
