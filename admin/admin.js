/* Admin app. All permissions are enforced by the database (supabase/schema.sql); this UI is only a convenience layer. */
(()=>{
const Q=s=>document.querySelector(s),A=Q("#app"),inr=n=>n==null?"On request":"₹"+new Intl.NumberFormat("en-IN").format(n);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=s=>s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"item";
const STATUS={available:"Available",out_of_stock:"Out of stock",hidden:"Hidden",archived:"Archived"},OSTAT=["pending","confirmed","processing","ready","completed","cancelled"];
let tt;function toast(m,e){const t=Q("#toast");t.textContent=m;t.className="o"+(e?" e":"");clearTimeout(tt);tt=setTimeout(()=>t.className="",3500)}
const LOAD_ERR="Unable to load data. Please check your connection and try again.";
if(!window.sb){A.innerHTML='<div class="lg"><div class="lc"><h1>Not configured</h1><small>Supabase is not connected. Set SUPABASE_URL and SUPABASE_ANON_KEY (see README).</small></div></div>';return}
const go=p=>location.replace(p),isAdmin=async u=>{const{data}=await sb.from("admins").select("user_id").eq("user_id",u.id).maybeSingle();return!!data};
if(document.body.dataset.page=="login")login();else dash();

async function login(){
 const{data:{session}}=await sb.auth.getSession();if(session&&await isAdmin(session.user))return go("/admin/dashboard/");
 A.innerHTML=`<div class="lg"><form class="lc" id="lf" novalidate><img src="/images/logo.jpg" alt=""><h1>Jasmine Crackers Admin</h1><small>Authorised staff only</small>
 <label>Email<input id="em" type="email" autocomplete="username" required></label><label>Password<input id="pw" type="password" autocomplete="current-password" required></label><div class="er" id="le" role="alert"></div><button class="btn p" id="lb">Login</button></form></div>`;
 Q("#lf").onsubmit=async e=>{e.preventDefault();const b=Q("#lb"),er=Q("#le");er.textContent="";b.disabled=true;b.textContent="Signing in…";
  const{data,error}=await sb.auth.signInWithPassword({email:Q("#em").value.trim(),password:Q("#pw").value});
  if(error){er.textContent="Incorrect email or password.";b.disabled=false;b.textContent="Login";return}
  if(!await isAdmin(data.user)){await sb.auth.signOut();er.textContent="This account does not have admin access.";b.disabled=false;b.textContent="Login";return}
  go("/admin/dashboard/")}}

let cats=[],view="dashboard";
async function dash(){
 const{data:{session}}=await sb.auth.getSession();if(!session||!await isAdmin(session.user))return go("/admin/login/");
 sb.auth.onAuthStateChange(ev=>{if(ev=="SIGNED_OUT")go("/admin/login/")});
 const nav=[["dashboard","Dashboard"],["products","Products"],["categories","Categories"],["orders","Orders"],["settings","Settings"]];
 A.innerHTML=`<div class="tb"><button class="btn s" id="mb" aria-label="Menu">☰</button><b>Jasmine Crackers Admin</b></div><div class="shell"><aside id="sd"><div class="br"><img src="/images/logo.jpg" alt=""><div><b>Jasmine Crackers</b><small>Admin</small></div></div>${nav.map(n=>`<a href="#${n[0]}" data-v="${n[0]}">${n[1]}</a>`).join("")}<div class="sp"></div><button class="nv" id="lo">Logout</button></aside><main id="mn"></main></div>`;
 Q("#mb").onclick=()=>Q("#sd").classList.toggle("o");Q("#lo").onclick=async()=>{await sb.auth.signOut();go("/admin/login/")};
 const show=()=>{view=(location.hash||"#dashboard").slice(1);if(!nav.some(n=>n[0]==view))view="dashboard";Q("#sd").classList.remove("o");document.querySelectorAll("aside a").forEach(a=>a.classList.toggle("on",a.dataset.v==view));({dashboard:vDash,products:vProd,categories:vCat,orders:vOrd,settings:vSet})[view]()};
 addEventListener("hashchange",show);show()}
const main=h=>{Q("#mn").onclick=null;Q("#mn").innerHTML=h},fail=()=>main(`<p class="er">${LOAD_ERR}</p>`);
async function loadCats(){const{data,error}=await sb.from("categories").select("*").order("display_order").order("name");if(error)throw error;cats=data}

async function vDash(){main("<h2>Dashboard</h2><p class='mu'>Loading…</p>");
 try{const[p,c,o]=await Promise.all([sb.from("products").select("status"),sb.from("categories").select("id",{count:"exact",head:true}),sb.from("orders").select("status")]);if(p.error||c.error||o.error)throw 0;
 const n=s=>p.data.filter(x=>x.status==s).length,cd=(l,v)=>`<div class="cd"><small>${l}</small><b>${v}</b></div>`;
 main(`<h2>Dashboard</h2><div class="cards">${cd("Total products",p.data.length-n("archived"))}${cd("Available",n("available"))}${cd("Out of stock",n("out_of_stock"))}${cd("Hidden",n("hidden"))}${cd("Categories",c.count)}${cd("Pending orders",o.data.filter(x=>x.status=="pending").length)}${cd("Total orders",o.data.length)}</div>`)}catch(e){fail()}}

// ---------- products ----------
let prods=[];
async function vProd(){main("<h2>Product management</h2><p class='mu'>Loading…</p>");
 try{await loadCats();const{data,error}=await sb.from("products").select("*").order("display_order").order("name");if(error)throw error;prods=data}catch(e){return fail()}
 main(`<h2>Product management</h2><div class="bar"><input id="q" type="search" autocomplete="off" placeholder="Search crackers..." aria-label="Search"><select id="fs"><option value="">All</option>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select><select id="fc"><option value="">All categories</option>${cats.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><button class="btn p" id="ad">+ Add new cracker</button></div><div id="pl"></div>`);
 const cn=id=>(cats.find(x=>x.id==id)||{}).name||"";
 // Built once; searching/filtering only shows or hides rows (no re-render), so typing stays instant.
 Q("#pl").innerHTML=`<table class="rs"><thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>${prods.map(p=>`<tr data-n="${esc((p.name+" "+cn(p.category_id)).toLowerCase())}" data-s="${p.status}" data-c="${p.category_id}"><td data-l="Image">${p.image_url?`<img class="th" src="${esc(p.image_url)}" alt="" loading="lazy" decoding="async">`:'<span class="th"></span>'}</td><td data-l="Product"><b>${esc(p.name)}</b></td><td data-l="Category">${esc(cn(p.category_id))}</td><td data-l="Price">${inr(p.price)}</td><td data-l="Order">${p.display_order}</td><td data-l="Status"><span class="bd ${p.status}">${STATUS[p.status]}</span></td><td class="nl"><div class="act"><button class="btn s" data-e="${p.id}">Edit</button>${["available","out_of_stock"].includes(p.status)?`<button class="btn s" data-t="${p.id}">${p.status=="available"?"Mark out of stock":"Mark available"}</button>`:""}${p.status!="archived"?`<button class="btn s d" data-d="${p.id}">Delete</button>`:""}</div></td></tr>`).join("")}</tbody></table><p class="mu" id="pnone" hidden>No products found.</p>`;
 const draw=()=>{const q=Q("#q").value.trim().toLowerCase(),s=Q("#fs").value,c=Q("#fc").value;let n=0;Q("#pl").querySelectorAll("tbody tr").forEach(r=>{const ok=(s?r.dataset.s==s:r.dataset.s!="archived")&&(!c||r.dataset.c==c)&&(!q||r.dataset.n.includes(q));r.hidden=!ok;if(ok)n++});Q("#pnone").hidden=n>0};
 let dt;draw();Q("#q").oninput=()=>{clearTimeout(dt);dt=setTimeout(draw,120)};Q("#fs").onchange=draw;Q("#fc").onchange=draw;Q("#ad").onclick=()=>pform();
 Q("#pl").onclick=async e=>{const b=e.target.closest("button");if(!b)return;const p=prods.find(x=>x.id==(b.dataset.e||b.dataset.t||b.dataset.d));if(!p)return;
  if(b.dataset.e)pform(p);
  if(b.dataset.t){const{error}=await sb.from("products").update({status:p.status=="available"?"out_of_stock":"available"}).eq("id",p.id);error?toast("Could not update. Please try again.",1):(toast("Availability updated."),vProd())}
  if(b.dataset.d)confirmBox("Are you sure you want to delete this product?","Delete product",async()=>{const{error}=await sb.from("products").update({status:"archived"}).eq("id",p.id);error?toast("Could not delete. Please try again.",1):(toast("Product deleted. Past orders keep their original details."),vProd())})}}
function modal(h){const o=document.createElement("div");o.className="ov";o.innerHTML=`<div class="md" role="dialog" aria-modal="true">${h}</div>`;document.body.appendChild(o);const x=()=>{o.remove();document.removeEventListener("keydown",k)},k=e=>e.key=="Escape"&&x();document.addEventListener("keydown",k);o.onmousedown=e=>{if(e.target==o)x()};o.close=x;return o}
function confirmBox(msg,label,fn){const m=modal(`<h3>${esc(msg)}</h3><div class="ft"><button class="btn" id="c1">Cancel</button><button class="btn p" id="c2">${label}</button></div>`);m.querySelector("#c1").onclick=m.close;m.querySelector("#c2").onclick=async()=>{m.close();await fn()}}
async function resize(file){const img=await createImageBitmap(file),r=Math.min(1,800/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
 let b=await new Promise(r=>c.toBlob(r,"image/webp",.82));return b&&b.type=="image/webp"?[b,"webp"]:[await new Promise(r=>c.toBlob(r,"image/jpeg",.82)),"jpg"]}
function pform(p){const n=!p,mx=Math.max(0,...prods.map(x=>x.display_order))+1;let file=null,img=p&&p.image_url||"";
 const m=modal(`<h3>${n?"Add new cracker":"Edit cracker"}</h3><form id="pf" novalidate style="display:grid;gap:12px"><label>Product name *<input id="pn" value="${esc(p&&p.name)}" maxlength="120"></label>
 <div class="g2"><label>Category *<select id="pc"><option value="">Select…</option>${cats.map(c=>`<option value="${c.id}" ${p&&p.category_id==c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label><label>Price (₹) *<input id="pp" type="number" inputmode="decimal" min="0" step="0.01" value="${p&&p.price!=null?p.price:""}"></label></div>
 <label>Description<textarea id="pd" rows="3" maxlength="600">${esc(p&&p.description)}</textarea></label>
 <div class="g2"><label>Availability<select id="ps">${["available","out_of_stock","hidden"].map(k=>`<option value="${k}" ${(p?p.status:"available")==k?"selected":""}>${STATUS[k]}</option>`).join("")}</select></label><label>Display order<input id="po" type="number" step="1" value="${p?p.display_order:mx}"></label></div>
 <label>Product code / SKU (optional)<input id="pk" value="${esc(p&&p.sku)}" maxlength="40"></label>
 <div><label>Product image (JPG, PNG or WEBP)<input id="pi" type="file" accept="image/jpeg,image/png,image/webp"></label><div style="display:flex;gap:12px;align-items:center;margin-top:8px"><img id="pv" class="pv" alt="" ${img?`src="${esc(img)}"`:"hidden"}><button type="button" class="btn s" id="pr" ${img?"":"hidden"}>Remove image</button></div></div>
 <div class="er" id="pe" role="alert"></div><div class="ft"><button type="button" class="btn" id="px">Cancel</button><button class="btn p" id="psv">Save</button></div></form>`);
 const V=i=>m.querySelector(i);V("#px").onclick=m.close;
 V("#pi").onchange=e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(jpeg|png|webp)$/.test(f.type)){V("#pe").textContent="Please choose a JPG, PNG or WEBP image.";e.target.value="";return}if(f.size>10e6){V("#pe").textContent="Image is too large (max 10 MB).";e.target.value="";return}V("#pe").textContent="";file=f;V("#pv").src=URL.createObjectURL(f);V("#pv").hidden=false;V("#pr").hidden=false};
 V("#pr").onclick=()=>{file=null;img="";V("#pv").hidden=true;V("#pr").hidden=true;V("#pi").value=""};
 V("#pf").onsubmit=async e=>{e.preventDefault();const er=V("#pe"),name=V("#pn").value.trim(),price=V("#pp").value,ord=parseInt(V("#po").value,10);er.textContent="";
  if(name.length<2)return er.textContent="Please enter a product name.";if(!V("#pc").value)return er.textContent="Please select a category.";if(price===""||isNaN(+price)||+price<0)return er.textContent="Please enter a valid price.";if(isNaN(ord))return er.textContent="Please enter a display order number.";
  const b=V("#psv");b.disabled=true;b.textContent="Saving…";
  try{let url=img;if(file){const[blob,ext]=await resize(file),path=`${crypto.randomUUID()}.${ext}`,up=await sb.storage.from("product-images").upload(path,blob,{contentType:blob.type,cacheControl:"31536000"});if(up.error)throw up.error;url=sb.storage.from("product-images").getPublicUrl(path).data.publicUrl}
   let s=slug(name),k=s,i=1;const taken=new Set(prods.filter(x=>!p||x.id!=p.id).map(x=>x.slug));while(taken.has(k))k=`${s}-${++i}`;
   const row={name,slug:p&&p.name==name?p.slug:k,description:V("#pd").value.trim()||null,sku:V("#pk").value.trim()||null,category_id:V("#pc").value,price:+(+price).toFixed(2),image_url:url||null,status:V("#ps").value,display_order:ord};
   const{error}=n?await sb.from("products").insert(row):await sb.from("products").update(row).eq("id",p.id);if(error)throw error;
   m.close();toast(n?"Product added successfully.":"Product updated successfully.");vProd()}
  catch(x){er.textContent="Could not save. Please check your connection and try again.";b.disabled=false;b.textContent="Save"}}}

// ---------- categories ----------
async function vCat(){main("<h2>Categories</h2><p class='mu'>Loading…</p>");let cnt={};
 try{await loadCats();const{data,error}=await sb.from("products").select("category_id");if(error)throw error;data.forEach(x=>cnt[x.category_id]=(cnt[x.category_id]||0)+1)}catch(e){return fail()}
 main(`<h2>Categories</h2><div class="bar"><input id="cn" placeholder="New category name" maxlength="60"><button class="btn p" id="ca">+ Add category</button></div><table class="rs"><thead><tr><th>Name</th><th>Products</th><th>Actions</th></tr></thead><tbody>${cats.map(c=>`<tr><td data-l="Name"><b>${esc(c.name)}</b></td><td data-l="Products">${cnt[c.id]||0}</td><td class="nl"><div class="act"><button class="btn s" data-r="${c.id}">Rename</button><button class="btn s d" data-x="${c.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>`);
 Q("#ca").onclick=async()=>{const n=Q("#cn").value.trim();if(!n)return;const{error}=await sb.from("categories").insert({name:n,slug:slug(n),display_order:Math.max(0,...cats.map(c=>c.display_order))+1});error?toast(/duplicate/.test(error.message)?"That category already exists.":"Could not add category.",1):(toast("Category added."),vCat())};
 main_cat_events(cnt)}
function main_cat_events(cnt){Q("#mn").onclick=e=>{const b=e.target.closest("button[data-r],button[data-x]");if(!b)return;const c=cats.find(x=>x.id==(b.dataset.r||b.dataset.x));
 if(b.dataset.r){const m=modal(`<h3>Rename category</h3><label>Name<input id="rn" value="${esc(c.name)}" maxlength="60"></label><div class="ft"><button class="btn" id="r1">Cancel</button><button class="btn p" id="r2">Save</button></div>`);m.querySelector("#r1").onclick=m.close;
  m.querySelector("#r2").onclick=async()=>{const n=m.querySelector("#rn").value.trim();if(!n)return;const{error}=await sb.from("categories").update({name:n,slug:slug(n)}).eq("id",c.id);error?toast("Could not rename (name may already exist).",1):(m.close(),toast("Category updated."),vCat())}}
 else{const k=cnt[c.id]||0,others=cats.filter(x=>x.id!=c.id);
  if(!k)return confirmBox(`Delete category "${c.name}"?`,"Delete category",async()=>{const{error}=await sb.from("categories").delete().eq("id",c.id);error?toast("Could not delete.",1):(toast("Category deleted."),vCat())});
  if(!others.length)return toast("Add another category first, then move these products to it.",1);
  const m=modal(`<h3>"${esc(c.name)}" still has ${k} product${k>1?"s":""}</h3><p class="mu">Move them to another category to delete this one.</p><label>Move products to<select id="mv">${others.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join("")}</select></label><div class="ft"><button class="btn" id="m1">Cancel</button><button class="btn p" id="m2">Move and delete</button></div>`);m.querySelector("#m1").onclick=m.close;
  m.querySelector("#m2").onclick=async()=>{const u=await sb.from("products").update({category_id:m.querySelector("#mv").value}).eq("category_id",c.id);if(u.error)return toast("Could not move products.",1);const d=await sb.from("categories").delete().eq("id",c.id);m.close();d.error?toast("Could not delete.",1):(toast("Products moved and category deleted."),vCat())}}}}

// ---------- orders ----------
async function vOrd(){main("<h2>Orders</h2><p class='mu'>Loading…</p>");let os;
 try{const{data,error}=await sb.from("orders").select("*,order_items(*)").order("created_at",{ascending:false}).limit(200);if(error)throw error;os=data}catch(e){return fail()}
 const dt=d=>new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
 main(`<h2>Orders</h2>${os.length?`<table class="rs"><thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${os.map(o=>`<tr style="cursor:pointer" data-o="${o.id}"><td data-l="Order ID"><b>${esc(o.order_code)}</b></td><td data-l="Customer">${esc(o.customer_name)}</td><td data-l="Phone">${esc(o.phone)}</td><td data-l="Date">${dt(o.created_at)}</td><td data-l="Total">${inr(o.total)}${o.price_pending?" +":""}</td><td data-l="Status"><span class="bd ${o.status}">${o.status}</span></td></tr>`).join("")}</tbody></table>`:'<p class="mu">No orders yet.</p>'}`);
 Q("#mn").onclick=e=>{const r=e.target.closest("[data-o]");if(!r)return;const o=os.find(x=>x.id==r.dataset.o);
  const m=modal(`<h3>${esc(o.order_code)}</h3><div class="sr"><span>Customer</span><span>${esc(o.customer_name)}</span></div><div class="sr"><span>Phone</span><span>${esc(o.phone)}</span></div><div class="sr"><span>Email</span><span>${esc(o.email||"-")}</span></div><div class="sr"><span>Order type</span><span>${o.order_type=="pickup"?"Store pickup":"Delivery"}</span></div>${o.order_type=="delivery"?`<div class="sr"><span>Address</span><span>${esc([o.address,o.city,o.state,o.pincode].filter(Boolean).join(", "))}</span></div>`:""}${o.notes?`<div class="sr"><span>Notes</span><span>${esc(o.notes)}</span></div>`:""}
  <b>Products</b>${o.order_items.map(i=>`<div class="sr"><span>${esc(i.product_name)} × ${i.qty}</span><span>${inr(i.line_total)}</span></div>`).join("")}<div class="sr"><span>Subtotal</span><span>${inr(o.subtotal)}</span></div><div class="sr"><b>Total</b><b>${inr(o.total)}</b></div>${o.price_pending?`<p class="mu">${o.price_pending} item(s) had no price. Confirm the final price with the customer.</p>`:""}<div class="sr"><span>Placed</span><span>${dt(o.created_at)}</span></div>
  <label>Order status<select id="os">${OSTAT.map(s=>`<option ${o.status==s?"selected":""} value="${s}">${s[0].toUpperCase()+s.slice(1)}</option>`).join("")}</select></label><div class="ft"><button class="btn" id="o1">Close</button><button class="btn p" id="o2">Update status</button></div>`);
  m.querySelector("#o1").onclick=m.close;m.querySelector("#o2").onclick=async()=>{const{error}=await sb.from("orders").update({status:m.querySelector("#os").value}).eq("id",o.id);error?toast("Could not update status.",1):(m.close(),toast("Order status updated."),vOrd())}}}

// ---------- settings ----------
async function vSet(){main("<h2>Settings</h2><p class='mu'>Loading…</p>");let s={};
 try{const{data,error}=await sb.from("settings").select("*");if(error)throw error;data.forEach(x=>s[x.key]=x.value)}catch(e){return fail()}
 const F=[["business_name","Business name","Jasmine Crackers"],["phone","Phone number","+91 88070 30143"],["whatsapp","WhatsApp number (digits with country code)","918807030143"],["instagram_url","Instagram URL","https://www.instagram.com/jasmine_crackers/"],["maps_url","Google Maps URL","https://www.google.com/maps/search/?api=1&query=Jasmine+Crackers+Kagganur+Sarjapura"]];
 main(`<h2>Settings</h2><p class="mu" style="margin-bottom:12px">Leave a field empty to keep the website's current details.</p><form id="sf" class="md" style="width:min(560px,100%)">${F.map(f=>`<label>${f[1]}<input id="s_${f[0]}" value="${esc(s[f[0]])}" placeholder="${esc(f[2])}"></label>`).join("")}<div class="ft"><button class="btn p">Save settings</button></div></form>`);
 Q("#sf").onsubmit=async e=>{e.preventDefault();const wa=Q("#s_whatsapp").value.trim();if(wa&&!/^\d{10,15}$/.test(wa))return toast("WhatsApp number must be digits only, including country code.",1);
  const{error}=await sb.from("settings").upsert(F.map(f=>({key:f[0],value:Q("#s_"+f[0]).value.trim(),updated_at:new Date().toISOString()})));error?toast("Could not save settings.",1):toast("Settings saved.")}}
})();
