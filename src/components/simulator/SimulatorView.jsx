import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../hooks/useAIAgent';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from './ChatMessage';
import { ChatQuickPrompts } from './ChatQuickPrompts';
import { DatabaseConsole } from './DatabaseConsole';
import { getEngineLabel } from '../../utils/formatters';

export function SimulatorView({ initialPrompt, onTriggerSaleModal }) {
  const { coils, dbEngine, ownerSettings } = useInventory();
  const { generateResponse, consoleLogs, clearLogs } = useAIAgent();
  const { isAdmin } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(true);

  const [messages, setMessages] = useState(() => [
    {
      id: 'init-msg',
      sender: 'bot',
      html: `¡Hola! 👋 Soy el <strong>Asesor Virtual Inteligente de Bobinas Express</strong>.<br><br>Escríbeme la marca, modelo de auto, año o código OEM que necesitas y confirmaré existencias y precios al instante.`,
      badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} bobinas)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      product: null
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming initial prompt from catalog ("Consultar IA")
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = (textToSend) => {
    const text = String(textToSend || inputVal).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Append user message
    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      time: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // 2. Simulate network / AI response delay
    setTimeout(() => {
      setIsTyping(false);
      const res = generateResponse(text);

      const botMsg = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        html: res.html,
        badge: res.badge,
        product: res.hasAction ? res.product : null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        html: `¡Hola! 👋 Historial reiniciado. Estoy conectado a <strong>${getEngineLabel(dbEngine)}</strong> con ${coils.length} bobinas registradas. ¿Qué modelo o código OEM deseas verificar?`,
        badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} bobinas)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        product: null
      }
    ]);
  };

  return (
    <div className={isAdmin && showAdminConsole ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "max-w-3xl mx-auto w-full"}>
      {/* WhatsApp Interface */}
      <div className={`${isAdmin && showAdminConsole ? "lg:col-span-2" : "w-full"} bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col h-[60vh] min-h-[420px] sm:h-[580px] overflow-hidden shadow-2xl relative`}>
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center font-extrabold text-brand-500 shadow">
                <i className="fa-solid fa-bolt text-lg"></i>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#075e54]"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                <span>Bobinas Express AI</span>
                <i className="fa-solid fa-circle-check text-sky-300 text-xs" title="Verificado"></i>
              </div>
              <p className="text-[10px] text-emerald-200">
                Oficial {ownerSettings.ownerPhone} • En línea (Respuesta &lt; 1s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setShowAdminConsole(!showAdminConsole)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  showAdminConsole 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-xs' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Mostrar/Ocultar Consola de Queries SQL para Administrador"
              >
                <i className="fa-solid fa-terminal text-[10px]"></i>
                <span className="hidden sm:inline">{showAdminConsole ? 'Ocultar Consola' : 'Ver Consola SQL'}</span>
              </button>
            )}

            <button 
              onClick={handleResetChat}
              className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg text-xs transition cursor-pointer"
              title="Reiniciar conversación"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div 
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] dark:bg-[#0b141a] transition-colors"
          style={{
            backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 0)",
            backgroundSize: "20px 20px"
          }}
        >
          {/* Security notice banner inside chat */}
          <div className="flex justify-center my-1">
            <div className="bg-[#ffeecd] dark:bg-[#182229] dark:text-[#ffd279] text-[#54656f] text-[10px] px-3 py-1 rounded-lg text-center shadow-xs max-w-sm border border-amber-200/50">
              {isAdmin ? (
                <span><i className="fa-solid fa-shield text-[9px] mr-1"></i> Modo Administrador activo • Consultas y comandos SQL auditados.</span>
              ) : (
                <span><i className="fa-solid fa-check-circle text-[9px] mr-1"></i> Asesor Oficial de Bobinas Express • Consulta de repuestos en tiempo real.</span>
              )}
            </div>
          </div>

          {messages.map(m => (
            <ChatMessage 
              key={m.id} 
              message={m} 
              onTriggerSaleModal={onTriggerSaleModal}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white dark:bg-[#202c33] rounded-xl px-4 py-2.5 shadow flex items-center gap-1.5 chat-bubble-tail-in">
                <span className="text-[11px] text-gray-400 font-medium mr-1">Verificando disponibilidad</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <ChatQuickPrompts onSelectPrompt={(p) => handleSendMessage(p)} />

        {/* Input bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input 
            type="text" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Escribe tu consulta (Ej: ¿Tienen la bobina para Captiva 3.2 V6?)..."
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          <button 
            type="submit" 
            disabled={!inputVal.trim()}
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition shadow-md cursor-pointer ${
              inputVal.trim() 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>

      {/* SQL & Queries Console Sidebar (SOLO VISIBLE PARA ADMINS) */}
      {isAdmin && showAdminConsole && (
        <div className="lg:col-span-1">
          <DatabaseConsole logs={consoleLogs} onClearLogs={clearLogs} />
        </div>
      )}
    </div>
  );
}
