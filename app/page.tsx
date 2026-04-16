import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">📐</span>
          <div>
            <h1>Soma Math</h1>
            <p>AI Tutor · Rwanda Secondary School</p>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge">O-Level</span>
          <span className="badge">A-Level</span>
        </div>
      </header>
      <ChatInterface />
    </main>
  );
}
