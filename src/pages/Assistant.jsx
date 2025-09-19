import { useState } from "react";
import Sidebar from "../sections/Sidebar";
import ClauseView from "../sections/ClauseView";
import Chatbot from "../sections/Chatbot";
import GlobalChatbot from "../sections/GlobalChatbot";
import ResizableBox from "../sections/ResizableBox";

export default function Assistant() {
  const [selectedClause, setSelectedClause] = useState(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [docSummary, setDocSummary] = useState("");
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  const [isClauseCollapsed, setIsClauseCollapsed] = useState(true);

  const [clauseChatMessages, setClauseChatMessages] = useState([]);
  const [globalChatMessages, setGlobalChatMessages] = useState([]);

  return (
    <div className="flex h-[calc(100vh-80px)] mt-[80px] bg-gradient-to-br from-violet-50 to-white">
      {/* Sidebar */}
      <div className="w-1/4 bg-white/90 backdrop-blur-sm border-r border-violet-100 shadow-lg">
        <div className="h-full p-6 overflow-y-auto">
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl text-white shadow-lg">
            <h2 className="text-lg font-semibold">Document Assistant</h2>
            <p className="text-violet-100 text-sm mt-1">
              Navigate and explore clauses
            </p>
          </div>

          <Sidebar
            onSelectClause={setSelectedClause}
            lang={selectedLang}
            setLang={setSelectedLang}
            setLoadingState={setIsLoading}
            setDocSummary={setDocSummary}
            clearClauseChat={() => setClauseChatMessages([])}
            clearGlobalChat={() => setGlobalChatMessages([])}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-violet-100 h-full p-6">
            <ClauseView
              clause={selectedClause}
              lang={selectedLang}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Clause chatbot */}
        <div className="border-t border-violet-200 bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="p-6">
            <div className="bg-gradient-to-r from-violet-50 to-white rounded-xl p-4 border border-violet-100">
              {/* Header row with toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-violet-500 rounded-full mr-2"></div>
                  <h3 className="text-violet-800 font-medium text-sm">
                    Clause Assistant
                  </h3>
                </div>
                <button
                  onClick={() => setIsClauseCollapsed(!isClauseCollapsed)}
                  className="text-violet-700 hover:text-white 
                             bg-violet-100 hover:bg-violet-600 
                             transition-all text-sm md:text-base font-medium 
                             px-5 py-2 rounded-full shadow-sm 
                             mr-6"
                >
                  {isClauseCollapsed ? "Expand" : "Minimize"}
                </button>
              </div>

              {/* Chatbot body */}
              {!isClauseCollapsed && (
                <Chatbot
                  clause={selectedClause}
                  summary={docSummary}
                  messages={clauseChatMessages}
                  setMessages={setClauseChatMessages}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Global Assistant */}
      <div>
        {/* Small button */}
        <div
          className="fixed bottom-10 right-8 z-50 group cursor-pointer"
          onClick={() => setShowGlobalChat(!showGlobalChat)}
          title="Chat with Document"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-full p-5 shadow-2xl transform group-hover:scale-110 transition-all duration-300 border-2 border-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 9H6v-2h12v2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expanded chat window */}
        {showGlobalChat && (
          <div className="fixed bottom-20 right-8 z-50">
            <ResizableBox>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white p-4 flex items-center justify-between">
                  <h3 className="font-semibold">Global Assistant</h3>
                  <button
                    onClick={() => setShowGlobalChat(false)}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-violet-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Global Chatbot (already has its own input bar) */}
                <div className="flex-1 overflow-auto">
                  <GlobalChatbot
                    messages={globalChatMessages}
                    setMessages={setGlobalChatMessages}
                  />
                </div>
              </div>
            </ResizableBox>
          </div>
        )}
      </div>
    </div>
  );
}
