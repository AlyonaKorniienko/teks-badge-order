'use strict';
// Адреса серверної частини (Google Apps Script Web app, закінчується на /exec).
// Це публічна адреса, а не ключ: без коду доступу сервер нічого не приймає.
const API_URL = '';

const CITIES = ['Біла Церква','Вінниця','Дніпро','Запоріжжя','Івано-Франківськ','Кам\'янське','Київ','Кременчук','Кривий Ріг','Кропивницький','Луцьк','Лубни','Львів','Миколаїв','Одеса','Полтава','Рівне','Ужгород','Харків','Черкаси'];

const $ = id => document.getElementById(id);
let photoB64 = '';
let dupOk = false;

CITIES.forEach(c => { const o = document.createElement('option'); o.value = c; $('cities').appendChild(o); });

function show(t, cls) { const m = $('msg'); m.className = 'msg ' + cls; m.textContent = t; }
function hide() { $('msg').className = 'msg'; }
function busy(on) { $('go').disabled = on; $('go').textContent = on ? 'Надсилаємо…' : 'Надіслати замовлення'; }

$('photo').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  $('photoName').textContent = file.name;
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.9);
    photoB64 = data.split(',')[1];
    $('prev').src = data; $('prev').style.display = 'block'; $('ph').style.display = 'none';
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { photoB64 = ''; show('Не вдалося відкрити це фото. Спробуйте JPG або PNG.', 'err'); };
  img.src = url;
});

$('f').addEventListener('submit', async e => {
  e.preventDefault(); hide();
  if (!API_URL) { show('Форму ще не підключено до сервера. Зверніться до відділу маркетингу.', 'err'); return; }
  if (!photoB64) { show('Додайте фото співробітника.', 'err'); return; }
  busy(true);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        firstName: $('firstName').value, lastName: $('lastName').value,
        city: $('city').value, position: $('position').value, code: $('code').value,
        passcode: $('passcode').value, photoBase64: photoB64, allowDuplicate: dupOk
      })
    });
    const r = await res.json();
    if (r.status === 'duplicate') {
      dupOk = true;
      show(r.message + ' Якщо це інший співробітник — перевірте код і натисніть «Надіслати» ще раз.', 'warn');
    } else if (r.status === 'ok') {
      $('formCard').style.display = 'none'; $('done').style.display = 'block';
      $('doneText').textContent = r.name + ' — дані збережено, бейдж буде підготовлено найближчим часом.';
    } else {
      show(r.message || 'Не вдалося надіслати. Спробуйте ще раз.', 'err');
    }
  } catch (err) {
    show('Немає звʼязку із сервером. Перевірте інтернет і спробуйте ще раз.', 'err');
  }
  busy(false);
});

$('again').addEventListener('click', () => {
  const pass = $('passcode').value;
  $('f').reset(); $('passcode').value = pass; $('position').value = 'Водій-курʼєр';
  photoB64 = ''; dupOk = false;
  $('prev').style.display = 'none'; $('ph').style.display = 'flex'; $('photoName').textContent = 'Натисніть, щоб обрати фото';
  $('done').style.display = 'none'; $('formCard').style.display = 'block'; hide();
});
