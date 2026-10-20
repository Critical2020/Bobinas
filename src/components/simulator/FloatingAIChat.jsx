import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../../hooks/useAIAgent';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ChatMessage } from './ChatMessage';
import { DatabaseConsole } from './DatabaseConsole';
import { getEngineLabel } from '../../utils/formatters';

const QUICK_PROMPTS = [
  { label: 'Captiva 3.2', query: '¿Tienen la bobina de Captiva 3.2 V6?' },
  { label: 'Corsa 1.6', query: '¿Precio de la bobina Corsa 1.6?' },
  { label: 'Aveo 1.6', query: '¿Tienen bobina para Aveo 1.6?' },
  { label: 'Toyota Corolla', query: '¿Tienen bobina Toyota Corolla?' },
  { label: 'Dong Feng 1.6', query: '¿Tienen para Dong Feng 1.6?' },
  { label: 'Ver todo el stock', query: '¿Qué bobinas tienen disponibles?' },
];

export function FloatingAIChat({ onTriggerSaleModal }) {
  const { coils, dbEngine, ownerSettings } = useInventory();
  const { generateResponse, consoleLogs, clearLogs } = useAIAgent();
  const { isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      id: 'init-msg',
      sender: 'bot',
      html: `¡Hola! 👋 Soy el <strong>Asesor Virtual de Bobinas Express</strong>.<br><br>Escríbeme la marca, modelo o código OEM que necesitas y confirmo disponibilidad y precio al instante.`,
      badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} bobinas)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      product: null
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const handleSendMessage = (textToSend) => {
    const text = String(textToSend || inputVal).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      time: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

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

      // If chat is closed, show notification dot
      if (!isOpen) setHasNewMessage(true);
    }, 650);
  };

  const handleResetChat = () => {
    setMessages([{
      id: Math.random().toString(36).substring(2, 9),
      sender: 'bot',
      html: `Chat reiniciado. Conectado a <strong>${getEngineLabel(dbEngine)}</strong> con ${coils.length} bobinas registradas. ¿Qué modelo o código OEM deseas verificar?`,
      badge: `Conectado a ${getEngineLabel(dbEngine)} (${coils.length} bobinas)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      product: null
    }]);
  };

  return (
    <>
      {/* ── Floating chat window ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col gap-3 animate-fade-in"
          style={{ width: 'min(92vw, 400px)' }}
        >
          {/* Admin SQL Console (above chat window) */}
          {isAdmin && showConsole && (
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80"
              style={{ height: '240px' }}
            >
              <DatabaseConsole logs={consoleLogs} onClearLogs={clearLogs} />
            </div>
          )}

          {/* Chat Window */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            style={{ height: 'min(72vh, 500px)' }}
          >
            {/* WhatsApp-style Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center font-extrabold text-brand-500 shadow shrink-0">
                    <i className="fa-solid fa-bolt text-base"></i>
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#075e54]"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                    <span>Bobinas Express AI</span>
                    <i className="fa-solid fa-circle-check text-sky-300 text-[10px]" title="Verificado"></i>
                  </div>
                  <p className="text-[10px] text-emerald-200">{ownerSettings.ownerPhone} • En línea</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    onClick={() => setShowConsole(v => !v)}
                    className={`p-1.5 rounded-lg text-[11px] transition cursor-pointer border ${
                      showConsole
                        ? 'bg-sky-500/30 text-sky-300 border-sky-500/40'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    title="Consola SQL"
                  >
                    <i className="fa-solid fa-terminal text-[10px]"></i>
                  </button>
                )}
                <button
                  onClick={handleResetChat}
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition cursor-pointer"
                  title="Reiniciar chat"
                >
                  <i className="fa-solid fa-rotate-right text-[11px]"></i>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition cursor-pointer"
                  title="Cerrar"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Messages body */}
            <div
              className="flex-1 p-3 overflow-y-auto space-y-3"
              style={{
                background: '#0b141a',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* Security notice */}
              <div className="flex justify-center">
                <div className="bg-[#182229] text-[#ffd279] text-[10px] px-3 py-1 rounded-lg text-center shadow-xs max-w-xs border border-amber-500/20">
                  {isAdmin
                    ? <span><i className="fa-solid fa-shield text-[9px] mr-1"></i>Modo Administrador • Consultas auditadas</span>
                    : <span><i className="fa-solid fa-check-circle text-[9px] mr-1"></i>Asesor Oficial de Bobinas Express</span>
                  }
                </div>
              </div>

              {messages.map(m => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onTriggerSaleModal={onTriggerSaleModal}
                />
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none px-4 py-2.5 shadow flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400 font-medium mr-1">Verificando</span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulsing-dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-3 pt-2 pb-1 bg-slate-900 border-t border-slate-800 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5 text-xs">
                <i className="fa-solid fa-wand-magic-sparkles text-amber-400 text-[10px] shrink-0"></i>
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handleSendMessage(p.query)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition whitespace-nowrap text-[10px] cursor-pointer shrink-0"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <form
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
              className="px-3 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Escribe tu consulta (modelo, OEM, marca...)"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition shadow cursor-pointer shrink-0 ${
                  inputVal.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ───────────────────────────────────────── */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end gap-2">
        {/* "¿Necesitas ayuda?" tooltip — shown when closed */}
        {!isOpen && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl animate-fade-in select-none">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            ¿Necesitas ayuda?
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer relative ${
            isOpen
              ? 'bg-slate-700 hover:bg-slate-600 rotate-0'
              : 'bg-[#25d366] hover:bg-[#20bd5a] scale-100 hover:scale-105'
          }`}
          title={isOpen ? 'Cerrar asistente' : 'Abrir Asesor IA'}
          aria-label="Asesor de IA"
        >
          <i className={`text-white text-2xl transition-all duration-300 ${isOpen ? 'fa-solid fa-xmark' : 'fa-brands fa-whatsapp'}`}></i>

          {/* Notification dot when there's a new bot message and chat is closed */}
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}
