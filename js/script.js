const PHONE="918807030143",MAP="https://www.google.com/maps/search/?api=1&query=Jasmine+Crackers+Kagganur+Sarjapura";
// EDIT ME: placeholder catalogue. Replace with real Jasmine Crackers data. price:null shows "Price on enquiry".
const CATEGORIES=["Sparklers","Fountains","Flower Pots","Sky Shots","Gift Boxes","Family Packs"];
const PRODUCTS=[
{name:"Sample sparkler pack",category:"Sparklers",description:"Placeholder. Replace with a real product.",price:null,pos:"10% 80%"},
{name:"Sample fountain",category:"Fountains",description:"Placeholder. Replace with a real product.",price:null,pos:"85% 55%"},
{name:"Sample flower pot",category:"Flower Pots",description:"Placeholder. Replace with a real product.",price:null,pos:"15% 40%"},
{name:"Sample sky shot",category:"Sky Shots",description:"Placeholder. Replace with a real product.",price:null,pos:"30% 55%"},
{name:"Sample gift box",category:"Gift Boxes",description:"Placeholder. Replace with a real product.",price:null,pos:"60% 60%"},
{name:"Sample family pack",category:"Family Packs",description:"Placeholder. Replace with a real product.",price:null,pos:"50% 85%"}];
const GALLERY=[{pos:"50% 30%",c:"b",img:"front"},{pos:"20% 30%",c:"w"},{pos:"85% 40%",c:"t"},{pos:"40% 75%"},{pos:"60% 15%"},{pos:"90% 85%",c:"w"},{pos:"5% 85%"},{pos:"50% 50%",c:"w"},{pos:"70% 70%"}];
const wa=t=>`https://wa.me/${PHONE}?text=${encodeURIComponent(t)}`;
const GEN="Hello Jasmine Crackers, I would like to enquire about your crackers and wholesale prices.";
const $=s=>document.querySelector(s),cart=new Set();
document.querySelectorAll("[data-wa]").forEach(a=>{a.href=wa(GEN);a.target="_blank";a.rel="noopener"});
let cat="All";
function chips(){$("#chips").innerHTML=["All",...CATEGORIES].map(c=>`<button class="chip ${c==cat?"on":""}" aria-pressed="${c==cat}">${c}</button>`).join("");
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cat=b.textContent;chips();grid()})}
function grid(){$("#grid").innerHTML=PRODUCTS.filter(p=>cat=="All"||p.category==cat).map((p,i)=>{const n=PRODUCTS.indexOf(p),on=cart.has(p.name);
return `<article class="pc" style="animation-delay:${i*50}ms"><div class="pi" style="background-position:${p.pos}" role="img" aria-label="${p.name} placeholder image"></div><div class="pb"><small>${p.category}</small><h3>${p.name}</h3><p>${p.description}</p><span class="price">${p.price?"₹"+p.price:"Price on enquiry"}</span><div class="pa"><button class="btn in" data-i="${n}">${on?"Added":"Add"}</button><a class="btn wa" style="animation:none" target="_blank" rel="noopener" href="${wa(`Hello Jasmine Crackers, I am interested in ${p.name}. Please share the price and availability.`)}">Ask</a></div></div></article>`}).join("");
document.querySelectorAll(".in").forEach(b=>b.onclick=()=>{const n=PRODUCTS[b.dataset.i].name;cart.has(n)?cart.delete(n):cart.add(n);b.textContent=cart.has(n)?"Added":"Add";tray()})}
function tray(){const a=[...cart];$("#cnt").textContent=a.length;$("#tray").classList.toggle("o",a.length>0);
$("#tl").innerHTML=a.map(n=>`<li>${n}<button aria-label="Remove ${n}" data-r="${n}">×</button></li>`).join("");
document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{cart.delete(b.dataset.r);grid();tray()});
document.querySelector("[data-send]").href=wa("Hello Jasmine Crackers, I would like to enquire about these items. Please share price and availability:\n"+a.map((n,i)=>`${i+1}. ${n}`).join("\n"))}
document.querySelector("[data-send]").target="_blank";
chips();grid();
$("#gal").innerHTML=GALLERY.map((g,i)=>`<button class="g ${g.c||""}" style="background-position:${g.pos};background-size:${g.img?"cover":g.c?"170%":"230%"}${g.img?";background-image:var(--front)":""}" data-img="${g.img||""}" aria-label="Enlarge shop photo ${i+1}" data-p="${g.pos}"></button>`).join("");
document.querySelectorAll(".g").forEach(g=>g.onclick=()=>{const d=$("#lb div");d.style.cssText=g.dataset.img?"background-image:var(--front);background-size:contain;background-repeat:no-repeat;background-position:center;height:85vh;aspect-ratio:auto;border:0;background-color:transparent":"";$("#lb").classList.add("o")});
$("#lb").onclick=()=>$("#lb").classList.remove("o");addEventListener("keydown",e=>e.key=="Escape"&&$("#lb").classList.remove("o"));
// nav
const nav=$("#nav"),L=$("#links"),B=$("#bg");
addEventListener("scroll",()=>nav.classList.toggle("s",scrollY>30),{passive:true});
B.onclick=()=>{const o=L.classList.toggle("o");B.setAttribute("aria-expanded",o)};
L.querySelectorAll("a").forEach(a=>a.onclick=()=>{L.classList.remove("o");B.setAttribute("aria-expanded",false)});
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".rv").forEach(e=>io.observe(e));
// fireworks
const rm=matchMedia("(prefers-reduced-motion:reduce)").matches,cv=$("#fx"),cx=cv.getContext("2d");let W,H,ps=[];
function rs(){const d=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
rs();addEventListener("resize",rs);
const COL=["#f3dc9a","#d9b25f","#e03a48","#fff4dc"];
function burst(x,y){const n=W<600?38:60,c=COL[Math.random()*4|0],c2=COL[Math.random()*4|0];
for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=1.5+Math.random()*2.6;ps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:i%3?c:c2})}}
let last=0,vis=true;
new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(cv);
function loop(t){requestAnimationFrame(loop);if(!vis)return;
cx.clearRect(0,0,W,H);
if(t-last>3600){last=t;burst(W*(.1+Math.random()*.8),H*(.15+Math.random()*.4))}
ps=ps.filter(p=>p.l>0);
for(const p of ps){p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy=p.vy*.97+.035;p.l-=.012;cx.globalAlpha=Math.max(p.l,0);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,1.8,0,7);cx.fill()}}
if(!rm){requestAnimationFrame(loop);cv.parentElement.addEventListener("pointerdown",e=>{if(e.target.closest("a,button"))return;const r=cv.getBoundingClientRect();burst(e.clientX-r.left,e.clientY-r.top)})}
else document.querySelector(".hint").remove();

// motion upgrades
(function(){
const pg=document.getElementById("pg");
addEventListener("scroll",()=>{pg.style.transform="scaleX("+(scrollY/(document.documentElement.scrollHeight-innerHeight||1))+")"},{passive:true});
if(rm)return;
// headline word reveal
const h=document.querySelector(".hero h1");let i=0;const frag=[];
h.childNodes.forEach(n=>{const g=n.nodeType==1,words=n.textContent.trim().split(/\s+/);
words.forEach(w=>{const s=document.createElement("span");s.className="hw"+(g?" gold":"");s.style.setProperty("--i",i++);s.textContent=w;frag.push(s,document.createTextNode(" "))});
if(!g&&/\s$/.test(n.textContent)){}});
h.setAttribute("aria-label",h.textContent);h.textContent="";frag.forEach(f=>h.appendChild(f));
// embers
const hero=document.querySelector(".hero");
for(let k=0;k<16;k++){const e=document.createElement("i");e.className="em";e.style.left=Math.random()*100+"%";e.style.setProperty("--dx",(Math.random()*80-40)+"px");e.style.animationDuration=(7+Math.random()*7)+"s";e.style.animationDelay=(-Math.random()*10)+"s";hero.insertBefore(e,hero.children[1])}
const fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
if(!fine)return;
// emblem tilt
const emb=document.querySelector(".emb");
hero.addEventListener("mousemove",e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;emb.style.transform=`perspective(800px) rotateY(${x*14}deg) rotateX(${-y*14}deg)`});
hero.addEventListener("mouseleave",()=>emb.style.transform="");
// card tilt
const gr=document.getElementById("grid");
gr.addEventListener("mousemove",e=>{const c=e.target.closest(".pc");if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(700px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`});
gr.addEventListener("mouseout",e=>{const c=e.target.closest(".pc");if(c&&!c.contains(e.relatedTarget))c.style.transform=""});
// magnetic buttons
document.querySelectorAll(".hero .btn,#order .btn").forEach(b=>{b.addEventListener("mousemove",e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`});b.addEventListener("mouseleave",()=>b.style.transform="")});
// gold sparkle trail
let lt=0;addEventListener("mousemove",e=>{const n=performance.now();if(n-lt<55)return;lt=n;const s=document.createElement("i");s.className="sp";s.style.left=e.clientX-3+"px";s.style.top=e.clientY-3+"px";s.style.setProperty("--x",(Math.random()*30-15)+"px");s.style.setProperty("--y",(Math.random()*30+4)+"px");document.body.appendChild(s);setTimeout(()=>s.remove(),800)});
})();

document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener("click",()=>{const c=$("#ct");c.classList.add("o");clearTimeout(c.t);c.t=setTimeout(()=>c.classList.remove("o"),7000)}));
$("#cc").onclick=async()=>{try{await navigator.clipboard.writeText("+918807030143");$("#cc").textContent="Copied"}catch(e){$("#cc").textContent="+918807030143"}setTimeout(()=>$("#cc").textContent="Copy number",2500)};

lucide.createIcons();
