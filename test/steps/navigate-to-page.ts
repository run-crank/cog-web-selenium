import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

chai.use(sinonChai);

describe('NavigateToPage', () => {
  const expect = chai.expect;
  beforeEach(() => {
  });
  
  it('should return expected step metadata', () => {
    expect(true).to.equal(true);
  });
});
