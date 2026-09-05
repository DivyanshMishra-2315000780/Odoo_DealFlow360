import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
const origin=process.env.SMOKE_ORIGIN??'http://localhost:3000';
const tag='workflow-smoke-'+randomUUID();const email=tag+'@example.invalid';
let customerId;let userId;let assertions=0;
async function call(cookie,path,method='GET',body,expected=200){
 const response=await fetch(origin+'/api'+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie??''},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json();assert.equal(response.status,expected,path+': '+JSON.stringify(data.error??data.message??data));assertions++;
 return {data:data.data??data,cookie:response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
}
const accounts=[...fs.readFileSync('src/scripts/seed.ts','utf8').matchAll(/email: '([^']+)',\s*passwordHash: await bcrypt.hash\('([^']+)'/g)];
async function login(index){return (await call('','/auth/login','POST',{email:accounts[index][1],password:accounts[index][2]})).cookie;}
async function cleanup(){
 if(!userId)return;
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});const db=await pool.connect();
 try{await db.query('BEGIN');const identity=await db.query('select id from users where id=$1 and email=$2',[userId,email]);assert.equal(identity.rowCount,1,'Cleanup only owns the generated test identity');
 const quotes=(await db.query('select id from quotations where customer_id=$1',[customerId])).rows.map(r=>r.id);
 const steps=(await db.query('select s.id from approval_steps s join approval_requests r on r.id=s.request_id where r.quotation_id=any($1::text[])',[quotes])).rows.map(r=>r.id);
 const allocations=(await db.query('select a.*,f.status from fulfillment_allocations a join fulfillments f on f.id=a.fulfillment_id where f.quotation_id=any($1::text[])',[quotes])).rows;
 for(const a of allocations){if(['SHIPPED','DELIVERED'].includes(a.status))await db.query('update inventory set quantity_available=quantity_available+$1 where warehouse_id=$2 and product_id=$3',[a.allocated_qty,a.warehouse_id,a.product_id]);else await db.query('update inventory set quantity_reserved=quantity_reserved-$1 where warehouse_id=$2 and product_id=$3',[a.allocated_qty,a.warehouse_id,a.product_id]);}
 await db.query('delete from payments where invoice_id in(select id from invoices where customer_id=$1)',[customerId]);
 await db.query('delete from invoices where customer_id=$1',[customerId]);
 await db.query('delete from subscriptions where customer_id=$1',[customerId]);
 await db.query('delete from credit_notes where customer_id=$1',[customerId]);
 await db.query('delete from fulfillments where quotation_id=any($1::text[])',[quotes]);
 await db.query('delete from sales_orders where customer_id=$1',[customerId]);
 await db.query('delete from negotiations where customer_id=$1',[customerId]);
 await db.query('delete from quotations where customer_id=$1',[customerId]);
 await db.query('delete from quote_requests where customer_id=$1',[customerId]);
 await db.query('delete from audit_logs where actor_id=$1 or entity_id=any($2::text[])',[userId,[...quotes,...steps]]);
 await db.query('delete from customers where id=$1 and user_id=$2',[customerId,userId]);
 await db.query('delete from refresh_tokens where session_id in(select id from auth_sessions where user_id=$1)',[userId]);
 await db.query('delete from auth_sessions where user_id=$1',[userId]);
 await db.query('delete from users where id=$1 and email=$2',[userId,email]);
 await db.query('COMMIT');console.log('Removed only generated workflow fixtures and restored their inventory.');
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();await pool.end();}
}
try{
 const sales=await login(2),manager=await login(1),finance=await login(3);
 const registered=await call('','/auth/signup','POST',{email,password:'Smoke!'+randomUUID()+'Aa9',firstName:'Workflow',lastName:'Smoke',companyName:tag},201);
 userId=registered.data.user.userId;customerId=registered.data.user.customerId;const customer=registered.cookie;
 await call('','/quotes', 'GET',undefined,401);
 const catalog=(await call(sales,'/catalog')).data;
 const inventory=(await call(sales,'/warehouse-stock')).data;
 const hardware=catalog.find(p=>!p.isRecurring&&p.availableStock>1&&/hardware/i.test(p.categoryName));assert.ok(hardware,'A stocked hardware fixture is required');
 const warehouses=inventory.filter(i=>i.productId===hardware.id);const largest=Math.max(...warehouses.map(i=>i.quantityAvailable-i.quantityReserved));const total=warehouses.reduce((n,i)=>n+i.quantityAvailable-i.quantityReserved,0);
 const quantity=total>largest?largest+1:1;const recurring=catalog.find(p=>p.isRecurring);
 const rfq=(await call(customer,'/quote-requests','POST',{title:tag,description:'Synthetic integration test for the full commercial workflow.',items:[{description:hardware.name,quantity}]},201)).data;
 await call(sales,'/quote-requests/'+rfq.id,'PATCH',{});
 const lines=[{productId:hardware.id,quantity,discountPercentage:0},...(recurring?[{productId:recurring.id,quantity:1,discountPercentage:0}]:[])];
 let quote=(await call(sales,'/quotes','POST',{quoteRequestId:rfq.id,lines},201)).data;const id=quote.id;
 assert.equal(quote.lines.length,lines.length);assertions++;
 await call(customer,'/quotes/'+id,'GET',undefined,403);
 await call(sales,'/quotes/'+id+'/submit','POST');
 assert.ok(!(await call(finance,'/approvals')).data.some(a=>a.request.quotationId===id));assertions++;
 async function decide(role,action='approve'){const pending=(await call(role,'/approvals')).data.find(a=>a.request.quotationId===id);assert.ok(pending,'Pending role step');assertions++;await call(role,'/approvals/'+pending.step.id+'/'+action,'POST',{comment:'Synthetic workflow validation'});return pending.step.id;}
 await decide(manager,'revision');
 quote=(await call(sales,'/quotes/'+id,'PATCH',{lines:lines.map(l=>({...l,discountPercentage:5}))})).data;
 await call(sales,'/quotes/'+id+'/submit','POST');const step=await decide(manager);
 await call(manager,'/approvals/'+step+'/approve','POST',{},409);
 await decide(finance);await call(sales,'/quotes/'+id+'/send','POST');
 const publicQuote=(await call(customer,'/quotes/'+id)).data;assert.equal(publicQuote.totalCost,undefined);assert.equal(publicQuote.lines[0].unitCost,undefined);assertions+=2;
 await call(customer,'/quotes/'+id+'/negotiate','POST',{requestType:'COUNTER_OFFER',customerNotes:'Synthetic discount validation',changes:[{quotationLineId:quote.lines[0].id,fieldChanged:'discountPercentage',requestedValue:101}]},400);
 await call(customer,'/quotes/'+id+'/negotiate','POST',{requestType:'COUNTER_OFFER',customerNotes:'Synthetic counter-offer',changes:[{quotationLineId:quote.lines[0].id,fieldChanged:'discountPercentage',requestedValue:20}]},201);
 await call(customer,'/quotes/'+id+'/confirm','POST',undefined,409);
 await call(sales,'/quotes/'+id+'/negotiate','PATCH',{action:'APPROVE'});
 quote=(await call(sales,'/quotes/'+id)).data;assert.equal(quote.lines[0].discountStatus,'EXCEEDED');assertions++;
 await decide(manager);await decide(finance);
 const confirmed=(await call(customer,'/quotes/'+id+'/confirm','POST')).data;
 await call(customer,'/quotes/'+id+'/confirm','POST',undefined,409);
 const fulfillment=confirmed.fulfillment.id;
 await call(sales,'/fulfillment/'+fulfillment,'PATCH',{status:'SHIPPED'},409);
 const recommended=(await call(sales,'/fulfillment/'+fulfillment+'/recommend')).data;
 const allocations=recommended.allocations.map(({productId,warehouseId,allocatedQty})=>({productId,warehouseId,allocatedQty}));
 if(total>largest){assert.ok(new Set(allocations.map(a=>a.warehouseId)).size>1);assertions++;}
 await call(sales,'/fulfillment/'+fulfillment+'/confirm','POST',{allocations});
 await call(sales,'/fulfillment/'+fulfillment,'PATCH',{status:'SHIPPED'});
 const delivered=(await call(sales,'/fulfillment/'+fulfillment,'PATCH',{status:'DELIVERED'})).data;
 const invoice=delivered.invoice;const amount=Number(invoice.total);const partial=Math.floor(amount*50)/100;
 await call(customer,'/payments','POST',{invoiceId:invoice.id,amount:partial,method:'TEST_LEDGER',reference:tag+'-partial'},403);
 await call(finance,'/payments','POST',{invoiceId:invoice.id,amount:partial,method:'TEST_LEDGER',reference:tag+'-partial'});
 await call(finance,'/payments','POST',{invoiceId:invoice.id,amount:partial,method:'TEST_LEDGER',reference:tag+'-partial'});
 let billing=(await call(customer,'/invoices/'+invoice.id)).data;assert.equal(billing.invoice.status,'PARTIALLY_PAID');assertions++;
 await call(finance,'/payments','POST',{invoiceId:invoice.id,amount:Number(billing.invoice.amountDue),method:'TEST_LEDGER',reference:tag+'-final'});
 quote=(await call(sales,'/quotes/'+id)).data;assert.equal(quote.status,'COMPLETED');assert.ok(quote.auditTrail.length>=6);assertions+=2;
 const health=(await call(sales,'/deal-health/'+id)).data;assert.ok(health.health||health.healthScore!==undefined);assertions++;
 if(recurring){const subs=(await call(customer,'/subscriptions')).data;const sub=subs.find(s=>s.subscription.orderId===confirmed.order.id);assert.ok(sub);assertions++;await call(finance,'/subscriptions/'+sub.subscription.id+'/simulate-change','POST',{newQuantity:2});await call(finance,'/subscriptions/'+sub.subscription.id,'PATCH',{newQuantity:2});await call(finance,'/subscriptions/'+sub.subscription.id,'PATCH',{status:'CANCELED'});}
 console.log('PASS: '+assertions+' checks covering RFQ, revision, ordered approvals, counter-offer reapproval, split fulfillment, billing, partial/idempotent settlement, subscriptions, health and audit.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{await cleanup();}
