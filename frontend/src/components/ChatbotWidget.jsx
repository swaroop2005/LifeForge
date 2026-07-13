import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { MessageCircle, X, Send, Droplets, RotateCcw } from 'lucide-react'
import { api } from '../services/api'

const SUGGESTIONS = [
  'What can thalassemia patients eat?',
  'How often can I donate blood?',
  'What is sickle cell disease?',
  'Is O- a universal donor?',
  'Foods to avoid with hemophilia?',
]

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', text: msg }
    setMsgs(m => [...m, userMsg])
    setLoading(true)

    // Build history for multi-turn (exclude current message)
    const history = msgs.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    try {
      const res = await api.chatbot(msg, lang, history)
      const botText = res.response || 'Sorry, I could not generate a response. Please try again.'
      setMsgs(m => [...m, { role: 'bot', text: botText }])
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Connection error. Make sure the server is running.' }])
    }
    setLoading(false)
  }

  const clear = () => setMsgs([])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-sm font-bold">V</div>
              <div>
                <p className="font-bold text-sm">VitaTrace Assistant</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  <p className="text-xs text-red-100">GreenPT · Sustainable AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={lang} onChange={e => setLang(e.target.value)}
                className="text-xs bg-white/20 text-white rounded-lg px-2 py-1 border border-white/30 cursor-pointer outline-none">
                <option value="en">EN</option>
                <option value="hi">हिं</option>
                <option value="te">తె</option>
              </select>
              {msgs.length > 0 && (
                <button onClick={clear} className="text-red-200 hover:text-white transition-colors" title="Clear chat">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {msgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Droplets size={28} className="text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">How can I help you?</p>
                  <p className="text-xs text-gray-400 mt-1">Ask about diseases, diet, or donation</p>
                </div>
                <div className="w-full space-y-2 mt-2">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full text-left text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl hover:border-red-300 hover:text-red-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 bg-red-100 rounded-xl flex items-center justify-center text-xs font-bold text-red-600 mr-2 mt-1 shrink-0">V</div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm'
                  }`}>
                  {m.role === 'user' ? m.text : (
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <p className="font-bold text-base mb-1">{children}</p>,
                        h2: ({children}) => <p className="font-bold text-sm mb-1">{children}</p>,
                        h3: ({children}) => <p className="font-semibold text-sm mb-1">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                        p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >{m.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-red-100 rounded-xl flex items-center justify-center text-xs font-bold text-red-600 mr-2 shrink-0">V</div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white shrink-0">
            <div className="flex gap-2 items-end">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={lang === 'hi' ? 'अपना प्रश्न पूछें...' : lang === 'te' ? 'మీ ప్రశ్న అడగండి...' : 'Ask anything...'}
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-red-400 focus:bg-white transition-colors resize-none" />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-700 disabled:opacity-40 transition-colors shrink-0">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
          open
            ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}>
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
