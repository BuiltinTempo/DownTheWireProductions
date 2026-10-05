const PACKAGES=[
{name:"Panasonic HC-X2 Kit",slug:"panasonic-hc-x2-kit",day:100,weekend:175,desc:"HC-X2 camera • tripod • battery • power"},
{name:"3× HC-X2 Package",slug:"3x-hc-x2",day:275,weekend:475,desc:"Three matching HC-X2 camera kits"},
{name:"6× HC-X2 Package",slug:"6x-hc-x2",day:500,weekend:850,desc:"Six matching HC-X2 camera kits"},
{name:"Micro Studio Camera 4K G2 Kit",slug:"micro-studio-4k-g2-kit",day:75,weekend:125,desc:"Micro Studio 4K G2 • lens • mount/support"},
{name:"4× Micro G2 Package",slug:"4x-micro-g2",day:250,weekend:425,desc:"Four matching Micro Studio G2 systems"},
{name:"8× Micro G2 Package",slug:"8x-micro-g2",day:450,weekend:750,desc:"Eight matching Micro Studio G2 systems"},
{name:"Blackmagic URSA G2 Package",slug:"ursa-g2-package",day:250,weekend:400,desc:"URSA G2 • 4 batteries • 2 chargers • support • power"},
{name:"15-position Comms",slug:"15-position-comms",day:550,weekend:900,desc:"15-position production communications system"},
{name:"2-position Dante Announce",slug:"2-position-dante-announce",day:300,weekend:475,desc:"Dante announce system with two tabletop announce kits"},
{name:"8× Sennheiser Nat Mics",slug:"8x-sennheiser-nat-mics",day:125,weekend:200,desc:"Eight Sennheiser natural-sound stick microphones"},
{name:"2× Sennheiser Wireless",slug:"2x-sennheiser-wireless",day:100,weekend:160,desc:"Two Sennheiser wireless microphone systems"},
{name:"Soundcraft Si32",slug:"soundcraft-si32",day:300,weekend:475,desc:"Soundcraft Si32 production console"},
{name:"DTW Multicam 6",slug:"dtw-multicam-6",day:750,weekend:null,desc:"Six HC-X2 production camera package"},
{name:"DTW Broadcast 14",slug:"dtw-broadcast-14",day:1250,weekend:null,desc:"6× HC-X2 + 8× Micro Studio Camera 4K G2 systems"},
{name:"DTW Broadcast 14 + Comms",slug:"dtw-broadcast-14-comms",day:1850,weekend:null,desc:"Broadcast 14 plus 15-position comms"}
];
const cart=new Map(),money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
function days(){const a=document.querySelector("#start-date").value,b=document.querySelector("#end-date").value;if(!a||!b)return 1;return Math.max(1,Math.ceil((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000));}
function price(p){const d=days();if(d>=3&&d<=4&&p.weekend)return p.weekend;return p.day*d}
function renderCatalog(){document.querySelector("#rental-catalog").innerHTML=PACKAGES.map(p=>`<article class="rental-product"><div class="product-top"><span class="package-label">DTW RENTAL</span><span class="availability-pill">STAGING</span></div><h3>${p.name}</h3><p>${p.desc}</p><div class="rate-line"><strong>${money(p.day)}</strong><span>/ day</span></div>${p.weekend?`<p class="weekend-rate">${money(p.weekend)} weekend</p>`:"<p class='weekend-rate'>Weekend by quote</p>"}<button class="btn btn-secondary add-rental" data-slug="${p.slug}" type="button">Add to Rental</button></article>`).join("");document.querySelectorAll(".add-rental").forEach(b=>b.onclick=()=>{const p=PACKAGES.find(x=>x.slug===b.dataset.slug);cart.set(p.slug,p);renderCart()})}
function renderCart(){const box=document.querySelector("#cart-items"),empty=document.querySelector("#cart-empty");empty.hidden=cart.size>0;box.innerHTML=[...cart.values()].map(p=>`<div class="cart-line"><div><strong>${p.name}</strong><small>${days()} rental day${days()>1?"s":""}</small></div><div><strong>${money(price(p))}</strong><button type="button" data-remove="${p.slug}" aria-label="Remove ${p.name}">×</button></div></div>`).join("");box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.delete(b.dataset.remove);renderCart()});const total=[...cart.values()].reduce((s,p)=>s+price(p),0);document.querySelector("#subtotal").textContent=money(total);document.querySelector("#reservation-payment").textContent=money(total*.5);document.querySelector("#balance").textContent=money(total*.5)}
document.querySelector("#check-dates").onclick=()=>{const s=document.querySelector("#start-date").value,e=document.querySelector("#end-date").value,n=document.querySelector("#availability-note");if(!s||!e){n.textContent="Choose both pickup and return dates.";return}if(new Date(e)<new Date(s)){n.textContent="Return date must be after pickup.";return}n.textContent="Staging preview only — live asset availability activates after physical inventory is entered.";renderCart()};
document.querySelectorAll("#start-date,#end-date").forEach(x=>x.onchange=renderCart);renderCatalog();renderCart();