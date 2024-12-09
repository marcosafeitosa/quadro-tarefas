import { makeRequest } from "./api.js";

const ctnColunaTarefas = document.getElementById("colunas-tarefa");
const ctnOpcoesQuadro = document.getElementById("selecao-quadro-tarefa");
let idQuadro;

const elCriarQuadro = document.getElementById("criar-quadro");

async function criarQuadro() {
  const novoQuadroTexto = prompt("Digite o nome do novo quadro:");
  if (novoQuadroTexto && novoQuadroTexto.trim() !== "") {
    const userId = localStorage.getItem("userId");
    try {
      if (!userId) {
        throw new Error("Usuário não está logado");
      }

      const response = await makeRequest(`/Board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: novoQuadroTexto,
          IsActive: true,
          CreatedBy: parseInt(userId),
          UpdatedBy: parseInt(userId),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar o quadro");
      }

      const novoQuadro = await response.json();
      console.log(novoQuadro);
      await pegarDadosQuadros();
    } catch (error) {
      console.error("Erro ao criar o quadro:", error);
      alert("Erro ao criar o quadro, verifique se você está logado.");
    }
  }
}

elCriarQuadro.addEventListener("click", criarQuadro);

function startLoading() {
  document.getElementById("loading").classList.remove("hide");
  document.getElementById("container-colunas").classList.add("hide");
}

function removeLoading() {
  document.getElementById("loading").classList.add("hide");
  document.getElementById("container-colunas").classList.remove("hide");
}

async function pegarDadosQuadros() {
  try {
    startLoading();
    const listaOpcoesSelect = await makeRequest("/Boards");

    if (listaOpcoesSelect.ok) {
      const quadros = await listaOpcoesSelect.json();
      criarQuadros(quadros);
    } else {
      console.error("Erro", listaOpcoesSelect.status);
    }
  } catch (erro) {
    console.error(erro);
  } finally {
    removeLoading();
  }
}

function criarQuadros(quadrosDados) {
  const quadrosHTML = quadrosDados
    .map((quadro) => `<option value="${quadro.Id}">${quadro.Name}</option>`)
    .join("");

  ctnOpcoesQuadro.innerHTML += quadrosHTML;

  ctnOpcoesQuadro.addEventListener("change", async (evento) => {
    const idQuadroSelecionado = evento.target.value;
    const indexQuadroSelecionado = evento.target.selectedIndex - 1;
    if (idQuadroSelecionado) {
      await carregarColunas(
        idQuadroSelecionado,
        indexQuadroSelecionado,
        quadrosDados
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", pegarDadosQuadros);

async function carregarColunas(idQuadroSelecionado, indexQuadro, dadosQuadros) {
  idQuadro = dadosQuadros[indexQuadro].Id;
  try {
    startLoading();
    const tituloQuadro = document.getElementById("titulo-quadro");
    tituloQuadro.innerText = dadosQuadros[indexQuadro].Name;

    const boardColumnsData = await makeRequest(
      `/ColumnByBoardId?BoardId=${idQuadro}`
    );
    if (boardColumnsData.ok) {
      const colunas = await boardColumnsData.json();
      await criarColunas(colunas);
    } else {
      console.error("Erro ao carregar colunas:", boardColumnsData.status);
    }
  } catch (erro) {
    console.error(erro);
  } finally {
    removeLoading();
  }
}

async function criarColunas(colunas) {
  const columnStack = [];

  // Limpar o contêiner antes de renderizar novas colunas
  ctnColunaTarefas.innerHTML = "";

  const containerContent = colunas
    .map((col) => {
      columnStack.push(col.Id);
      return `
        <div class="header-tarefa-${col.Id}">
          <div class="ctn-cabecalho">
            <h3 class="cabecalho-tarefa">${
              col.Name || "Tarefa inexistente."
            }</h3>
            <button class="adicionar-tarefa" title="Criar tarefa" data-column-id="${
              col.Id
            }">+</button>
          </div>
        </div>`;
    })
    .join("");

  ctnColunaTarefas.innerHTML = containerContent;

  // Carregar as tarefas associadas às colunas
  await carregarTarefasDaColuna(columnStack);
}

async function carregarTarefasDaColuna(columnIds) {
  try {
    startLoading();
    await Promise.all(
      columnIds.map(async (idColuna) => {
        const infoTarefa = await makeRequest(
          `/TasksByColumnId?ColumnId=${idColuna}`
        );
        if (infoTarefa.ok) {
          const tarefasJson = await infoTarefa.json();
          await criarTarefas(tarefasJson, idColuna);
        } else {
          console.error("Erro ao carregar tarefas:", infoTarefa.status);
        }
      })
    );
  } catch (erro) {
    console.error(erro);
  } finally {
    removeLoading();
  }

  // Associar evento aos botões de adicionar tarefa sem duplicar
  document.querySelectorAll(".adicionar-tarefa").forEach((btn) => {
    if (!btn.hasAttribute("data-event-bound")) {
      btn.addEventListener("click", () => {
        const columnId = btn.dataset.columnId;
        adicionarTarefa(columnId);
      });
    }
  });
}

async function criarTarefas(tarefasJson, idColuna) {
  const divCorrespondente = document.querySelector(
    `.header-tarefa-${idColuna}`
  );

  if (divCorrespondente) {
    // Limpar tarefas antigas
    divCorrespondente
      .querySelectorAll(".descricao-tarefa")
      .forEach((tarefa) => tarefa.remove());

    divCorrespondente.classList.add("style-ctn-tarefa");

    if (tarefasJson.length === 0) {
      divCorrespondente.innerHTML += `<p><strong>Nenhuma tarefa encontrada.</strong></p>`;
    } else {
      tarefasJson.forEach((tarefa) => {
        divCorrespondente.innerHTML += `
          <div class="descricao-tarefa">
            <p class="texto-descricao"><strong>${tarefa.Title}</strong></p>
            <div class="botao-acoes">
            <button class="editar-tarefa" title="Editar tarefa">✏️</button>
            <button class="deletar-tarefa" title="Excluir tarefa">❌</button>
            </div>
          </div>`;
      });
    }
  }
}

async function adicionarTarefa(columnId) {
  const tituloTarefa = prompt("Digite o título da tarefa:");
  if (tituloTarefa && tituloTarefa.trim() !== "") {
    try {
      // Salvar o valor do quadro selecionado
      const selectedQuadroId = ctnOpcoesQuadro.value;

      const response = await makeRequest(`/Task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ColumnId: parseInt(columnId),
          Title: tituloTarefa,
          IsActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar tarefa.");
      }

      const novaTarefa = await response.json();
      console.log("Tarefa criada:", novaTarefa);

      // Atualizar as tarefas da coluna e a lista de quadros
      await carregarTarefasDaColuna([columnId]);
      await pegarDadosQuadros();

      // Restaurar o quadro selecionado
      ctnOpcoesQuadro.value = selectedQuadroId;
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  }
}

async function deletarQuadro(columnId) {
  try {
    const response = await fetch(`${API_BASE_URL}/Board?BoardId=${columnId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir quadro");
    }
    document.getElementById("style-ctn-tarefa").innerHTML = "";
    // document.getElementById("current-board-name").textContent =
    // "Nome do Quadro";

    await pegarDadosQuadros();

    const userBoardsDropdown = document.getElementById("user-boards-dropdown");
    userBoardsDropdown.value = "";
  } catch (error) {
    console.error("Erro ao excluir quadro:", error);
    alert("Erro ao excluir quadro");
  }
}
