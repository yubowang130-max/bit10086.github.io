import test from 'node:test';
import assert from 'node:assert/strict';
import {CloudStore} from '../src/dashboard/cloud-store.js';

test('failed save preserves snapshot and retries with the same operation ID', async () => {
  let calls=[];
  const client={rpc:async(name,args)=>{calls.push({name,args}); return calls.length===1?{error:new Error('network')}:{data:1};}};
  const store=new CloudStore(client,'owner');
  const doc={version:1,tasks:[]};
  await assert.rejects(store.save(doc),/network/);
  doc.tasks.push('later edit');
  assert.deepEqual(store.pending.document.tasks,[]);
  await assert.rejects(store.save(doc),/CHAPTER_PENDING/);
  await store.retry();
  assert.equal(calls[0].args.p_write_id,calls[1].args.p_write_id);
  assert.equal(calls[1].args.p_owner_id,'owner');
  assert.equal(store.revision,1);
  assert.equal(store.pending,null);
});

test('revision conflict never silently advances or overwrites',async()=>{
  const store=new CloudStore({rpc:async()=>({error:new Error('CHAPTER_CONFLICT')})},'owner',4);
  await assert.rejects(store.save({version:1}),/CHAPTER_CONFLICT/);
  assert.equal(store.revision,4);
  assert.deepEqual(store.pending.document,{version:1});
});
