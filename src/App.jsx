import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import "./App.css"; // Your custom styles

const emojis = [
  "😃", "😂", "😍", "🤯", "😎", "😭", "🤔", "😡", "😴", "🥳",
  "🫠", "👀", "🙈", "🤪", "🤩", "🥺", "😏", "🤗", "😤", "😇",
  "💀", "👻", "🍆", "🍑", "💋"
];

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchMessages();
    const messageListener = supabase
      .channel("realtime messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchMessages())
      .subscribe();
    return () => supabase.removeChannel(messageListener);
  }, [session]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage && !selectedEmoji) return;
    await supabase.from("messages").insert({
      text: newMessage + selectedEmoji,
      user_id: session.user.id,
      mood: selectedEmoji,
    });
    setNewMessage("");
    setSelectedEmoji("");
  };

  const handleLogout = () => supabase.auth.signOut();

  if (!session) {
    return (
      <div
        className="auth-container"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        <div className="overlay">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Vibewise Logo" className="h-24 w-24 rounded-full border-4 border-white" />
          </div>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <div className="overlay">
        <header className="flex items-center justify-between p-4 bg-black bg-opacity-50">
          <img src="/logo.png" alt="Vibewise Logo" className="h-12 w-12 rounded-full border-2 border-white" />
          <h1 className="text-2xl font-bold text-white">Vibewise Chat 🎉</h1>
          <button className="logout-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <main className="p-4 max-w-2xl mx-auto text-white">
          <div className="messages space-y-2 mb-4 max-h-[70vh] overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="message bg-black bg-opacity-30 rounded p-2">
                <strong>{msg.mood}</strong> {msg.text}
              </div>
            ))}
          </div>

          <form className="message-form flex gap-2" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-grow p-2 rounded text-black"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <select
              className="p-2 rounded text-black"
              value={selectedEmoji}
              onChange={(e) => setSelectedEmoji(e.target.value)}
            >
              <option value="">😶‍🌫️ Mood</option>
              {emojis.map((emoji, idx) => (
                <option key={idx} value={emoji}>{emoji}</option>
              ))}
            </select>
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Send 🚀
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default App;
