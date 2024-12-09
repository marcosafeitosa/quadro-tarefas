const API_URL =
  "https://personal-ga2xwx9j.outsystemscloud.com/TaskBoard_CS/rest/TaskBoard/"; //Armazena em uma variável o link do Postman para fazer as requisições

export async function makeRequest(route, options) {
  //Função assíncrona que recebe dois parâmetros
  return await fetch(API_URL.concat(route), options); //Faz uma requisição usando o "fetch", concatenando a URL base, permitindo personalizar a requisição
}
