// "use client";

// import { useMemo, useRef, useState } from "react";
// import { MdOutlineGroupAdd } from "react-icons/md";
// import { BsFillTelephoneOutboundFill } from "react-icons/bs";
// import { MdMissedVideoCall } from "react-icons/md";
// import { TbScreenShare } from "react-icons/tb";
// import { FiLock, FiUnlock } from "react-icons/fi";

// const usersSeed = [
//   { id: "u1", name: "Ali", online: true },
//   { id: "u2", name: "Laylo", online: true },
//   { id: "u3", name: "samandar", online: false },
// ];

// const groupsSeed = [
//   {
//     id: "g1",
//     name: "Frontend",
//     members: ["u1", "u2"],
//     isPrivate: false,
//     messages: [
//       { id: "m1", senderId: "u2", text: "Salom!", ts: Date.now() - 60_000 },
//     ],
//   },
// ];

// const initials = (s) =>
//   s
//     .split(" ")
//     .map((p) => p[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

// export default function Chat() {
//   const currentUserId = "u1";
//   const [users, setUsers] = useState(usersSeed);
//   const [groups, setGroups] = useState(groupsSeed);
//   const [search, setSearch] = useState("");
//   const [active, setActive] = useState({ type: "group", id: "g1" }); // 'group' | 'dm'
//   const [text, setText] = useState("");
//   const [typingUsers, setTypingUsers] = useState(new Set());

//   const [showCreate, setShowCreate] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([currentUserId]);
//   const [isPrivateGroup, setIsPrivateGroup] = useState(false);

//   const dmRef = useRef({});
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const [modal, setModal] = useState(null); // { kind: 'audio'|'video'|'screen', title }

//   const messages =
//     active.type === "group"
//       ? groups.find((g) => g.id === active.id)?.messages || []
//       : dmRef.current[active.id] || [];

//   const simulateTyping = (userId) => {
//     setTypingUsers((prev) => new Set([...prev, userId]));
//     setTimeout(() => {
//       setTypingUsers((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(userId);
//         return newSet;
//       });
//     }, 3000);
//   };

//   const send = () => {
//     const t = text.trim();
//     if (!t) return;
//     const msg = {
//       id: Math.random().toString(36).slice(2),
//       senderId: currentUserId,
//       text: t,
//       ts: Date.now(),
//     };
//     if (active.type === "group") {
//       setGroups((gs) =>
//         gs.map((g) =>
//           g.id === active.id ? { ...g, messages: [...g.messages, msg] } : g
//         )
//       );
//     } else {
//       dmRef.current[active.id] = [...(dmRef.current[active.id] || []), msg];
//       setUsers((u) => [...u]); // force rerender
//     }
//     setText("");

//     setTimeout(() => {
//       const otherUsers =
//         active.type === "group"
//           ? groups
//               .find((g) => g.id === active.id)
//               ?.members?.filter((id) => id !== currentUserId) || []
//           : [active.id];
//       if (otherUsers.length > 0) {
//         const randomUser =
//           otherUsers[Math.floor(Math.random() * otherUsers.length)];
//         simulateTyping(randomUser);
//       }
//     }, 1000);
//   };

//   const getUserAvatar = (userId) => {
//     const user = users.find((u) => u.id === userId);
//     return user ? initials(user.name) : "?";
//   };

//   const getUserName = (userId) => {
//     const user = users.find((u) => u.id === userId);
//     return user ? user.name : "Unknown";
//   };

//   const openModal = async (kind) => {
//     try {
//       if (kind === "video") {
//         streamRef.current = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: true,
//         });
//       } else if (kind === "screen") {
//         streamRef.current = await navigator.mediaDevices.getDisplayMedia({
//           video: true,
//           audio: false,
//         });
//       } else {
//         streamRef.current = await navigator.mediaDevices.getUserMedia({
//           audio: true,
//         });
//       }
//       setModal({
//         kind,
//         title:
//           kind === "video"
//             ? "Video qo'ng'iroq"
//             : kind === "screen"
//             ? "Ekran ulashish"
//             : "Qo'ng'iroq",
//       });
//     } catch (e) {
//       alert("Media permission rad etildi yoki xatolik yuz berdi");
//     }
//   };

//   const closeModal = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//     setModal(null);
//   };

//   const handleCreateGroup = () => {
//     const name = newGroupName.trim();
//     if (!name) return alert("Guruh nomini kiriting");
//     const members = Array.from(new Set(selectedMembers));
//     if (members.length < 2) return alert("Kamida 2 a'zo kerak");
//     const g = {
//       id: Math.random().toString(36).slice(2),
//       name,
//       members,
//       isPrivate: isPrivateGroup,
//       messages: [
//         {
//           id: "w",
//           senderId: members[0],
//           text: `"${name}" guruhiga xush kelibsiz!`,
//           ts: Date.now(),
//         },
//       ],
//     };
//     setGroups((prev) => [g, ...prev]);
//     setShowCreate(false);
//     setNewGroupName("");
//     setSelectedMembers([currentUserId]);
//     setIsPrivateGroup(false);
//     setActive({ type: "group", id: g.id });
//   };

//   const filteredUsers = useMemo(
//     () =>
//       users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase())),
//     [users, search]
//   );
//   const filteredGroups = useMemo(
//     () =>
//       groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
//     [groups, search]
//   );

//   const entity =
//     active.type === "group"
//       ? groups.find((g) => g.id === active.id)
//       : users.find((u) => u.id === active.id);
//   const title = entity?.name || "Chat";

//   return (
//     <div className="flex h-[90vh] bg-background text-foreground">
//       {/* LEFT */}
//       <aside className="w-80 border-r border-sidebar-border bg-sidebar flex flex-col">
//         <div className="flex gap-2 p-2 border-b border-sidebar-border">
//           <input
//             className="flex-1 rounded-xl border border-border bg-input px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
//             placeholder="Qidirish"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <button
//             className="rounded-xl border border-border bg-card px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//             onClick={() => setShowCreate(true)}
//           >
//             <MdOutlineGroupAdd />
//           </button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-2">
//           <div className="text-xs text-muted-foreground my-1">GURUHLAR</div>
//           {filteredGroups.map((g) => (
//             <div
//               key={g.id}
//               onClick={() => setActive({ type: "group", id: g.id })}
//               className={`mb-1 cursor-pointer rounded-lg p-2 transition-colors ${
//                 active.type === "group" && active.id === g.id
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-card"
//               }`}
//             >
//               <div className="font-semibold flex items-center gap-2">
//                 {g.name}
//                 {g.isPrivate ? (
//                   <FiLock className="w-3 h-3 text-muted-foreground" />
//                 ) : (
//                   <FiUnlock className="w-3 h-3 text-muted-foreground" />
//                 )}
//               </div>
//               <div className="text-xs opacity-70">
//                 {g.members.length} a'zo • {g.isPrivate ? "Maxfiy" : "Ochiq"}
//               </div>
//             </div>
//           ))}

//           <div className="text-xs text-muted-foreground mt-2 mb-1">
//             FOYDALANUVCHILAR
//           </div>
//           {filteredUsers.map((u) => (
//             <div
//               key={u.id}
//               onClick={() => setActive({ type: "dm", id: u.id })}
//               className={`mb-1 cursor-pointer rounded-lg p-2 transition-colors ${
//                 active.type === "dm" && active.id === u.id
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-card"
//               }`}
//             >
//               <div className="font-semibold inline-flex items-center gap-2">
//                 {u.name}
//                 <span
//                   className={`inline-block h-2 w-2 rounded-full ${
//                     u.online ? "bg-green-500" : "bg-muted"
//                   }`}
//                 />
//               </div>
//               <div className="text-xs opacity-70">
//                 {u.online ? "online" : "offline"}
//               </div>
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* RIGHT */}
//       <main className="flex flex-1 flex-col">
//         {/* Header */}
//         <div className="h-16 border-b border-border px-3 flex items-center justify-between bg-background">
//           <div className="flex items-center gap-3">
//             <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
//               {initials(title)}
//             </div>
//             <div>
//               <div className="font-bold leading-tight flex items-center gap-2">
//                 {title}
//                 {active.type === "group" && entity?.isPrivate && (
//                   <FiLock className="w-4 h-4 text-muted-foreground" />
//                 )}
//               </div>
//               <div className="text-xs text-muted-foreground">
//                 {active.type === "group"
//                   ? `${entity?.members?.length || 0} a'zo${
//                       entity?.isPrivate ? " • Maxfiy guruh" : " • Ochiq guruh"
//                     }`
//                   : entity?.online
//                   ? "online"
//                   : "offline"}
//               </div>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             <button
//               className="rounded-full border border-border bg-card p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//               title="Qo'ng'iroq"
//               onClick={() => openModal("audio")}
//             >
//               <BsFillTelephoneOutboundFill className="w-4 h-4" />
//             </button>
//             <button
//               className="rounded-full border border-border bg-card p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//               title="Video"
//               onClick={() => openModal("video")}
//             >
//               <MdMissedVideoCall className="w-4 h-4" />
//             </button>
//             <button
//               className="rounded-full border border-border bg-card p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//               title="Ekran ulashish"
//               onClick={() => openModal("screen")}
//             >
//               <TbScreenShare className="w-4 h-4" />
//             </button>
//           </div>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {messages.map((m) => (
//             <div
//               key={m.id}
//               className={`flex items-end gap-2 max-w-[75%] ${
//                 m.senderId === currentUserId ? "ml-auto flex-row-reverse" : ""
//               }`}
//             >
//               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
//                 {getUserAvatar(m.senderId)}
//               </div>
//               <div
//                 className={`rounded-2xl px-4 py-2 max-w-full ${
//                   m.senderId === currentUserId
//                     ? "bg-primary text-primary-foreground rounded-br-md"
//                     : "bg-card text-card-foreground border border-border rounded-bl-md"
//                 }`}
//               >
//                 {active.type === "group" && m.senderId !== currentUserId && (
//                   <div className="text-xs font-medium text-primary mb-1">
//                     {getUserName(m.senderId)}
//                   </div>
//                 )}
//                 <div className="leading-relaxed break-words">{m.text}</div>
//                 <div
//                   className={`mt-1 text-[10px] opacity-70 ${
//                     m.senderId === currentUserId ? "text-right" : "text-left"
//                   }`}
//                 >
//                   {new Date(m.ts || Date.now()).toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//               </div>
//             </div>
//           ))}

//           {typingUsers.size > 0 && (
//             <div className="flex items-center gap-2 max-w-[75%]">
//               <div className="flex -space-x-1">
//                 {Array.from(typingUsers).map((userId) => (
//                   <div
//                     key={userId}
//                     className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center border-2 border-background"
//                   >
//                     {getUserAvatar(userId)}
//                   </div>
//                 ))}
//               </div>
//               <div className="bg-card border border-border rounded-2xl px-4 py-2 rounded-bl-md">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
//                   <div
//                     className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
//                     style={{ animationDelay: "0.1s" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
//                     style={{ animationDelay: "0.2s" }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Input bar */}
//         <div className="flex gap-2 border-t border-border p-3 bg-background">
//           <input
//             className="flex-1 rounded-full border border-border bg-input px-4 py-2 outline-none focus:ring-2 focus:ring-ring"
//             placeholder="Xabar yozish..."
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && send()}
//           />
//           <button
//             className="rounded-full bg-primary text-primary-foreground px-6 py-2 hover:bg-primary/90 transition-colors font-medium"
//             onClick={send}
//           >
//             Yuborish
//           </button>
//         </div>
//       </main>

//       {/* CALL / VIDEO / SCREEN MODAL */}
//       {modal && (
//         <div className="fixed inset-0 grid place-items-center bg-black/50 p-3">
//           <div className="w-[520px] max-w-[95vw] rounded-2xl border border-border bg-popover p-6 shadow-xl">
//             <div className="mb-4 font-bold text-lg">{modal.title}</div>
//             {modal.kind === "audio" && (
//               <div className="text-muted-foreground">
//                 Mikrofon yoqildi. (Demo)
//               </div>
//             )}
//             {(modal.kind === "video" || modal.kind === "screen") && (
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="w-full rounded-lg bg-muted"
//               />
//             )}
//             <div className="mt-4 flex justify-end gap-2">
//               <button
//                 className="rounded-lg border border-border bg-card px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//                 onClick={closeModal}
//               >
//                 Yopish
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* CREATE GROUP MODAL */}
//       {showCreate && (
//         <div className="fixed inset-0 grid place-items-center bg-black/50 p-3">
//           <div className="w-[520px] max-w-[95vw] rounded-2xl border border-border bg-popover p-6 shadow-xl">
//             <div className="mb-4 font-bold text-lg">Yangi guruh yaratish</div>
//             <input
//               className="w-full rounded-lg border border-border bg-input px-3 py-2 outline-none focus:ring-2 focus:ring-ring mb-4"
//               placeholder="Guruh nomi"
//               value={newGroupName}
//               onChange={(e) => setNewGroupName(e.target.value)}
//             />
//             <div className="mb-4 p-3 border border-border rounded-lg bg-card">
//               <div className="font-medium mb-2">Guruh turi</div>
//               <div className="space-y-2">
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="privacy"
//                     checked={!isPrivateGroup}
//                     onChange={() => setIsPrivateGroup(false)}
//                     className="accent-primary"
//                   />
//                   <FiUnlock className="w-4 h-4" />
//                   <div>
//                     <div className="font-medium">Ochiq guruh</div>
//                     <div className="text-xs text-muted-foreground">
//                       Hamma ko'ra oladi va qo'shila oladi
//                     </div>
//                   </div>
//                 </label>
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="privacy"
//                     checked={isPrivateGroup}
//                     onChange={() => setIsPrivateGroup(true)}
//                     className="accent-primary"
//                   />
//                   <FiLock className="w-4 h-4" />
//                   <div>
//                     <div className="font-medium">Maxfiy guruh</div>
//                     <div className="text-xs text-muted-foreground">
//                       Faqat a'zolar ko'ra oladi
//                     </div>
//                   </div>
//                 </label>
//               </div>
//             </div>
//             <div className="max-h-52 overflow-y-auto border border-border rounded-lg p-3 mb-4 bg-card">
//               {users.map((u) => (
//                 <label
//                   key={u.id}
//                   className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedMembers.includes(u.id)}
//                     onChange={(e) => {
//                       setSelectedMembers((prev) =>
//                         e.target.checked
//                           ? [...prev, u.id]
//                           : prev.filter((id) => id !== u.id)
//                       );
//                     }}
//                     className="accent-primary"
//                   />
//                   <div className="font-medium">{u.name}</div>
//                   <div
//                     className={`ml-auto h-2 w-2 rounded-full ${
//                       u.online ? "bg-green-500" : "bg-muted"
//                     }`}
//                   />
//                 </label>
//               ))}
//             </div>
//             <div className="flex justify-end gap-2">
//               <button
//                 className="rounded-lg border border-border bg-card px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
//                 onClick={() => setShowCreate(false)}
//               >
//                 Bekor qilish
//               </button>
//               <button
//                 className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors font-medium"
//                 onClick={handleCreateGroup}
//               >
//                 Yaratish
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
/////////////////////
"use client";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { MdOutlineGroupAdd } from "react-icons/md";
// import { FiLock, FiUnlock } from "react-icons/fi";
// import { cookies } from "../config/cookies";

// const initials = (s) =>
//   s
//     ?.split(" ")
//     .map((p) => p[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

// export default function Chat() {
//   const currentUserId = 1;
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [search, setSearch] = useState("");
//   const [active, setActive] = useState(null);
//   const [text, setText] = useState("");
//   const [showCreate, setShowCreate] = useState(false);
//   const [selectedMembers, setSelectedMembers] = useState([currentUserId]);

//   const dmRef = useRef({});
//   // useEffect(() => {
//   //   const token = cookies.get("access_token");
//   //   console.log("Token:", token);

//   //   fetch("http://5.133.122.226:8000/api/employee/", {
//   //     method: "GET",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //       Authorization: `Bearer ${token}`,
//   //     },
//   //   })
//   //     .then((res) => {
//   //       console.log(res.status); // statusni tekshiring
//   //       return res.json();
//   //     })
//   //     .then((data) => setUsers(data))
//   //     .catch((err) => console.error("Users fetch error:", err));
//   // }, []);
//   // useEffect(() => {
//   //   const token = cookies.get("access_token");
//   //   fetch("http://5.133.122.226:8000/api/chat/chat-rooms/", {
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //       Authorization: `Bearer ${token}`,
//   //     },
//   //   })
//   //     .then((res) => res.json())
//   //     .then((data) => {
//   //       setGroups(data);
//   //       if (data.length > 0) {
//   //         setActive({ type: "group", id: data[0].id });
//   //       }
//   //     })
//   //     .catch((err) => console.error("Rooms fetch error:", err));
//   // }, []);

//   useEffect(() => {
//     const token = cookies.get("access_token");
//     if (!token) return;
//     const controller = new AbortController();

//     // Fetch users
//     const fetchUsers = async () => {
//       try {
//         const res = await fetch("http://5.133.122.226:8000/api/employee/", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           signal: controller.signal,
//         });

//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

//         const data = await res.json();
//         setUsers(data);
//       } catch (err) {
//         if (err.name !== "AbortError") {
//           console.error("Users fetch error:", err);
//           // Consider setting an error state here
//         }
//       }
//     };

//     // Fetch chat rooms
//     const fetchChatRooms = async () => {
//       try {
//         const res = await fetch(
//           "http://5.133.122.226:8000/api/chat/chat-rooms/",
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             signal: controller.signal,
//           }
//         );

//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

//         const data = await res.json();
//         setGroups(data);
//         if (data.length > 0) {
//           setActive({ type: "group", id: data[0].id });
//         }
//       } catch (err) {
//         if (err.name !== "AbortError") {
//           console.error("Rooms fetch error:", err);
//           // Consider setting an error state here
//         }
//       }
//     };

//     fetchUsers();
//     fetchChatRooms();

//     return () => controller.abort();
//   }, []);

//   // Xabar yuborish (hozircha local state ichida)
//   const send = () => {
//     const t = text.trim();
//     if (!t || !active) return;
//     const msg = {
//       id: Math.random().toString(36).slice(2),
//       senderId: currentUserId,
//       text: t,
//       ts: Date.now(),
//     };
//     if (active.type === "group") {
//       setGroups((gs) =>
//         gs.map((g) =>
//           g.id === active.id
//             ? { ...g, messages: [...(g.messages || []), msg] }
//             : g
//         )
//       );
//     } else {
//       dmRef.current[active.id] = [...(dmRef.current[active.id] || []), msg];
//       setUsers((u) => [...u]);
//     }
//     setText("");
//   };
//   const handleCreateGroup = async () => {
//     if (selectedMembers.length < 2) return alert("Kamida 2 a'zo kerak");

//     try {
//       const res = await fetch(
//         "http://5.133.122.226:8000/api/chat/chat-rooms/create_room/",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ participant_ids: selectedMembers }),
//         }
//       );
//       if (!res.ok) throw new Error("Room yaratishda xatolik");
//       const newRoom = await res.json();

//       setGroups((prev) => [newRoom, ...prev]);
//       setActive({ type: "group", id: newRoom.id });
//       setShowCreate(false);
//       setSelectedMembers([currentUserId]);
//     } catch (err) {
//       console.error("Create room error:", err);
//     }
//   };

//   const filteredUsers = useMemo(
//     () =>
//       users.filter((u) => u.fio?.toLowerCase().includes(search.toLowerCase())),
//     [users, search]
//   );
//   const filteredGroups = useMemo(
//     () =>
//       groups.filter((g) => g.fio?.toLowerCase().includes(search.toLowerCase())),
//     [groups, search]
//   );

//   const entity =
//     active?.type === "group"
//       ? groups.find((g) => g.id === active.id)
//       : users.find((u) => u.id === active.id);

//   const messages =
//     active?.type === "group"
//       ? groups.find((g) => g.id === active.id)?.messages || []
//       : dmRef.current[active?.id] || [];

//   return (
//     <div className="flex h-[90vh] bg-background text-foreground">
//       {/* LEFT */}
//       <aside className="w-80 border-r bg-sidebar flex flex-col">
//         <div className="flex gap-2 p-2 border-b">
//           <input
//             className="flex-1 rounded-xl border px-3 py-2 outline-none"
//             placeholder="Qidirish"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <button
//             className="rounded-xl border px-3 py-2"
//             onClick={() => setShowCreate(true)}
//           >
//             <MdOutlineGroupAdd />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-2">
//           <div className="text-xs text-muted-foreground my-1">GURUHLAR</div>
//           {filteredGroups.map((g) => (
//             <div
//               key={g.id}
//               onClick={() => setActive({ type: "group", id: g.id })}
//               className={`mb-1 cursor-pointer rounded-lg p-2 ${
//                 active?.type === "group" && active?.id === g.id
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-card"
//               }`}
//             >
//               <div className="font-semibold flex items-center gap-2">
//                 {g.fio}
//                 {g.is_private ? (
//                   <FiLock className="w-3 h-3 text-muted-foreground" />
//                 ) : (
//                   <FiUnlock className="w-3 h-3 text-muted-foreground" />
//                 )}
//               </div>
//             </div>
//           ))}

//           <div className="text-xs text-muted-foreground mt-2 mb-1">
//             FOYDALANUVCHILAR
//           </div>
//           {filteredUsers.map((u) => (
//             <div
//               key={u.id}
//               onClick={() => setActive({ type: "dm", id: u.id })}
//               className={`mb-1 cursor-pointer rounded-lg p-2 ${
//                 active?.type === "dm" && active?.id === u.id
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-card"
//               }`}
//             >
//               <div className="font-semibold">{u.fio}</div>
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* RIGHT */}
//       <main className="flex flex-1 flex-col">
//         <div className="h-16 border-b px-3 flex items-center justify-between bg-background">
//           <div className="flex items-center gap-3">
//             <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
//               {initials(entity?.fio || "Chat")}
//             </div>
//             <div>
//               <div className="font-bold">{entity?.fio || "Chat"}</div>
//             </div>
//           </div>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {messages.map((m) => (
//             <div
//               key={m.id}
//               className={`flex items-end gap-2 max-w-[75%] ${
//                 m.senderId === currentUserId ? "ml-auto flex-row-reverse" : ""
//               }`}
//             >
//               <div
//                 className={`rounded-2xl px-4 py-2 ${
//                   m.senderId === currentUserId
//                     ? "bg-primary text-primary-foreground"
//                     : "bg-card text-card-foreground border"
//                 }`}
//               >
//                 {m.text}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Input */}
//         {active && (
//           <div className="flex gap-2 border-t p-3 bg-background">
//             <input
//               className="flex-1 rounded-full border px-4 py-2 outline-none"
//               placeholder="Xabar yozish..."
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && send()}
//             />
//             <button
//               className="rounded-full bg-primary text-primary-foreground px-6 py-2"
//               onClick={send}
//             >
//               Yuborish
//             </button>
//           </div>
//         )}
//       </main>

//       {/* CREATE ROOM MODAL */}
//       {showCreate && (
//         <div className="fixed inset-0 grid place-items-center bg-black/50 p-3">
//           <div className="w-[520px] max-w-[95vw] rounded-2xl border bg-popover p-6 shadow-xl">
//             <div className="mb-4 font-bold text-lg">Yangi chat yaratish</div>
//             <div className="max-h-52 overflow-y-auto border rounded-lg p-3 mb-4 bg-card">
//               {users.map((u) => (
//                 <label
//                   key={u.id}
//                   className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedMembers.includes(u.id)}
//                     onChange={(e) => {
//                       setSelectedMembers((prev) =>
//                         e.target.checked
//                           ? [...prev, u.id]
//                           : prev.filter((id) => id !== u.id)
//                       );
//                     }}
//                   />
//                   <div className="font-medium">{u.fio}</div>
//                 </label>
//               ))}
//             </div>
//             <div className="flex justify-end gap-2">
//               <button
//                 className="rounded-lg border px-4 py-2"
//                 onClick={() => setShowCreate(false)}
//               >
//                 Bekor qilish
//               </button>
//               <button
//                 className="rounded-lg bg-primary text-primary-foreground px-4 py-2"
//                 onClick={handleCreateGroup}
//               >
//                 Yaratish
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { MdOutlineGroupAdd } from "react-icons/md";
// import { FiLock, FiUnlock } from "react-icons/fi";
// import { cookies } from "../config/cookies";
// import { toast } from "react-toastify";

// const initials = (s) =>
//   s
//     ?.split(" ")
//     .map((p) => p[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

// export default function Chat() {
//   const currentUserId = 1;
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [search, setSearch] = useState("");
//   const [active, setActive] = useState(null);
//   const [text, setText] = useState("");
//   const [showCreate, setShowCreate] = useState(false);
//   const [selectedMembers, setSelectedMembers] = useState([currentUserId]);
//   const [loading, setLoading] = useState({
//     users: false,
//     groups: false,
//     creating: false,
//   });
//   const [error, setError] = useState(null);

//   const dmRef = useRef({});
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, []);

//   // Fetch data on component mount
//   useEffect(() => {
//     const fetchData = async () => {
//       const manualToken =
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODYxNzI1LCJpYXQiOjE3NTU0Mjk3MjUsImp0aSI6ImY5YWQ4ODIyMmNjNzQyZTg5OWIxZmNjODgyM2E3MGE1IiwidXNlcl9pZCI6IjcifQ.5xdLpdvdLwIki_xHtLyC1AAqrJtXzmkx60bR6bO0ET0";
//       const token = manualToken.get("access_token");
//       if (!token) {
//         setError("Authentication token not found");
//         return;
//       }

//       try {
//         setLoading((prev) => ({ ...prev, users: true, groups: true }));
//         const [usersRes, groupsRes] = await Promise.all([
//           fetch("http://5.133.122.226:8000/api/employee/", {
//             method: "GET",
//             credentials: "include",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }),
//           fetch("http://5.133.122.226:8000/api/chat/chat-rooms/", {
//             method: "GET",
//             credentials: "include",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }),
//         ]);

//         if (!usersRes.ok) throw new Error("Failed to fetch users");
//         if (!groupsRes.ok) throw new Error("Failed to fetch groups");

//         const usersData = await usersRes.json();
//         const groupsData = await groupsRes.json();

//         setUsers(usersData);
//         setGroups(groupsData);

//         // Set first group as active if available
//         if (groupsData.length > 0) {
//           setActive({ type: "group", id: groupsData[0].id });
//         }
//       } catch (err) {
//         setError(err.message);
//         toast.error(`Failed to load data: ${err.message}`);
//       } finally {
//         setLoading((prev) => ({ ...prev, users: false, groups: false }));
//       }
//     };

//     fetchData();
//   }, []);

//   // Send message handler
//   const send = async () => {
//     const t = text.trim();
//     if (!t || !active) return;

//     const manualToken =
//       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODYxNzI1LCJpYXQiOjE3NTU0Mjk3MjUsImp0aSI6ImY5YWQ4ODIyMmNjNzQyZTg5OWIxZmNjODgyM2E3MGE1IiwidXNlcl9pZCI6IjcifQ.5xdLpdvdLwIki_xHtLyC1AAqrJtXzmkx60bR6bO0ET0";
//     const token = manualToken.get("access_token");
//     try {
//       const token = manualToken.get("access_token");
//       if (!token) throw new Error("Authentication token not found");

//       // Optimistic UI update
//       const tempId = Date.now().toString();
//       const newMsg = {
//         id: tempId,
//         senderId: currentUserId,
//         text: t,
//         ts: Date.now(),
//       };

//       if (active.type === "group") {
//         setGroups((prev) =>
//           prev.map((g) =>
//             g.id === active.id
//               ? { ...g, messages: [...(g.messages || []), newMsg] }
//               : g
//           )
//         );
//       } else {
//         dmRef.current[active.id] = [
//           ...(dmRef.current[active.id] || []),
//           newMsg,
//         ];
//         setUsers((prev) => [...prev]);
//       }

//       setText("");

//       // Actual API call
//       // const res = await fetch("http://5.133.122.226:8000/api/chat/messages/", {
//       //   method: "POST",
//       //   headers: {
//       //     "Content-Type": "application/json",
//       //     Authorization: `Bearer ${token}`,
//       //   },
//       //   body: JSON.stringify({
//       //     room_id: active.id,
//       //     content: t,
//       //   }),
//       // });

//       if (!res.ok) throw new Error("Failed to send message");

//       const responseData = await res.json();

//       // Replace temp message with actual message from server
//       if (active.type === "group") {
//         setGroups((prev) =>
//           prev.map((g) =>
//             g.id === active.id
//               ? {
//                   ...g,
//                   messages: g.messages.map((m) =>
//                     m.id === tempId ? responseData : m
//                   ),
//                 }
//               : g
//           )
//         );
//       } else {
//         dmRef.current[active.id] = (dmRef.current[active.id] || []).map((m) =>
//           m.id === tempId ? responseData : m
//         );
//         setUsers((prev) => [...prev]);
//       }
//     } catch (err) {
//       toast.error(`Failed to send message: ${err.message}`);
//       // Revert optimistic update
//       if (active.type === "group") {
//         setGroups((prev) =>
//           prev.map((g) =>
//             g.id === active.id
//               ? {
//                   ...g,
//                   messages: g.messages.filter((m) => m.id !== tempId),
//                 }
//               : g
//           )
//         );
//       } else {
//         dmRef.current[active.id] = (dmRef.current[active.id] || []).filter(
//           (m) => m.id !== tempId
//         );
//         setUsers((prev) => [...prev]);
//       }
//     }
//   };

//   // Create group handler
//   const handleCreateGroup = async () => {
//     if (selectedMembers.length < 2) {
//       toast.warning("Please select at least 2 members");
//       return;
//     }

//     try {
//       setLoading((prev) => ({ ...prev, creating: true }));
//       const manualToken =
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODYxNzI1LCJpYXQiOjE3NTU0Mjk3MjUsImp0aSI6ImY5YWQ4ODIyMmNjNzQyZTg5OWIxZmNjODgyM2E3MGE1IiwidXNlcl9pZCI6IjcifQ.5xdLpdvdLwIki_xHtLyC1AAqrJtXzmkx60bR6bO0ET0";
//       const token = manualToken.get("access_token");

//       if (!token) throw new Error("Authentication token not found");

//       const res = await fetch(
//         "http://5.133.122.226:8000/api/chat/chat-rooms/create_room/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ participant_ids: selectedMembers }),
//         }
//       );

//       if (!res.ok) throw new Error("Failed to create room");

//       const newRoom = await res.json();

//       setGroups((prev) => [newRoom, ...prev]);
//       setActive({ type: "group", id: newRoom.id });
//       setShowCreate(false);
//       setSelectedMembers([currentUserId]);

//       toast.success("Chat room created successfully");
//     } catch (err) {
//       toast.error(`Failed to create room: ${err.message}`);
//     } finally {
//       setLoading((prev) => ({ ...prev, creating: false }));
//     }
//   };

//   // Filter users and groups based on search
//   const filteredUsers = useMemo(
//     () =>
//       users.filter((u) => u.fio?.toLowerCase().includes(search.toLowerCase())),
//     [users, search]
//   );

//   const filteredGroups = useMemo(
//     () =>
//       groups.filter((g) => g.fio?.toLowerCase().includes(search.toLowerCase())),
//     [groups, search]
//   );

//   // Get current active entity and messages
//   const entity =
//     active?.type === "group"
//       ? groups.find((g) => g.id === active.id)
//       : users.find((u) => u.id === active.id);

//   const messages =
//     active?.type === "group"
//       ? groups.find((g) => g.id === active.id)?.messages || []
//       : dmRef.current[active?.id] || [];

//   return (
//     <div className="flex h-[90vh] bg-background text-foreground">
//       {/* Sidebar */}
//       <aside className="w-80 border-r bg-sidebar flex flex-col">
//         <div className="flex gap-2 p-2 border-b">
//           <input
//             className="flex-1 rounded-xl border px-3 py-2 outline-none"
//             placeholder="Search..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <button
//             className="rounded-xl border px-3 py-2 hover:bg-gray-100 transition-colors"
//             onClick={() => setShowCreate(true)}
//             disabled={loading.users}
//           >
//             <MdOutlineGroupAdd />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-2">
//           {loading.groups || loading.users ? (
//             <div className="flex justify-center items-center h-full">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
//             </div>
//           ) : error ? (
//             <div className="text-red-500 p-2">{error}</div>
//           ) : (
//             <>
//               <div className="text-xs text-muted-foreground my-1">GROUPS</div>
//               {filteredGroups.map((g) => (
//                 <div
//                   key={g.id}
//                   onClick={() => setActive({ type: "group", id: g.id })}
//                   className={`mb-1 cursor-pointer rounded-lg p-2 ${
//                     active?.type === "group" && active?.id === g.id
//                       ? "bg-primary text-primary-foreground"
//                       : "hover:bg-card"
//                   }`}
//                 >
//                   <div className="font-semibold flex items-center gap-2">
//                     {g.fio}
//                     {g.is_private ? (
//                       <FiLock className="w-3 h-3 text-muted-foreground" />
//                     ) : (
//                       <FiUnlock className="w-3 h-3 text-muted-foreground" />
//                     )}
//                   </div>
//                 </div>
//               ))}

//               <div className="text-xs text-muted-foreground mt-2 mb-1">
//                 USERS
//               </div>
//               {filteredUsers.map((u) => (
//                 <div
//                   key={u.id}
//                   onClick={() => setActive({ type: "dm", id: u.id })}
//                   className={`mb-1 cursor-pointer rounded-lg p-2 ${
//                     active?.type === "dm" && active?.id === u.id
//                       ? "bg-primary text-primary-foreground"
//                       : "hover:bg-card"
//                   }`}
//                 >
//                   <div className="font-semibold">{u.fio}</div>
//                 </div>
//               ))}
//             </>
//           )}
//         </div>
//       </aside>

//       {/* Main Chat Area */}
//       <main className="flex flex-1 flex-col">
//         {!active ? (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-center">
//               <h3 className="text-xl font-medium">No chat selected</h3>
//               <p className="text-muted-foreground">
//                 Select a chat or create a new one
//               </p>
//             </div>
//           </div>
//         ) : (
//           <>
//             {/* Chat Header */}
//             <div className="h-16 border-b px-3 flex items-center justify-between bg-background">
//               <div className="flex items-center gap-3">
//                 <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
//                   {initials(entity?.fio || "Chat")}
//                 </div>
//                 <div>
//                   <div className="font-bold">{entity?.fio || "Chat"}</div>
//                   <div className="text-xs text-muted-foreground">
//                     {active.type === "group"
//                       ? `${entity?.participants?.length || 0} members`
//                       : "Direct message"}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-3">
//               {messages.length === 0 ? (
//                 <div className="flex items-center justify-center h-full">
//                   <p className="text-muted-foreground">
//                     No messages yet. Start the conversation!
//                   </p>
//                 </div>
//               ) : (
//                 messages.map((m) => (
//                   <div
//                     key={m.id}
//                     className={`flex items-end gap-2 max-w-[75%] ${
//                       m.senderId === currentUserId
//                         ? "ml-auto flex-row-reverse"
//                         : ""
//                     }`}
//                   >
//                     {m.senderId !== currentUserId && (
//                       <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
//                         {initials(users.find((u) => u.id === m.senderId)?.fio)}
//                       </div>
//                     )}
//                     <div
//                       className={`rounded-2xl px-4 py-2 ${
//                         m.senderId === currentUserId
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-card text-card-foreground border"
//                       }`}
//                     >
//                       {m.text}
//                       <div
//                         className={`text-xs mt-1 ${
//                           m.senderId === currentUserId
//                             ? "text-primary-foreground/70"
//                             : "text-muted-foreground"
//                         }`}
//                       >
//                         {new Date(m.ts).toLocaleTimeString([], {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Message Input */}
//             <div className="flex gap-2 border-t p-3 bg-background">
//               <input
//                 className="flex-1 rounded-full border px-4 py-2 outline-none"
//                 placeholder="Type a message..."
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && send()}
//               />
//               <button
//                 className="rounded-full bg-primary text-primary-foreground px-6 py-2 hover:bg-primary/90 transition-colors"
//                 onClick={send}
//                 disabled={!text.trim()}
//               >
//                 Send
//               </button>
//             </div>
//           </>
//         )}
//       </main>

//       {/* Create Room Modal */}
//       {showCreate && (
//         <div className="fixed inset-0 grid place-items-center bg-black/50 p-3 z-50">
//           <div className="w-[520px] max-w-[95vw] rounded-2xl border bg-popover p-6 shadow-xl">
//             <div className="mb-4 font-bold text-lg">Create New Chat</div>

//             <div className="max-h-52 overflow-y-auto border rounded-lg p-3 mb-4 bg-card">
//               {loading.users ? (
//                 <div className="flex justify-center items-center h-20">
//                   <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
//                 </div>
//               ) : (
//                 users.map((u) => (
//                   <label
//                     key={u.id}
//                     className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.includes(u.id)}
//                       onChange={(e) => {
//                         setSelectedMembers((prev) =>
//                           e.target.checked
//                             ? [...prev, u.id]
//                             : prev.filter((id) => id !== u.id)
//                         );
//                       }}
//                       className="accent-primary"
//                     />
//                     <div className="font-medium">{u.fio}</div>
//                   </label>
//                 ))
//               )}
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 className="rounded-lg border px-4 py-2 hover:bg-gray-100 transition-colors"
//                 onClick={() => setShowCreate(false)}
//                 disabled={loading.creating}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors"
//                 onClick={handleCreateGroup}
//                 disabled={loading.creating}
//               >
//                 {loading.creating ? (
//                   <span className="flex items-center gap-2">
//                     <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
//                     Creating...
//                   </span>
//                 ) : (
//                   "Create"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

////////////////////

// "use client";
// import { useEffect, useMemo, useState } from "react";
// const EMPLOYEES_URL = "http://5.133.122.226:8000/api/employee/";
// const ROOMS_URL = "http://5.133.122.226:8000/api/chat/chat-rooms/";

// function getAuthToken() {
//   // Qo‘lda yozib beriladigan token
//   const manualToken =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODYxNzI1LCJpYXQiOjE3NTU0Mjk3MjUsImp0aSI6ImY5YWQ4ODIyMmNjNzQyZTg5OWIxZmNjODgyM2E3MGE1IiwidXNlcl9pZCI6IjcifQ.5xdLpdvdLwIki_xHtLyC1AAqrJtXzmkx60bR6bO0ET0";

//   if (manualToken) return manualToken;

//   if (typeof window === "undefined") return null;

//   const lsToken =
//     localStorage.getItem("token") ||
//     localStorage.getItem("access") ||
//     localStorage.getItem("access_token");

//   if (lsToken) return lsToken;

//   const cookieStr = typeof document !== "undefined" ? document.cookie : "";
//   const match = cookieStr.match(
//     /(?:^|;\s*)(token|access|access_token)=([^;]+)/
//   );
//   return match ? decodeURIComponent(match[2]) : null;
// }

// function authHeaders() {
//   const token = getAuthToken();
//   return token ? { Authorization: `Bearer ${token}` } : {};
// }

// function Avatar({ fio, image }) {
//   const initials = useMemo(() => {
//     if (!fio) return "?";
//     return fio
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((p) => p[0]?.toUpperCase())
//       .join("");
//   }, [fio]);

//   if (image) {
//     return (
//       <img
//         src={image}
//         alt={fio || "user"}
//         className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
//       />
//     );
//   }
//   return (
//     <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center text-sm font-semibold">
//       {initials || "?"}
//     </div>
//   );
// }

// function Badge({ children, onRemove }) {
//   return (
//     <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
//       {children}
//       {onRemove && (
//         <button
//           onClick={onRemove}
//           className="ml-1 rounded-full px-1 hover:bg-gray-100"
//           title="Remove"
//           type="button"
//         >
//           ×
//         </button>
//       )}
//     </span>
//   );
// }

// export default function ChatPage() {
//   const [employees, setEmployees] = useState([]);
//   const [loadingEmployees, setLoadingEmployees] = useState(false);
//   const [rooms, setRooms] = useState([]);
//   const [loadingRooms, setLoadingRooms] = useState(false);
//   const [error, setError] = useState("");

//   const [query, setQuery] = useState("");
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [roomName, setRoomName] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");

//   // Fetch employees
//   const fetchEmployees = async () => {
//     setLoadingEmployees(true);
//     setError("");
//     try {
//       const res = await fetch(EMPLOYEES_URL, { headers: { ...authHeaders() } });
//       if (!res.ok) throw new Error(`Employees fetch failed: ${res.status}`);
//       const data = await res.json();
//       setEmployees(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoadingEmployees(false);
//     }
//   };

//   // Fetch rooms
//   const fetchRooms = async () => {
//     setLoadingRooms(true);
//     try {
//       const res = await fetch(ROOMS_URL, { headers: { ...authHeaders() } });
//       if (!res.ok) throw new Error(`Rooms fetch failed: ${res.status}`);
//       const data = await res.json();
//       setRooms(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError((prev) => prev || e.message);
//     } finally {
//       setLoadingRooms(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//     fetchRooms();
//   }, []);

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return employees;
//     return employees.filter((u) => {
//       const parts = [u.fio, u.username, u.phone, u.email, u.inn, u.address]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();
//       return parts.includes(q);
//     });
//   }, [employees, query]);

//   const toggleSelect = (id) => {
//     setSelectedIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   };

//   const selectAllVisible = () => {
//     const ids = filtered.map((u) => u.id);
//     setSelectedIds(ids);
//   };

//   const clearSelection = () => setSelectedIds([]);

//   const createRoom = async () => {
//     setSuccessMsg("");
//     setError("");
//     if (!roomName.trim()) {
//       setError("Guruh nomini kiriting.");
//       return;
//     }
//     if (selectedIds.length === 0) {
//       setError("Kamida bitta ishtirokchi tanlang.");
//       return;
//     }
//     setCreating(true);
//     try {
//       const res = await fetch(ROOMS_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...authHeaders(),
//         },
//         body: JSON.stringify({
//           name: roomName.trim(),
//           participants: selectedIds,
//         }),
//       });
//       if (!res.ok) {
//         const t = await res.text();
//         throw new Error(`Create failed: ${res.status} ${t}`);
//       }
//       setSuccessMsg("Chat guruhi yaratildi.");
//       setRoomName("");
//       setSelectedIds([]);
//       fetchRooms();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-gray-50">
//       {/* Top Bar */}
//       <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
//         <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
//           <div className="text-xl font-semibold">Chat Panel</div>
//           <div className="ml-auto flex items-center gap-2">
//             <button
//               onClick={fetchEmployees}
//               className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
//               type="button"
//             >
//               Userlarni yangilash
//             </button>
//             <button
//               onClick={fetchRooms}
//               className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
//               type="button"
//             >
//               Xonalarni yangilash
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Alerts */}
//       <div className="mx-auto max-w-7xl px-4 pt-4 space-y-2">
//         {error && (
//           <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}
//         {successMsg && (
//           <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
//             {successMsg}
//           </div>
//         )}
//       </div>

//       {/* Main Grid */}
//       <main className="mx-auto max-w-7xl px-4 py-4 grid gap-4 md:grid-cols-3">
//         {/* Users List */}
//         <section className="rounded-2xl border bg-white shadow-sm">
//           <div className="flex items-center gap-2 border-b p-3">
//             <input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Qidirish (FIO, username, tel, email...)"
//               className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring"
//             />
//           </div>

//           <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-600">
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={selectAllVisible}
//                 className="rounded-lg border px-2 py-1 hover:bg-gray-50"
//                 type="button"
//               >
//                 Hammasini tanlash
//               </button>
//               <button
//                 onClick={clearSelection}
//                 className="rounded-lg border px-2 py-1 hover:bg-gray-50"
//                 type="button"
//               >
//                 Tozalash
//               </button>
//             </div>
//             <div>{selectedIds.length} ta tanlandi</div>
//           </div>

//           <div className="max-h-[60vh] overflow-y-auto p-2">
//             {loadingEmployees ? (
//               <div className="p-4 text-sm text-gray-500">Yuklanmoqda...</div>
//             ) : filtered.length === 0 ? (
//               <div className="p-4 text-sm text-gray-500">User topilmadi.</div>
//             ) : (
//               <ul className="space-y-2">
//                 {filtered.map((u) => (
//                   <li
//                     key={u.id}
//                     className={`flex items-center gap-3 rounded-xl border p-2 transition ${
//                       selectedIds.includes(u.id)
//                         ? "border-blue-300 bg-blue-50"
//                         : "hover:bg-gray-50"
//                     }`}
//                   >
//                     <label className="flex w-full cursor-pointer items-center gap-3">
//                       <input
//                         type="checkbox"
//                         checked={selectedIds.includes(u.id)}
//                         onChange={() => toggleSelect(u.id)}
//                         className="h-4 w-4 rounded border-gray-300"
//                       />
//                       <Avatar fio={u.fio} image={u.image} />
//                       <div className="min-w-0">
//                         <div className="truncate font-medium">
//                           {u.fio || "No name"}
//                         </div>
//                         <div className="truncate text-xs text-gray-500">
//                           @{u.username || "username-yo'q"}
//                         </div>
//                       </div>
//                       <div className="ml-auto text-xs text-gray-500">
//                         {u.phone || "tel yo'q"}
//                       </div>
//                     </label>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </section>

//         {/* Create Group */}
//         <section className="rounded-2xl border bg-white p-4 shadow-sm">
//           <h2 className="mb-3 text-lg font-semibold">Yangi guruh yaratish</h2>
//           <div className="space-y-3">
//             <input
//               value={roomName}
//               onChange={(e) => setRoomName(e.target.value)}
//               placeholder="Guruh nomi"
//               className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring"
//             />

//             <div>
//               <div className="mb-1 text-sm text-gray-600">
//                 Tanlangan ishtirokchilar
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {selectedIds.length === 0 && (
//                   <span className="text-xs text-gray-400">
//                     Hech kim tanlanmagan
//                   </span>
//                 )}
//                 {selectedIds.map((id) => {
//                   const u = employees.find((x) => x.id === id);
//                   return (
//                     <Badge key={id} onRemove={() => toggleSelect(id)}>
//                       {u?.fio || `ID ${id}`}
//                     </Badge>
//                   );
//                 })}
//               </div>
//             </div>

//             <button
//               onClick={createRoom}
//               disabled={creating}
//               className="w-full rounded-xl bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
//               type="button"
//             >
//               {creating ? "Yaratilmoqda..." : "Guruhni yaratish"}
//             </button>

//             <p className="text-xs text-gray-500">
//               * So'rov JSON: {"{ name, participants: number[] }"}
//             </p>
//           </div>
//         </section>

//         {/* Rooms List */}
//         <section className="rounded-2xl border bg-white shadow-sm">
//           <div className="flex items-center justify-between border-b p-3">
//             <h2 className="text-lg font-semibold">Chat xonalari</h2>
//             <button
//               onClick={fetchRooms}
//               className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
//               type="button"
//             >
//               Yangilash
//             </button>
//           </div>

//           <div className="max-h-[70vh] overflow-y-auto p-3">
//             {loadingRooms ? (
//               <div className="p-2 text-sm text-gray-500">Yuklanmoqda...</div>
//             ) : rooms.length === 0 ? (
//               <div className="p-2 text-sm text-gray-500">
//                 Hozircha xona yo'q.
//               </div>
//             ) : (
//               <ul className="space-y-2">
//                 {rooms.map((r) => (
//                   <li
//                     key={r.id}
//                     className="rounded-xl border p-3 hover:bg-gray-50"
//                   >
//                     <div className="flex items-start gap-2">
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2">
//                           <div className="truncate font-medium">
//                             {r.name || `Xona #${r.id}`}
//                           </div>
//                           {Array.isArray(r.participants) && (
//                             <span className="text-xs text-gray-500">
//                               {r.participants.length} kishi
//                             </span>
//                           )}
//                         </div>
//                         {r.created_at && (
//                           <div className="text-xs text-gray-400">
//                             {new Date(r.created_at).toLocaleString()}
//                           </div>
//                         )}
//                       </div>
//                       {/* Future: open room / messages */}
//                       <button
//                         className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-100"
//                         type="button"
//                         onClick={() =>
//                           alert("Xona ochish/muloqot UI keyincha qo'shiladi")
//                         }
//                       >
//                         Kirish
//                       </button>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </section>
//       </main>

//       <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-gray-400">
//         Tailwind-only UI • API: /api/employee, /api/chat/chat-rooms
//       </footer>
//     </div>
//   );
// }

/**
 * buyer edi
 * 
 *   // const token = getAuthToken();
   // const [users, setUsers] = useState([]);
   // const [groups, setGroups] = useState([]);
   // const [active, setActive] = useState(null);
   // const [messages, setMessages] = useState([]);
   // const [search, setSearch] = useState("");
   // const [typing, setTyping] = useState(false);
   // const [newMessage, setNewMessage] = useState("");
 
   // // Group create modal
   // const [showCreateGroup, setShowCreateGroup] = useState(false);
   // const [newGroupName, setNewGroupName] = useState("");
   // const [newDescription, setNewDescription] = useState("");
   // const [selectedMembers, setSelectedMembers] = useState([]);
   // const [groupPrivate, setGroupPrivate] = useState(true);
 
   // const messagesEndRef = useRef();
 
   // // API: Users olish
   // useEffect(() => {
   //   if (!token) return;
   //   fetch("http://5.133.122.226:8000/api/employee/", {
   //     headers: { Authorization: `Bearer ${token}` },
   //   })
   //     .then((res) => res.json())
   //     .then(setUsers)
   //     .catch((e) => console.error(e));
   // }, [token]);
 
   // // API: Chat rooms olish
   // useEffect(() => {
   //   if (!token) return;
   //   fetch("http://5.133.122.226:8000/api/chat/chat-rooms/", {
   //     headers: { Authorization: `Bearer ${token}` },
   //   })
   //     .then((res) => res.json())
   //     .then(setGroups)
   //     .catch((e) => console.error(e));
   // }, [token]);
 
   // // Auto scroll
   // useEffect(() => {
   //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   // }, [messages]);
 
   // // Search filter
   // const filteredUsers = useMemo(
   //   () =>
   //     users.filter((u) =>
   //       (u.fio || u.username || u.first_name || "")
   //         .toLowerCase()
   //         .includes(search.toLowerCase())
   //     ),
   //   [users, search]
   // );
 
   // const filteredGroups = useMemo(
   //   () =>
   //     groups.filter((g) =>
   //       (g.name || "").toLowerCase().includes(search.toLowerCase())
   //     ),
   //   [groups, search]
   // );
 
   // // Active chat tanlash
   // const openChat = (obj, type) => {
   //   setActive({ ...obj, type });
   //   setMessages(obj.messages || []);
   // };
 
   // // Message yuborish
   // const sendMessage = () => {
   //   if (!newMessage.trim()) return;
   //   const msg = { sender: "me", text: newMessage, time: "now" };
   //   setMessages((prev) => [...prev, msg]);
   //   setNewMessage("");
   //   setTyping(true);
   //   setTimeout(() => setTyping(false), 1000);
   // };
 
   // // Group yaratish
   // const createGroup = async () => {
   //   if (!newGroupName || selectedMembers.length === 0) {
   //     toast.error("Guruh nomi va ishtirokchilarni tanlang!");
   //     return;
   //   }
 
   //   try {
   //     // const res = await fetch(
   //     //   "http://5.133.122.226:8000/api/chat/chat-rooms/create_room/",
   //     //   {
   //     //     method: "POST",
   //     //     headers: {
   //     //       "Content-Type": "application/json",
   //     //       Authorization: `Bearer ${token}`,
   //     //     },
   //     //     body: JSON.stringify({
   //     //       name: newGroupName,
   //     //       is_private: groupPrivate,
   //     //       participant_ids: selectedMembers,
   //     //     }),
   //     //   }
   //     // );
 
   //     const res = await fetch(
   //       "http://5.133.122.226:8000/api/chat/groups/create_group/",
   //       {
   //         method: "POST",
   //         headers: {
   //           "Content-Type": "application/json",
   //           Authorization: `Bearer ${token}`,
   //         },
   //         body: JSON.stringify({
   //           name: newGroupName,
   //           description: newDescription,
   //           is_public: groupPrivate,
   //           member_ids: selectedMembers,
   //         }),
   //       }
   //     );
 
   //     // const data = await res.json();
   //     // console.log("Server javobi:", data);
 
   //     const data = await res.json();
 
   //     if (!res.ok) {
   //       console.error("Serverdan qaytgan xato:", data);
   //       toast.error(data?.detail || JSON.stringify(data));
   //       return;
   //     }
 
   //     setGroups((prev) => [...prev, data]);
   //     setShowCreateGroup(false);
   //     setNewGroupName("");
   //     setNewDescription("");
   //     setSelectedMembers([]);
   //     toast.success("Guruh yaratildi!");
   //   } catch (err) {
   //     console.error("Kutilmagan xato:", err);
   //     toast.error("Guruh yaratishda xatolik");
   //   }
   // };
 */

/**
    * 2 bu yerda 
    *  // Active chat tanlash va socket ulash
  // const openChat = (obj, type) => {
  //   setActive({ ...obj, type });
  //   setMessages(obj.messages || []);

  //   // WebSocket ulash
  //   if (socketRef.current) {
  //     socketRef.current.close();
  //   }

  //   const socket = new WebSocket(
  //     `ws://5.133.122.226:8000/ws/chat/group/${groupId}/?token=${token}`
  //   );

  //   socket.onmessage = (event) => {
  //     const data = JSON.parse(event.data);

  //     if (data.type === "chat_message") {
  //       setMessages((prev) => [...prev, data.message]);
  //     } else if (data.type === "typing_indicator") {
  //       setTyping(data.is_typing);
  //     }
  //   };

  //   socket.onclose = () => {
  //     console.log("Socket yopildi");
  //   };

  //   socketRef.current = socket;
  // };
    */

// * 3 bu yerda   // <div className="flex h-[90vh]">
//   {/* Sidebar */}
//   <div className="w-1/4 bg-gray-100 border-r p-3 flex flex-col">
//     <input
//       className="border rounded p-2 mb-3"
//       placeholder="Search"
//       value={search}
//       onChange={(e) => setSearch(e.target.value)}
//     />
//     <h3 className="font-bold mb-2">Users</h3>
//     <div className="flex-1 overflow-y-auto">
//       {filteredUsers.map((u) => (
//         <div
//           key={u.id}
//           onClick={() => openChat(u, "user")}
//           className={`p-2 flex items-center gap-2 rounded cursor-pointer ${
//             active?.id === u.id ? "bg-blue-200" : "hover:bg-gray-200"
//           }`}
//         >
//           <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">
//             {initials(u.fio || u.username || u.first_name)}
//           </div>
//           <span>{u.fio || u.username || u.first_name}</span>
//         </div>
//       ))}
//     </div>

//     <h3 className="font-bold mt-4 mb-2 flex items-center justify-between">
//       Groups
//       <button
//         onClick={() => setShowCreateGroup(true)}
//         className="p-1 rounded bg-green-500 text-white"
//       >
//         <MdOutlineGroupAdd />
//       </button>
//     </h3>
//     <div className="flex-1 overflow-y-auto">
//       {filteredGroups.map((g) => (
//         <div
//           key={g.id}
//           onClick={() => openChat(g, "group")}
//           className={`p-2 flex items-center gap-2 rounded cursor-pointer ${
//             active?.id === g.id ? "bg-blue-200" : "hover:bg-gray-200"
//           }`}
//         >
//           <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white">
//             {initials(g.name)}
//           </div>
//           <span>{g.name}</span>
//         </div>
//       ))}
//     </div>
//   </div>

//   {/* Chat window */}
//   <div className="flex-1 flex flex-col">
//     {active ? (
//       <>
//         <div className="p-3 border-b flex justify-between items-center bg-gray-50">
//           <h2 className="font-bold">{active.name || active.fio}</h2>
//           <div className="flex gap-2">
//             <button className="px-2 py-1 bg-green-500 text-white rounded cursor-pointer">
//               Call
//             </button>
//             <button className="px-2 py-1 bg-blue-500 text-white rounded cursor-pointer">
//               Video
//             </button>
//           </div>
//         </div>
//         <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
//           {messages.map((m, i) => (
//             <div
//               key={i}
//               className={`flex ${
//                 m.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`p-2 rounded max-w-xs ${
//                   m.sender === "me"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200"
//                 }`}
//               >
//                 {m.text}
//               </div>
//             </div>
//           ))}
//           {typing && <div className="italic text-gray-500">Typing...</div>}
//           <div ref={messagesEndRef} />
//         </div>
//         <div className="p-3 border-t flex gap-2">
//           <input
//             className="border flex-1 rounded p-2"
//             placeholder="Type message..."
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//           />
//           <button
//             onClick={sendMessage}
//             className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
//           >
//             Send
//           </button>
//         </div>
//       </>
//     ) : (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         Select a chat to start messaging
//       </div>
//     )}
//   </div>

//   {/* Create Group Modal */}
//   {showCreateGroup && (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
//       <div className="bg-white p-6 rounded shadow w-96">
//         <h2 className="font-bold mb-3">Create Group</h2>
//         <input
//           className="border rounded p-2 w-full mb-3"
//           placeholder="Group name"
//           value={newGroupName}
//           onChange={(e) => setNewGroupName(e.target.value)}
//         />
//         <div className="mb-3">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={groupPrivate}
//               onChange={() => setGroupPrivate(!groupPrivate)}
//             />
//             {groupPrivate ? (
//               <FiLock className="text-red-500" />
//             ) : (
//               <FiUnlock className="text-green-500" />
//             )}
//             Private Group
//           </label>
//         </div>
//         <div className="max-h-40 overflow-y-auto mb-3 border p-2 rounded">
//           {users.map((u) => (
//             <label key={u.id} className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={selectedMembers.includes(u.id)}
//                 onChange={(e) =>
//                   setSelectedMembers((prev) =>
//                     e.target.checked
//                       ? [...prev, u.id]
//                       : prev.filter((id) => id !== u.id)
//                   )
//                 }
//               />
//               {u.fio || u.username || u.first_name}
//             </label>
//           ))}
//         </div>
//         <div className="flex justify-end gap-2">
//           <button
//             onClick={() => setShowCreateGroup(false)}
//             className="px-4 py-2 border rounded cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={createGroup}
//             className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
//           >
//             Create
//           </button>
//         </div>
//       </div>
//     </div>
//   )}
// </div>
