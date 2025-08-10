const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Variables del estado del juego
let respuestaCorrectaActual = '';
let rondaActiva = false;
let usuariosConectados = {};

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Manejar la conexión de un nuevo usuario
    socket.on('usuario:conectado', (nombre) => {
        usuariosConectados[socket.id] = nombre;
        console.log(`${nombre} se ha conectado`);
        
        // Notificar a todos los usuarios conectados
        io.emit('usuario:nuevo', { nombre, totalConectados: Object.keys(usuariosConectados).length });
    });

    // Manejar nueva pregunta del docente
    socket.on('pregunta:nueva', (data) => {
        const { pregunta, respuesta } = data;
        respuestaCorrectaActual = respuesta.toLowerCase().trim();
        rondaActiva = true;
        
        console.log(`Nueva pregunta: ${pregunta}`);
        console.log(`Respuesta correcta: ${respuestaCorrectaActual}`);
        
        // Enviar solo la pregunta a todos los clientes
        io.emit('pregunta:publicada', pregunta);
    });

    // Manejar respuesta de estudiante
    socket.on('respuesta:enviada', (respuesta) => {
        const nombreUsuario = usuariosConectados[socket.id];
        
        if (!rondaActiva) {
            // La ronda ya terminó, no procesar más respuestas
            return;
        }

        if (!nombreUsuario) {
            console.log('Usuario no identificado intentó enviar respuesta');
            return;
        }

        const respuestaNormalizada = respuesta.toLowerCase().trim();
        console.log(`${nombreUsuario} respondió: ${respuesta}`);

        // Verificar si la respuesta es correcta
        if (respuestaNormalizada === respuestaCorrectaActual) {
            // ¡Respuesta correcta! Terminar la ronda
            rondaActiva = false;
            
            console.log(`¡${nombreUsuario} ganó la ronda!`);
            
            // Notificar a todos los clientes que la ronda terminó
            io.emit('ronda:terminada', {
                ganador: nombreUsuario,
                respuestaCorrecta: respuestaCorrectaActual
            });
        }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
        const nombreUsuario = usuariosConectados[socket.id];
        if (nombreUsuario) {
            console.log(`${nombreUsuario} se ha desconectado`);
            delete usuariosConectados[socket.id];
            
            // Notificar a todos los usuarios
            io.emit('usuario:desconectado', { 
                nombre: nombreUsuario, 
                totalConectados: Object.keys(usuariosConectados).length 
            });
        }
    });

    // Evento para reiniciar el juego (opcional)
    socket.on('juego:reiniciar', () => {
        const nombreUsuario = usuariosConectados[socket.id];
        
        // Solo permitir que el docente reinicie
        if (nombreUsuario && nombreUsuario.toLowerCase() === 'docente') {
            rondaActiva = false;
            respuestaCorrectaActual = '';
            
            io.emit('juego:reiniciado');
            console.log('Juego reiniciado por el docente');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('¡Quiz Rápido: El Duelo de Conocimiento está listo!');
});