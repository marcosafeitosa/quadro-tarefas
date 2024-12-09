let textoErro = document.getElementById("message-error");
const url_api =
  "https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard";
let botaoAcessar = document.getElementById("botaoUsuario");

botaoAcessar.addEventListener("click", async (evento) => {
  evento.preventDefault();
  let valorEmail = document.getElementById("userEmail").value;
  document.getElementById("userEmail").value = "";

  try {
    let respostaEmail = await fetch(
      `${url_api}/GetPersonByEmail?Email=${valorEmail}`
    );
    if (respostaEmail.ok) {
      let informacoesUsuario = await respostaEmail.json();

      if (informacoesUsuario && informacoesUsuario.Email) {
        localStorage.setItem("userEmail", informacoesUsuario.Email);
        localStorage.setItem("userId", informacoesUsuario.Id);
        window.location.href = "./taskBoard.html";
      } else {
        textoErro.innerText = "E-mail não encontrado!";
        textoErro.style.display = "block";
      }
    } else {
      textoErro.innerText = "E-mail não encontrado!";
      textoErro.style.display = "block";
    }
  } catch (erro) {
    textoErro.innerText = "Erro inesperado!";
    textoErro.style.display = "block";
  }
});
