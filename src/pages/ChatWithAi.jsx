import "../styles/ChatWithAi.css";
import { getAuth } from "firebase/auth";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import IntroAnimation from "./IntroAnimation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  MessageSquare, Plus, Menu, Sun, Moon, Send,
  User, Zap, Settings, PanelLeftClose, BookOpen,
  PenTool, Code, Briefcase, Heart, Copy, ThumbsUp, ThumbsDown, Check, LogOut, LogIn,
  Sparkles, X, MoreHorizontal, MoreVertical, Share2, Trash2, Pencil, Crown, Pin, PinOff,
  File, Camera, Monitor, Image, Search,
  Mail, UtensilsCrossed, Atom, CalendarDays, Globe, FlaskConical,
  HelpCircle, Lightbulb, Terminal, Bug,
  ClipboardList, Star, TrendingUp, Frown, Wind, Flower2, Lock, VenetianMask, RefreshCw
} from "lucide-react";

const Instagram = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Twitter = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const CreateImageIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const CreateVideoIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

// 🔥 Custom renderer passed to ReactMarkdown as the `code` component.
// Inline code (single backticks, e.g. `variable_name`) renders as a small
// plain pill. Fenced code blocks (triple backticks, optionally with a
// language like ```python) get the full treatment: a header bar showing
// the detected language, a copy button that copies ONLY that block's code
// (not the whole chat message), and real syntax highlighting.
const CodeBlock = ({ inline, className, children, theme, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const codeString = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button className="code-block-copy-btn" onClick={handleCopyCode}>
          {copied ? (
            <>
              <Check size={14} /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={theme === "light" ? oneLight : vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 12px 12px",
          padding: "16px",
          fontSize: "0.85rem",
          background: "transparent", // let .code-block-wrapper's themed background show through
        }}
        wrapLongLines
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const initialModes = [
  { name: "General", icon: <Sparkles size={20} /> },
  { name: "Study", icon: <BookOpen size={20} /> },
  { name: "Content", icon: <PenTool size={20} /> },
  { name: "Code", icon: <Code size={20} /> },
  { name: "Career", icon: <Briefcase size={20} /> },
  { name: "Emotion", icon: <Heart size={20} /> },
];

// 🆕 The backend saves/returns its own internal mode names (lowercase,
// and a few — "overthinking", "medical" — that aren't even selectable
// tabs, since they're auto-detected rather than chosen). This maps them
// to a friendly label for the small mode tag shown under each reply.
const MODE_DISPLAY_LABELS = {
  general: "General",
  study: "Study",
  content: "Content",
  code: "Code",
  career: "Career",
  emotional: "Emotion",
  overthinking: "Overthinking",
  medical: "Medical",
  image: "Image",
};

// 🆕 Subset of the above that actually correspond to a clickable tab —
// used to restore the selected tab when reopening a chat. Auto-detected
// modes like "overthinking"/"medical" have no tab of their own, so a
// chat that landed there falls back to "General" instead.
const BACKEND_MODE_TO_TAB = {
  general: "General",
  study: "Study",
  content: "Content",
  code: "Code",
  career: "Career",
  emotional: "Emotion",
};

// Shown once a response is taking a while — cycles so waiting doesn't
// feel dead. Kept light/playful since this is generic wait-time filler,
// not tied to any serious topic.
const LONG_WAIT_MESSAGES = [
  "Thinking it through...",
  "Connecting the dots...",
  "Almost there...",
  "Double-checking that for you...",
  "Putting it all together...",
  "Just a little longer...",
];

const modeWelcomeText = {
  General: "How can I help you today?",
  Study: "What would you like to learn today?",
  Content: "Let's create something amazing together!",
  Code: "Ready to write some code? Let's go!",
  Career: "Let's boost your career journey!",
  Emotion: "I'm here to listen. How are you feeling?",
};

const modeSuggestedQuestions = {
  General: [
    { icon: <Mail size={18} />, text: "Draft a professional email..." },
    { icon: <UtensilsCrossed size={18} />, text: "What are some healthy dinner recipes?" },
    { icon: <Atom size={18} />, text: "Explain quantum computing simply" },
    { icon: <Lightbulb size={18} />, text: "Give me a fun fact I probably don't know" },
    { icon: <Globe size={18} />, text: "Plan a weekend trip on a budget" },
    { icon: <HelpCircle size={18} />, text: "Help me decide between two options" },
  ],
  Study: [
    { icon: <CalendarDays size={18} />, text: "Create a study schedule for finals" },
    { icon: <FlaskConical size={18} />, text: "Explain the theory of relativity" },
    { icon: <Globe size={18} />, text: "Quiz me on world history" },
    { icon: <Atom size={18} />, text: "Break down photosynthesis step by step" },
    { icon: <ClipboardList size={18} />, text: "Summarize this chapter for me" },
    { icon: <HelpCircle size={18} />, text: "Explain a tricky math concept simply" },
  ],
  Content: [
    { icon: <Lightbulb size={18} />, text: "Give me 5 blog post ideas for tech" },
    { icon: <Instagram size={18} />, text: "Write a catchy Instagram caption" },
    { icon: <Twitter size={18} />, text: "Draft a tweet thread about AI" },
    { icon: <PenTool size={18} />, text: "Write a short story opening line" },
    { icon: <Mail size={18} />, text: "Write a newsletter intro paragraph" },
    { icon: <Sparkles size={18} />, text: "Brainstorm a catchy product name" },
  ],
  Code: [
    { icon: <HelpCircle size={18} />, text: "How do I use React context?" },
    { icon: <Terminal size={18} />, text: "Write a Python script to scrape a website" },
    { icon: <Bug size={18} />, text: "Debug this JavaScript error for me" },
    { icon: <Code size={18} />, text: "Explain this regex pattern" },
    { icon: <Terminal size={18} />, text: "Write a SQL query to join two tables" },
    { icon: <Bug size={18} />, text: "Review my code for best practices" },
  ],
  Career: [
    { icon: <ClipboardList size={18} />, text: "How to prepare for a behavioral interview?" },
    { icon: <Star size={18} />, text: "Review my resume bullet points" },
    { icon: <TrendingUp size={18} />, text: "Tips for negotiating a salary offer" },
    { icon: <Briefcase size={18} />, text: "Write a LinkedIn headline for me" },
    { icon: <Mail size={18} />, text: "Draft a follow-up email after an interview" },
    { icon: <TrendingUp size={18} />, text: "Help me plan a career change" },
  ],
  Emotion: [
    { icon: <Frown size={18} />, text: "I'm feeling overwhelmed today..." },
    { icon: <Wind size={18} />, text: "How can I manage my stress better?" },
    { icon: <Flower2 size={18} />, text: "Help me practice mindfulness" },
    { icon: <Heart size={18} />, text: "I need to vent about my day" },
    { icon: <Wind size={18} />, text: "Help me calm down before a big moment" },
    { icon: <Flower2 size={18} />, text: "Guide me through a breathing exercise" },
  ],
};

// Pick `n` random, non-repeating items from an array.
const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

// 🆕 The backend's image-generation URL is a LIVE endpoint — it generates
// a brand-new image on every fetch rather than serving a stored file.
// Ideally we'd fetch the bytes once and cache them client-side so
// revisiting a message never re-triggers generation — but that requires
// reading the response body via fetch(), which this worker blocks (no
// CORS headers), so a fetch attempt fails outright (and, worse, still
// reaches the server and burns a real generation before failing). A
// plain <img> tag isn't subject to that restriction, so this renders one
// directly. Whether revisiting the same image re-generates it now comes
// down entirely to whatever HTTP caching (if any) the backend's image
// endpoint sends — that's server-side behavior this component can't
// influence without a same-origin proxy.
function GeneratedImage({ src, alt, className, onClick }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src) return null;

  if (failed) {
    return <div className="generated-image-error">Couldn't load this image.</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={() => onClick && onClick(src)}
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("appTheme") || "dark");
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("appTheme", theme);
  }, [theme]);
  
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [selectedMode, setSelectedMode] = useState("General");
  const [suggestedQuestions] = useState(() => {
    const picks = {};
    Object.keys(modeSuggestedQuestions).forEach((mode) => {
      picks[mode] = pickRandom(modeSuggestedQuestions[mode], 3);
    });
    return picks;
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [longWait, setLongWait] = useState(false);
  const [waitMsgIdx, setWaitMsgIdx] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 🆕 Guests (no Firebase user) can chat in General mode only, and
  // nothing gets saved for them. Every other mode tab and every "extra"
  // input feature (image/video creation, deep research, attachments)
  // stays gated behind login. This helper is the single choke point for
  // that — anything guest-restricted calls it first and bails if it
  // returns false, instead of duplicating the `!user` check everywhere.
  const requireAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  // 🆕 Shown once, right when the user flips temporary/incognito chat ON —
  // makes sure they know this session won't be saved before they start typing.
  const [showIncognitoNotice, setShowIncognitoNotice] = useState(false);
  const [activeMenuIdx, setActiveMenuIdx] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 🔥 Custom Rename / Share modals — replace window.prompt/alert with
  // in-app UI that actually matches the rest of the app.
  const [renameModal, setRenameModal] = useState(null); // { chatId, currentTitle } | null
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [shareModal, setShareModal] = useState(null); // { url } | null
  const [shareCopied, setShareCopied] = useState(false);
  const [limitModal, setLimitModal] = useState(false);
  const [createMode, setCreateMode] = useState(null);

  // Attachments State & Refs
  const [attachments, setAttachments] = useState([]);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [deepSearchMode, setDeepSearchMode] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const webcamStreamRef = useRef(null);
  const [isMobileDevice, setIsMobileDevice] = useState(window.innerWidth <= 768);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  // 🔥 Tracks which chat "view" is currently active, independent of
  // React state timing. Every send bumps this; if the user switches
  // chats (or starts a new one) while a response is still in flight,
  // the counter changes — so when that old response finally arrives,
  // it knows not to splice itself into whatever chat is now on screen.
  // The message is still saved server-side by /chat regardless — this
  // only guards the *visible* message list from cross-chat corruption.
  const sessionCounterRef = useRef(0);
  const activeSessionIdRef = useRef(0);
  // 🆕 Tracks the most recent non-General mode actually used in the CURRENT
  // chat. General is just a hub you can pass through — it doesn't clear
  // this. So Study -> General -> Emotion still counts as Study -> Emotion.
  const lastModeUsedRef = useRef(null);

  // 🔥 Synchronous lock against double-sends. `isBotTyping` (React state)
  // can't guard this alone — setIsBotTyping(true) is batched/async, so a
  // fast double Enter-press or an Enter landing right as a click fires can
  // both slip through handleSend before the button visually disables.
  // A plain ref updates immediately, with no render in between, so it
  // closes that gap completely.
  const isSendingRef = useRef(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatListLoading, setChatListLoading] = useState(false);

  // 🔥 Keep the currently-open chat persisted across refreshes. This
  // effect fires from every setCurrentChatId call site (new message
  // adopting a chat_id, clicking a chat in the sidebar, starting a new
  // chat, deleting the open chat) so there's one single source of
  // truth for "what's open" instead of scattering localStorage writes
  // through every handler.
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem("lastChatId", currentChatId);
    } else {
      localStorage.removeItem("lastChatId");
    }
  }, [currentChatId]);

  // Auth States
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("User");

  // Real-time Firebase Authentication & Subscription status listener
  // Real-time Firebase Authentication & Subscription status listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fallback initially to email or User before database fetch completes
        setUserName(firebaseUser.email || "User");

        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch("http://127.0.0.1:8000/check-user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            
            // 🚨 SECURITY BOUNCER: If Firebase authenticated successfully, 
            // but no MongoDB profile details exist yet, intercept and force onboarding!
            // (data.exists === true only means a bare record was created by
            // /register-user — it doesn't mean name/dob/role were saved.
            // data.onboarded is what actually confirms onboarding is complete.)
            if (data.exists === false || data.onboarded === false) {
              navigate("/onboarding");
              return;
            }

            setUser(prev => ({
              ...prev,
              premium: data.premium,
              plan: data.plan
            }));

            // Set the user's name from the MongoDB document if it exists
            if (data.name || (data.user && data.user.name)) {
              setUserName(data.name || data.user.name);
            }
          }
        } catch (err) {
          console.error("Error setting premium user state details:", err);
        }

        fetchChatList();

        // 🔥 Resume whatever chat was open before a refresh instead of
        // always landing on a blank new chat. loadConversation's own
        // `chatId === currentChatId` guard is a no-op here since
        // currentChatId is still null at this point, and it clears the
        // saved id itself if the fetch fails (e.g. deleted elsewhere),
        // so a dead id won't keep getting retried on every refresh.
        const savedChatId = localStorage.getItem("lastChatId");
        if (savedChatId) {
          loadConversation(savedChatId);
        }
      } else {
        setUser(null);
        setUserName("User");
        setChatHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuIdx(null);
      setAttachmentMenuOpen(false);
      setUserMenuOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (location.state?.activateVideoMode) {
      setCreateMode("video");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setAttachmentMenuOpen(false);
    e.target.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const target = prev.find(att => att.id === id);
      if (target && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter(att => att.id !== id);
    });
  };

  const startWebcam = async () => {
    try {
      setAttachmentMenuOpen(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcamStreamRef.current = stream;
      setWebcamStream(stream);
      setWebcamOpen(true);
      
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        } else {
          requestAnimationFrame(attachStream);
        }
      };
      requestAnimationFrame(attachStream);
    } catch (err) {
      console.error("Webcam access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        alert("No camera found. Please connect a camera and try again.");
      } else {
        alert("Could not access camera: " + err.message);
      }
    }
  };

  const stopWebcam = () => {
    const stream = webcamStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamOpen(false);
  };

  const addBlobAsAttachment = (blob, filename, mimeType) => {
    if (!blob) {
      alert("Capture failed — no image was produced. Please try again.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const attachment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: filename,
      type: mimeType,
      url,
      file: blob,
    };
    setAttachments(prev => [...prev, attachment]);
  };

  const capturePhoto = async () => {
    const stream = webcamStreamRef.current;
    const video = videoRef.current;
    if (!stream || !video) { alert("Camera not active. Please open camera and try again."); return; }

    if (video.readyState < 2) {
      await new Promise(resolve => {
        video.addEventListener("canplay", resolve, { once: true });
        setTimeout(resolve, 2000);
      });
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);

    stopWebcam();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
    addBlobAsAttachment(blob, `photo_${Date.now()}.jpg`, "image/jpeg");
  };

  const handleDeepSearch = () => {
    if (!requireAuth()) return;
    setDeepSearchMode((prev) => !prev);
    setAttachmentMenuOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const captureScreenshot = async () => {
    try {
      setAttachmentMenuOpen(false);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
      document.body.appendChild(video);
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.addEventListener("playing", resolve, { once: true });
        video.play().catch(() => {});
        setTimeout(resolve, 4000);
      });

      await new Promise(r => requestAnimationFrame(r));

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(video, 0, 0, width, height);

      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
      document.body.removeChild(video);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      addBlobAsAttachment(blob, `screenshot_${Date.now()}.png`, "image/png");

    } catch (err) {
      console.error("Screen capture error:", err);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        alert("Could not capture screenshot. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await auth.signOut();
    setUser(null);
    setUserName("User");
    setMessages([]);
    navigate("/login");
  };

  // 🆕 Pulls the real sidebar list from the backend
  const fetchChatList = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setChatListLoading(true);
      const token = await currentUser.getIdToken();

      const res = await fetch("http://127.0.0.1:8000/get-chat-list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load chat list");
      const data = await res.json();

      setChatHistory(
        (data.data || []).map((c) => ({
          id: c.id,
          title: c.title,
          icon: <MessageSquare size={16} />,
          pinned: !!c.pinned,
        }))
      );
    } catch (err) {
      console.error("Error fetching chat list:", err);
    } finally {
      setChatListLoading(false);
    }
  };

  // 🆕 Loads one thread's full message history when clicked in the sidebar
  const loadConversation = async (chatId) => {
    if (chatId === currentChatId) return;

    // 🔥 Invalidate whatever send might still be in flight for the chat
    // we're leaving — its response is already safely persisted server-side,
    // it just won't be allowed to splice itself into this new view anymore.
    sessionCounterRef.current += 1;
    activeSessionIdRef.current = sessionCounterRef.current;
    setIsBotTyping(false);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      const res = await fetch(`http://127.0.0.1:8000/get-chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();

      const loadedMessages = (data.data || []).flatMap((entry) => {
        const fallbackImageUrl = extractGeneratedImageUrl(entry.response);
        const isImage = entry.type === "image" || !!entry.image_url || !!fallbackImageUrl;
        return [
          { role: "user", text: entry.message, messageId: entry._id },
          isImage
            ? {
                role: "bot",
                text: "",
                imageUrl: entry.image_url || fallbackImageUrl,
                mode: entry.mode,
                messageId: entry._id,
              }
            : { role: "bot", text: entry.response, mode: entry.mode, messageId: entry._id },
        ];
      });

      setMessages(loadedMessages);
      setCurrentChatId(chatId);

      // 🆕 Restore whichever mode this chat was last used in, instead of
      // always resetting to General on reload/switch. Auto-detected modes
      // that don't have a tab of their own (overthinking/medical) fall
      // back to General rather than leaving no tab visually active.
      const entries = data.data || [];
      const lastEntry = entries[entries.length - 1];
      const resolvedMode = (lastEntry && BACKEND_MODE_TO_TAB[lastEntry.mode]) || "General";
      setSelectedMode(resolvedMode);
      // Keep the mode-switch tracker in sync with this chat's real history,
      // so switching modes from here on compares against what this chat
      // actually used, not whatever the previous chat left behind.
      lastModeUsedRef.current = resolvedMode === "General" ? null : resolvedMode;

      setSidebarOpen((prev) => (isMobileDevice ? false : prev));
    } catch (err) {
      console.error("Error loading conversation:", err);
      localStorage.removeItem("lastChatId");
    }
  };

  const handleHistoryAction = async (e, action, id) => {
    e.stopPropagation();
    setActiveMenuIdx(null);

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken();

    if (action === "Delete") {
      try {
        const res = await fetch(`http://127.0.0.1:8000/delete-chat/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Delete failed");

        setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
        // If the deleted thread was open, drop back to a blank new chat
        if (id === currentChatId) {
          setMessages([]);
          setCurrentChatId(null);
          lastModeUsedRef.current = selectedMode === "General" ? null : selectedMode;
        }
      } catch (err) {
        console.error("Error deleting chat:", err);
        alert("Couldn't delete this chat. Please try again.");
      }
    } else if (action === "Rename") {
      const chatToRename = chatHistory.find((chat) => chat.id === id);
      setRenameValue(chatToRename?.title || "");
      setRenameModal({ chatId: id, currentTitle: chatToRename?.title || "" });
    } else if (action === "Share") {
      const shareUrl = `${window.location.origin}/chat/${id}`;
      setShareCopied(false);
      setShareModal({ url: shareUrl });
    } else if (action === "Pin" || action === "Unpin") {
      const nextPinned = action === "Pin";
      // 🔥 Optimistic update so the sidebar reorders immediately instead
      // of waiting on the round-trip — reverted below if the request fails.
      setChatHistory((prev) =>
        prev
          .map((chat) => (chat.id === id ? { ...chat, pinned: nextPinned } : chat))
          .sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1))
      );

      try {
        const res = await fetch(`http://127.0.0.1:8000/pin-chat/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pinned: nextPinned }),
        });
        if (!res.ok) throw new Error("Pin update failed");
      } catch (err) {
        console.error("Error updating pin status:", err);
        // Revert the optimistic change on failure.
        setChatHistory((prev) =>
          prev.map((chat) => (chat.id === id ? { ...chat, pinned: !nextPinned } : chat))
        );
        alert("Couldn't update pin status. Please try again.");
      }
    }
  };

  // 🔥 Confirm handler for the custom Rename modal (replaces window.prompt)
  const submitRename = async () => {
    if (!renameModal) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    setRenameSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();

      const res = await fetch(`http://127.0.0.1:8000/rename-chat/${renameModal.chatId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Rename failed");

      setChatHistory((prev) =>
        prev.map((chat) => (chat.id === renameModal.chatId ? { ...chat, title: trimmed } : chat))
      );
      setRenameModal(null);
    } catch (err) {
      console.error("Error renaming chat:", err);
    } finally {
      setRenameSaving(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFeedback = (idx, type) => {
    setMessages(prev => prev.map((msg, i) =>
      i === idx ? { ...msg, feedback: msg.feedback === type ? null : type } : msg
    ));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCreateImage = () => {
    if (!requireAuth()) return;
    setCreateMode(createMode === "image" ? null : "image");
    setInput("");
    setAttachmentMenuOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCreateVideo = () => {
    if (!requireAuth()) return;
    setAttachmentMenuOpen(false);
    // If the user is premium, activate video creation mode instead of redirecting
    if (user?.premium) {
      setCreateMode(createMode === "video" ? null : "video");
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // If they are on the free tier, redirect them to subscribe
      navigate("/pricing", { state: { fromVideoCreate: true } });
    }
  };

  const handleSend = async (optionalText) => {
    // 🔒 Hard stop against overlapping sends — see isSendingRef comment
    // above for why this can't just rely on isBotTyping/disabled state.
    if (isSendingRef.current) return;

    const textToSend = typeof optionalText === "string" ? optionalText : input;

    if (!textToSend.trim() && attachments.length === 0 && !createMode) {
      return;
    }

    isSendingRef.current = true;

    // 🎬 No backend service exists for video generation yet — bail out
    // before touching auth/check-limit/update-usage so this doesn't burn
    // one of the user's daily free messages for a feature that does
    // nothing on the backend.
    if (createMode === "video") {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: textToSend.trim() ? `[Create Video] ${textToSend.trim()}` : "[Create Video]" },
        { role: "bot", text: "Video generation is coming soon — it isn't wired up on the backend yet." },
      ]);
      if (textToSend === input) setInput("");
      setCreateMode(null);
      isSendingRef.current = false;
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    // 🆕 GUEST PATH — no Firebase user. Restricted to plain-text General
    // chat only: any other mode tab, image/video creation, deep research,
    // or attachments falls back to the auth modal instead. Nothing here
    // touches the backend's authenticated /chat route, so nothing gets
    // saved — no chat_id, no sidebar entry, no usage-limit tracking.
    if (!currentUser) {
      if (
        selectedMode !== "General" ||
        attachments.length > 0 ||
        createMode ||
        deepSearchMode
      ) {
        setShowAuthModal(true);
        isSendingRef.current = false;
        return;
      }

      const guestMessage = textToSend.trim();
      if (textToSend === input) setInput("");
      isSendingRef.current = false;

      setMessages((prev) => [...prev, { role: "user", text: guestMessage }]);
      setIsBotTyping(true);

      try {
        // Recreate {message, response} pairs from local state so the AI
        // has short-term context — this is the only "memory" a guest
        // conversation has, since none of it is persisted server-side.
        const recentHistory = [];
        for (let i = 0; i < messages.length - 1; i += 2) {
          if (messages[i]?.role === "user" && messages[i + 1]?.role === "bot") {
            recentHistory.push({ message: messages[i].text, response: messages[i + 1].text });
          }
        }

        const guestRes = await fetch("http://127.0.0.1:8000/guest-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: guestMessage,
            history: recentHistory.slice(-5),
          }),
        });

        const guestData = await guestRes.json();

        if (!guestData.success) {
          throw new Error(guestData.error || "Something went wrong generating a response.");
        }

        setMessages((prev) => [...prev, { role: "bot", text: guestData.data.response }]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Sorry, something went wrong getting a response. Please try again." },
        ]);
      } finally {
        setIsBotTyping(false);
      }
      return;
    }

    let localSessionId;

    try {

      const token = await currentUser.getIdToken();

      const userRes = await fetch("http://127.0.0.1:8000/check-user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) throw new Error("Failed to verify user.");
      const userData = await userRes.json();

      if (!userData.exists) {
        navigate("/onboarding");
        return;
      }

      const limitRes = await fetch("http://127.0.0.1:8000/check-limit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!limitRes.ok) throw new Error("Failed to check daily limit.");
      const limitData = await limitRes.json();

      if (!limitData.allowed) {
        setLimitModal(true);
        return;
      }

      const usageRes = await fetch("http://127.0.0.1:8000/update-usage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!usageRes.ok) throw new Error("Failed to update chat usage.");

      let finalText = textToSend;
      if (createMode === "image" && textToSend.trim()) {
        finalText = `[Create Image] ${textToSend.trim()}`;
      }
      if (createMode === "video" && textToSend.trim()) {
        finalText = `[Create Video] ${textToSend.trim()}`;
      }
      if (deepSearchMode && textToSend.trim()) {
        finalText = `[Deep Research] ${finalText}`;
      }

      // 🔥 Claim this send as the active session BEFORE pushing the
      // message, so the message itself can be tagged with localId — that's
      // how we retroactively attach the real backend messageId to it once
      // the response arrives (needed for the edit feature to work on a
      // message sent in this same session, without requiring a refresh).
      // Anything that arrives later and finds activeSessionIdRef no longer
      // matches this value knows the user has moved on (switched chats /
      // started a new one) and should not touch the visible message list.
      sessionCounterRef.current += 1;
      localSessionId = sessionCounterRef.current;
      activeSessionIdRef.current = localSessionId;

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: finalText,
          attachments: [...attachments],
          createMode: createMode,
          deepSearch: deepSearchMode,
          localId: localSessionId,
        },
      ]);
      setIsBotTyping(true);

      // 🔓 Release the sync lock now — its only job was closing the tiny
      // window before React re-renders the send button as disabled. From
      // here on, isBotTyping (now queued true) is the real guard against
      // re-sending in *this* chat, while still allowing a legitimate send
      // in a *different* chat to go through while this one keeps generating
      // in the background — which is exactly the behavior we want.
      isSendingRef.current = false;

      if (textToSend === input) {
        setInput("");
      }

      const pendingAttachments = attachments;
      const pendingCreateMode = createMode;
      const isDisappearing = selectedMode === "Emotion" && isTemporaryChat;

      // 🔥 If this is the first message of a brand-new chat, show it in
      // the sidebar immediately instead of waiting for the AI to finish
      // responding — fetchChatList() (called after the response below)
      // will replace this placeholder with the real, backend-confirmed
      // entry once it lands.
      if (!currentChatId && !isDisappearing) {
        const placeholderTitle = finalText.replace(/^\[.*?\]\s*/, "").slice(0, 40) || "New chat";
        setChatHistory((prev) => [
          { id: `pending-${localSessionId}`, title: placeholderTitle, icon: <MessageSquare size={16} />, pending: true },
          ...prev,
        ]);
      }

      setAttachments([]);
      // 🔥 Deliberately NOT resetting createMode here anymore. It used to
      // clear back to null after every send, which meant "Create image"
      // only ever applied to a single message — any follow-up (e.g. "now
      // make it blue") silently fell back to plain text mode, so the
      // user had to re-click "Create image" before every single edit,
      // and even then the backend had no memory of the prior image (see
      // the image-mode branch in chat.py, which now stitches together
      // the whole streak of image turns for exactly this reason).
      // Image mode now stays active across turns until the user removes
      // it themselves via the "x" on the create-mode tag.
      setDeepSearchMode(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      // Note: attachments aren't sent to the backend yet — /chat only
      // accepts a text message right now. They're shown in the UI so the
      // user sees what they picked, but the AI won't actually see them
      // until a file-upload endpoint exists.
      if (pendingAttachments.length > 0) {
        console.warn("Attachments selected but not yet sent to backend — no upload endpoint exists.");
      }

      const chatRes = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          chat_id: currentChatId,
          mode: selectedMode,
          disappearing: isDisappearing,
          force_mode: pendingCreateMode === "image" ? "image" : null,
        }),
      });

      if (!chatRes.ok) {
        const errBody = await chatRes.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to get a response from SmartAI.");
      }

      const chatData = await chatRes.json();

      if (!chatData.success) {
        throw new Error(chatData.error || "Something went wrong generating a response.");
      }

      // 🔥 The sidebar entry and server-side save always happen — the
      // message is safely persisted by /chat regardless of what the user
      // is currently looking at. fetchChatList() also naturally replaces
      // the optimistic "pending-..." placeholder added above with the
      // real, backend-confirmed entry.
      if (!isDisappearing) {
        fetchChatList();
      }

      // 🔥 Only touch the visible message list if the user is still on
      // the chat that sent this request. If they've switched to another
      // chat (or started a new one) in the meantime, this response is
      // stale for display purposes — it's already safely saved though,
      // so opening this chat again will show it correctly.
      const stillOnThisChat = activeSessionIdRef.current === localSessionId;

      if (stillOnThisChat) {
        // 🆕 First message of a brand-new chat — backend created the
        // thread and handed back its id. Adopt it so the next message
        // in this same view continues the same thread.
        if (chatData.chat_id && chatData.chat_id !== currentChatId) {
          setCurrentChatId(chatData.chat_id);
        }

        const fallbackImageUrl = extractGeneratedImageUrl(chatData.data.response);
        const isImage = chatData.data.type === "image" || !!fallbackImageUrl;

        if (isImage) {
          setMessages((prev) => [
            ...prev.map((m) =>
              m.localId === localSessionId ? { ...m, messageId: chatData.data.message_id } : m
            ),
            {
              role: "bot",
              text: "",
              imageUrl: chatData.data.image_url || fallbackImageUrl,
              mode: chatData.data.mode,
              messageId: chatData.data.message_id,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev.map((m) =>
              m.localId === localSessionId ? { ...m, messageId: chatData.data.message_id } : m
            ),
            {
              role: "bot",
              text: chatData.data.response,
              mode: chatData.data.mode,
              messageId: chatData.data.message_id,
            },
          ]);
        }
      }

    } catch (err) {
      console.error(err);
      // Same guard as above — don't drop an error bubble into whatever
      // chat happens to be on screen if the user has since navigated away.
      if (activeSessionIdRef.current === localSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            // 🔥 Show the real reason (e.g. "SmartAI took too long to
            // respond") instead of a generic message — a timeout and a
            // genuine server error need different reactions from the
            // user (retry vs. report a bug), and the backend already
            // sends a specific message in err.message.
            text: err.message || "Sorry, something went wrong getting a response. Please try again.",
          },
        ]);
      }

      // 🔥 The success path replaces the optimistic "pending-..." sidebar
      // placeholder via fetchChatList() — but that never runs if the
      // request throws, so on failure the placeholder was getting stuck
      // forever (no icon, no menu, since its CSS state never resolves
      // into a real backend-confirmed entry). Since the request failed,
      // there's no real chat to fetch in its place — just drop it.
      setChatHistory((prev) => prev.filter((c) => c.id !== `pending-${localSessionId}`));
    } finally {
      // Only clear the typing indicator if this send is still the one
      // "in control" of the view — otherwise a slow, now-abandoned
      // request could incorrectly clear the spinner for a newer,
      // still-in-flight send on whatever chat the user has since opened.
      if (activeSessionIdRef.current === localSessionId) {
        setIsBotTyping(false);
      }
      // Unlike the above, this ALWAYS releases — it's a lock on "is a
      // request currently in flight at all", not on which chat owns it,
      // so the very next send (on this chat or a different one) is free
      // to go through regardless of which session it belonged to.
      isSendingRef.current = false;
    }
  };

  // 🆕 EDIT MESSAGE — lets the user correct something they typed and
  // regenerate the AI's reply based on the edited text, instead of the
  // reply being stuck answering the original (wrong/incomplete) wording.
  const [editingMessageIdx, setEditingMessageIdx] = useState(null);
  const [editingText, setEditingText] = useState("");

  const startEditingMessage = (idx) => {
    setEditingMessageIdx(idx);
    setEditingText(messages[idx].text);
  };

  const cancelEditingMessage = () => {
    setEditingMessageIdx(null);
    setEditingText("");
  };

  // 🆕 The backend isn't consistent about how it reports a generated
  // image: /chat returns a clean { type: "image", image_url } shape, but
  // /edit-message (used for regenerate) sometimes instead sends back a
  // plain text reply like "[Generated image: <url>]". Left alone, that
  // renders as ordinary markdown text — the URL becomes a clickable link
  // that re-triggers generation on every open, instead of an actual
  // inline image. This pulls the URL back out so it can be treated the
  // same as a proper image response either way.
  const extractGeneratedImageUrl = (text) => {
    if (!text) return null;
    const match = text.match(/\[\s*Generated image:\s*(\S+?)\s*\]\s*$/i);
    return match ? match[1] : null;
  };

  const handleEditMessage = async (idx) => {
    if (isSendingRef.current) return;

    const originalMsg = messages[idx];
    const newText = editingText.trim();

    if (!newText) return;

    // Nothing actually changed — just close the editor instead of
    // burning a usage credit and regenerating an identical reply.
    if (newText === originalMsg.text) {
      cancelEditingMessage();
      return;
    }

    // If the reply being replaced was a generated image, keep the
    // regenerated one an image too — otherwise editing an image prompt's
    // wording would silently downgrade it to a plain text reply.
    const wasImageReply = !!messages[idx + 1]?.imageUrl;

    setEditingMessageIdx(null);
    await regenerateFromUserMessage(idx, newText, wasImageReply);
  };

  // 🆕 Regenerates just the image reply for a given prompt without
  // touching the edit box — used by the "Regenerate" icon on a generated
  // image. Reuses the exact same edit/regenerate pipeline (same endpoint,
  // same message_id), just with the prompt text unchanged, since the
  // point here isn't editing what was asked, only getting a fresh image
  // for it. Unlike handleEditMessage, there's no "did the text change"
  // guard — a regenerate is always intentional.
  const handleRegenerateImage = async (botIdx) => {
    if (isSendingRef.current) return;
    const userIdx = botIdx - 1;
    const userMsg = messages[userIdx];
    if (!userMsg || userMsg.role !== "user") return;
    await regenerateFromUserMessage(userIdx, userMsg.text, true);
  };

  // Shared by handleEditMessage (prompt text changed) and
  // handleRegenerateImage (same prompt, just wants a new result) — both
  // ultimately need to: drop the old user message + its reply (and
  // anything after it), re-send to /edit-message, and splice in whatever
  // comes back, whether that's text or a freshly generated image.
  // `forceImage` mirrors the `force_mode: "image"` flag the original
  // /chat call sends when a create-image request goes out — without it
  // the backend has no way to know this should generate an image rather
  // than reply conversationally about the prompt.
  const regenerateFromUserMessage = async (idx, newText, forceImage = false) => {
    const originalMsg = messages[idx];

    if (!originalMsg.messageId || !currentChatId) {
      // Shouldn't normally happen — every message sent or loaded now
      // carries a messageId. If it's somehow missing, there's no safe
      // way to know what to delete/regenerate server-side, so don't
      // pretend this worked.
      console.error("Cannot regenerate this message — missing messageId or chat_id.");
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    isSendingRef.current = true;

    // Drop the old version of this message and everything after it (its
    // old reply, and any later exchanges) — regenerating happens from this
    // point forward, it doesn't create a second branch alongside the old one.
    setMessages((prev) => [
      ...prev.slice(0, idx),
      { role: "user", text: newText, messageId: originalMsg.messageId },
    ]);
    setIsBotTyping(true);

    sessionCounterRef.current += 1;
    const localSessionId = sessionCounterRef.current;
    activeSessionIdRef.current = localSessionId;

    try {
      const token = await currentUser.getIdToken();

      const limitRes = await fetch("http://127.0.0.1:8000/check-limit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!limitRes.ok) throw new Error("Failed to check daily limit.");
      const limitData = await limitRes.json();
      if (!limitData.allowed) {
        setLimitModal(true);
        return;
      }

      const usageRes = await fetch("http://127.0.0.1:8000/update-usage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usageRes.ok) throw new Error("Failed to update chat usage.");

      const editRes = await fetch("http://127.0.0.1:8000/edit-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: currentChatId,
          message_id: originalMsg.messageId,
          message: newText,
          force_mode: forceImage ? "image" : null,
          mode: selectedMode,
          // 🆕 Best-effort hint for the backend/image API: this is an
          // explicit regenerate of the SAME prompt, so any cache/dedup
          // keyed on identical prompt text should be bypassed and a new
          // seed used. Harmless if the backend doesn't read these.
          ...(forceImage ? { regenerate: true, seed: Date.now() } : {}),
        }),
      });

      if (!editRes.ok) {
        const errBody = await editRes.json().catch(() => ({}));
        throw new Error(errBody.detail || "Failed to regenerate a response.");
      }

      const editData = await editRes.json();

      if (!editData.success) {
        throw new Error(editData.error || "Something went wrong regenerating a response.");
      }

      fetchChatList();

      const stillOnThisChat = activeSessionIdRef.current === localSessionId;
      if (stillOnThisChat) {
        const fallbackImageUrl = extractGeneratedImageUrl(editData.data.response);
        const isImage = editData.data.type === "image" || !!fallbackImageUrl;
        setMessages((prev) => [
          ...prev.map((m) =>
            m.messageId === originalMsg.messageId && m.role === "user"
              ? { ...m, messageId: editData.data.message_id }
              : m
          ),
          isImage
            ? {
                role: "bot",
                text: "",
                imageUrl: editData.data.image_url || fallbackImageUrl,
                mode: editData.data.mode,
                messageId: editData.data.message_id,
              }
            : {
                role: "bot",
                text: editData.data.response,
                mode: editData.data.mode,
                messageId: editData.data.message_id,
              },
        ]);
      }
    } catch (err) {
      console.error(err);
      if (activeSessionIdRef.current === localSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Sorry, something went wrong getting a response. Please try again.",
          },
        ]);
      }
    } finally {
      if (activeSessionIdRef.current === localSessionId) {
        setIsBotTyping(false);
      }
      isSendingRef.current = false;
    }
  };

  // 🔥 Track the previously-open chat so we can tell "switched to a
  // different chat" (messages array replaced wholesale) apart from
  // "a new message arrived in the chat I'm already looking at". The
  // former should land at the bottom instantly; only the latter should
  // animate. Without this, switching chats replayed a smooth scroll
  // from wherever the old chat had scrolled to, all the way down.
  const prevChatIdRef = useRef(undefined);

  useEffect(() => {
    const isChatSwitch = prevChatIdRef.current !== currentChatId;
    prevChatIdRef.current = currentChatId;

    messagesEndRef.current?.scrollIntoView({
      behavior: isChatSwitch ? "auto" : "smooth",
    });
  }, [messages, isBotTyping, longWait, currentChatId]);

  // After 1.5s of waiting, switch from the simple 3-dot indicator to the
  // rotating "thinking" animation so a slow response doesn't just look frozen.
  useEffect(() => {
    if (!isBotTyping) {
      setLongWait(false);
      setWaitMsgIdx(0);
      return;
    }
    const escalateTimer = setTimeout(() => setLongWait(true), 1500);
    return () => clearTimeout(escalateTimer);
  }, [isBotTyping]);

  // Cycle through the playful status messages while in the long-wait state
  useEffect(() => {
    if (!longWait) return;
    const cycleTimer = setInterval(() => {
      setWaitMsgIdx((i) => (i + 1) % LONG_WAIT_MESSAGES.length);
    }, 2200);
    return () => clearInterval(cycleTimer);
  }, [longWait]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input, createMode]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isBotTyping) return;
      handleSend();
    }
  };

  const renderInputArea = (variantClass) => (
    <div className={`input-area ${variantClass}`}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        multiple
      />
      <input
        type="file"
        ref={photoInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
        multiple
      />
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: "none" }}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      <div className="input-wrapper-container">
        {attachments.length > 0 && (
          <div className="attachment-previews-container">
            {attachments.map((att) => (
              <div key={att.id} className="attachment-preview-card">
                {att.type.startsWith("image/") ? (
                  <img src={att.url} alt={att.name} className="att-preview-img" />
                ) : (
                  <div className="att-preview-file-icon">
                    <File size={20} />
                  </div>
                )}
                <span className="att-preview-name">{att.name}</span>
                <button
                  className="remove-att-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(att.id);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`input-wrapper ${createMode ? "input-wrapper--create" : ""}`}>
          <button
            type="button"
            className={`attach-btn ${attachmentMenuOpen ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!requireAuth()) return;
              setAttachmentMenuOpen(!attachmentMenuOpen);
            }}
          >
            <Plus size={20} />
          </button>
          
          {attachmentMenuOpen && (
            <div className="attachment-menu" onClick={(e) => e.stopPropagation()}>
              {isMobileDevice ? (
                <>
                  <button onClick={() => fileInputRef.current?.click()}>
                    <File size={16} /> Files
                  </button>
                  <button onClick={() => photoInputRef.current?.click()}>
                    <Image size={16} /> Photo
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={16} /> Camera
                  </button>
                  <div className="menu-divider" />
                  <button
                    className={createMode === "image" ? "active" : ""}
                    onClick={handleCreateImage}
                  >
                    <CreateImageIcon size={16} /> Create image
                  </button>
                  <button
                    className={createMode === "video" ? "active" : ""}
                    onClick={handleCreateVideo}
                  >
                    <CreateVideoIcon size={16} /> Create video
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => fileInputRef.current?.click()}>
                    <File size={16} /> Add photos and files
                  </button>
                  <button onClick={captureScreenshot}>
                    <Monitor size={16} /> Take screenshot
                  </button>
                  <button onClick={startWebcam}>
                    <Camera size={16} /> Take photo
                  </button>
                  <button
                    className={deepSearchMode ? "active" : ""}
                    onClick={handleDeepSearch}
                  >
                    <Search size={16} /> Deep Research
                  </button>
                  <div className="menu-divider" />
                  <button
                    className={createMode === "image" ? "active" : ""}
                    onClick={handleCreateImage}
                  >
                    <CreateImageIcon size={16} /> Create image
                  </button>
                  <button
                    className={createMode === "video" ? "active" : ""}
                    onClick={handleCreateVideo}
                  >
                    <CreateVideoIcon size={16} /> Create video
                  </button>
                </>
              )}
            </div>
          )}

          {createMode && (
            <div className={`create-mode-tag create-mode-tag--${createMode}`}>
              <span className="create-mode-tag-icon">
                {createMode === "image" ? <CreateImageIcon size={15} /> : <CreateVideoIcon size={15} />}
              </span>
              <span className="create-mode-tag-label">
                <span className="create-mode-prefix">Create </span>
                {createMode === "image" ? "image" : "video"}
              </span>
              <button
                className="create-mode-tag-close"
                onClick={() => setCreateMode(null)}
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {deepSearchMode && (
            <div className="deep-search-tag">
              <span className="create-mode-tag-icon">
                <Search size={13} />
              </span>
              <span className="create-mode-tag-label">Deep Research</span>
              <button
                className="create-mode-tag-close"
                onClick={() => setDeepSearchMode(false)}
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="input-textarea-row">
            <textarea
              ref={inputRef}
              placeholder={createMode ? (createMode === "image" ? "Describe the image..." : "Describe the video...") : "Message SmartAI..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`send-btn ${input.trim() || attachments.length > 0 || createMode ? "active" : ""}`}
              onClick={handleSend}
              disabled={isBotTyping}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      <p className="input-disclaimer">
        SmartAI can make mistakes. Consider verifying important information.
      </p>
    </div>
  );

  return (
    <div className={`chat-app ${theme}`}>
      <IntroAnimation theme={theme} />

      {!sidebarOpen && (
        <button className="icon-btn open-sidebar-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      )}

      {sidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo"><Zap size={22} fill="currentColor" /></div>
            <h2>SmartAI</h2>
          </div>
          <button className="icon-btn collapse-btn" onClick={() => setSidebarOpen(false)}>
            <PanelLeftClose size={20} />
          </button>
        </div>

        <button
          className="new-chat-btn"
          onClick={() => {
            sessionCounterRef.current += 1;
            activeSessionIdRef.current = sessionCounterRef.current;
            setIsBotTyping(false);
            setMessages([]);
            setCurrentChatId(null);
            // New Chat doesn't change which tab is active, so this fresh
            // chat already "belongs" to whatever mode is currently selected.
            lastModeUsedRef.current = selectedMode === "General" ? null : selectedMode;
          }}
        >
          <Plus size={18} /> New Chat
        </button>

        <div className="chat-history-list">
          {chatListLoading && chatHistory.length === 0 && (
            <p className="history-empty-hint">Loading...</p>
          )}
          {!chatListLoading && chatHistory.length === 0 && (
            <p className="history-empty-hint">No conversations yet</p>
          )}

          {/* 🔥 Pinned chats get their own section up top, same as
              ChatGPT — only rendered when at least one chat is pinned. */}
          {chatHistory.some((c) => c.pinned) && (
            <>
              <p className="history-label">Pinned</p>
              {chatHistory
                .filter((c) => c.pinned)
                .map((chat) => {
                  const idx = chatHistory.indexOf(chat);
                  return (
                    <div key={chat.id} className="history-item-wrapper">
                      <div
                        className={`history-item ${chat.id === currentChatId ? "active" : ""} ${chat.pending ? "pending" : ""}`}
                        onClick={() => !chat.pending && loadConversation(chat.id)}
                      >
                        <Pin size={14} className="pin-indicator" />
                        <span>{chat.title}</span>
                        {!chat.pending && (
                          <button
                            className="history-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuIdx(activeMenuIdx === idx ? null : idx);
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>

                      {activeMenuIdx === idx && !chat.pending && (
                        <div className="history-action-menu">
                          <button onClick={(e) => handleHistoryAction(e, 'Unpin', chat.id)}>
                            <PinOff size={14} /> Unpin
                          </button>
                          <button onClick={(e) => handleHistoryAction(e, 'Share', chat.id)}>
                            <Share2 size={14} /> Share
                          </button>
                          <button onClick={(e) => handleHistoryAction(e, 'Rename', chat.id)}>
                            <Pencil size={14} /> Rename
                          </button>
                          <div className="menu-divider" />
                          <button className="delete-action" onClick={(e) => handleHistoryAction(e, 'Delete', chat.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </>
          )}

          {chatHistory.some((c) => !c.pinned) && (
            <p className="history-label">Recent Chats</p>
          )}
          {chatHistory
            .filter((c) => !c.pinned)
            .map((chat) => {
              const idx = chatHistory.indexOf(chat);
              return (
                <div key={chat.id} className="history-item-wrapper">
                  <div
                    className={`history-item ${chat.id === currentChatId ? "active" : ""} ${chat.pending ? "pending" : ""}`}
                    onClick={() => !chat.pending && loadConversation(chat.id)}
                  >
                    {chat.icon} <span>{chat.title}</span>
                    {!chat.pending && (
                      <button
                        className="history-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuIdx(activeMenuIdx === idx ? null : idx);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>

                  {activeMenuIdx === idx && !chat.pending && (
                    <div className="history-action-menu">
                      <button onClick={(e) => handleHistoryAction(e, 'Pin', chat.id)}>
                        <Pin size={14} /> Pin
                      </button>
                      <button onClick={(e) => handleHistoryAction(e, 'Share', chat.id)}>
                        <Share2 size={14} /> Share
                      </button>
                      <button onClick={(e) => handleHistoryAction(e, 'Rename', chat.id)}>
                        <Pencil size={14} /> Rename
                      </button>
                      <div className="menu-divider" />
                      <button className="delete-action" onClick={(e) => handleHistoryAction(e, 'Delete', chat.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="sidebar-footer">
          {/* 👑 DYNAMIC UPGRADE / PREMIUM ACTIVE BADGE */}
          {user?.premium ? (
            <div className="footer-btn premium-active-badge" style={{ cursor: "default", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
              <Crown size={18} fill="#f59e0b" color="#f59e0b" />
              <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{user.plan || "Pro"} Member</span>
            </div>
          ) : (
            <button className="footer-btn upgrade-pro-btn" onClick={() => navigate("/pricing")}>
              <Crown size={18} fill="#f59e0b" color="#f59e0b" /> 
              <span>Upgrade to Pro</span>
            </button>
          )}

          {user ? (
            <div className="user-profile-section">
              <div className="user-profile-info">
                <div className="user-avatar-circle">{userName.charAt(0).toUpperCase()}</div>
                <span className="user-name">{userName}</span>
              </div>

              <button
                className="icon-btn user-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((prev) => !prev);
                }}
                title="More options"
              >
                <MoreVertical size={18} />
              </button>

              {userMenuOpen && (
                <div className="history-action-menu user-action-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setUserMenuOpen(false);
                    }}
                  >
                    {theme === "dark" ? (
                      <><Sun size={14} /> Light Mode</>
                    ) : (
                      <><Moon size={14} /> Dark Mode</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/settings");
                    }}
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <div className="menu-divider" />
                  <button
                    className="delete-action"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="footer-btn login-nav-btn" onClick={() => navigate("/login")}>
              <LogIn size={18} /> Log In
            </button>
          )}
        </div>
      </aside>

      <main className="chat-main">
        <div className="modes-bar">
          {initialModes.map((m) => (
            <div
              key={m.name}
              className={`mode-tab ${selectedMode === m.name ? "active" : ""} ${!user && m.name !== "General" ? "locked" : ""} ${isBotTyping ? "disabled" : ""}`}
              title={
                isBotTyping
                  ? "Wait for the response to finish before switching modes"
                  : (!user && m.name !== "General" ? "Sign in to use this mode" : undefined)
              }
              onClick={() => {
                // 🆕 Mode is locked while a response is streaming in — switching
                // mid-generation would leave the reply orphaned/mismatched.
                if (isBotTyping) return;

                if (!user && m.name !== "General") {
                  setShowAuthModal(true);
                  return;
                }

                if (m.name === selectedMode) return;

                // 🆕 Hopping between two DIFFERENT non-General modes always
                // starts a fresh chat. Crucially, this checks the last
                // non-General mode actually used in this chat — not just the
                // tab you're on right now — so General doesn't act as an
                // "escape hatch": Study -> General -> Emotion still counts
                // as Study -> Emotion and resets, since Study was already
                // used in this chat. Only General <-> the SAME mode you were
                // already in (or a brand-new chat that hasn't used any mode
                // yet) skips the reset.
                if (m.name === "General") {
                  setSelectedMode(m.name);
                  setIsTemporaryChat(false);
                  return;
                }

                const isCrossModeSwitch =
                  lastModeUsedRef.current !== null && lastModeUsedRef.current !== m.name;
                if (isCrossModeSwitch) {
                  sessionCounterRef.current += 1;
                  activeSessionIdRef.current = sessionCounterRef.current;
                  setIsBotTyping(false);
                  setMessages([]);
                  setCurrentChatId(null);
                }

                lastModeUsedRef.current = m.name;
                setSelectedMode(m.name);
                if (m.name !== "Emotion") setIsTemporaryChat(false);
              }}
            >
              <span className="mode-tab-icon">{m.icon}</span>
              <span>{m.name}</span>
              {!user && m.name !== "General" && <Lock size={12} className="mode-tab-lock" />}
            </div>
          ))}
        </div>

        <div className="chat-top-actions">
          {selectedMode === "Emotion" && (
            <button 
              className={`temp-chat-toggle ${isTemporaryChat ? 'active' : ''}`}
              onClick={() => {
                const turningOn = !isTemporaryChat;
                setIsTemporaryChat(turningOn);
                if (turningOn) setShowIncognitoNotice(true);
              }}
              data-tooltip={isTemporaryChat ? "Incognito mode (Not saved)" : "Turn on incognito mode"}
            >
              <div className="layered-icon-container">
                <VenetianMask size={22} />
                {isTemporaryChat && <div className="icon-tick-overlay"><Check size={12} strokeWidth={3} /></div>}
              </div>
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="empty-chat-container">
            <div className="welcome-logo">
              <Zap size={48} fill="currentColor" />
            </div>
            <h1>{modeWelcomeText[selectedMode]}</h1>

            <div className="suggested-questions-grid">
              {suggestedQuestions[selectedMode].map((q, idx) => (
                <button 
                  key={idx}
                  className="suggested-question-card"
                  onClick={() => {
                    setInput(q.text);
                    inputRef.current?.focus();
                  }}
                >
                  <span className="suggested-question-icon">{q.icon}</span>
                  <p>{q.text}</p>
                </button>
              ))}
            </div>

            {renderInputArea("centered-input")}
          </div>
        ) : (
          <div className="active-chat-container">
            <div className="messages-scroll-area">
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message-wrapper ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === "user" ? <User size={20} /> : <Zap size={20} fill="currentColor" />}
                    </div>
                    <div className="message-content">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="message-attachments">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="message-attachment-item">
                              {att.type.startsWith("image/") ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="message-attachment-img"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="message-attachment-file"
                                >
                                  <File size={16} />
                                  <span>{att.name}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.imageUrl && (
                        <div className="message-attachments">
                          <div className="message-attachment-item generated-image-item">
                            <GeneratedImage
                              src={msg.imageUrl}
                              alt="Generated"
                              className="message-attachment-img"
                              onClick={(resolvedSrc) => window.open(resolvedSrc, '_blank')}
                            />
                            <button
                              className="regenerate-image-btn"
                              title="Regenerate image"
                              disabled={isBotTyping}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegenerateImage(idx);
                              }}
                            >
                              <RefreshCw size={15} />
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.text && (
                        editingMessageIdx === idx ? (
                          <div className="message-edit-box">
                            <textarea
                              className="message-edit-textarea"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleEditMessage(idx);
                                } else if (e.key === "Escape") {
                                  cancelEditingMessage();
                                }
                              }}
                              autoFocus
                              rows={1}
                            />
                            <div className="message-edit-actions">
                              <button
                                className="message-edit-cancel-btn"
                                onClick={cancelEditingMessage}
                              >
                                Cancel
                              </button>
                              <button
                                className="message-edit-save-btn"
                                onClick={() => handleEditMessage(idx)}
                              >
                                Save & Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="message-text">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                code: (codeProps) => <CodeBlock {...codeProps} theme={theme} />,
                                table: (tableProps) => (
                                  <div className="message-table-wrapper">
                                    <table {...tableProps} />
                                  </div>
                                ),
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        )
                      )}
                      {/* 🆕 Small mode tag so the user always knows which
                          mode answered them — especially useful since
                          switching tabs mid-conversation is allowed, and
                          because some modes (overthinking/medical) are
                          auto-detected rather than chosen. */}
                      {msg.role === "bot" && msg.mode && MODE_DISPLAY_LABELS[msg.mode] && (
                        <div className="message-mode-tag">
                          {MODE_DISPLAY_LABELS[msg.mode]}
                        </div>
                      )}
                      {editingMessageIdx !== idx && (
                        <div className="message-actions">
                          <button
                            className="action-btn"
                            title="Copy"
                            onClick={() => handleCopy(msg.text, idx)}
                          >
                            {copiedIndex === idx ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                          </button>
                          {msg.role === "bot" && (
                            <>
                              <button
                                className={`action-btn ${msg.feedback === 'up' ? 'active' : ''}`}
                                onClick={() => handleFeedback(idx, 'up')}
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button
                                className={`action-btn ${msg.feedback === 'down' ? 'active' : ''}`}
                                onClick={() => handleFeedback(idx, 'down')}
                              >
                                <ThumbsDown size={16} />
                              </button>
                            </>
                          )}
                          {msg.role === "user" && (
                            <button
                              className="action-btn"
                              title="Edit"
                              onClick={() => startEditingMessage(idx)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="message-wrapper bot">
                    <div className="message-avatar">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="message-content">
                      {longWait ? (
                        <div className="long-wait-indicator">
                          <div className="long-wait-orbit">
                            <Sparkles size={16} />
                          </div>
                          <span className="long-wait-text" key={waitMsgIdx}>
                            {LONG_WAIT_MESSAGES[waitMsgIdx]}
                          </span>
                        </div>
                      ) : (
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {renderInputArea("sticky-input")}
          </div>
        )}
      </main>

      {/* FIREBASE AUTH DISPATCH ROUTE GUARDIAN MODAL */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
              <X size={20} />
            </button>
            <div className="auth-modal-icon">
              <Zap size={32} fill="currentColor" />
            </div>
            <h3>Join SmartAI to continue</h3>
            <p>Sign in to unlock the full power of SmartAI — save chats, personalize responses, and more.</p>
            <div className="auth-modal-buttons">
              <button className="auth-modal-btn login" onClick={() => navigate("/login")}>
                Log In
              </button>
              <button className="auth-modal-btn signup" onClick={() => navigate("/signup")}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FREE LAYER RATELIMIT INTERCEPT MODAL */}
      {limitModal && (
        <div className="auth-modal-overlay" onClick={() => setLimitModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setLimitModal(false)}>
              <X size={20} />
            </button>
            <div className="auth-modal-icon" style={{ color: "#f59e0b" }}>
              <Crown size={32} fill="#f59e0b" />
            </div>
            <h3>Daily Chat Limit Reached</h3>
            <p>You've reached your free daily chat limit. Please come back tomorrow or upgrade to SmartAI Pro for unlimited access.</p>
            <div className="auth-modal-buttons">
              <button className="auth-modal-btn login" onClick={() => setLimitModal(false)}>
                Close
              </button>
              <button
                className="auth-modal-btn signup"
                onClick={() => {
                  setLimitModal(false);
                  navigate("/pricing");
                }}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCOGNITO MODE ENABLED NOTICE MODAL */}
      {showIncognitoNotice && (
        <div className="auth-modal-overlay" onClick={() => setShowIncognitoNotice(false)}>
          <div className="auth-modal incognito-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowIncognitoNotice(false)}>
              <X size={20} />
            </button>
            <div className="auth-modal-icon incognito-modal-icon">
              <VenetianMask size={30} />
            </div>
            <h3>Incognito mode is on</h3>
            <p>This chat won't be saved to your history. Once you leave or start a new conversation, these messages are gone for good.</p>
            <div className="auth-modal-buttons">
              <button className="auth-modal-btn signup incognito-full-btn" onClick={() => setShowIncognitoNotice(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEBCAM CAPTURE CONTAINER MODAL */}
      {webcamOpen && (
        <div className="webcam-modal-overlay">
          <div className="webcam-modal">
            <button className="webcam-modal-close" onClick={stopWebcam}>
              <X size={20} />
            </button>
            <h3>Take a Photo</h3>
            <div className="webcam-video-container">
              <video ref={videoRef} autoPlay playsInline muted />
            </div>
            <div className="webcam-modal-buttons">
              <button className="webcam-capture-btn" onClick={capturePhoto}>
                Capture Photo
              </button>
              <button className="webcam-cancel-btn" onClick={stopWebcam}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RENAME CHAT MODAL */}
      {renameModal && (
        <div className="auth-modal-overlay" onClick={() => !renameSaving && setRenameModal(null)}>
          <div className="auth-modal rename-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-modal-close"
              onClick={() => setRenameModal(null)}
              disabled={renameSaving}
            >
              <X size={20} />
            </button>
            <div className="auth-modal-icon">
              <Pencil size={26} />
            </div>
            <h3>Rename chat</h3>
            <input
              type="text"
              className="rename-modal-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Chat name"
              autoFocus
              disabled={renameSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
              }}
            />
            <div className="auth-modal-buttons">
              <button
                className="auth-modal-btn login"
                onClick={() => setRenameModal(null)}
                disabled={renameSaving}
              >
                Cancel
              </button>
              <button
                className="auth-modal-btn signup"
                onClick={submitRename}
                disabled={renameSaving || !renameValue.trim()}
              >
                {renameSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE CHAT MODAL */}
      {shareModal && (
        <div className="auth-modal-overlay" onClick={() => setShareModal(null)}>
          <div className="auth-modal share-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShareModal(null)}>
              <X size={20} />
            </button>
            <div className="auth-modal-icon">
              <Share2 size={26} />
            </div>
            <h3>Share this chat</h3>
            <p>Anyone with this link will be able to view this conversation.</p>
            <div className="share-modal-link-row">
              <input type="text" readOnly value={shareModal.url} className="share-modal-link-input" />
              <button
                className="share-modal-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.url).then(() => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }).catch((err) => console.error("Could not copy text:", err));
                }}
              >
                {shareCopied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}