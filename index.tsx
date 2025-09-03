import { GoogleGenAI, Chat } from "@google/genai";

// The API key is injected by the environment
const API_KEY = process.env.API_KEY;

let chat: Chat | null = null;

if (!API_KEY) {
  console.error("API_KEY not found. The chat widget will be disabled.");
} else {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemInstruction = `
    Eres un asistente virtual para "AutoService", un servicio de mantenimiento y cambio de neumáticos a domicilio enfocado en la zona del Vallès Oriental, en Barcelona.
    Tu objetivo es ayudar a los usuarios a entender nuestros servicios y guiarles para que reserven a través del formulario de la web.
    Sé amable, profesional y conciso. Habla siempre en español.

    Información Clave de AutoService:
    - **Propuesta de Valor Principal**: Recogemos el coche del cliente en su trabajo y se lo devolvemos listo al final de su jornada. Ahorramos su tiempo.
    - **Zona de Cobertura**: Principalmente en el Vallès Oriental (Granollers, Mollet, Parets, Lliçà, etc.). La recogida y entrega es gratuita en esta zona.

    - **Servicios y Precios Base**:
      1.  **Mantenimiento Programado (Recogida y Entrega)**: Desde 250€ por mano de obra y revisión de 30 puntos. Los recambios (aceite, filtros) se presupuestan aparte con aprobación del cliente.
      2.  **Cambio de Neumáticos (A Domicilio)**: Desde 60€ por rueda por la mano de obra (equilibrado incluido). El coste del neumático es aparte.

    - **Proceso (Cómo funciona)**:
        1. El cliente reserva una franja horaria de mínimo 6 horas a través del formulario.
        2. Recogemos su coche o vamos a su domicilio para el servicio.
        3. Se lo entregamos a la hora acordada.

    - **Garantía de Puntualidad**: Si nos retrasamos en la entrega por una causa nuestra, ofrecemos un coche de sustitución sin coste para el cliente.

    - **Tu Rol**: NO puedes agendar citas. Tu única llamada a la acción es dirigir al usuario al formulario de la web. Anima a los usuarios a rellenar el formulario en la sección "Reservar tu Franja Ahora". No inventes información.
    `;

    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window') as HTMLDivElement;
    const chatButton = document.getElementById('chat-button') as HTMLDivElement;
    const chatInput = document.getElementById('chat-message-input') as HTMLInputElement;

    if (!chat || !chatWindow || !chatButton || !chatInput) {
        if(chatInput) {
            chatInput.placeholder = "Asistente no disponible.";
            chatInput.disabled = true;
        }
        return;
    }

    chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });

    const handleSendMessage = async () => {
        const message = chatInput.value.trim();
        if (message === '' || !chat) return;

        addMessageToChat(message, 'user');
        chatInput.value = '';
        showTypingIndicator();

        try {
            const response = await chat.sendMessage({ message });
            removeTypingIndicator();
            addMessageToChat(response.text, 'bot');
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            removeTypingIndicator();
            addMessageToChat("Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.", 'bot');
        }
    }
});

function addMessageToChat(text: string, sender: 'user' | 'bot') {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;
    messageElement.textContent = text;
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showTypingIndicator() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'chat-message bot typing-indicator';
    typingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    indicator?.remove();
}
