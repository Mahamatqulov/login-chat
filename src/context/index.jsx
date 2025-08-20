// import { createContext, useReducer, useContext } from "react";
// import { cookies } from "../config/cookies";

// const initialState = {
//   user: localStorage.getItem("user")
//     ? JSON.parse(localStorage.getItem("user"))
//     : null,
// };

// const AuthContext = createContext(undefined);

// function reducer(state, action) {
//   switch (action.type) {
//     case "LOGIN":
//       cookies.set("access_token", action.payload?.access_token || "", {
//         path: "/",
//         secure: true,
//         sameSite: "strict",
//       });
//       const userData = {
//         id: "1",
//         name: "Admin",
//         email: "admin@example.com",
//       };
//       localStorage.setItem("user", JSON.stringify(userData));

//       return { ...state, user: userData };

//     case "LOGOUT":
//       cookies.remove("access_token");
//       localStorage.removeItem("user");
//       return { ...state, user: null };

//     default:
//       return state;
//   }
// }

// export function AuthContextProvider({ children }) {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const login = (tokens) => dispatch({ type: "LOGIN", payload: tokens });
//   const logOut = () => dispatch({ type: "LOGOUT" });

//   return (
//     <AuthContext.Provider value={{ state, login, logOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuthContext() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error(
//       "useAuthContext must be used within an AuthContextProvider"
//     );
//   }
//   return context;
// }

//**

// "use client";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { MdOutlineGroupAdd } from "react-icons/md";
// import {
//   FiLock,
//   FiUnlock,
//   FiMessageSquare,
//   FiPhone,
//   FiVideo,
//   FiMoreHorizontal,
//   FiPaperclip,
//   FiImage,
//   FiSend,
//   FiX,
// } from "react-icons/fi";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // ✅ Token olish funksiyasi
// function getAuthToken() {
//   const savedToken = localStorage.getItem("token");
//   if (savedToken) return savedToken;

//   const manualToken =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODYxNzI1LCJpYXQiOjE3NTU0Mjk3MjUsImp0aSI6ImY5YWQ4ODIyMmNjNzQyZTg5OWIxZmNjODgyM2E3MGE1IiwidXNlcl9pZCI6IjcifQ.5xdLpdvdLwIki_xHtLyC1AAqrJtXzmkx60bR6bO0ET0";
//   localStorage.setItem("token", manualToken);
//   return manualToken;
// }

// const initials = (s) =>
//   s
//     ?.split(" ")
//     .map((p) => p[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

// export default function Chat() {
//   const token = getAuthToken();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [active, setActive] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [search, setSearch] = useState("");
//   const [typing, setTyping] = useState(false);
//   const [newMessage, setNewMessage] = useState("");

//   const [showCreateGroup, setShowCreateGroup] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newDescription, setNewDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [groupPrivate, setGroupPrivate] = useState(true);

//   const messagesEndRef = useRef();
//   const socketRef = useRef(null);

//   // API: Users olish
//   useEffect(() => {
//     if (!token) return;
//     fetch("http://5.133.122.226:8000/api/employee/", {
//       credentials: "include",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then(setUsers)
//       .catch((e) => console.error(e));
//   }, [token]);

//   // API: Chat rooms olish
//   useEffect(() => {
//     if (!token) return;
//     fetch("http://5.133.122.226:8000/api/chat/chat-rooms/", {
//       credentials: "include",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then(setGroups)
//       .catch((e) => console.error(e));
//   }, [token]);

//   // Auto scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Search filter
//   const filteredUsers = useMemo(
//     () =>
//       users.filter((u) =>
//         (u.fio || u.username || u.first_name || "")
//           .toLowerCase()
//           .includes(search.toLowerCase())
//       ),
//     [users, search]
//   );

//   const filteredGroups = useMemo(
//     () =>
//       groups.filter((g) =>
//         (g.name || "").toLowerCase().includes(search.toLowerCase())
//       ),
//     [groups, search]
//   );

//   // ✅ Chatni ochish (Private va Group alohida ishlaydi)
//   const openChat = async (obj, type) => {
//     setActive({ ...obj, type });
//     setMessages([]);

//     // 🔹 Private chat -> API orqali yozishmalarni olish
//     if (type === "user") {
//       try {
//         const res = await fetch(
//           `http://5.133.122.226:8000/api/chat/messages/?chat_room=${obj.id}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const data = await res.json();
//         setMessages(
//           data.map((m) => ({
//             sender: m.sender_name || m.sender,
//             text: m.message,
//             time: m.created_at,
//           }))
//         );
//       } catch (err) {
//         console.error("Xabarlarni olishda xatolik:", err);
//       }
//     }

//     // 🔹 Group chat -> WebSocket orqali
//     if (type === "group") {
//       const groupId = obj.id;
//       const ws = new WebSocket(
//         `ws://5.133.122.226:8000/ws/chat/group/${groupId}/?token=${token}`
//       );

//       ws.onopen = () => console.log("Socket ulandi");
//       ws.onmessage = (e) => {
//         const data = JSON.parse(e.data);
//         setMessages((prev) => [
//           ...prev,
//           { sender: data.sender, text: data.message },
//         ]);
//       };
//       ws.onclose = () => console.log("Socket yopildi");

//       socketRef.current = ws;
//     }
//   };

//   // ✅ Xabar yuborish
//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     // 🔹 Private chat -> API orqali yuborish
//     if (active?.type === "user") {
//       try {
//         const res = await fetch(
//           "http://5.133.122.226:8000/api/chat/messages/send_message/",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({
//               chat_room: active.id,
//               message: newMessage,
//             }),
//           }
//         );

//         if (!res.ok) {
//           const err = await res.json();
//           console.error("Xabar yuborishda xato:", err);
//           return;
//         }

//         setMessages((prev) => [
//           ...prev,
//           { sender: "me", text: newMessage, time: new Date().toISOString() },
//         ]);
//         setNewMessage("");
//       } catch (err) {
//         console.error("Kutilmagan xatolik:", err);
//       }
//     }

//     // 🔹 Group chat -> WebSocket orqali yuborish
//     if (active?.type === "group" && socketRef.current) {
//       const msg = { type: "chat_message", message: newMessage };
//       socketRef.current.send(JSON.stringify(msg));

//       setMessages((prev) => [
//         ...prev,
//         { sender: "me", text: newMessage, time: new Date().toISOString() },
//       ]);
//       setNewMessage("");
//     }
//   };

//   // ✅ Group yaratish
//   const createGroup = async () => {
//     if (!newGroupName || selectedMembers.length === 0) {
//       toast.error("Guruh nomi va ishtirokchilarni tanlang!");
//       return;
//     }

//     try {
//       const res = await fetch(
//         "http://5.133.122.226:8000/api/chat/groups/create_group/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newDescription,
//             is_public: groupPrivate,
//             member_ids: selectedMembers,
//           }),
//         }
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         console.error("Serverdan qaytgan xato:", data);
//         toast.error(data?.detail || JSON.stringify(data));
//         return;
//       }

//       setGroups((prev) => [...prev, data]);
//       setShowCreateGroup(false);
//       setNewGroupName("");
//       setNewDescription("");
//       setSelectedMembers([]);
//       toast.success("Guruh yaratildi!");
//     } catch (err) {
//       console.error("Kutilmagan xato:", err);
//       toast.error("Guruh yaratishda xatolik");
//     }
//   };

//   return (
//     <div className="flex h-[90vh] bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
//         {/* Search */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="relative">
//             <input
//               className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
//               placeholder="Search..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Users */}
//         <div className="p-3 flex-1 overflow-y-auto">
//           <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
//             Users
//           </h3>
//           {filteredUsers.map((u) => (
//             <div
//               key={u.id}
//               onClick={() => openChat(u, "user")}
//               className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition ${
//                 active?.id === u.id
//                   ? "bg-blue-50 border border-blue-100"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
//                 {initials(u.fio || u.username || u.first_name)}
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm font-medium">
//                   {u.fio || u.username || u.first_name}
//                 </p>
//                 <p className="text-xs text-gray-500">Online</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Groups */}
//         <div className="p-3 border-t border-gray-200 flex-1 overflow-y-auto">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-semibold text-gray-500 uppercase">
//               Groups
//             </h3>
//             <button
//               onClick={() => setShowCreateGroup(true)}
//               className="p-1.5 rounded-full bg-blue-100 text-blue-600"
//             >
//               <MdOutlineGroupAdd size={18} />
//             </button>
//           </div>
//           {filteredGroups.map((g) => (
//             <div
//               key={g.id}
//               onClick={() => openChat(g, "group")}
//               className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition ${
//                 active?.id === g.id
//                   ? "bg-blue-50 border border-blue-100"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
//                 {initials(g.name)}
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm font-medium">{g.name}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chat window */}
//       <div className="flex-1 flex flex-col">
//         {active ? (
//           <>
//             {/* Header */}
//             <div className="p-4 border-b flex justify-between items-center bg-white">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
//                   {initials(active.name || active.fio)}
//                 </div>
//                 <div>
//                   <h2 className="font-bold">{active.name || active.fio}</h2>
//                   <p className="text-xs text-gray-500">Online</p>
//                 </div>
//               </div>
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//               {messages.map((m, i) => (
//                 <div
//                   key={i}
//                   className={`flex ${
//                     m.sender === "me" ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   <div
//                     className={`p-3 rounded-lg max-w-md ${
//                       m.sender === "me"
//                         ? "bg-blue-600 text-white"
//                         : "bg-white border"
//                     }`}
//                   >
//                     {m.text}
//                   </div>
//                 </div>
//               ))}
//               {typing && <div className="text-gray-400 text-sm">Typing...</div>}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Input */}
//             <div className="p-4 border-t bg-white flex items-center gap-2">
//               <input
//                 className="flex-1 px-4 py-2 rounded-full bg-gray-100"
//                 placeholder="Type a message..."
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               />
//               <button
//                 onClick={sendMessage}
//                 className="p-2 rounded-full bg-blue-600 text-white"
//               >
//                 <FiSend size={20} />
//               </button>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex flex-col items-center justify-center">
//             <FiMessageSquare size={40} className="text-gray-400" />
//             <p className="text-gray-500">Select a chat to start</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// */
