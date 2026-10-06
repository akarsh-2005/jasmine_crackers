/* Jasmine Crackers: cart, checkout, order confirmation. Needs PRODUCTS, PHONE, wa() from script.js. */
const SHOP={
 deliveryEnabled:false,              // CLIENT: set true only once delivery is confirmed
 charges:(subtotal,orderType)=>[],   // CLIENT: delivery/tax later, e.g. [{label:"Delivery",amount:50}]
 orderApi:""                         // BACKEND: POST endpoint (e.g. "/api/orders"). Empty = no backend connected yet
};
(()=>{
const KEY="jc_cart_v1",Q=s=>document.querySelector(s),inr=n=>"₹"+new Intl.NumberFormat("en-IN").format(n);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const prod=id=>PRODUCTS.find(p=>p.id==id),priced=p=>typeof p.price=="number"&&p.price>=0,icons=()=>window.lucide&&lucide.createIcons();
let items=[],flash=null;
function restore(){let r=[];try{r=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){}
items=(Array.isArray(r)?r:[]).filter(i=>prod(i.id)&&prod(i.id).available!==false&&Number.isInteger(i.qty)&&i.qty>0).map(i=>({id:i.id,qty:Math.min(i.qty,99)}));save()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){}};
const count=()=>items.reduce((a,i)=>a+i.qty,0);
function totals(type){let sub=0,pending=0;items.forEach(i=>{const p=prod(i.id);priced(p)?sub+=p.price*i.qty:pending++});
const ch=SHOP.charges(sub,type)||[];return{sub,pending,ch,total:sub+ch.reduce((a,c)=>a+c.amount,0)}}
const line=i=>{const p=prod(i.id);return priced(p)?inr(p.price*i.qty):"On request"};
const unit=i=>{const p=prod(i.id);return priced(p)?inr(p.price)+" × "+i.qty:"Price on request × "+i.qty};
const thumb=p=>p.image?`background-image:url(${esc(p.image)});background-size:cover`:`background-position:${esc(p.pos)}`;
function sumHtml(type){const t=totals(type);return `<div class="sr"><span>Subtotal</span><span>${inr(t.sub)}</span></div>`+t.ch.map(c=>`<div class="sr"><span>${esc(c.label)}</span><span>${inr(c.amount)}</span></div>`).join("")+`<div class="sr t"><span>Total</span><b>${inr(t.total)}</b></div>`+(t.pending?`<p class="sn">${t.pending} item${t.pending>1?"s":""} priced on request. The shop will confirm the final price.</p>`:"")}
const row=i=>{const p=prod(i.id);return `<div class="ci2" data-row="${p.id}"><div class="th" style="${thumb(p)}"></div><div class="in2"><b>${esc(p.name)}</b><small>${unit(i)}</small><div class="qc"><button data-q="-1" aria-label="Decrease quantity" ${i.qty<=1?"disabled":""}>−</button><span class="${flash==p.id?"fl":""}">${i.qty}</span><button data-q="1" aria-label="Increase quantity" ${i.qty>=99?"disabled":""}>+</button><button class="rm" data-rm>Remove</button></div></div><div class="ls">${line(i)}</div></div>`};
const empty=(msg)=>`<div class="em2"><i data-lucide="shopping-cart"></i><h3>Your cart is waiting</h3><p>${msg||"Your selected crackers will appear here."}</p><a class="btn pri" href="#categories" data-go>Explore crackers</a></div>`;
// cart mutations
function change(fn,id){fn();flash=id;save();update();setTimeout(()=>flash=null,400)}
const add=(id,q=1)=>{const p=prod(id);if(!p||p.available===false)return;const i=items.find(x=>x.id==id);change(()=>i?i.qty=Math.min(99,i.qty+q):items.push({id,qty:q}),id)};
const setQty=(id,q)=>{const i=items.find(x=>x.id==id);q=Math.floor(Number(q));if(i&&q>=1&&q<=99)change(()=>i.qty=q,id)};
const remove=id=>{document.querySelectorAll(`[data-row="${id}"]`).forEach(r=>r.classList.add("out"));setTimeout(()=>change(()=>items=items.filter(x=>x.id!=id)),260)};
// drawer + view shells
document.body.insertAdjacentHTML("beforeend",`<div id="dov"></div><aside id="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart"></aside><div id="view" role="main"></div>`);
const D=Q("#drawer"),V=Q("#view"),B=Q("#cb");
function drawer(){const wam="Hello Jasmine Crackers, I would like to enquire about these items:\n"+items.map((i,n)=>`${n+1}. ${prod(i.id).name} × ${i.qty}`).join("\n");
D.innerHTML=`<div class="dh"><h3>Your cart (${count()})</h3><button class="x" data-close aria-label="Close cart">×</button></div><div class="db">${items.length?items.map(row).join(""):empty()}</div>`+(items.length?`<div class="df">${sumHtml("pickup")}<a class="btn pri" href="#/checkout">Proceed to checkout</a><button class="btn" data-close>Continue shopping</button><a class="sn" style="text-align:center;text-decoration:underline" target="_blank" rel="noopener" href="${wa(wam)}">Or send this list on WhatsApp</a></div>`:"");icons()}
const open=()=>{drawer();Q("#dov").classList.add("o");D.classList.add("o");document.documentElement.classList.add("lock");setTimeout(()=>D.querySelector(".x").focus(),50)};
const close=()=>{Q("#dov").classList.remove("o");D.classList.remove("o");if(!V.classList.contains("o"))document.documentElement.classList.remove("lock")};
function update(){const n=count();B.hidden=!n;B.textContent=n;B.classList.remove("bump");void B.offsetWidth;B.classList.add("bump");drawer();if(V.classList.contains("o")&&location.hash=="#/cart")cartPage()}
// pages
function cartPage(){V.innerHTML=`<div class="wrap vw"><a class="bk" href="#categories">← Continue shopping</a><h2>Your <span class="gold">cart</span></h2>`+(items.length?`<div class="two"><div class="card2">${items.map(row).join("")}</div><div class="card2 stk"><h3>Order summary</h3>${sumHtml("pickup")}<a class="btn pri big" href="#/checkout">Proceed to checkout</a></div></div><div class="sb"><div><small>Total</small><b>${inr(totals("pickup").total)}</b></div><a class="btn pri" href="#/checkout">Checkout</a></div>`:`<div class="card2">${empty()}</div>`)+`</div>`;icons()}
const fld=(id,l,o={})=>`<div class="f" data-f="${id}"><label for="${id}">${l}</label>${o.ta?`<textarea id="${id}" rows="3"></textarea>`:`<input id="${id}" type="${o.t||"text"}" ${o.m?`inputmode="${o.m}"`:""} autocomplete="${o.ac||"off"}">`}<span class="er" role="alert"></span></div>`;
function checkout(){if(!items.length){V.innerHTML=`<div class="wrap vw"><h2>Check<span class="gold">out</span></h2><div class="card2">${empty("Your cart is empty. Add products before proceeding.")}</div></div>`;icons();return}
const t=totals("pickup");
V.innerHTML=`<div class="wrap vw"><a class="bk" href="#/cart">← Back to cart</a><h2>Check<span class="gold">out</span></h2><div class="two"><form id="cf" novalidate class="card2"><fieldset><legend>Pickup${SHOP.deliveryEnabled?" or delivery":""}</legend><label class="op"><input type="radio" name="ot" value="pickup" checked>Store Pickup<small>Near Kagganur, Sarjapura</small></label>${SHOP.deliveryEnabled?`<label class="op"><input type="radio" name="ot" value="delivery">Delivery</label>`:""}<div class="er" id="ote"></div></fieldset>
<fieldset><legend>Your details</legend>${fld("name","Full name *",{ac:"name"})}${fld("mobile","Mobile number *",{t:"tel",m:"tel",ac:"tel"})}${fld("email","Email address (optional)",{t:"email",m:"email",ac:"email"})}
<div id="adr" hidden>${fld("address","Address *",{ta:1,ac:"street-address"})}<div class="g2">${fld("city","City",{ac:"address-level2"})}${fld("state","State",{ac:"address-level1"})}</div>${fld("pin","Pincode",{m:"numeric",ac:"postal-code"})}</div>${fld("notes","Additional instructions (optional)",{ta:1})}</fieldset>
<div class="al" id="fe" hidden></div><button class="btn pri big" id="po" type="submit">Place order</button></form>
<div class="card2 stk"><h3>Order summary</h3>${items.map(i=>{const p=prod(i.id);return `<div class="sr"><span>${esc(p.name)} × ${i.qty}${priced(p)?` <small>(${inr(p.price)} each)</small>`:""}</span><span>${line(i)}</span></div>`}).join("")}${sumHtml("pickup")}<a class="bk" href="#/cart">Edit cart</a></div></div>
<div class="sb"><div><small>Total</small><b>${inr(t.total)}</b></div><button class="btn pri" type="submit" form="cf">Place order</button></div></div>`;
V.querySelectorAll('[name=ot]').forEach(r=>r.onchange=()=>Q("#adr").hidden=Q('[name=ot]:checked').value!="delivery");
V.querySelectorAll(".f input,.f textarea").forEach(e=>e.oninput=()=>{e.closest(".f").classList.remove("bad");e.closest(".f").querySelector(".er").textContent=""});
Q("#cf").onsubmit=place;icons()}
const val=id=>(Q("#"+id)||{value:""}).value.trim();
function place(e){e.preventDefault();const type=(Q('[name=ot]:checked')||{}).value,err={},mob=val("mobile").replace(/[\s-]/g,"").replace(/^(\+91|91|0)(?=\d{10}$)/,"");
if(!items.length){fail("Your cart is empty. Add products before proceeding.");return}
if(!type)Q("#ote").textContent="Please select a pickup option.";
if(val("name").length<2)err.name="Please enter your name.";
if(!/^[6-9]\d{9}$/.test(mob))err.mobile="Please enter a valid mobile number.";
if(val("email")&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")))err.email="Please enter a valid email address.";
if(type=="delivery"){if(val("address").length<5)err.address="Please enter your delivery address.";if(val("pin")&&!/^\d{6}$/.test(val("pin")))err.pin="Please enter a valid 6-digit pincode."}
document.querySelectorAll(".f").forEach(f=>{const m=err[f.dataset.f];f.classList.toggle("bad",!!m);f.querySelector(".er").textContent=m||""});
const k=Object.keys(err)[0];if(k||!type){if(k)Q("#"+k).focus();return}
const t=totals(type),o={orderId:"",customer:{name:val("name"),mobile:mob,email:val("email"),address:type=="delivery"?val("address"):"",city:val("city"),state:val("state"),pincode:val("pin"),notes:val("notes")},
items:items.map(i=>{const p=prod(i.id);return{id:p.id,name:p.name,unitPrice:priced(p)?p.price:null,qty:i.qty,lineTotal:priced(p)?p.price*i.qty:null}}),
subtotal:t.sub,charges:t.ch,total:t.total,pricePending:t.pending,orderType:type,createdAt:new Date().toISOString(),status:"received"};
const b=Q("#po");b.disabled=true;b.textContent="Placing order…";
submitOrder(o).then(r=>{if(!r.ok){b.disabled=false;b.textContent="Place order";fail(r.msg||"We could not place your order. Your cart is safe. Please try again or order on WhatsApp.");return}
o.orderId=r.orderId||newId();o.stored=r.stored;if(r.server){const s=r.server;o.subtotal=s.subtotal;o.total=s.total;o.pricePending=s.price_pending;o.items=s.items.map(i=>({id:"",name:i.name,unitPrice:i.unit_price,qty:i.qty,lineTotal:i.line_total}))}try{sessionStorage.setItem("jc_last",JSON.stringify(o))}catch(x){}
items=[];save();update();location.hash="#/confirmation"})}
const fail=m=>{const f=Q("#fe");f.hidden=false;f.textContent=m};
// BACKEND CONNECTION POINT. Send only product ids + quantities + customer details; the server MUST re-price from its own catalogue
// and recompute subtotal/total (never trust these frontend numbers). No payment gateway here.
async function submitOrder(o){
if(window.sb){const{data,error}=await sb.rpc("place_order",{p_customer:o.customer,p_order_type:o.orderType,p_items:o.items.map(i=>({id:i.id,qty:i.qty}))});
if(error||!data)return{ok:false,msg:/unavailable/.test(error&&error.message||"")?"Some items are no longer available. Please review your cart and try again.":""};
return{ok:true,stored:true,orderId:data.order_code,server:data}}
if(!SHOP.orderApi)return{ok:true,stored:false};
try{const r=await fetch(SHOP.orderApi,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer:o.customer,orderType:o.orderType,items:o.items.map(i=>({id:i.id,qty:i.qty}))})});
if(!r.ok)throw 0;const d=await r.json().catch(()=>({}));return{ok:true,stored:true,orderId:d.orderId}}catch(e){return{ok:false}}}
function newId(){const d=new Date(),ds=d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");let c={};try{c=JSON.parse(localStorage.getItem("jc_seq")||"{}")}catch(e){}
const n=(c.d==ds?c.n:0)+1;try{localStorage.setItem("jc_seq",JSON.stringify({d:ds,n}))}catch(e){}return `JC-${ds}-${String(n).padStart(3,"0")}`}
function waMsg(o){const c=o.customer;return `Hello Jasmine Crackers,\n\nI would like to place the following order:\n\nOrder ID: ${o.orderId}\n\n`+o.items.map((i,n)=>`${n+1}. ${i.name} × ${i.qty} — ${i.lineTotal==null?"price on request":inr(i.lineTotal)}`).join("\n")+`\n\nTotal: ${inr(o.total)}${o.pricePending?` (+ ${o.pricePending} item(s) price to be confirmed)`:""}\n\nCustomer:\n${c.name}\n${c.mobile}\n${o.orderType=="pickup"?"Store pickup":"Delivery: "+[c.address,c.city,c.state,c.pincode].filter(Boolean).join(", ")}${c.notes?"\nNotes: "+c.notes:""}\n\nThank you.`}
function confirmPage(){let o;try{o=JSON.parse(sessionStorage.getItem("jc_last"))}catch(e){}if(!o){location.hash="#home";return}
V.innerHTML=`<div class="wrap vw cf"><i data-lucide="circle-check"></i><h2>Order placed <span class="gold">successfully</span></h2><p class="lead" style="margin:auto">Thank you for choosing Jasmine Crackers. Your order has been received.</p>
<div class="card2"><div class="sr"><span>Order ID</span><b style="color:var(--gold2)">${esc(o.orderId)}</b></div><div class="sr"><span>Name</span><span>${esc(o.customer.name)}</span></div><div class="sr"><span>${o.orderType=="pickup"?"Store pickup":"Delivery"}</span><span style="text-align:right">${o.orderType=="pickup"?"Near Kagganur, Sarjapura":esc([o.customer.address,o.customer.city,o.customer.pincode].filter(Boolean).join(", "))}</span></div>
${o.items.map(i=>`<div class="sr"><span>${esc(i.name)} × ${i.qty}</span><span>${i.lineTotal==null?"On request":inr(i.lineTotal)}</span></div>`).join("")}<div class="sr t"><span>Total</span><b>${inr(o.total)}</b></div>${o.pricePending?`<p class="sn">${o.pricePending} item(s) priced on request. The shop will confirm the final price.</p>`:""}</div>
<div class="al ${o.stored?"ok":""}">${o.stored?"The shop will contact you to confirm your order.":"This order is saved on this device only and has not reached the shop yet. Please tap Confirm via WhatsApp to send it."}</div>
<div class="row" style="margin-top:20px"><a class="btn wa" target="_blank" rel="noopener" href="${wa(waMsg(o))}"><i data-lucide="message-circle"></i>Confirm via WhatsApp</a><a class="btn pri" href="#categories">Continue shopping</a><a class="btn" href="tel:+${PHONE}"><i data-lucide="phone"></i>Contact Jasmine Crackers</a></div></div>`;icons()}
// router (hash based, works on any static host)
function route(){const h=location.hash,pg={"#/cart":cartPage,"#/checkout":checkout,"#/confirmation":confirmPage}[h];
if(!pg){V.classList.remove("o");document.body.classList.remove("vo");if(!D.classList.contains("o"))document.documentElement.classList.remove("lock");return}
close();pg();V.classList.add("o");V.scrollTop=0;document.body.classList.add("vo");document.documentElement.classList.add("lock")}
addEventListener("hashchange",route);
document.addEventListener("click",e=>{const t=e.target,a=t.closest("[data-add]"),r=t.closest("[data-row]"),q=t.closest("[data-q]");
if(a&&!a.disabled){add(a.dataset.add);const s=a.querySelector("span");a.classList.add("ok");s.textContent="Added to cart";setTimeout(()=>{a.classList.remove("ok");s.textContent="Add to cart"},1300)}
else if(q&&r)setQty(r.dataset.row,(items.find(x=>x.id==r.dataset.row)||{}).qty+Number(q.dataset.q));
else if(t.closest("[data-rm]")&&r)remove(r.dataset.row);
else if(t.closest("#cartbtn"))open();
else if(t.closest("[data-close]")||t.id=="dov")close();
else if(t.closest("[data-go]")){close();if(location.hash.startsWith("#/"))location.hash="#categories"}});
addEventListener("keydown",e=>e.key=="Escape"&&close());
const init=()=>{restore();B.hidden=!count();B.textContent=count();drawer();route()};
(window.productsReady||Promise.resolve()).then(init);
})();
