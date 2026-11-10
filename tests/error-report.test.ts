import {test} from 'node:test';
import assert from 'node:assert/strict';
import {describeError} from '../src/error-report.ts';
test('errors are described briefly whatever was thrown',()=>{
 assert.equal(describeError(new Error('boom')),'boom');assert.equal(describeError('oops'),'oops');
 assert.equal(describeError({code:7}),'{"code":7}');assert.equal(describeError(''),'неизвестная ошибка');
 assert.equal(describeError('x'.repeat(300)).length,140);
});
