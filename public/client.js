// Establecer conexión con el servidor
const socket = io();

// Variables globales
let nombreUsuario = '';
let esDocente = false;

// Elementos del DOM
const statusText = document.getElementById('statusText');
const usuariosConectados = document.getElementById('usuariosConectados');
const panelDocente = document.getElementById('panelDocente');
const areaPregunta = document.getElementById('areaPregunta');
const areaResultados = document.getElementById('areaResultados');
const estadoCarga = document.getElementById('estadoCarga');

// Elementos del docente
const inputPregunta = document.getElementById('inputPregunta');
const inputRespuesta = document.getElementById('inputRespuesta');
const btnPublicarPregunta = document.getElementById('btnPublicarPregunta');
const btnReiniciarJuego = document.getElementById('btnReiniciarJuego');

// Elementos del estudiante
const preguntaActual = document.getElementById('preguntaActual');
const inputRespuestaEstudiante = document.getElementById('inputRespuestaEstudiante');
const btnEnviarRespuesta = document.getElementById('btnEnviarRespuesta');

// Elementos de resultados
const mensajeGanador = document.getElementById('mensajeGanador');
const respuestaCorrecta = document.getElementById('respuestaCorrecta');

// Función para pedir el nombre del usuario
function pedirNombreUsuario() {
    do {
        nombreUsuario = prompt('¡Bienvenido al Quiz Rápido! 🧠\n\nIngresa tu nombre:\n(Escribe "docente" si eres el docente)');
        
        if (nombreUsuario === null) {
            alert('Necesitas ingresar un nombre para continuar.');
        } else {
            nombreUsuario = nombreUsuario.trim();
            if (nombreUsuario === '') {
                alert('El nombre no puede estar vacío.');
            }
        }
    } while (!nombreUsuario);

    // Verificar si es docente
    esDocente = nombreUsuario.toLowerCase() === 'docente';
    
    return nombreUsuario;
}

// Función para mostrar/ocultar elementos
function mostrarElemento(elemento, mostrar = true) {
    if (mostrar) {
        elemento.classList.remove('hidden');
    } else {
        elemento.classList.add('hidden');
    }
}

// Función para actualizar el estado de la UI
function actualizarInterfaz() {
    estadoCarga.classList.add('hidden');
    
    if (esDocente) {
        mostrarElemento(panelDocente);
        statusText.textContent = '👨‍🏫 Conectado como Docente';
        // Solo mostrar área de resultados para el docente, no el panel del estudiante
        mostrarElemento(areaPregunta, false);
    } else {
        statusText.textContent = `👨‍🎓 Conectado como: ${nombreUsuario}`;
        mostrarElemento(areaPregunta);
    }
}

// Función para limpiar campos del docente
function limpiarCamposDocente() {
    inputPregunta.value = '';
    inputRespuesta.value = '';
}

// Función para habilitar/deshabilitar campos de respuesta
function habilitarRespuesta(habilitar = true) {
    inputRespuestaEstudiante.disabled = !habilitar;
    btnEnviarRespuesta.disabled = !habilitar;
    
    if (habilitar) {
        inputRespuestaEstudiante.focus();
    }
}

// Eventos del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Pedir nombre al usuario
    const nombre = pedirNombreUsuario();
    
    // Eventos del docente
    btnPublicarPregunta.addEventListener('click', function() {
        const pregunta = inputPregunta.value.trim();
        const respuesta = inputRespuesta.value.trim();
        
        if (!pregunta || !respuesta) {
            alert('Por favor completa tanto la pregunta como la respuesta.');
            return;
        }
        
        // Emitir nueva pregunta
        socket.emit('pregunta:nueva', {
            pregunta: pregunta,
            respuesta: respuesta
        });
        
        limpiarCamposDocente();
        statusText.textContent = '✅ Pregunta publicada exitosamente';
    });
    
    btnReiniciarJuego.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
            socket.emit('juego:reiniciar');
        }
    });
    
    // Eventos del estudiante
    btnEnviarRespuesta.addEventListener('click', function() {
        const respuesta = inputRespuestaEstudiante.value.trim();
        
        if (!respuesta) {
            alert('Por favor escribe una respuesta.');
            return;
        }
        
        // Emitir respuesta
        socket.emit('respuesta:enviada', respuesta);
        
        // Deshabilitar campos para evitar múltiples envíos
        habilitarRespuesta(false);
        btnEnviarRespuesta.textContent = '⏳ Enviando...';
        statusText.textContent = 'Respuesta enviada. Esperando resultados...';
    });
    
    // Permitir enviar respuesta con Enter
    inputRespuestaEstudiante.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !btnEnviarRespuesta.disabled) {
            btnEnviarRespuesta.click();
        }
    });
    
    // Permitir publicar pregunta con Ctrl+Enter
    inputPregunta.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            btnPublicarPregunta.click();
        }
    });
});

// Eventos de Socket.io

// Cuando se establece la conexión
socket.on('connect', function() {
    console.log('Conectado al servidor');
    
    // Enviar nombre de usuario al servidor
    socket.emit('usuario:conectado', nombreUsuario);
    
    // Actualizar interfaz
    setTimeout(actualizarInterfaz, 500);
});

// Cuando se desconecta del servidor
socket.on('disconnect', function() {
    statusText.textContent = '❌ Desconectado del servidor';
    console.log('Desconectado del servidor');
});

// Cuando un nuevo usuario se conecta
socket.on('usuario:nuevo', function(data) {
    usuariosConectados.textContent = `Usuarios conectados: ${data.totalConectados}`;
    console.log(`${data.nombre} se ha conectado`);
});

// Cuando un usuario se desconecta
socket.on('usuario:desconectado', function(data) {
    usuariosConectados.textContent = `Usuarios conectados: ${data.totalConectados}`;
    console.log(`${data.nombre} se ha desconectado`);
});

// Cuando se publica una nueva pregunta
socket.on('pregunta:publicada', function(pregunta) {
    console.log('Nueva pregunta recibida:', pregunta);
    
    // Mostrar la pregunta
    preguntaActual.textContent = pregunta;
    preguntaActual.style.background = 'linear-gradient(135deg, #74b9ff, #0984e3)';
    preguntaActual.style.color = 'white';
    
    // Limpiar resultados anteriores
    mostrarElemento(areaResultados, false);
    
    // Habilitar respuesta para estudiantes
    if (!esDocente) {
        habilitarRespuesta(true);
        inputRespuestaEstudiante.value = '';
        btnEnviarRespuesta.textContent = '🚀 Enviar Respuesta';
        statusText.textContent = '⚡ ¡Nueva pregunta disponible! Responde rápido.';
    } else {
        statusText.textContent = '📢 Pregunta publicada. Esperando respuestas...';
    }
});

// Cuando termina una ronda
socket.on('ronda:terminada', function(data) {
    console.log('Ronda terminada:', data);
    
    // Deshabilitar campos de respuesta
    habilitarRespuesta(false);
    
    // Mostrar resultados
    mostrarElemento(areaResultados);
    areaResultados.classList.add('ganador');
    
    mensajeGanador.innerHTML = `
        🎉 <strong>${data.ganador}</strong> ha ganado la ronda! 🏆
    `;
    
    respuestaCorrecta.innerHTML = `
        ✅ La respuesta correcta era: <strong>${data.respuestaCorrecta}</strong>
    `;
    
    // Actualizar status
    if (nombreUsuario === data.ganador) {
        statusText.textContent = '🏆 ¡Felicitaciones! ¡Has ganado!';
    } else {
        statusText.textContent = `🏁 Ronda terminada. Ganador: ${data.ganador}`;
    }
    
    // Remover animación después de 2 segundos
    setTimeout(() => {
        areaResultados.classList.remove('ganador');
    }, 2000);
});

// Cuando se reinicia el juego
socket.on('juego:reiniciado', function() {
    console.log('Juego reiniciado');
    
    // Limpiar interfaz
    preguntaActual.textContent = 'Esperando nueva pregunta...';
    preguntaActual.style.background = 'white';
    preguntaActual.style.color = '#333';
    
    mostrarElemento(areaResultados, false);
    habilitarRespuesta(false);
    
    if (!esDocente) {
        inputRespuestaEstudiante.value = '';
        btnEnviarRespuesta.textContent = '🚀 Enviar Respuesta';
        statusText.textContent = 'Juego reiniciado. Esperando nueva pregunta...';
    } else {
        limpiarCamposDocente();
        statusText.textContent = 'Juego reiniciado. Puedes publicar una nueva pregunta.';
    }
});

// Manejar errores de conexión
socket.on('connect_error', function(error) {
    console.error('Error de conexión:', error);
    statusText.textContent = '❌ Error de conexión al servidor';
});

socket.on('reconnect', function() {
    console.log('Reconectado al servidor');
    statusText.textContent = '✅ Reconectado al servidor';
    
    // Reenviar nombre de usuario
    socket.emit('usuario:conectado', nombreUsuario);
});