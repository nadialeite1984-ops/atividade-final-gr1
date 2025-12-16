
// ---------------------------
// Persistência: localStorage
// ---------------------------

function getTarefas() {
  const tarefasJSON = localStorage.getItem("TAREFAS");
  if (!tarefasJSON) return [];
  try {
    return JSON.parse(tarefasJSON);
  } catch (e) {
    console.error("Erro ao parsear TAREFAS:", e);
    return [];
  }
}

function saveTarefas(tarefas) {
  localStorage.setItem("TAREFAS", JSON.stringify(tarefas));
}

// ---------------------------
// Criação
// ---------------------------

function adicionarTarefa(titulo) {
  const tarefas = getTarefas();
  const novaTarefa = {
    id: Date.now(),
    titulo,
    concluida: false
  };
  tarefas.push(novaTarefa);
  saveTarefas(tarefas);
  mostrarTarefas();
}

// ---------------------------
// Remover
// ---------------------------

function removerTarefa(idTarefa) {
  const tarefas = getTarefas();
  const idx = tarefas.findIndex(t => t.id === idTarefa);
  if (idx === -1) return; // não encontrada
  tarefas.splice(idx, 1);
  saveTarefas(tarefas);
  mostrarTarefas();
}

// ---------------------------
// Alternar Conclusão
// ---------------------------

function alternarConclusao(idTarefa) {
  const tarefas = getTarefas();
  const novas = tarefas.map(t => {
    if (t.id === idTarefa) {
      return { ...t, concluida: !t.concluida };
    }
    return t;
  });
  saveTarefas(novas);
  mostrarTarefas();
}

// ---------------------------
// Mostrar tarefas (DOM)
// ---------------------------

function mostrarTarefas() {
  const lista = document.getElementById("task-list");
  lista.innerHTML = "";

  const tarefas = getTarefas();

  if (tarefas.length === 0) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhuma tarefa. Adiciona a primeira!";
    vazio.style.opacity = "0.7";
    vazio.style.padding = "10px";
    lista.appendChild(vazio);
    return;
  }

  tarefas.forEach(tarefa => {
    const li = document.createElement("li");
    li.className = "task-item";
    // adicionar classe de concluída ao item inteiro (para CSS)
    if (tarefa.concluida) {
      li.classList.add("concluida");
    }

    // atributo data-id para referencia
    li.dataset.id = tarefa.id;

    // Conteúdo (título)
    const tituloSpan = document.createElement("div");
    tituloSpan.className = "task-title";
    tituloSpan.textContent = tarefa.titulo;

    // Ações (botões)
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const btnConcluir = document.createElement("button");
    btnConcluir.className = "btn btn-concluir";
    btnConcluir.textContent = tarefa.concluida ? "Desfazer" : "Concluir";
    btnConcluir.addEventListener("click", () => {
      alternarConclusao(tarefa.id);
    });

    const btnRemover = document.createElement("button");
    btnRemover.className = "btn btn-remover";
    btnRemover.textContent = "Remover";
    btnRemover.addEventListener("click", () => {
      // Confirmação opcional
      const ok = confirm("Remover a tarefa: \"" + tarefa.titulo + "\" ?");
      if (ok) removerTarefa(tarefa.id);
    });

    actions.appendChild(btnConcluir);
    actions.appendChild(btnRemover);

    // Anexa título e ações ao li (respeita o grid do CSS)
    li.appendChild(tituloSpan);
    li.appendChild(actions);

    lista.appendChild(li);
  });
}

// ---------------------------
// Fetch API externa
// ---------------------------

function fetchApiData() {
  const output = document.getElementById("api-output");
  output.textContent = "A carregar dados externos...";

  // Exemplo: API pública de "advice" (não requer chave)
  // endpoint: https://api.adviceslip.com/advice
  fetch("https://api.adviceslip.com/advice")
    .then(response => {
      if (!response.ok) throw new Error("Resposta da rede não ok");
      return response.json();
    })
    .then(data => {
      // A API devolve { slip: { id: ..., advice: "..." } }
      const texto = data && data.slip && data.slip.advice
        ? data.slip.advice
        : JSON.stringify(data);
      output.innerHTML = `<strong>Fato / Conselho:</strong> ${texto}`;
    })
    .catch(err => {
      console.error("Erro na fetch:", err);
      output.textContent = "Não foi possível carregar dados externos.";
    });
}

// ---------------------------
// Inicialização e eventos
// ---------------------------

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-tarefa");
  const input = document.getElementById("titulo-tarefa");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const titulo = input.value.trim();
    if (titulo !== "") {
      adicionarTarefa(titulo);
      input.value = "";
      input.focus();
    }
  });

  // Carregar e mostrar tarefas
  mostrarTarefas();

  // Chamar a API externa
  fetchApiData();
});

// ############   DESAFIO   ############
// --- Extra: Exportar tarefas para ficheiro TXT ---
function exportarTarefasTxt() {
  const tarefas = getTarefas();

  if (!tarefas || tarefas.length === 0) {
    alert("Não há tarefas para exportar!");
    return;
  }

  // Construção do conteúdo
  let conteudo = "RELATÓRIO DE TAREFAS\n";
  conteudo += "======================\n\n";

  tarefas.forEach((t, i) => {
    conteudo += `${i + 1}. ${t.titulo}\n`;
    conteudo += `   Estado: ${t.concluida ? "Concluída ✅" : "Pendente ⏳"}\n`;
    conteudo += `   ID: ${t.id}\n\n`;
  });

  conteudo += `Total: ${tarefas.length} tarefas\n`;
  conteudo += `Gerado em: ${new Date().toLocaleString()}\n`;

  // Criação do ficheiro e download automático
  const blob = new Blob([conteudo], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tarefas_relatorio.txt";
  link.click();

  URL.revokeObjectURL(url); // limpeza de memória
}

document.getElementById("btn-exportar").addEventListener("click", exportarTarefasTxt);



// --- Extra: Exportar tarefas para ficheiro CSV ---
function exportarTarefasCsv() {
  const tarefas = getTarefas();

  if (!tarefas || tarefas.length === 0) {
    alert("Não há tarefas para exportar!");
    return;
  }

  // Cabeçalho CSV
  let conteudo = "ID,Título,Estado\n";

  // Cada linha representa uma tarefa
  tarefas.forEach(t => {
    const estado = t.concluida ? "Concluída" : "Pendente";
    // Escapar vírgulas dentro do título (usar aspas)
    const tituloSeguro = `"${t.titulo.replace(/"/g, '""')}"`;
    conteudo += `${t.id},${tituloSeguro},${estado}\n`;
  });

  // Criação e download do ficheiro
  const blob = new Blob([conteudo], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tarefas_relatorio.csv";
  link.click();

  URL.revokeObjectURL(url);
}


document.getElementById("btn-exportar-csv").addEventListener("click", exportarTarefasCsv);
