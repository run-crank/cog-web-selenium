import * as grpc from 'grpc';
import { BasicInteractionAware } from './mixins';
import { Field } from '../core/base-step';
import { ThenableWebDriver } from 'selenium-webdriver';
import { NetworkAware } from './mixins/network';

class ClientWrapper {

  public static expectedAuthFields: Field[] = [];

  public client: ThenableWebDriver;
  public lighthouse: any;
  public clientReady: Promise<boolean>;
  public blobContainerClient: any;

  constructor(client: any, auth: grpc.Metadata, idMap) {
    this.client = client;
  }
}

interface ClientWrapper extends BasicInteractionAware, NetworkAware {}

applyMixins(ClientWrapper, [BasicInteractionAware, NetworkAware]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
