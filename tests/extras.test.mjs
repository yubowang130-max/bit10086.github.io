import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExtras} from '../src/dashboard/extra-data.js';
const snapshot=()=>({integrations:{ntulearn:{courseNames:{EE6407:'Example course'},fetchedAt:'2026-10-18T00:00:00Z',items:[{course:'EE6407',name:'Quiz',status:'Graded',due:null,score:8,max:10}]},phd:{updated:'2026-10-18',dirs:['Research'],schools:[{id:'school',name:'Example',site:'https://example.com',timeline:[],xhs:[],mentors:[{id:'mentor',name:'Example',unit:'Lab',topics:['Research'],evidence:'Example',url:'https://example.com',recruit:'unknown',verified:false}]}]}},phdPicks:{mentor:{s:'想联系',n:'Personal note'}}});
test('private snapshot and mentor selections round-trip',()=>assert.deepEqual(validateExtras(snapshot()),snapshot()));
test('reject executable links, unsafe identifiers and invalid grades',()=>{
 let x=snapshot();x.integrations.phd.schools[0].site='javascript:alert(1)';assert.throws(()=>validateExtras(x));
 x=snapshot();x.integrations.phd.schools[0].mentors[0].id='" onclick="bad';assert.throws(()=>validateExtras(x));
 x=snapshot();x.integrations.ntulearn.items[0].score='<script>';assert.throws(()=>validateExtras(x));
});
