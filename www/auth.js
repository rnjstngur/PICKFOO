/* 시연용 오프라인 계정: 운영 서버가 없으므로 실제 개인정보나 재사용 비밀번호를 입력하지 마세요. */
function readUsers(){try{return JSON.parse(localStorage.getItem('pickfoo_users')||'[]')}catch{return []}}
function writeUsers(users){localStorage.setItem('pickfoo_users',JSON.stringify(users))}
function setCurrentUser(user){const {password,passwordHash,passwordSalt,...profile}=user;localStorage.setItem('pickfoo_current_user',JSON.stringify(profile))}
function message(text,isError=true){const el=document.getElementById('formMessage');if(el){el.textContent=text;el.className=`form-message ${isError?'error':'success'}`}}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
async function derive(password,saltHex){
  const salt=new Uint8Array(saltHex.match(/.{2}/g).map(x=>parseInt(x,16)));
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},material,256);
  return hex(new Uint8Array(bits));
}
document.addEventListener('DOMContentLoaded',()=>{
 const signup=document.getElementById('signupForm'),login=document.getElementById('loginForm');
 signup?.addEventListener('submit',async event=>{
  event.preventDefault();const button=signup.querySelector('button[type=submit]');button.disabled=true;
  try{
   const nickname=document.getElementById('nickname').value.trim();
   const email=document.getElementById('email').value.trim().toLowerCase();
   const password=document.getElementById('password').value;
   if(password!==document.getElementById('passwordConfirm').value)return message('비밀번호가 서로 일치하지 않습니다.');
   const users=readUsers();if(users.some(x=>x.email===email))return message('이미 이 기기에 등록된 이메일입니다.');
   if(!crypto?.subtle)return message('안전한 로컬 접속(http://localhost)으로 실행해 주세요.');
   const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
   const user={id:`user_${Date.now()}`,nickname,email,passwordSalt:salt,passwordHash:await derive(password,salt),preferences:{foodTypes:[],brands:[],flavors:[],spicy:'all',budget:'all',excludedIngredients:[],allergies:[]}};
   users.push(user);writeUsers(users);setCurrentUser(user);location.href='preferences.html?first=1';
  }catch(err){console.error(err);message('가입 저장 실패: 브라우저 저장 공간이나 실행 환경을 확인해 주세요.')}finally{button.disabled=false}
 });
 login?.addEventListener('submit',async event=>{
  event.preventDefault();const button=login.querySelector('button[type=submit]');button.disabled=true;
  try{
   const email=document.getElementById('email').value.trim().toLowerCase(),password=document.getElementById('password').value;
   const user=readUsers().find(x=>x.email===email);
   let valid=false;
   if(user?.passwordHash&&user?.passwordSalt)valid=(await derive(password,user.passwordSalt))===user.passwordHash;
   else if(user?.password)valid=(user.password===password); // 이전 데모 버전의 로컬 데이터 이전 지원
   if(!valid)return message('이메일 또는 비밀번호를 확인해 주세요.');
   // Clear old plaintext data if migrating from an earlier version.
   if(user.password){user.passwordSalt=hex(crypto.getRandomValues(new Uint8Array(16)));user.passwordHash=await derive(password,user.passwordSalt);delete user.password;writeUsers(readUsers().map(x=>x.email===email?user:x))}
   setCurrentUser(user);location.href='index.html';
  }catch(err){console.error(err);message('로그인 실패: 실행 환경과 로컬 저장소를 확인해 주세요.')}finally{button.disabled=false}
 });
});
