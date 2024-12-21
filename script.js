// Variáveis globais
let questoes = [];
let indiceQuestaoAtual = 0;
let pontuacao = 0;
let respostaSelecionada = null;
const TOTAL_QUESTOES = 30;
const PORCENTAGEM_APROVACAO = 70;
const TEMPO_LIMITE = 60 * 60; // 60 minutos em segundos
let mostrarRespostasImediatas = true;
let userResults = [];

function setupNavigation() {
    // Configurar links de navegação
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });

    // Configurar botões que levam ao quiz
    const quizButtons = document.querySelectorAll('.btn-quiz-start');
    quizButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'quiz.html';
        });
    });
}

function setupMobileMenu() {
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuPrincipal = document.querySelector('.menu-principal');
    
    if (!menuHamburguer || !menuPrincipal) {
        console.log('Elementos do menu não encontrados');
        return;
    }

    // Mostrar o menu hambúrguer em telas mobile
    menuHamburguer.style.display = 'flex';

    menuHamburguer.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('ativo');
        menuPrincipal.classList.toggle('ativo');
        console.log('Menu toggle');
    });

    // Fechar menu ao clicar em um link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuHamburguer.classList.remove('ativo');
            menuPrincipal.classList.remove('ativo');
        });
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!menuPrincipal.contains(e.target) && !menuHamburguer.contains(e.target)) {
            menuHamburguer.classList.remove('ativo');
            menuPrincipal.classList.remove('ativo');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    
    // Sempre inicializar o menu mobile primeiro
    setupMobileMenu();
    
    // Identificar qual página está sendo carregada
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Página atual:', currentPage);
    
    // Configurações específicas para cada página
    switch(currentPage) {
        case 'quiz.html':
            inicializarQuiz();
            break;
        case 'placas.html':
            initializePlacas();
            break;
        case 'index.html':
            initializeCarousel();
            break;
    }
});

function inicializarQuiz() {
    console.log('Inicializando quiz...');
    carregarQuestoes();

    // Configurar eventos do quiz
    const confirmarBtn = document.getElementById('confirmar');
    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', () => {
            console.log('Clique no botão confirmar');
            verificarResposta();
        });
    }

    const proximaBtn = document.getElementById('proxima');
    if (proximaBtn) {
        proximaBtn.addEventListener('click', () => {
            console.log('Clique no botão próxima');
            proximaQuestao();
        });
    }

    // Configurar modo de resposta
    const modoRespostaInputs = document.querySelectorAll('input[name="modo-resposta"]');
    modoRespostaInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            mostrarRespostasImediatas = e.target.value === 'imediato';
            console.log('Modo de resposta:', mostrarRespostasImediatas ? 'imediato' : 'final');
        });
    });

    // Configurar seleção de alternativas
    document.addEventListener('click', (e) => {
        const alternativa = e.target.closest('.alternativa');
        if (alternativa && !alternativa.classList.contains('disabled')) {
            console.log('Alternativa clicada:', alternativa.dataset.alternativa);
            selecionarAlternativa(alternativa);
        }
    });
}

async function carregarQuestoes() {
    try {
        console.log('Carregando questões...');
        const response = await fetch('transito.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Embaralhar questões
        questoes = [...data].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTOES);
        
        // Iniciar quiz
        exibirQuestao();
        iniciarTempo();
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
        const quizContainer = document.getElementById('quiz');
        if (quizContainer) {
            quizContainer.innerHTML = `
                <div class="erro-mensagem">
                    <h3>Erro ao carregar questões</h3>
                    <p>Por favor, tente novamente mais tarde.</p>
                </div>
            `;
        }
    }
}

function exibirQuestao() {
    const questaoAtual = questoes[indiceQuestaoAtual];
    if (!questaoAtual) return;

    const perguntaElement = document.getElementById('pergunta');
    const alternativasContainer = document.getElementById('alternativas');
    const dificuldadeElement = document.querySelector('.dificuldade');

    // Limpar seleção anterior
    respostaSelecionada = null;
    const confirmarBtn = document.getElementById('confirmar');
    if (confirmarBtn) {
        confirmarBtn.disabled = true;
    }

    // Exibir pergunta e dificuldade
    if (perguntaElement) {
        perguntaElement.textContent = questaoAtual.pergunta;
    }
    
    if (dificuldadeElement) {
        dificuldadeElement.textContent = questaoAtual.dificuldade.toUpperCase();
        dificuldadeElement.className = `dificuldade ${questaoAtual.dificuldade}`;
    }

    // Limpar e criar alternativas
    if (alternativasContainer) {
        alternativasContainer.innerHTML = '';
        Object.entries(questaoAtual.alternativas).forEach(([letra, texto]) => {
            const alternativa = document.createElement('div');
            alternativa.className = 'alternativa';
            alternativa.dataset.alternativa = letra;
            alternativa.innerHTML = `
                <span class="letra">${letra.toUpperCase()})</span>
                <span class="texto">${texto}</span>
            `;
            alternativasContainer.appendChild(alternativa);
        });
    }

    // Esconder feedback
    const feedback = document.getElementById('feedback');
    const respostaFeedback = document.getElementById('resposta-feedback');
    if (feedback) feedback.classList.add('escondido');
    if (respostaFeedback) respostaFeedback.classList.add('escondido');

    // Atualizar progresso
    atualizarProgresso();
}

function selecionarAlternativa(alternativa) {
    // Remover seleção anterior
    document.querySelectorAll('.alternativa').forEach(alt => {
        alt.classList.remove('selecionada');
    });

    // Adicionar seleção à alternativa clicada
    alternativa.classList.add('selecionada');
    
    // Habilitar botão de confirmar
    const confirmarBtn = document.getElementById('confirmar');
    if (confirmarBtn) {
        confirmarBtn.disabled = false;
    }

    // Atualizar resposta selecionada
    respostaSelecionada = alternativa.dataset.alternativa;
}

function verificarResposta() {
    if (!respostaSelecionada) return;

    const questaoAtual = questoes[indiceQuestaoAtual];
    const alternativas = document.querySelectorAll('.alternativa');
    const feedback = document.getElementById('feedback');
    const respostaFeedback = document.getElementById('resposta-feedback');
    const explicacao = document.getElementById('explicacao');
    const proximaBtn = document.getElementById('proxima');
    
    const estaCorreta = respostaSelecionada === questaoAtual.resposta_correta;

    // Atualizar estatísticas
    if (estaCorreta) {
        pontuacao++;
    }

    // Salvar resposta do usuário
    let respostas = JSON.parse(sessionStorage.getItem('respostas')) || [];
    respostas.push({
        questao: questaoAtual,
        respostaUsuario: respostaSelecionada,
        correta: estaCorreta
    });
    sessionStorage.setItem('respostas', JSON.stringify(respostas));

    // Mostrar feedback
    feedback.classList.remove('escondido');
    respostaFeedback.classList.remove('escondido');
    
    if (estaCorreta) {
        respostaFeedback.innerHTML = `
            <div class="feedback-icon correto">✓</div>
            <p class="feedback-texto">Resposta correta!</p>
        `;
    } else {
        respostaFeedback.innerHTML = `
            <div class="feedback-icon incorreto">✗</div>
            <p class="feedback-texto">Resposta incorreta</p>
        `;
    }

    explicacao.textContent = questaoAtual.explicacao;

    // Desabilitar interação com alternativas
    alternativas.forEach(alt => {
        alt.classList.add('disabled');
    });

    // Desabilitar botão confirmar e habilitar próxima
    document.getElementById('confirmar').disabled = true;
    if (proximaBtn) proximaBtn.disabled = false;

    // Se não estiver no modo imediato, esconder feedback
    if (!mostrarRespostasImediatas) {
        respostaFeedback.classList.add('escondido');
        explicacao.textContent = '';
    }

    // Salvar questão e resposta
    let questoesRespondidas = JSON.parse(sessionStorage.getItem('questoesRespondidas')) || [];
    let respostasUsuario = JSON.parse(sessionStorage.getItem('respostasUsuario')) || [];
    
    questoesRespondidas.push(questoes[indiceQuestaoAtual]);
    respostasUsuario.push(respostaSelecionada);
    
    sessionStorage.setItem('questoesRespondidas', JSON.stringify(questoesRespondidas));
    sessionStorage.setItem('respostasUsuario', JSON.stringify(respostasUsuario));
}

function proximaQuestao() {
    if (respostaSelecionada === null) {
        alert('Por favor, selecione uma resposta antes de continuar.');
        return;
    }

    indiceQuestaoAtual++;
    if (indiceQuestaoAtual >= TOTAL_QUESTOES) {
        finalizarQuiz();
        return;
    }

    // Limpar seleção e feedback
    respostaSelecionada = null;
    const alternativas = document.querySelectorAll('.alternativa');
    alternativas.forEach(alt => alt.classList.remove('selecionada', 'disabled'));
    
    const feedback = document.getElementById('feedback');
    const respostaFeedback = document.getElementById('resposta-feedback');
    if (feedback) feedback.classList.add('escondido');
    if (respostaFeedback) respostaFeedback.classList.add('escondido');

    // Habilitar botão confirmar
    const confirmarBtn = document.getElementById('confirmar');
    if (confirmarBtn) confirmarBtn.disabled = true;

    // Carregar próxima questão
    exibirQuestao();
}

function atualizarProgresso() {
    const progressoElement = document.getElementById('progresso');
    if (progressoElement) {
        progressoElement.textContent = `Questão ${indiceQuestaoAtual + 1} de ${TOTAL_QUESTOES}`;
    }
}

function iniciarTempo() {
    let tempoRestante = TEMPO_LIMITE;
    const tempoElement = document.getElementById('tempo');

    function atualizarTempo() {
        const minutos = Math.floor(tempoRestante / 60);
        const segundos = tempoRestante % 60;
        if (tempoElement) {
            tempoElement.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        }

        if (tempoRestante === 0) {
            clearInterval(intervalo);
            finalizarQuiz();
        } else {
            tempoRestante--;
        }
    }

    const intervalo = setInterval(atualizarTempo, 1000);
    atualizarTempo();
}

function finalizarQuiz() {
    const porcentagem = (pontuacao / TOTAL_QUESTOES) * 100;
    
    // Salvar todas as questões
    sessionStorage.setItem('todasQuestoes', JSON.stringify(questoes));
    
    // Redirecionar para a página de resultados
    window.location.href = `resultado.html?pontuacao=${pontuacao}&total=${TOTAL_QUESTOES}&porcentagem=${porcentagem}`;
}

function verificarFimDoQuiz() {
    if (indiceQuestaoAtual >= TOTAL_QUESTOES) {
        finalizarQuiz();
        return true;
    }
    return false;
}

function salvarResultado(porcentagem) {
    // Obter usuário atual
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    // Obter resultados existentes
    let results = JSON.parse(localStorage.getItem('quizResults')) || [];
    
    // Adicionar novo resultado
    const novoResultado = {
        userId: currentUser.id,
        userName: currentUser.name,
        score: porcentagem,
        date: new Date().toISOString(),
        questoes: TOTAL_QUESTOES,
        acertos: pontuacao
    };

    results.push(novoResultado);
    
    // Salvar no localStorage
    localStorage.setItem('quizResults', JSON.stringify(results));
}

function initializeCarousel() {
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    function showSlides(n) {
        slideIndex = n;
        if (slideIndex >= slides.length) slideIndex = 0;
        if (slideIndex < 0) slideIndex = slides.length - 1;

        slides.forEach(slide => slide.style.display = 'none');
        dots.forEach(dot => dot.classList.remove('active'));

        slides[slideIndex].style.display = 'block';
        dots[slideIndex].classList.add('active');
    }

    // Navegação do carrossel
    document.querySelector('.prev')?.addEventListener('click', () => showSlides(slideIndex - 1));
    document.querySelector('.next')?.addEventListener('click', () => showSlides(slideIndex + 1));
    
    // Dots do carrossel
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlides(index));
    });

    // Auto-play do carrossel
    setInterval(() => showSlides(slideIndex + 1), 5000);

    // Mostrar primeiro slide
    showSlides(0);
}
  