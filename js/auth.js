// js/auth.js

const API_URL = "http://localhost:8000";

// ─── TOKEN ───────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
  };
}

function verificarLogin() {
  if (!getToken()) {
    alert("Você precisa estar logado.");
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// ─── VALIDAÇÕES ──────────────────────────────────────
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let r1 = (soma * 10) % 11;
  if (r1 === 10 || r1 === 11) r1 = 0;
  if (r1 !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  let r2 = (soma * 10) % 11;
  if (r2 === 10 || r2 === 11) r2 = 0;
  return r2 === parseInt(cpf[10]);
}

function validarIdade(dataNasc) {
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  const idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  const ajuste = m < 0 || (m === 0 && hoje.getDate() < nasc.getDate()) ? 1 : 0;
  return idade - ajuste >= 16;
}

function validarSenha(senha) {
  return senha.length >= 6;
}

// ─── LABEL FLUTUANTE HELPERS ─────────────────────────
function floatLabel(label) {
  if (!label) return;
  label.style.top = "0";
  label.style.transform = "translateY(-50%)";
  label.style.fontSize = "0.75rem";
  label.style.color = "var(--color-red-1, #dc2626)";
}

function bindSelectLabel(id) {
  const sel = document.getElementById(id);
  const label = document.getElementById("label-" + id);
  if (!sel || !label) return;
  sel.addEventListener("change", () => {
    if (sel.value) floatLabel(label);
  });
}

function bindDateLabel(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("change", function () {
    this.style.opacity = "1";
    const label = this.closest(".relative")?.querySelector("label");
    floatLabel(label);
  });
}

// ─── MOBILE STEPS ────────────────────────────────────
const STEP1_IDS = [
  "field-nome",
  "field-data",
  "field-cpf-mobile",
  "field-tipo-mobile",
  "field-sexo-mobile",
  "btn-avancar-wrap",
];
const STEP2_IDS = ["field-email", "field-senha", "btn-cadastrar-wrap"];

function isMobile() {
  return window.innerWidth < 1024;
}

function setDisplay(ids, show) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? "" : "none";
  });
}

function initMobile() {
  if (isMobile()) {
    setDisplay(STEP2_IDS, false);
    setDisplay(STEP1_IDS, true);
    document
      .getElementById("dot-1")
      ?.classList.replace("bg-gray-300", "bg-red-1");
    document
      .getElementById("dot-2")
      ?.classList.replace("bg-red-1", "bg-gray-300");
  } else {
    setDisplay([...STEP1_IDS, ...STEP2_IDS], true);
  }
}

// ─── CADASTRO ────────────────────────────────────────
async function cadastrarUsuario(
  nome,
  email,
  senha,
  tipoSanguineo,
  cpf,
  sexo,
  dataNascimento,
) {
  if (!validarCPF(cpf)) {
    alert("CPF inválido.");
    return;
  }
  if (!validarIdade(dataNascimento)) {
    alert("Você precisa ter pelo menos 16 anos para se cadastrar.");
    return;
  }
  if (!validarSenha(senha)) {
    alert("Senha precisa ter pelo menos 6 caracteres.");
    return;
  }

  const cpfLimpo = cpf.replace(/\D/g, "");

  try {
    const resp = await fetch(API_URL + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome, // ✓ era "name" — errado
        email: email,
        password: senha,
        cpf: cpfLimpo,
        sexo: sexo,
        data_nascimento: dataNascimento, // formato "YYYY-MM-DD" do input[type=date]
        tipo_sanguineo: tipoSanguineo, // ✓ era "blood_type" — errado
        aceite_termos: true, // ✓ obrigatório — faltava
      }),
    });

    const dados = await resp.json();

    if (resp.ok) {
      localStorage.setItem("token", dados.access_token);
      localStorage.setItem("usuario", JSON.stringify(dados.user));
      window.location.href = "perfil.html";
    } else {
      const msg = Array.isArray(dados.detail)
        ? dados.detail.map((e) => e.msg).join("\n")
        : dados.detail || "Erro desconhecido.";
      alert("Erro: " + msg);
    }
  } catch (err) {
    alert("Sem conexão com servidor. Tente novamente.");
  }
}

// ─── LOGIN ───────────────────────────────────────────
async function fazerLogin(email, senha) {
  if (!email || !validarSenha(senha)) {
    alert("Preencha e-mail e senha corretamente.");
    return;
  }

  try {
    // OAuth2PasswordRequestForm exige form-data com "username" e "password"
    const form = new FormData();
    form.append("username", email);
    form.append("password", senha);

    const resp = await fetch(API_URL + "/auth/login", {
      method: "POST",
      body: form,
    });

    const dados = await resp.json();

    if (resp.ok) {
      localStorage.setItem("token", dados.access_token);
      localStorage.setItem("usuario", JSON.stringify(dados.user));
      window.location.href = "../index.html";
    } else {
      alert("E-mail ou senha incorretos.");
    }
  } catch (err) {
    alert("Sem conexão com servidor. Tente novamente.");
  }
}

// ─── SUBMIT CADASTRO ─────────────────────────────────
function initCadastro() {
  const form = document.querySelector("form");
  if (!form) return;

  initMobile();
  window.addEventListener("resize", initMobile);

  bindSelectLabel("tipo_sanguineo");
  bindSelectLabel("tipo_sanguineo_mobile");
  bindSelectLabel("sexo");
  bindSelectLabel("sexo_mobile");

  bindDateLabel("data_nascimento");
  bindDateLabel("data_nascimento_mobile");

  const btnAvancar = document.getElementById("btn-avancar");
  if (btnAvancar) {
    btnAvancar.addEventListener("click", () => {
      const nome = document.getElementById("nome").value.trim();
      const data = document.getElementById("data_nascimento_mobile").value;
      const cpf = document.getElementById("cpf_mobile").value.trim();
      const tipo = document.getElementById("tipo_sanguineo_mobile").value;
      const sexo = document.getElementById("sexo_mobile").value;

      if (!nome || !data || !cpf || !tipo || !sexo) {
        [
          "nome",
          "data_nascimento_mobile",
          "cpf_mobile",
          "tipo_sanguineo_mobile",
          "sexo_mobile",
        ].forEach((id) => {
          const el = document.getElementById(id);
          if (el && !el.value) el.reportValidity?.();
        });
        return;
      }

      setDisplay(STEP1_IDS, false);
      setDisplay(STEP2_IDS, true);
      document
        .getElementById("dot-1")
        ?.classList.replace("bg-red-1", "bg-gray-300");
      document
        .getElementById("dot-2")
        ?.classList.replace("bg-gray-300", "bg-red-1");
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const mobile = isMobile();

    const nome = document.getElementById("nome").value.trim();
    const dataNascimento = mobile
      ? document.getElementById("data_nascimento_mobile").value
      : document.getElementById("data_nascimento").value;
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const cpf = mobile
      ? document.getElementById("cpf_mobile").value.trim()
      : document.getElementById("cpf").value.trim();
    const tipoSanguineo = mobile
      ? document.getElementById("tipo_sanguineo_mobile").value
      : document.getElementById("tipo_sanguineo").value;
    const sexo = mobile
      ? document.getElementById("sexo_mobile").value
      : document.getElementById("sexo").value;

    if (
      !nome ||
      !dataNascimento ||
      !email ||
      !senha ||
      !cpf ||
      !tipoSanguineo ||
      !sexo
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    await cadastrarUsuario(
      nome,
      email,
      senha,
      tipoSanguineo,
      cpf,
      sexo,
      dataNascimento,
    );
  });
}

// ─── SUBMIT LOGIN ────────────────────────────────────
function initLogin() {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    await fazerLogin(email, senha);
  });
}

// ─── INDEX ───────────────────────────────────────────
function initIndex() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) return;

  document.getElementById("area-usuario").innerHTML = `
    <a href="./html/perfil.html" class="flex flex-col items-center gap-1 cursor-pointer">
      <img 
        src="${usuario.foto || "./img/logo.png"}" 
        class="w-14 h-14 rounded-full object-cover border-2 border-red-1"
        alt="foto de perfil"
      />  
      <span class="font-inter font-semibold bg-red-1 text-white text-sm px-3 py-1 rounded-full">${usuario.tipo_sanguineo || ""}</span>
    </a>
  `;
}
