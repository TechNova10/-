const OWNER_EMAIL="zadaxxgb@gmail.com",OWNER_DEFAULT_PASSWORD="TechNova@2026!",ADMIN_AUTH_KEY="technova_admin_users_v1";let currentAdmin=null;
const TECHNOVA_API=String(window.TECHNOVA_API_URL||"").replace(/\/$/,"");
async function apiRequest(path, options={}){
  if(!TECHNOVA_API || TECHNOVA_API.includes("SEU-SERVICO")) throw new Error("API não configurada");
  const r=await fetch(TECHNOVA_API+path,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(body.error||("HTTP "+r.status));
  return body;
}
async function syncProductsFromAPI(){
  try{
    const list=await apiRequest("/admin/products",{cache:"no-store"});
    localStorage.setItem("technova_products_v1",JSON.stringify(list));
    return list;
  }catch(e){
    console.warn("API indisponível; usando cache local.",e);
    return getAdminProducts();
  }
}

function getAdminUsers(){
  const owner={id:"owner",name:"Proprietário TechNova",email:OWNER_EMAIL,password:OWNER_DEFAULT_PASSWORD,role:"owner"};
  try{
    const a=JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY)||"null");
    if(Array.isArray(a)){
      const withoutOwner=a.filter(x=>String(x.email||"").toLowerCase()!==OWNER_EMAIL);
      const admins=withoutOwner.filter(x=>x&&x.role!=="owner").map(x=>({...x,role:"admin"}));
      const result=[owner,...admins];
      localStorage.setItem(ADMIN_AUTH_KEY,JSON.stringify(result));
      return result;
    }
  }catch(e){}
  localStorage.setItem(ADMIN_AUTH_KEY,JSON.stringify([owner]));
  return [owner];
}
function saveAdminUsers(a){localStorage.setItem(ADMIN_AUTH_KEY,JSON.stringify(a))}
function isOwner(){return currentAdmin?.email===OWNER_EMAIL&&currentAdmin?.role==="owner"}
function adminLogin(){const email=(document.getElementById("adminLoginEmail").value||"").trim().toLowerCase(),password=document.getElementById("adminLoginPassword").value,err=document.getElementById("adminLoginError");err.textContent="";if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent="E-mail sem acesso à área restrita.";return}const u=getAdminUsers().find(x=>x.email===email);if(!u){err.textContent="E-mail sem acesso à área restrita.";return}if(u.password!==password){err.textContent="senha incorreta";return}currentAdmin=u;localStorage.setItem("technova_current_admin",JSON.stringify(u));document.getElementById("adminLoginOverlay").classList.add("hidden");document.getElementById("adminLoggedAs").textContent=`Logado como ${u.name}`;renderAll()}
function adminLogout(){currentAdmin=null;localStorage.removeItem("technova_current_admin");document.getElementById("adminLoginOverlay").classList.remove("hidden")}
function addAdmin(){if(!isOwner())return toast("Somente o proprietário pode adicionar administradores.");const name=document.getElementById("newAdminName").value.trim(),email=document.getElementById("newAdminEmail").value.trim().toLowerCase(),password=document.getElementById("newAdminPassword").value;if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<6)return toast("Preencha nome, e-mail válido e senha de pelo menos 6 caracteres.");const a=getAdminUsers();if(a.some(x=>x.email===email))return toast("Este administrador já existe.");a.push({id:"admin_"+Date.now(),name,email,password,role:"admin"});saveAdminUsers(a);renderAdminUsers();toast("Administrador adicionado.");["newAdminName","newAdminEmail","newAdminPassword"].forEach(id=>document.getElementById(id).value="")}
function deleteAdmin(id){if(!isOwner())return toast("Somente o proprietário pode excluir administradores.");const a=getAdminUsers(),u=a.find(x=>x.id===id);if(!u||u.role==="owner")return toast("O proprietário não pode ser excluído.");saveAdminUsers(a.filter(x=>x.id!==id));renderAdminUsers();toast("Administrador excluído.")}
function renderAdminUsers(){const box=document.getElementById("adminUsersTable");if(!box)return;box.innerHTML=`<table class="admin-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Ação</th></tr></thead><tbody>${getAdminUsers().map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role==="owner"?"Proprietário":"Administrador"}</td><td>${u.role==="owner"?'<span class="admin-muted">Protegido</span>':`<button class="admin-btn danger" onclick="deleteAdmin('${u.id}')">Excluir</button>`}</td></tr>`).join("")}</tbody></table>`}
(function(){getAdminUsers();try{const s=JSON.parse(localStorage.getItem("technova_current_admin")||"null");if(s){const u=getAdminUsers().find(x=>x.email===s.email&&x.password===s.password);if(u)currentAdmin=u}}catch(e){}if(currentAdmin){document.getElementById("adminLoginOverlay").classList.add("hidden");document.getElementById("adminLoggedAs").textContent=`Logado como ${currentAdmin.name}`}document.getElementById("ownerOnlyArea").style.display=isOwner()?"block":"none";document.getElementById("adminRestrictedArea").style.display=isOwner()?"none":"block";renderAdminUsers()})();


(function(){
const KEY="technova_admin_data_v1";
const defaultData={
 coupons:[{
   code:"TECH10",type:"percentage",discount:10,maxUses:100,uses:0,
   expiry:"2026-09-30",minValue:100,firstPurchase:false,exclusive:false,perCustomer:1
 }],
 orders:[], banner:""
};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||defaultData;
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll();}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0)}
function toast(t){const x=document.createElement("div");x.className="admin-toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),2500)}
window.toast=toast;

document.querySelectorAll(".admin-side button").forEach(btn=>btn.addEventListener("click",()=>{if(!currentAdmin)return;
 document.querySelectorAll(".admin-side button").forEach(x=>x.classList.remove("active"));
 document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));
 btn.classList.add("active");document.getElementById(btn.dataset.panel).classList.add("active");
 renderAll();
}));

window.saveBanner=function(){
 const file=document.getElementById("bannerFile").files[0];
 if(!file){toast("Selecione uma imagem primeiro.");return}
 const reader=new FileReader();
 reader.onload=()=>{data.banner=reader.result;save();toast("Banner atualizado na loja.");};
 reader.readAsDataURL(file);
};
window.removeBanner=function(){data.banner="";save();toast("Banner removido.");};
document.getElementById("bannerFile").addEventListener("change",e=>{
 const f=e.target.files[0];if(!f)return;
 const r=new FileReader();r.onload=()=>document.getElementById("bannerPreview").src=r.result;r.readAsDataURL(f);
});

window.saveCoupon=function(){
 const code=document.getElementById("couponCode").value.trim().toUpperCase();
 if(!code)return toast("Informe o código.");
 const coupon={
  code,type:document.getElementById("couponType").value,
  discount:Number(document.getElementById("couponDiscount").value)||0,
  maxUses:Number(document.getElementById("couponMaxUses").value)||0,
  expiry:document.getElementById("couponExpiry").value,
  minValue:Number(document.getElementById("couponMinValue").value)||0,
  firstPurchase:document.getElementById("couponFirstPurchase").checked,
  exclusive:document.getElementById("couponExclusive").checked,
  perCustomer:Number(document.getElementById("couponPerCustomer").value)||1,
  uses:0
 };
 const i=data.coupons.findIndex(x=>x.code===code);
 if(i>=0){coupon.uses=data.coupons[i].uses||0;data.coupons[i]=coupon}else data.coupons.push(coupon);
 save();toast("Cupom salvo com sucesso.");
};
window.editCoupon=function(code){
 const c=data.coupons.find(x=>x.code===code);if(!c)return;
 document.getElementById("couponCode").value=c.code;
 document.getElementById("couponType").value=c.type;
 document.getElementById("couponDiscount").value=c.discount;
 document.getElementById("couponMaxUses").value=c.maxUses;
 document.getElementById("couponExpiry").value=c.expiry;
 document.getElementById("couponMinValue").value=c.minValue;
 document.getElementById("couponFirstPurchase").checked=!!c.firstPurchase;
 document.getElementById("couponExclusive").checked=!!c.exclusive;
 document.getElementById("couponPerCustomer").value=c.perCustomer;
 document.querySelector('[data-panel="coupons"]').click();
};
window.deleteCoupon=function(code){data.coupons=data.coupons.filter(x=>x.code!==code);save();toast("Cupom excluído.");};
window.clearCouponForm=function(){document.querySelectorAll("#coupons input").forEach(x=>{if(x.type==="checkbox")x.checked=false});document.getElementById("couponCode").value="";};

function expired(c){return c.expiry && new Date(c.expiry+"T23:59:59")<new Date()}
function renderCoupons(){
 document.getElementById("couponList").innerHTML=data.coupons.map(c=>`
 <div class="coupon-row"><div><strong>${c.code}</strong> <span class="badge ${expired(c)?"expired":""}">${expired(c)?"Cupom expirado":"Ativo"}</span>
 <div class="admin-muted">${c.type==="percentage"?c.discount+"%":"R$ "+c.discount} · uso máximo ${c.maxUses} · validade ${c.expiry||"sem data"} · mínimo ${money(c.minValue)} · limite/cliente ${c.perCustomer}${c.firstPurchase?" · primeira compra":""}${c.exclusive?" · exclusivo":""}</div></div>
 <div class="admin-actions"><button class="admin-btn" onclick="editCoupon('${c.code}')">Editar</button><button class="admin-btn danger" onclick="deleteCoupon('${c.code}')">Excluir</button></div></div>`).join("")||'<p class="admin-muted">Nenhum cupom cadastrado.</p>';
}

let editingProductId=null;
function getAdminProducts(){
  try{
    const raw=localStorage.getItem("technova_products_v1");
    if(raw){
      const parsed=JSON.parse(raw);
      return Array.isArray(parsed)?parsed:[];
    }
  }catch(e){}
  return [];
}
function saveAdminProducts(list){localStorage.setItem("technova_products_v1",JSON.stringify(list));}
function clearProductForm(){
  editingProductId=null;
  ["prodName","prodPrice","prodOld","prodStock","prodRating","prodReviews","prodSold","prodDiscount","prodDescription","prodArt"].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value="";
  });
  document.getElementById("prodStock").value=20;
  document.getElementById("prodRating").value=5;
  document.querySelector('#products .primary').textContent="Criar produto";
  document.getElementById("prodImage").value="";
  const preview=document.getElementById("prodImagePreview");if(preview)preview.innerHTML="";
}
window.clearProductForm=clearProductForm;

window.previewProductImage=function(event){
  const file=event?.target?.files?.[0];
  const box=document.getElementById("prodImagePreview");
  if(!box)return;
  if(!file){box.innerHTML="";return;}
  if(!file.type.startsWith("image/")){toast("Selecione um arquivo de imagem.");event.target.value="";return;}
  if(file.size>4*1024*1024){toast("A imagem deve ter no máximo 4 MB.");event.target.value="";box.innerHTML="";return;}
  const reader=new FileReader();
  reader.onload=()=>box.innerHTML=`<img src="${reader.result}" alt="Prévia do produto">`;
  reader.readAsDataURL(file);
};
window.saveProduct=function(){
  const name=document.getElementById("prodName").value.trim();
  const price=Number(document.getElementById("prodPrice").value);
  if(!name||Number.isNaN(price)||price<0){toast("Informe nome e preço.");return}
  const list=getAdminProducts();
  const imageFile=document.getElementById("prodImage").files[0];
  const finish=async(image)=>{
    const item={
      id:editingProductId||undefined,
      name,price,
      old:Number(document.getElementById("prodOld").value)||price,
      stock:Number(document.getElementById("prodStock").value)||0,
      rating:Number(document.getElementById("prodRating").value)||0,
      reviews:Number(document.getElementById("prodReviews").value)||0,
      sold:Number(document.getElementById("prodSold").value)||0,
      discount:document.getElementById("prodDiscount").value.trim()||"",
      description:document.getElementById("prodDescription").value.trim()||"Produto TechNova.",
      category:document.getElementById("prodCategory")?.value||"gamer",
      art:document.getElementById("prodArt").value.trim()||"📦",
      image:image||""
    };
    try{
      const saved=editingProductId
        ? await apiRequest("/products/"+editingProductId,{method:"PUT",body:JSON.stringify(item)})
        : await apiRequest("/products",{method:"POST",body:JSON.stringify(item)});
      const next=list.filter(x=>x.id!==saved.id);
      next.push(saved);
      localStorage.setItem("technova_products_v1",JSON.stringify(next));
      clearProductForm(); renderAll();
      toast(editingProductId?"Produto atualizado no banco online.":"Produto criado no banco online.");
    }catch(e){
      console.error(e);
      // Fallback local only if API is not configured/unavailable
      const localItem={...item,id:editingProductId||Date.now()};
      const idx=list.findIndex(x=>x.id===localItem.id);
      if(idx>=0) list[idx]=localItem; else list.push(localItem);
      saveAdminProducts(list); clearProductForm(); renderAll();
      toast("API indisponível: produto salvo apenas neste navegador. Configure config.js.");
    }
  };
  if(imageFile){
    const reader=new FileReader(); reader.onload=()=>finish(reader.result); reader.readAsDataURL(imageFile);
  } else {
    const oldItem=list.find(x=>x.id===editingProductId);
    finish(oldItem?.image||"");
  }
};
window.editProduct=function(id){
  const p=getAdminProducts().find(x=>x.id===id);if(!p)return;
  editingProductId=id;
  document.getElementById("prodName").value=p.name||"";
  document.getElementById("prodPrice").value=p.price||"";
  document.getElementById("prodOld").value=p.old||"";
  document.getElementById("prodStock").value=p.stock??0;
  document.getElementById("prodRating").value=p.rating??0;
  document.getElementById("prodReviews").value=p.reviews??0;
  document.getElementById("prodSold").value=p.sold??0;
  document.getElementById("prodDiscount").value=p.discount||"";
  document.getElementById("prodDescription").value=p.description||"";
  if(document.getElementById("prodCategory"))document.getElementById("prodCategory").value=p.category||"gamer";
  document.getElementById("prodArt").value=p.art||"📦";
  document.getElementById("prodImage").value="";
  const preview=document.getElementById("prodImagePreview");
  if(preview) preview.innerHTML=p.image?`<img src="${p.image}" alt="Imagem atual do produto">`:"";
  document.querySelector('#products .primary').textContent="Salvar alterações";
  document.querySelector('[data-panel="products"]').click();
  window.scrollTo({top:0,behavior:"smooth"});
};
window.deleteProduct=async function(id){
  const p=getAdminProducts().find(x=>x.id===id);if(!p)return;
  if(!confirm(`Excluir o produto "${p.name}"?`))return;
  try{
    await apiRequest("/products/"+id,{method:"DELETE"});
    saveAdminProducts(getAdminProducts().filter(x=>x.id!==id));
    renderAll(); toast("Produto excluído do banco online.");
  }catch(e){
    saveAdminProducts(getAdminProducts().filter(x=>x.id!==id));
    renderAll(); toast("API indisponível: produto excluído apenas deste navegador.");
  }
};

function renderProducts(){
 const products=getAdminProducts();
 document.getElementById("productTable").innerHTML=`<table class="admin-table"><thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Vendidos</th><th>Status</th><th>Ações</th></tr></thead><tbody>${
 products.map(p=>`<tr><td><strong>${p.name}</strong><div class="admin-muted">${p.description||""}</div></td><td>${money(p.price)}</td><td>${p.stock??0}</td><td>${p.sold||0}</td><td>${(p.stock??0)>0?"Disponível":"Sem estoque"}</td><td><div class="admin-actions"><button class="admin-btn" onclick="editProduct(${p.id})">Editar</button><button class="admin-btn danger" onclick="deleteProduct(${p.id})">Excluir</button></div></td></tr>`).join("")
 }</tbody></table>`;
}
function renderOrders(){
 const orders=data.orders;
 document.getElementById("ordersTable").innerHTML=orders.length?`<table class="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Valor</th><th>Pagamento</th><th>Status</th><th>Ação</th></tr></thead><tbody>${orders.map((o,i)=>`<tr><td>#${o.id||i+1}</td><td>${o.customer||"-"}</td><td>${money(o.total)}</td><td>${o.payment||"PIX"}</td><td>${o.status||"Aguardando pagamento"}</td><td><button class="admin-btn" onclick="approveOrder(${i})">Aprovar</button></td></tr>`).join("")}</tbody></table>`:'<div class="admin-card"><p>Nenhum pedido registrado ainda.</p></div>';
}
window.approveOrder=function(i){if(data.orders[i]){data.orders[i].status="Pagamento aprovado — preparar envio";save();toast("Pedido aprovado.");}};
function renderStats(){
 const orders=data.orders;
 document.getElementById("stats").innerHTML=`
 <div class="admin-card"><h3>Pedidos</h3><div class="admin-stat">${orders.length}</div></div>
 <div class="admin-card"><h3>Aguardando</h3><div class="admin-stat">${orders.filter(x=>(x.status||"").includes("Aguardando")).length}</div></div>
 <div class="admin-card"><h3>Cupons</h3><div class="admin-stat">${data.coupons.length}</div></div>
 <div class="admin-card"><h3>Produtos</h3><div class="admin-stat">${getAdminProducts().length}</div></div>`;
 const pending=orders.filter(x=>(x.status||"").includes("Aguardando"));
 document.getElementById("adminNotice").innerHTML=pending.length?`<div class="admin-notice">🔔 Você tem <strong>${pending.length}</strong> pedido(s) aguardando pagamento.</div>`:"";
 document.getElementById("recentOrders").innerHTML=orders.slice(-5).reverse().map(o=>`<div class="admin-card" style="margin:8px 0">Pedido <strong>#${o.id||"-"}</strong> · ${o.customer||"Cliente"} · ${money(o.total)} · ${o.status||"Aguardando pagamento"}</div>`).join("")||'<p class="admin-muted">Sem pedidos recentes.</p>';
}
let productsLoadedFromAPI=false;
async function renderAll(){if(!currentAdmin)return;
 if(!productsLoadedFromAPI){productsLoadedFromAPI=true; await syncProductsFromAPI();}
 renderStats();renderCoupons();renderProducts();renderOrders();
 if(data.banner)document.getElementById("bannerPreview").src=data.banner;
}
renderAll();
})();
