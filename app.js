
const PRODUCTS=[];
let storeProducts=[];
const PRODUCT_CACHE_KEY="technova_products_v1";
const API_BASE=String(window.TECHNOVA_API_URL||"").replace(/\/$/,"");

function getStoreProducts(){
  if(Array.isArray(storeProducts) && storeProducts.length) return storeProducts;
  try{
    const raw=localStorage.getItem(PRODUCT_CACHE_KEY);
    if(raw){
      const list=JSON.parse(raw);
      if(Array.isArray(list)) return list;
    }
  }catch(e){}
  return PRODUCTS;
}

function setStoreProducts(list){
  storeProducts=Array.isArray(list)?list:[];
  try{localStorage.setItem(PRODUCT_CACHE_KEY,JSON.stringify(storeProducts));}catch(e){}
}

async function loadProductsFromAPI(){
  if(!API_BASE || API_BASE.includes("SEU-SERVICO")) return false;
  try{
    const r=await fetch(API_BASE+"/products",{cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    const list=await r.json();
    setStoreProducts(list);
    renderProducts();
    return true;
  }catch(e){
    console.warn("API de produtos indisponível; usando cache local.",e);
    return false;
  }
}
const KEY="technova_state";
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{user:null,cart:[],coupon:null,notifications:[],orders:[],profile:{},payment:"PIX"};
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderHeader();}
function money(v){return "R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}
function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function go(hash){location.hash=hash}
function renderHeader(){const count=state.cart.reduce((a,x)=>a+x.qty,0), total=state.cart.reduce((a,x)=>a+x.price*x.qty,0);document.getElementById("cartBadge").textContent=count;document.getElementById("cartTotal").textContent=money(total);document.getElementById("userName").textContent=state.user?state.user:"Entrar / Cadastrar-se";const unread=state.notifications.filter(n=>!n.read).length;document.getElementById("notifBadge").textContent=unread}
function productImageHTML(p, className="product-image"){
  const image=p.image||"";
  return image
    ? `<img class="${className}" src="${image}" alt="${String(p.name||"Produto").replace(/"/g,"&quot;")}" loading="lazy">`
    : `<div class="art">${p.art||"📦"}</div>`;
}
function renderProducts(){
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase();
  const grid=document.getElementById("productGrid");
  if(!grid)return;
  const items=getStoreProducts().filter(p=>String(p.name||"").toLowerCase().includes(q));
  grid.innerHTML=items.map(p=>`<article class="product-card">
    <div class="product-img">
      <span class="discount">${p.discount||""}</span>
      ${productImageHTML(p)}
    </div>
    <div class="product-body">
      <h3>${p.name}</h3>
      <div class="rating">${"★".repeat(Math.round(Number(p.rating)||0))}<span>${Number(p.rating||0).toFixed(1)} (${Number(p.reviews||0).toLocaleString("pt-BR")})</span></div>
      <div class="sold">Vendidos: ${Number(p.sold||0).toLocaleString("pt-BR")}</div>
      <div class="price">${money(p.price)} <span class="old">${money(p.old||p.price)}</span></div>
      <button class="details-btn" onclick="openProductDetails(${p.id})">Detalhes</button>
      <button class="buy-btn" onclick="buyNow(${p.id})">Comprar agora</button>
    </div>
  </article>`).join("")||`<div class="coupon-box"><h3>Nenhum produto cadastrado ainda.</h3><p>Os produtos aparecerão aqui assim que forem adicionados pelo painel administrativo.</p></div>`;
}

function starsHTML(value){
  let out="";
  for(let i=1;i<=5;i++) out += i<=value ? "★" : "☆";
  return out;
}

function openProductDetails(id){
  const p=getStoreProducts().find(x=>x.id===id);
  if(!p)return;
  const reviews=[];
  const modal=document.createElement("div");
  modal.className="modal product-modal";
  modal.id="productDetailsModal";
  modal.innerHTML=`
    <div class="modal-card product-details-card">
      <button class="modal-close" onclick="closeProductDetails()">×</button>
      <div class="details-top">
        <div class="details-image">${productImageHTML(p,"details-product-image")}</div>
        <div>
          <span class="details-discount">${p.discount}</span>
          <h2>${p.name}</h2>
          <div class="rating big-rating">${starsHTML(Math.round(p.rating))} <span>${p.rating.toFixed(1)} / 5 · ${p.reviews.toLocaleString("pt-BR")} avaliações</span></div>
          <p class="sold">Vendidos: ${p.sold.toLocaleString("pt-BR")}</p>
          <div class="details-price">${money(p.price)} <span class="old">${money(p.old)}</span></div>
        </div>
      </div>

      <div class="details-tabs">
        <button class="detail-tab active" onclick="switchDetailTab(this,'reviewsPanel')">Avaliações</button>
        <button class="detail-tab" onclick="switchDetailTab(this,'descriptionPanel')">Descrição</button>
        <button class="detail-tab" onclick="switchDetailTab(this,'writePanel')">Enviar avaliação</button>
      </div>

      <div id="reviewsPanel" class="detail-panel">
        <div class="review-summary">
          <div class="review-score"><strong>${p.rating.toFixed(1)}</strong><div>${starsHTML(Math.round(p.rating))}</div><small>${p.reviews.toLocaleString("pt-BR")} avaliações</small></div>
          <div class="review-bars">
            <div>5 ★ <span><i style="width:88%"></i></span></div>
            <div>4 ★ <span><i style="width:8%"></i></span></div>
            <div>3 ★ <span><i style="width:3%"></i></span></div>
            <div>2 ★ <span><i style="width:1%"></i></span></div>
            <div>1 ★ <span><i style="width:1%"></i></span></div>
          </div>
        </div>
        <div class="coupon-box"><b>Ainda não há avaliações.</b><p>Seja o primeiro cliente a avaliar este produto após a compra.</p></div>
      </div>

      <div id="descriptionPanel" class="detail-panel hidden">
        <h3>Descrição do produto</h3>
        <p>${getDescription(p.id)}</p>
        <ul class="description-list">
          <li>Produto TechNova com garantia conforme as condições da loja.</li>
          
          <li>Estoque atualizado no painel administrativo.</li>
          <li>Produto novo e enviado com embalagem de proteção.</li>
        </ul>
      </div>

      <div id="writePanel" class="detail-panel hidden">
        <h3>Enviar avaliação</h3>
        <p class="muted">Compartilhe sua experiência com este produto.</p>
        <label class="field-label">Sua nota</label>
        <div class="star-picker" id="starPicker">
          ${[1,2,3,4,5].map(i=>`<button type="button" onclick="selectReviewStars(${i})" data-star="${i}">☆</button>`).join("")}
        </div>
        <input id="reviewAuthor" class="review-input" placeholder="Seu nome">
        <textarea id="reviewText" class="review-textarea" placeholder="Escreva sua avaliação..."></textarea>
        <label class="photo-upload">📷 Enviar foto na avaliação
          <input id="reviewPhoto" type="file" accept="image/*" onchange="previewReviewPhoto(event)" hidden>
        </label>
        <div id="reviewPhotoPreview" class="review-photo-preview"></div>
        <button class="primary wide" onclick="submitReview(${p.id})">Enviar avaliação</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function getDescription(id){
  const p=getStoreProducts().find(x=>x.id===id);
  return p?.description || "Descrição ainda não cadastrada.";
}

function closeProductDetails(){
  document.getElementById("productDetailsModal")?.remove();
}

function switchDetailTab(btn,panelId){
  const modal=document.getElementById("productDetailsModal");
  modal.querySelectorAll(".detail-tab").forEach(x=>x.classList.remove("active"));
  modal.querySelectorAll(".detail-panel").forEach(x=>x.classList.add("hidden"));
  btn.classList.add("active");
  modal.querySelector("#"+panelId).classList.remove("hidden");
}

let selectedReviewStars=0;
function selectReviewStars(value){
  selectedReviewStars=value;
  document.querySelectorAll("#starPicker button").forEach(btn=>{
    btn.textContent=Number(btn.dataset.star)<=value?"★":"☆";
    btn.classList.toggle("selected",Number(btn.dataset.star)<=value);
  });
}

function previewReviewPhoto(event){
  const file=event.target.files[0];
  const box=document.getElementById("reviewPhotoPreview");
  if(!file){box.innerHTML="";return;}
  const reader=new FileReader();
  reader.onload=()=>box.innerHTML=`<img src="${reader.result}" alt="Prévia da foto enviada">`;
  reader.readAsDataURL(file);
}

function submitReview(productId){
  const name=document.getElementById("reviewAuthor").value.trim();
  const text=document.getElementById("reviewText").value.trim();
  if(!selectedReviewStars)return toast("Escolha de 1 a 5 estrelas.");
  if(!name||!text)return toast("Preencha seu nome e sua avaliação.");
  toast("Avaliação enviada com sucesso!");
  closeProductDetails();
}


function buyNow(id){
  const p=getStoreProducts().find(x=>x.id===id);
  if(!p)return;

  const message=`Olá quero comprar ${p.name} na TechNova`;
  const whatsappUrl=`https://wa.me/5592993104032?text=${encodeURIComponent(message)}`;

  window.location.href=whatsappUrl;
}

function openAccountGate(productId){
  document.getElementById("accountGateModal")?.remove();
  const modal=document.createElement("div");
  modal.className="modal account-gate-modal";
  modal.id="accountGateModal";
  modal.innerHTML=`
    <div class="modal-card account-gate-card">
      <button class="modal-close" onclick="closeAccountGate()">×</button>
      <div class="gate-icon">◉</div>
      <h2>Crie ou entre na sua conta</h2>
      <p class="gate-subtitle">Para continuar com a compra, entre na sua conta ou crie uma nova.</p>

      <label class="gate-label">Número de telefone</label>
      <input id="gatePhone" class="gate-input" type="tel" inputmode="numeric"
             maxlength="8" placeholder="Digite seu número"
             oninput="validateGatePhone()">
      <div id="gatePhoneError" class="gate-error"></div>

      <label class="gate-label">E-mail</label>
      <input id="gateEmail" class="gate-input" type="email"
             placeholder="seuemail@exemplo.com"
             oninput="validateGateEmail()">
      <div id="gateEmailError" class="gate-error"></div>

      <label class="gate-label">Senha</label>
      <input id="gatePassword" class="gate-input" type="password"
             placeholder="Digite sua senha"
             oninput="validateGatePassword()">
      <div id="gatePasswordError" class="gate-error"></div>

      <button class="primary wide" onclick="continueAccountPurchase(${productId})">Entrar e comprar</button>
      <p class="gate-note">Se ainda não tiver uma conta, ela será criada automaticamente neste protótipo.</p>
    </div>`;
  document.body.appendChild(modal);
}

function closeAccountGate(){
  document.getElementById("accountGateModal")?.remove();
}

function validateGatePhone(){
  const input=document.getElementById("gatePhone");
  const error=document.getElementById("gatePhoneError");
  if(!input||!error)return false;
  const digits=input.value.replace(/\D/g,"");
  input.value=digits;
  if(digits.length>8){
    error.textContent="número invalido";
    input.classList.add("invalid");
    return false;
  }
  error.textContent="";
  input.classList.remove("invalid");
  return true;
}

function validateGateEmail(){
  const input=document.getElementById("gateEmail");
  const error=document.getElementById("gateEmailError");
  if(!input||!error)return false;
  const value=input.value.trim();
  if(value.length>0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){
    error.textContent="email invalido";
    input.classList.add("invalid");
    return false;
  }
  error.textContent="";
  input.classList.remove("invalid");
  return true;
}

function validateGatePassword(){
  const input=document.getElementById("gatePassword");
  const error=document.getElementById("gatePasswordError");
  if(!input||!error)return false;
  if(input.value.length>0 && input.value.length<6){
    error.textContent="senha incorreta";
    input.classList.add("invalid");
    return false;
  }
  error.textContent="";
  input.classList.remove("invalid");
  return true;
}

function continueAccountPurchase(productId){
  const phone=document.getElementById("gatePhone");
  const email=document.getElementById("gateEmail");
  const password=document.getElementById("gatePassword");

  validateGatePhone();
  validateGateEmail();
  validateGatePassword();

  const digits=(phone?.value||"").replace(/\D/g,"");
  const validPhone=digits.length>0 && digits.length<=8;
  const validEmail=email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const validPassword=password && password.value.length>=6;

  if(!validPhone){
    document.getElementById("gatePhoneError").textContent="número invalido";
    phone?.classList.add("invalid");
    return;
  }
  if(!validEmail){
    document.getElementById("gateEmailError").textContent="email invalido";
    email?.classList.add("invalid");
    return;
  }
  if(!validPassword){
    document.getElementById("gatePasswordError").textContent="senha incorreta";
    password?.classList.add("invalid");
    return;
  }

  state.user=email.value.trim().split("@")[0];
  state.profile={
    ...(state.profile||{}),
    name:state.user,
    email:email.value.trim(),
    phone:digits
  };
  save();

  const product=getStoreProducts().find(x=>x.id===productId);
  const productName=product ? product.name : "produto";
  const message=`Olá quero comprar ${productName} na TechNova`;
  const whatsappUrl=`https://wa.me/5592993104032?text=${encodeURIComponent(message)}`;

  closeAccountGate();
  window.location.href=whatsappUrl;
}

function addToCart(id){const p=getStoreProducts().find(x=>x.id===id);if(!p)return;const item=state.cart.find(x=>x.id===id);if(item){if(item.qty<p.stock)item.qty++;else return toast("Estoque máximo atingido.")}else state.cart.push({...p,qty:1});save();toast("Produto adicionado ao carrinho.");go("#cart")}
function cartTotal(){return state.cart.reduce((a,x)=>a+x.price*x.qty,0)}
function renderCart(){const box=document.getElementById("cartItems");if(!box)return;if(!state.cart.length){box.innerHTML='<div class="coupon-box"><h3>Seu carrinho está vazio</h3><p>Escolha um produto na página inicial.</p><a class="primary" href="#home">Continuar comprando</a></div>';document.getElementById("itemsCountLabel").textContent="0 itens";document.getElementById("cartPageTotal").textContent=money(0);return}box.innerHTML=state.cart.map(x=>`<div class="cart-item"><div class="cart-thumb">${x.art}</div><div><b>${x.name}</b><p class="sold">Vendidos: ${x.sold.toLocaleString("pt-BR")}</p></div><div class="qty"><button onclick="changeQty(${x.id},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${x.id},1)">+</button></div><div><b>${money(x.price*x.qty)}</b><button class="remove" onclick="removeCart(${x.id})">Remover</button></div></div>`).join("");document.getElementById("itemsCountLabel").textContent=`${state.cart.reduce((a,x)=>a+x.qty,0)} item(s)`;document.getElementById("cartPageTotal").textContent=money(discountedSubtotal()) ;document.getElementById("couponApplied").innerHTML=state.coupon?`<p style="color:#29a0ff">Cupom aplicado: <b>${state.coupon}</b></p>`:""}
function changeQty(id,delta){const x=state.cart.find(i=>i.id===id);if(!x)return;x.qty+=delta;if(x.qty<=0)state.cart=state.cart.filter(i=>i.id!==id);save();renderCart()}
function removeCart(id){state.cart=state.cart.filter(i=>i.id!==id);save();renderCart()}
function discountedSubtotal(){let t=cartTotal();if(state.coupon==="TECH10"||state.coupon==="BEMVINDO15")t*=state.coupon==="TECH10"?.9:.85;return t}
function applyCoupon(){const c=(document.getElementById("couponInput").value||"").trim().toUpperCase();if(["TECH10","BEMVINDO15","PIX5"].includes(c)){state.coupon=c;save();renderCart();toast("Cupom aplicado com sucesso.")}else toast("Cupom não encontrado.")}
function openCoupons(){document.getElementById("couponModal").classList.remove("hidden")}
function closeCoupons(){document.getElementById("couponModal").classList.add("hidden")}
function chooseCoupon(c){state.coupon=c;document.getElementById("couponInput").value=c;closeCoupons();save();renderCart();toast("Cupom selecionado.")}
function startCheckout(){if(!state.cart.length)return toast("Adicione um produto primeiro.");if(!state.user)return openLogin();go("#checkout")}
function updateCheckoutTotals(){const subtotal=discountedSubtotal();const warranty=Number(document.querySelector('input[name="warranty"]:checked')?.value||0);const warrantyValue=warranty===6?29.9:warranty===12?49.9:0;let pix=state.payment==="PIX"?subtotal*.05:0;if(state.coupon==="PIX5")pix+=subtotal*.05;document.getElementById("checkoutSubtotal").textContent=money(subtotal+warrantyValue);document.getElementById("pixDiscount").textContent="- "+money(pix);document.getElementById("checkoutTotal").textContent=money(subtotal+warrantyValue-pix)}
function renderCheckout(){const p=document.getElementById("checkoutProducts");if(!p)return;p.innerHTML=state.cart.map(x=>`<div class="checkout-product"><div class="cart-thumb">${x.art}</div><div><b>${x.name}</b><p>Quantidade: ${x.qty}</p></div><strong>${money(x.price*x.qty)}</strong></div>`).join("");document.getElementById("addressName").value=state.profile.name||state.user||"";const d=new Date();d.setDate(d.getDate()+7);document.getElementById("arrivalDate").textContent=d.toLocaleDateString("pt-BR");updateCheckoutTotals()}
function selectPayment(btn){document.querySelectorAll(".payment").forEach(x=>x.classList.remove("active"));btn.classList.add("active");state.payment=btn.dataset.method;save();updateCheckoutTotals()}
function placeOrder(){if(!state.user)return openLogin();const name=document.getElementById("addressName").value.trim(),cep=document.getElementById("addressCep").value.trim(),street=document.getElementById("addressStreet").value.trim(),num=document.getElementById("addressNumber").value.trim();if(!name||!cep||!street||!num)return toast("Preencha nome, CEP, rua e número.");const subtotal=discountedSubtotal();const warranty=Number(document.querySelector('input[name="warranty"]:checked')?.value||0);const warrantyValue=warranty===6?29.9:warranty===12?49.9:0;let pix=state.payment==="PIX"?subtotal*.05:0;if(state.coupon==="PIX5")pix+=subtotal*.05;const order={id:"TN"+Date.now().toString().slice(-8),date:new Date().toLocaleString("pt-BR"),user:state.user,items:state.cart.map(x=>({...x})),address:{name,cep,street,num,complement:document.getElementById("addressComplement").value},message:document.getElementById("sellerMessage").value,warranty,shipping:"Entrega padrão",payment:state.payment,subtotal,warrantyValue,pixDiscount:pix,total:subtotal+warrantyValue-pix,status:"Aguardando pagamento",step:0,tracking:"TN"+Math.floor(Math.random()*900000+100000)};state.orders.unshift(order);state.cart=[];state.notifications.unshift({id:Date.now(),title:"Pedido recebido",text:`Seu pedido ${order.id} foi criado e aguarda aprovação do pagamento.`,read:false,orderId:order.id});save();renderNotifications();renderOrders();showPix(order);go("#orders")}
function showPix(order){const overlay=document.createElement("div");overlay.className="modal";overlay.innerHTML=`<div class="modal-card" style="text-align:center"><button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button><h2>Pagamento via ${order.payment}</h2><p>Pedido <b>${order.id}</b></p><img src="assets/pix-demo.png" style="width:220px;max-width:80%;background:white;padding:8px;border-radius:8px"><p>QR Code demonstrativo do protótipo</p><button class="primary wide" onclick="this.parentElement.parentElement.remove();toast('Pagamento enviado para análise do Admin.')">Já fiz o pagamento</button></div>`;document.body.appendChild(overlay)}
function renderOrders(){const box=document.getElementById("ordersList");if(!box)return;if(!state.orders.length){box.innerHTML='<div class="order-card">Você ainda não possui pedidos.</div>';return}box.innerHTML=state.orders.map(o=>`<div class="order-card"><div class="order-head"><div><b>${o.id}</b><p>${o.date} · ${o.items.map(x=>x.name).join(", ")}</p></div><div class="status">${o.status}</div></div><p>Total: <b>${money(o.total)}</b></p>${o.status==="Enviado"?`<button class="outline" onclick="openTracking('${o.id}')">Ver rota do pedido →</button>`:`<small>Acompanhe as atualizações pelas notificações.</small>`}</div>`).join("")}
function openTracking(id){const o=state.orders.find(x=>x.id===id);if(!o)return;const box=document.getElementById("trackingBox");const steps=["Pedido recebido","Pagamento aprovado","Separado / embalado","Enviado","Entregue"];box.innerHTML=`<div class="order-card"><h3>Pedido ${o.id}</h3><p>Código de rastreio: <b>${o.tracking}</b></p><div class="track">${steps.map((s,i)=>`<div class="track-step ${i<=o.step?"done":""}"><div class="track-dot"></div><small>${s}</small></div>`).join("")}</div><div class="coupon-box"><b>Rota do pedido</b><p>${o.status==="Enviado"?"Manaus-AM → Centro de distribuição → Em trânsito → Unidade de entrega → Seu endereço":"A rota será liberada assim que o Admin enviar o produto."}</p></div></div>`;go("#tracking")}
function renderNotifications(){const box=document.getElementById("notificationsList");if(!box)return;if(!state.notifications.length){box.innerHTML='<div class="notification">Nenhuma notificação.</div>';return}box.innerHTML=state.notifications.map(n=>`<div class="notification ${n.read?"":"unread"}"><b>${n.title}</b><p>${n.text}</p>${n.orderId?`<button class="outline" onclick="openTracking('${n.orderId}')">Acompanhar pedido</button>`:""}</div>`).join("")}
function markNotificationsRead(){state.notifications.forEach(n=>n.read=true);save();renderNotifications()}
function showFavorites(){toast("Favoritos: adicione o produto à sua lista na próxima versão do catálogo.")}
function getCustomerAccounts(){try{return JSON.parse(localStorage.getItem("technova_customer_accounts_v1")||"[]")}catch(e){return []}}
function saveCustomerAccounts(list){localStorage.setItem("technova_customer_accounts_v1",JSON.stringify(list))}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim().toLowerCase())}
let userMenuTimer;
function openUserMenu(){if(!state.user)return;clearTimeout(userMenuTimer);document.getElementById("userMenu")?.classList.add("show")}
function closeUserMenu(){clearTimeout(userMenuTimer);document.getElementById("userMenu")?.classList.remove("show")}
function scheduleUserMenuClose(){clearTimeout(userMenuTimer);userMenuTimer=setTimeout(closeUserMenu,220)}
function cancelUserMenuClose(){clearTimeout(userMenuTimer)}
function showAuthTab(tab){const l=document.getElementById("loginPane"),r=document.getElementById("registerPane"),card=document.querySelector("#loginModal .auth-card");if(!l||!r)return;const x=tab==="login";l.classList.toggle("hidden",!x);r.classList.toggle("hidden",x);document.getElementById("loginTabBtn")?.classList.toggle("active",x);document.getElementById("registerTabBtn")?.classList.toggle("active",!x);card?.classList.toggle("register-scroll",!x)}
function openLogin(){document.getElementById("loginModal").classList.remove("hidden");showAuthTab("login")}
function closeLogin(){document.getElementById("loginModal").classList.add("hidden")}
function validateLoginEmail(){const i=document.getElementById("loginEmail"),e=document.getElementById("loginEmailError");if(i.value&&!validEmail(i.value)){e.textContent="email invalido";i.classList.add("invalid");return false}e.textContent="";i.classList.remove("invalid");return true}
function validateRegisterEmail(){const i=document.getElementById("registerEmail"),e=document.getElementById("registerEmailError");if(i.value&&!validEmail(i.value)){e.textContent="email invalido";i.classList.add("invalid");return false}e.textContent="";i.classList.remove("invalid");return true}
function validateRegisterPhone(){const i=document.getElementById("registerPhone"),e=document.getElementById("registerPhoneError");i.value=i.value.replace(/\D/g,"");if(i.value.length>11){e.textContent="numero invalido";return false}e.textContent="";return true}
function createAccount(){
 const username=document.getElementById("registerUsername").value.trim(),name=document.getElementById("registerName").value.trim(),surname=document.getElementById("registerSurname").value.trim(),birth=document.getElementById("registerBirth").value,phone=document.getElementById("registerPhone").value.replace(/\D/g,""),email=document.getElementById("registerEmail").value.trim().toLowerCase(),password=document.getElementById("registerPassword").value,confirm=document.getElementById("registerPasswordConfirm").value;
 if(!username||!name||!surname||!birth||!phone||!email||!password)return toast("Preencha todos os campos.");
 if(phone.length<8||phone.length>11){document.getElementById("registerPhoneError").textContent="numero invalido";return}
 if(!validEmail(email)){document.getElementById("registerEmailError").textContent="email invalido";return}
 if(password.length<6||password!==confirm){document.getElementById("registerPasswordError").textContent="senha incorreta ou senhas não conferem";return}
 const accounts=getCustomerAccounts();if(accounts.some(x=>x.email===email)){document.getElementById("registerEmailError").textContent="este email já está cadastrado";return}
 if(accounts.some(x=>(x.username||x.name||"").toLowerCase()===username.toLowerCase()))return toast("Este nome de usuário já está em uso.");
 const account={id:Date.now(),username,name,surname,birth,phone,email,password,avatar:"",addresses:[],paymentMethods:[]};accounts.push(account);saveCustomerAccounts(accounts);
 state.user=username;state.profile={...state.profile,...account,accountId:account.id};save();closeLogin();renderAccount();toast("Conta criada com sucesso.");
}
function login(){
 const email=document.getElementById("loginEmail").value.trim().toLowerCase(),password=document.getElementById("loginPassword").value,ee=document.getElementById("loginEmailError"),pe=document.getElementById("loginPasswordError");
 ee.textContent="";pe.textContent="";if(!validEmail(email)){ee.textContent="email invalido";return}
 const a=getCustomerAccounts().find(x=>x.email===email);if(!a){ee.textContent="email invalido";return}
 if(a.password!==password){pe.textContent="senha incorreta";return}
 state.user=a.username||a.name;state.profile={...state.profile,...a,accountId:a.id};save();closeLogin();renderAccount();toast("Login realizado com sucesso.");
}
function logout(){state.user=null;state.profile={};save();closeUserMenu();toast("Você saiu da conta.");go("#home")}
function toggleLoginOrMenu(){if(state.user)openUserMenu();else openLogin()}
function getLoggedAccount(){const id=state.profile?.accountId;const email=state.profile?.email;return getCustomerAccounts().find(x=>(id&&x.id===id)||(email&&x.email===email))||null}
function syncLoggedAccount(){const accounts=getCustomerAccounts(),id=state.profile?.accountId,email=state.profile?.email;const i=accounts.findIndex(x=>(id&&x.id===id)||(email&&x.email===email));if(i<0)return;accounts[i]={...accounts[i],...state.profile,username:state.user||accounts[i].username||accounts[i].name};saveCustomerAccounts(accounts);state.profile={...accounts[i],accountId:accounts[i].id};state.user=accounts[i].username||accounts[i].name}
function renderAccount(){
 const p=state.profile||{};document.getElementById("accountTitle").textContent=state.user?`Olá, ${state.user}`:"Minha conta";document.getElementById("accountSubtitle").textContent=state.user?`Conta de ${state.user} · gerencie seus dados e preferências.`:"Gerencie seus dados e preferências.";
 const fields={profileUsername:p.username||state.user||p.name||"",profileName:p.name||"",profileSurname:p.surname||"",profileEmail:p.email||"",profilePhone:p.phone||"",profileBirth:p.birth||""};Object.entries(fields).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});
 const avatar=document.getElementById("accountAvatar");if(avatar){avatar.textContent=(state.user||"G")[0].toUpperCase();avatar.style.backgroundImage=p.avatar?`url("${p.avatar}")`:""}
 renderPaymentMethods();renderAddresses();
}
function saveProfile(){state.profile={...state.profile,username:document.getElementById("profileUsername").value.trim(),name:document.getElementById("profileName").value.trim(),surname:document.getElementById("profileSurname").value.trim(),email:document.getElementById("profileEmail").value.trim().toLowerCase(),phone:document.getElementById("profilePhone").value.replace(/\D/g,""),birth:document.getElementById("profileBirth").value};if(!state.profile.username)return toast("Digite um nome de usuário.");state.user=state.profile.username;syncLoggedAccount();save();renderAccount();toast("Dados salvos.")}
function changeAvatar(e){const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024)return toast("A imagem deve ter no máximo 2 MB.");const r=new FileReader();r.onload=()=>{state.profile.avatar=r.result;syncLoggedAccount();save();renderAccount();toast("Imagem do perfil atualizada.")};r.readAsDataURL(file)}
function showAccountPanel(panel,btn){document.querySelectorAll(".account-panel").forEach(x=>x.classList.add("hidden"));document.getElementById(`accountPanel${panel[0].toUpperCase()+panel.slice(1)}`)?.classList.remove("hidden");document.querySelectorAll(".account-nav").forEach(x=>x.classList.remove("active"));btn?.classList.add("active");}
function renderPaymentMethods(){
 const box=document.getElementById("savedPaymentMethods"); if(!box)return;
 const list=state.profile.paymentMethods||[];
 box.innerHTML=list.length ? list.map((m,i)=>`<div class="saved-item"><div><b>${m.type==="card"?"💳 Cartão":"🏦 Conta bancária"}</b><small>${m.label}</small></div><button onclick="removePaymentMethod(${i})">Remover</button></div>`).join("") : `<div class="saved-item"><div><b>Nenhuma forma de pagamento salva.</b><small>Adicione um cartão ou conta bancária abaixo.</small></div></div>`;
}
function addCard(){const number=document.getElementById("cardNumber").value.replace(/\D/g,"");if(number.length<12)return toast("Número do cartão inválido.");const methods=state.profile.paymentMethods||[];methods.push({type:"card",label:`${document.getElementById("cardName").value||"Cartão"} · final ${number.slice(-4)}`});state.profile.paymentMethods=methods;syncLoggedAccount();save();renderPaymentMethods();["cardName","cardNumber","cardExpiry","cardHolder"].forEach(id=>document.getElementById(id).value="");toast("Cartão adicionado.")}
function addBankAccount(){const bank=document.getElementById("bankName").value.trim(),account=document.getElementById("bankAccount").value.trim();if(!bank||!account)return toast("Informe banco e conta.");const methods=state.profile.paymentMethods||[];methods.push({type:"bank",label:`${bank} · conta ${account}`});state.profile.paymentMethods=methods;syncLoggedAccount();save();renderPaymentMethods();["bankName","bankAgency","bankAccount","bankHolder"].forEach(id=>document.getElementById(id).value="");toast("Conta bancária adicionada.")}
function removePaymentMethod(i){state.profile.paymentMethods=(state.profile.paymentMethods||[]).filter((_,idx)=>idx!==i);syncLoggedAccount();save();renderPaymentMethods();}
function renderAddresses(){
 const box=document.getElementById("savedAddresses"); if(!box)return;
 const list=state.profile.addresses||[];
 box.innerHTML=list.length ? list.map((a,i)=>`<div class="saved-item"><div><b>📍 ${a.label||"Endereço"}</b><small>${a.street}, ${a.number} · ${a.neighborhood} · ${a.city}/${a.state} · CEP ${a.cep}</small></div><button onclick="removeAddress(${i})">Remover</button></div>`).join("") : `<div class="saved-item"><div><b>Nenhum endereço salvo.</b><small>Adicione um endereço abaixo.</small></div></div>`;
}
function addAddress(){const ids=["addrLabel","addrFullName","addrPhone","addrCep","addrState","addrCity","addrNeighborhood","addrStreet","addrNumber","addrComplement","addrDescription"];const v=Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value.trim()]));if(!v.addrFullName||!v.addrCep||!v.addrStreet||!v.addrNumber||!v.addrCity||!v.addrState)return toast("Preencha os campos principais do endereço.");const list=state.profile.addresses||[];list.push({label:v.addrLabel||"Residencial",fullName:v.addrFullName,phone:v.addrPhone,cep:v.addrCep,state:v.addrState,city:v.addrCity,neighborhood:v.addrNeighborhood,street:v.addrStreet,number:v.addrNumber,complement:v.addrComplement,description:v.addrDescription});state.profile.addresses=list;syncLoggedAccount();save();renderAddresses();ids.forEach(id=>document.getElementById(id).value="");toast("Endereço salvo.")}
function removeAddress(i){state.profile.addresses=(state.profile.addresses||[]).filter((_,idx)=>idx!==i);syncLoggedAccount();save();renderAddresses()}
function changePassword(){const current=document.getElementById("currentPassword").value,newPass=document.getElementById("newPassword").value,confirm=document.getElementById("confirmNewPassword").value,ce=document.getElementById("currentPasswordError"),ne=document.getElementById("newPasswordError");ce.textContent="";ne.textContent="";const a=getLoggedAccount();if(!a)return;if(a.password!==current){ce.textContent="senha incorreta";return}if(newPass.length<6||newPass!==confirm){ne.textContent="A nova senha deve ter pelo menos 6 caracteres e coincidir com a confirmação.";return}a.password=newPass;const accounts=getCustomerAccounts();const idx=accounts.findIndex(x=>x.email===a.email);if(idx>=0){accounts[idx]=a;saveCustomerAccounts(accounts)}state.profile.password=newPass;syncLoggedAccount();save();document.getElementById("currentPassword").value="";document.getElementById("newPassword").value="";document.getElementById("confirmNewPassword").value="";toast("Senha alterada com sucesso.")}
function route(){const id=location.hash||"#home";document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));if((id==="#account"||id==="#orders")&&!state.user){openLogin();go("#home");return}const page=document.querySelector(id);if(page)page.classList.remove("hidden");if(id==="#cart")renderCart();if(id==="#checkout")renderCheckout();if(id==="#account")renderAccount();if(id==="#orders")renderOrders();if(id==="#notifications")renderNotifications();if(id==="#tracking"&&state.orders[0])openTracking(state.orders[0].id);window.scrollTo(0,0)}
window.addEventListener("hashchange",route);
window.addEventListener("storage",()=>{state=JSON.parse(localStorage.getItem(KEY)||"null")||state;renderHeader();renderNotifications();renderOrders()});
renderProducts();renderHeader();route();

function applyAdminBanner(){
  try{
    const d=JSON.parse(localStorage.getItem("technova_admin_data_v1")||"null");
    if(d && d.banner){
      const hero=document.querySelector(".hero");
      if(hero){
        hero.style.backgroundImage=`url("${d.banner}")`;
        hero.style.backgroundSize="cover";
        hero.style.backgroundPosition="center";
      }
    }
  }catch(e){}
}
document.addEventListener("DOMContentLoaded",applyAdminBanner);


function updateCartQuantity(id,delta){
  const item=state.cart.find(x=>x.id===id); if(!item)return;
  item.qty=Math.max(1,(item.qty||1)+delta); save(); renderCart();
}
function removeCartItem(id){
  state.cart=state.cart.filter(x=>x.id!==id); save(); renderCart(); toast("Produto removido do carrinho.");
}
function calculateShipping(subtotal){
  return subtotal>=199?0:19.90;
}
function getExtendedWarranty(){
  const el=document.querySelector('input[name="warranty"]:checked');
  return el?Number(el.value):0;
}
function applyCartCoupon(code){
  const d=JSON.parse(localStorage.getItem("technova_admin_data_v1")||"null")||{};
  const c=(d.coupons||[]).find(x=>x.code.toUpperCase()===code.trim().toUpperCase());
  if(!c)return toast("Cupom não encontrado.");
  if(c.expiry && new Date(c.expiry+"T23:59:59")<new Date())return toast("Cupom expirado.");
  const subtotal=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(subtotal<c.minValue)return toast(`Compra mínima de ${money(c.minValue)} para este cupom.`);
  state.appliedCoupon=c;save();renderCart();toast("Cupom aplicado.");
}


function startMarketingCountdown(){
  const el=document.getElementById("marketingCountdown"); if(!el)return;
  let end=Number(localStorage.getItem("technova_marketing_countdown"));
  if(!end || end<Date.now()){end=Date.now()+2*60*60*1000;localStorage.setItem("technova_marketing_countdown",end)}
  const tick=()=>{
    const left=Math.max(0,end-Date.now());
    const h=String(Math.floor(left/3600000)).padStart(2,"0");
    const m=String(Math.floor(left%3600000/60000)).padStart(2,"0");
    const s=String(Math.floor(left%60000/1000)).padStart(2,"0");
    el.textContent=`${h}:${m}:${s}`;
    if(left<=0){localStorage.removeItem("technova_marketing_countdown");startMarketingCountdown()}
  };
  tick();setInterval(tick,1000);
}
document.addEventListener("DOMContentLoaded",startMarketingCountdown);

window.addEventListener("load",()=>{loadProductsFromAPI();});
