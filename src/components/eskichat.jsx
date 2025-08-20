"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdOutlineGroupAdd } from "react-icons/md";

import { FaUserPlus } from "react-icons/fa";
import {
  FiLock,
  FiUnlock,
  FiMessageSquare,
  FiPhone,
  FiVideo,
  FiMoreHorizontal,
  FiPaperclip,
  FiImage,
  FiSend,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Token olish
function getAuthToken() {
  const savedToken = localStorage.getItem("token");
  if (savedToken) return savedToken;

  const manualToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1OTI2NDk0LCJpYXQiOjE3NTU0OTQ0OTQsImp0aSI6ImM5ZjIzNTIyNGRlOTQ3YjViYzYwODAwYzk2NmE2YWExIiwidXNlcl9pZCI6IjcifQ.poWOfbuFXXgUEpGsmH6sOwA0rMZj1O-MxS0C6pm2xG8";
  localStorage.setItem("token", manualToken);
  return manualToken;
}

const initials = (s) =>
  s
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Chat({ type, obj }) {
  const token = getAuthToken();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupPrivate, setGroupPrivate] = useState(true);

  const messagesEndRef = useRef();
  const socketRef = useRef(null);

  // ✅ yangi state
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // ✅ user qo'shish function
  const addUserToChat = async (userId) => {
    if (!active) return;

    try {
      const res = await fetch(`http://5.133.122.226:8000/api/chat/employee/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_id: active.id,
          user_id: userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.detail || "Foydalanuvchini qo'shishda xato!");
        return;
      }

      toast.success("✅ Foydalanuvchi chatga qo'shildi!");
      setShowAddUserModal(false);
    } catch (err) {
      console.error("Add user error:", err);
      toast.error("Xatolik yuz berdi!");
    }
  };

  // 🔹 Users
  useEffect(() => {
    if (!token) return;
    fetch("http://5.133.122.226:8000/api/chat/chat-rooms/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUsers)
      .catch((e) => console.error(e));
  }, [token]);
  useEffect(() => {
    if (type !== "group" || !obj?.id) return;

    const groupId = obj.id;
    const ws = new WebSocket(
      `ws://5.133.122.226:8001/ws/chat/chat_room/${groupId}/`
    );

    ws.onopen = () => console.log("Socket ulandi");
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages((prev) => [
          ...prev,
          {
            sender: data.sender,
            context: data.content,
            time: data.created_at || new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("Message parse error:", err);
      }
    };
    ws.onclose = () => console.log("Socket yopildi");
    ws.onerror = (err) => console.error("Socket xato:", err);

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [type, obj]);

  // 🔹 Groups
  useEffect(() => {
    if (!token) return;
    fetch("http://5.133.122.226:8000/api/chat/groups/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Groups:", data);
        setGroups(data);
      })
      .catch((e) => console.error("Groups error:", e));
  }, [token]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔎 Filter
  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        (u.fio || u.username || u.first_name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  const filteredGroups = useMemo(
    () =>
      groups.filter((g) =>
        (g.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [groups, search]
  );

  // 🔹 Chatni ochish
  // const openChat = async (obj, type) => {
  //   setActive({ ...obj, type });
  //   setMessages([]);

  //   if (type === "user") {
  //     try {
  //       const res = await fetch(
  //         `http://5.133.122.226:8000/api/chat/messages/?chat_room_id=${obj.id}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       const data = await res.json();
  //       setMessages(
  //         data.map((m) => ({
  //           sender: m.sender_name || m.sender,
  //           content: m.content,
  //           time: m.created_at,
  //         }))
  //       );
  //     } catch (err) {
  //       console.error("Xabarlarni olishda xato:", err);
  //     }
  //   }

  //   if (type === "group") {
  //     const groupId = obj.id;
  //     const ws = new WebSocket(
  //       `ws://5.133.122.226:8001/ws/chat/group/${groupId}/`
  //     );

  //     ws.onopen = () => console.log("Socket ulandi");
  //     ws.onmessage = (e) => {
  //       const data = JSON.parse(e.data);
  //       setMessages((prev) => [
  //         ...prev,
  //         {
  //           sender: data.sender,
  //           context: data.content,
  //           time: data.created_at || new Date().toISOString(),
  //         },
  //       ]);
  //     };
  //     ws.onclose = () => console.log("Socket yopildi");

  //     socketRef.current = ws;
  //   }
  // };

  const openChat = async (obj, type) => {
    setActive({ ...obj, type });
    setMessages([]);

    if (type === "user") {
      try {
        const res = await fetch(
          `http://5.133.122.226:8000/api/chat/messages/?chat_room_id=${obj.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setMessages(
          data.map((m) => ({
            sender: m.sender_name || m.sender,
            content: m.content,
            time: m.created_at,
          }))
        );
      } catch (err) {
        console.error("Xabarlarni olishda xato:", err);
      }
      // Agar oldingi socket ochiq bo'lsa, uni yopamiz
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }

    if (type === "group") {
      const groupId = obj.id;
      // Eski socketni yopamiz
      if (socketRef.current) {
        socketRef.current.close();
      }

      const ws = new WebSocket(
        `ws://5.133.122.226:8001/ws/chat/group/${groupId}/?token=${token}`
      );

      ws.onopen = () => console.log("✅ Guruh socketiga ulandi");
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setMessages((prev) => [
            ...prev,
            {
              sender: data.sender,
              content: data.content,
              time: data.created_at || new Date().toISOString(),
            },
          ]);
        } catch (err) {
          console.error("Message parse error:", err);
        }
      };
      ws.onclose = () => console.log("❌ Guruh socket yopildi");
      ws.onerror = (err) => console.error("Socket xato:", err);

      socketRef.current = ws;
    }
  };
  // 🔹 Xabar yuborish
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (active?.type === "user") {
      try {
        const res = await fetch(
          "http://5.133.122.226:8000/api/chat/messages/send_message/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              chat_room: active.id,
              content: newMessage,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          console.error("Xabar yuborishda xato:", err);
          return;
        }

        setMessages((prev) => [
          ...prev,
          { sender: "me", text: newMessage, time: new Date().toISOString() },
        ]);
        setNewMessage("");
      } catch (err) {
        console.error("Private chat error:", err);
      }
    }

    if (active?.type === "group" && socketRef.current) {
      const msg = {
        type: "chat_message",
        content: newMessage,
      };

      socketRef.current.send(JSON.stringify(msg));

      setMessages((prev) => [
        ...prev,
        { sender: "me", text: newMessage, time: new Date().toISOString() },
      ]);
      setNewMessage("");
    }
  };

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // 🔹 Group yaratish
  const createGroup = async () => {
    if (!newGroupName || selectedMembers.length === 0) {
      toast.error("Guruh nomi va ishtirokchilarni tanlang!");
      return;
    }

    try {
      const res = await fetch(
        "http://5.133.122.226:8000/api/chat/groups/create_group/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            name: newGroupName,
            description: newDescription,
            is_public: groupPrivate,
            member_ids: [1, 7],
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Serverdan qaytgan xato:", data);
        toast.error(data?.detail || JSON.stringify(data));
        return;
      }

      setGroups((prev) => [...prev, data]);
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewDescription("");
      setSelectedMembers([]);
      toast.success("Guruh yaratildi!");
    } catch (err) {
      console.error("Kutilmagan xato:", err);
      toast.error("Guruh yaratishda xatolik");
    }
  };
  return (
    /**
     * 3 bu yerda
     */
    <div className="flex h-[90vh] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Users */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Users
            </h3>
          </div>
          {filteredUsers.map((u, index) => (
            <div
              key={`${u.id}-${index}`}
              onClick={() => openChat(u, "user")}
              className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition ${
                active?.id === u.id
                  ? "bg-blue-50 border border-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {initials(u.fio || u.username || u.first_name)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {u.fio || u.username || u.first_name}
                </p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          ))}
        </div>

        {/* Groups */}
        <div className="p-3 border-t border-gray-200 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Groups
            </h3>
            <div className="flex items-center gap-2">
              {" "}
              <button
                onClick={() => setShowAddUserModal(true)}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                <FaUserPlus size={18} />
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
              >
                <MdOutlineGroupAdd size={18} />
              </button>
            </div>
          </div>
          {filteredGroups.map((g, index) => (
            <div
              key={`${g.id}-${index}`}
              onClick={() => openChat(g, "group")}
              className={`flex items-center p-3 rounded-lg mb-1 cursor-pointer transition ${
                active?.id === g.id
                  ? "bg-blue-50 border border-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {/* Group avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium">
                {initials(g.name)}
              </div>

              {/* Group info */}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{g.name}</p>
                <p className="text-xs text-gray-500">
                  {g.members ? `${g.members.length} members` : "No members"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium mr-3">
                  {initials(active.name || active.fio)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">
                    {active.name || active.fio}
                  </h2>
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  <FiPhone size={18} />
                </button>
                <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  <FiVideo size={18} />
                </button>
                <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                  <FiMoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-3">
                {messages.map((m, index) => (
                  <div
                    key={m.id ? `${m.id}-${index}` : `msg-${index}`}
                    className={`flex ${
                      m.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-md ${
                        m.sender === "me"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white border border-gray-200 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {/* text yoki content bo'lishi mumkin */}
                      {m.text || m.content || m.context}

                      <div
                        className={`text-xs mt-1 ${
                          m.sender === "me" ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {new Date(m.time || new Date()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg rounded-bl-none shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition">
                  <FiPaperclip size={20} />
                </button>
                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition">
                  <FiImage size={20} />
                </button>
                <input
                  className="flex-1 border-0 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <FiSend size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <FiMessageSquare size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No chat selected
            </h3>
            <p className="text-gray-500 max-w-md text-center">
              Select a chat from the sidebar to start messaging or create a new
              group chat
            </p>
          </div>
        )}
      </div>

      {}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0  bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Group
                </h2>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <FiX size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupPrivate}
                      onChange={() => setGroupPrivate(!groupPrivate)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {groupPrivate ? "Private Group" : "Public Group"}
                    </span>
                  </label>
                  {groupPrivate ? (
                    <FiLock className="ml-2 text-red-500" />
                  ) : (
                    <FiUnlock className="ml-2 text-green-500" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Description
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="  Group Description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Members
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {users.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.id)}
                          onChange={(e) =>
                            setSelectedMembers((prev) =>
                              e.target.checked
                                ? [...prev, u.id]
                                : prev.filter((id) => id !== u.id)
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                            {initials(u.fio || u.username || u.first_name)}
                          </div>
                          <span className="text-sm text-gray-700">
                            {u.fio || u.username || u.first_name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition curson-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 "
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Add User to Chat
                </h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <FiX size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                        {initials(u.fio || u.username || u.first_name)}
                      </div>
                      <span className="text-sm text-gray-700">
                        {u.fio || u.username || u.first_name}
                      </span>
                    </div>
                    <button
                      onClick={() => addUserToChat(u.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";
// import { useEffect, useRef, useState } from "react";

// export default function TelegramStyleChat() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1OTI2NDk0LCJpYXQiOjE3NTU0OTQ0OTQsImp0aSI6ImM5ZjIzNTIyNGRlOTQ3YjViYzYwODAwYzk2NmE2YWExIiwidXNlcl9pZCI6IjcifQ.poWOfbuFXXgUEpGsmH6sOwA0rMZj1O-MxS0C6pm2xG8";

//   // 1️⃣ Userlarni olish
//   useEffect(() => {
//     fetch("http://5.133.122.226:8001/api/employee/", {
//       method: "GET",

//       credentials: "include",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => setUsers(data))
//       .catch((err) => console.error(err));
//   }, [token]);

//   // 2️⃣ Chat roomni tanlash va xabarlarni olish
//   useEffect(() => {
//     if (!selectedUser) return;

//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/?user_id=${selectedUser.id}`,
//       { credentials: "include", headers: { Authorization: `Bearer ${token}` } }
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         setMessages(data.messages || []);
//         socketRef.current = new WebSocket(
//           `ws://5.133.122.226:8001/ws/chat/group/${data.room_id}/`
//         );

//         socketRef.current.onmessage = (event) => {
//           const msg = JSON.parse(event.data);
//           setMessages((prev) => [...prev, msg]);
//         };

//         socketRef.current.onclose = () => console.log("WS closed");
//         socketRef.current.onerror = (err) => console.error("WS error", err);
//       })
//       .catch((err) => console.error(err));

//     return () => socketRef.current?.close();
//   }, [selectedUser, token]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim()) return;

//     // WebSocket hali ochilganligini tekshirish
//     if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
//       console.log("WebSocket hali ochilmagan yoki yopilgan");
//       return;
//     }

//     const msg = { user: "Me", text: input };
//     socketRef.current.send(JSON.stringify(msg));
//     setMessages((prev) => [...prev, msg]);
//     setInput("");
//   };

//   return (
//     <div className="flex h-[80vh] border rounded-lg shadow-lg overflow-hidden font-sans">
//       {/* Users list */}
//       <div className="w-72 bg-gray-50 border-r border-gray-300 flex flex-col">
//         <div className="p-4 border-b border-gray-200 font-semibold text-lg">
//           Contacts
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 transition-colors ${
//                 selectedUser?.id === user.id ? "bg-blue-50 font-semibold" : ""
//               }`}
//             >
//               <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold mr-3">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div>{user.fio || "No Name"}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chat area */}
//       <div className="flex-1 flex flex-col bg-white">
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`flex ${
//                 msg.user === "Me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[70%] px-4 py-2 rounded-xl break-words ${
//                   msg.user === "Me"
//                     ? "bg-blue-500 text-white rounded-br-none"
//                     : "bg-gray-200 text-gray-800 rounded-bl-none"
//                 } shadow-sm`}
//               >
//                 <div className="text-xs font-semibold mb-1">{msg.user}</div>
//                 <div className="text-sm">{msg.text}</div>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="flex items-center p-3 border-t border-gray-300 bg-gray-50">
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//             className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//           />
//           <button
//             onClick={sendMessage}
//             className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition"
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// useEffect(() => {
//   if (!selectedUser) return;

//   fetch(
//     `http://5.133.122.226:8001/api/chat/chat-rooms/?user_id=${selectedUser.id}`,
//     { headers: { Authorization: `Bearer ${token}` } }
//   )
//     .then((res) => res.json())
//     .then((data) => {
//       console.log("Chat room data:", data);

//       if (!data || data.length === 0 || !data[0]?.id) {
//         console.warn("Chat room topilmadi");
//         return;
//       }

//       const roomId = data[0].id;
//       setMessages(data[0].messages || []);

//       socketRef.current = new WebSocket(
//         ` ws://5.133.122.226:8001/ws/chat/chat_room/421cbff2-35e1-4700-a033-b788ab20b831/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//       );

//       socketRef.current.onopen = () => console.log("WS connected");
//       socketRef.current.onclose = (event) => {
//         console.log("WebSocket yopildi:", event.code, event.reason);
//         if (event.code !== 1000) {
//           setTimeout(() => {
//             console.log("Qayta ulanishga harakat...");
//           }, 3000);
//         }
//       };
//       socketRef.current.onerror = (err) => console.error("WS error", err);
//       socketRef.current.onclose = () => console.log("WS closed");
//     })
//     .catch((err) => console.error(err));

//   return () => socketRef.current?.close();
// }, [selectedUser, token]);

// useEffect(() => {
//   fetch("http://5.133.122.226:8001/api/employee/", {
//     headers: { Authorization: `Bearer ${token}` },
//   })
//     .then((res) => res.json())
//     .then(setUsers)
//     .catch((err) => console.error(err));
// }, [token]);
// useEffect(() => {
//   if (!selectedUser) return;

//   fetch("http://5.133.122.226:8001/api/chat/chat-rooms/", {
//     headers: { Authorization: `Bearer ${token}` },
//   })
//     .then((res) => res.json())
//     .then((data) => {
//       console.log("Chat room data:", data);

//       if (!data || data.length === 0 || !data[0]?.id) {
//         console.warn("Chat room topilmadi");
//         return;
//       }

//       const roomId = data[0].id;
//       setMessages(data[0].messages || []);

//       socketRef.current = new WebSocket(
//         ` ws://5.133.122.226:8001/ws/chat/chat_room/421cbff2-35e1-4700-a033-b788ab20b831/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//       );

//       socketRef.current.onopen = () => console.log("WS connected");
//       socketRef.current.onclose = (event) => {
//         console.log("WebSocket yopildi:", event.code, event.reason);
//         if (event.code !== 1000) {
//           setTimeout(() => {
//             console.log("Qayta ulanishga harakat...");
//           }, 3000);
//         }
//       };
//       socketRef.current.onerror = (err) => console.error("WS error", err);
//     })
//     .catch((err) => console.error(err));

//   return () => socketRef.current?.close();
// }, [selectedUser, token]);

// useEffect(() => {
//   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// }, [messages]);

// Xabar yuborish

// 1) Xodimlarni olish

// "use client";
// import { useEffect, useRef, useState } from "react";

// export default function TelegramStyleChat() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setСontent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // 1️⃣ Userlarni olish

//   // const token = localStorage.getItem("access_token");

//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzNzEwLCJpYXQiOjE3NTU1ODE3MTAsImp0aSI6IjEzYTM4YzFmYWNkZjQ1NjhhMGFjZjgyOTE3NDBiMjkxIiwidXNlcl9pZCI6IjcifQ.YEyF6yYVbf6CdQRyZIJMFvIqSC0vIu_gGu6u9twmeM4";

//   console.log(token);
//   useEffect(() => {
//     fetch("http://5.133.122.226:8001/api/employee/", {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then(setUsers)
//       .catch((err) => console.error(err));
//   }, [token]);

//   // 2) Chat room va messages olish
//   useEffect(() => {
//     if (!selectedUser) return;

//     fetch("http://5.133.122.226:8001/api/chat/chat-rooms/", {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then(async (data) => {
//         console.log("Chat room data:", data);
//         if (!data || data.length === 0 || !data[0]?.id) {
//           console.warn("Chat room topilmadi");
//           return;
//         }

//         const foundRoomId = data[0].id;
//         setRoomId(foundRoomId);

//         // 🔹 Avval messages API’dan olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${foundRoomId}`,
//             {
//               method: "GET",
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );
//           const msgs = await msgRes.json();
//           setMessages(Array.isArray(msgs) ? msgs : []); // Massiv bo‘lishini tekshir
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // 🔹 WebSocket ulanish
//         socketRef.current = new WebSocket(
//           ` ws://5.133.122.226:8001/ws/chat/chat_room/${foundRoomId}/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//         );

//         socketRef.current.onopen = () => console.log("WS connected ✅");
//         socketRef.current.onmessage = (e) => {
//           const newMsg = JSON.parse(e.data);
//           setMessages((prev) => [...prev, newMsg]); // Real time update
//         };
//         socketRef.current.onclose = (event) => {
//           console.log("WebSocket yopildi:", event.code, event.reason);
//           if (event.code !== 1000) {
//             setTimeout(() => {
//               console.log("Qayta ulanishga harakat...");
//             }, 3000);
//           }
//         };
//         socketRef.current.onerror = (err) => console.error("WS error ❌", err);
//       })
//       .catch((err) => console.error(err));

//     return () => socketRef.current?.close();
//   }, [selectedUser, token]);

//   // 3) Har safar xabar yangilansa scroll pastga tushsin
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const sendMessage = async () => {
//     if (!content.trim() || !roomId) return;

//     const newMsg = {
//       chat_room: roomId, //"421cbff2-35e1-4700-a033-b788ab20b831",
//       sender: "me", // hozircha faqat o'zimiz yuboramiz
//       message_type: "text", // hozircha faqat text
//       content: content,
//     };

//     try {
//       // 🔹 API orqali yuborish
//       const res = await fetch(
//         "http://5.133.122.226:8001/api/chat/messages/send_message/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(newMsg),
//         }
//       );

//       if (!res.ok) {
//         throw new Error("❌ Xabar yuborishda xatolik");
//       }

//       const savedMsg = await res.json();
//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(JSON.stringify(savedMsg));
//       }

//       setMessages((prev) => [...prev, savedMsg]);
//       setСontent("");
//     } catch (error) {
//       console.error("Xabar yuborishda xatolik:", error);
//     }
//   };

//   return (
//     <div className="flex h-[80vh] border rounded-lg shadow-lg overflow-hidden font-sans">
//       {/* Users list */}
//       <div className="w-72 bg-gray-50 border-r border-gray-300 flex flex-col">
//         <div className="p-4 border-b border-gray-200 font-semibold text-lg">
//           Contacts
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 transition-colors ${
//                 selectedUser?.id === user.id ? "bg-blue-50 font-semibold" : ""
//               }`}
//             >
//               <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-white font-bold mr-3">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div>{user.fio || "No Name"}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-white">
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`flex ${
//                 msg.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-xs p-3 rounded-lg text-sm ${
//                   msg.sender === "me"
//                     ? "bg-blue-500 text-white"
//                     : "bg-gray-200 text-gray-800"
//                 }`}
//               >
//                 {msg.content || "No content"}
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="flex items-center p-3 border-t border-gray-300 bg-gray-50">
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={content}
//             onChange={(e) => setСontent(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//             className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//           />
//           <button
//             onClick={sendMessage}
//             className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition"
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// useEffect(() => {
//   if (!selectedUser) return;

//   const currentUserId = 1; // Hozirgi user ID (login qilgan user)
//   const query = `user_ids=${currentUserId}&user_ids=${selectedUser.id}`;

//   fetch(
//     `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//     {
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   )
//     .then((res) => res.json())
//     .then(async (room) => {
//       console.log("Chat room:", room);
//       if (!room || !room.id) {
//         console.warn("Chat room topilmadi");
//         setMessages([]);
//         return;
//       }

//       setRoomId(room.id);

//       // 🔹 Avval messages API’dan olish
//       try {
//         const msgRes = await fetch(
//           `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${room.id}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const msgs = await msgRes.json();
//         setMessages(Array.isArray(msgs) ? msgs : []);
//       } catch (err) {
//         console.error("Messages olishda xatolik:", err);
//         setMessages([]);
//       }

//       // 🔹 WebSocket ulanish
//       socketRef.current = new WebSocket(
//         `ws://5.133.122.226:8001/ws/chat/chat_room/${room.id}/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//       );

//       socketRef.current.onopen = () => console.log("WS connected ✅");
//       socketRef.current.onmessage = (e) => {
//         const newMsg = JSON.parse(e.data);
//         setMessages((prev) => [...prev, newMsg]);
//       };
//       socketRef.current.onclose = (event) => {
//         console.log("WebSocket yopildi:", event.code, event.reason);
//         if (event.code !== 1000) {
//           setTimeout(() => console.log("Qayta ulanishga harakat..."), 3000);
//         }
//       };
//       socketRef.current.onerror = (err) => console.error("WS error ❌", err);
//     })
//     .catch((err) => console.error(err));

//   return () => socketRef.current?.close();
// }, [selectedUser, token]);

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { cookies } from "../config/cookies";
// import { useChat } from "../context/ChatProvider";

// export default function Login({ setIsAuth }) {
//   const [user, setUser] = useState("");
//   const [pass, setPass] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const { addUserToChat } = useChat();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const response = await fetch("http://5.133.122.226:8000/api/login/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           username_or_email: user,
//           password: pass,
//         }),
//       });

//       const data = await response.json();
//       console.log("Server javobi:", data);

//       if (response.ok) {
//         cookies.set("token", data.token, { path: "/", maxAge: 360000 });
//         setIsAuth(true);
//         addUserToChat(loggedUser);
//         navigate("/page1");
//       } else {
//         alert(data.detail || "Login yoki parol noto‘g‘ri!");
//       }
//     } catch (error) {
//       console.error(error);
//       alert("Xatolik yuz berdi!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-200">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-md w-80"
//       >
//         <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

//         <input
//           type="text"
//           placeholder="Username"
//           className="w-full border p-2 mb-3 rounded"
//           value={user}
//           onChange={(e) => setUser(e.target.value)}
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full border p-2 mb-3 rounded"
//           value={pass}
//           onChange={(e) => setPass(e.target.value)}
//         />

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//           disabled={loading}
//         >
//           {loading ? "Kirish..." : "Kirish"}
//         </button>
//       </form>
//     </div>
//   );
// }

// function AppRoutes() {
//   const { user } = useAuth();
//   const isAuth = !!user;

//   return isAuth ? (
//     <div className="flex h-screen">
//       <Sidebar />
//       <div className="flex-1 p-6 bg-gray-100">
//         <Routes>
//           <Route path="/page1" element={<Page1 />} />
//           <Route path="/page2" element={<Page2 />} />
//           <Route path="/chat" element={<Chat />} />
//           <Route path="*" element={<Navigate to="/page1" />} />
//         </Routes>
//       </div>
//     </div>
//   ) : (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route path="*" element={<Navigate to="/login" />} />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <AppRoutes />
//       </Router>
//     </AuthProvider>
//   );
// }

// import { createBrowserRouter, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";

// import Layout from "./layout/Layout";
// import Home from "./page/home";
// import Page2 from "./page/Page2";
// import Chat from "./components/Chat";
// import Login from "./page/Login";

// function App() {
//   const { user } = useAuth();
//   const isAuth = !!user;
//   const routes = createBrowserRouter([
//     {
//       path: "/",
//       element: (
//         <AuthProvider>
//           <Layout />,
//         </AuthProvider>
//       ),
//       children: [
//         {
//           index: true,
//           element: <Home />,
//         },
//         {
//           path: "/page2",
//           element: <Page2 />,
//         },
//         {
//           path: "/chat",
//           element: <Chat />,
//         },
//         {
//           path: "/login",
//           element: <Login />,
//         },
//         {
//           path: "*",
//           element: <Navigate to="/home" />,
//         },
//       ],
//     },
//   ]);
//   return <RouterProvider router={routes} />;
// }

// export default App;

// import {
//   createBrowserRouter,
//   RouterProvider,
//   Navigate,
// } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";

// import Layout from "./layout/Layout";
// import Home from "./page/home";
// import Page2 from "./page/Page2";
// import Chat from "./components/Chat";
// import Login from "./page/Login";
// import { action as loginAction } from "./page/Login";

// // ProtectedRoute komponenti
// function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   const isAuth = !!user;

//   if (!isAuth) {
//     return <Navigate to="/login" />;
//   }

//   return children;
// }

// function App() {
//   const routes = createBrowserRouter([
//     {
//       path: "/",
//       element: (
//         <AuthProvider>
//           <Layout />
//         </AuthProvider>
//       ),
//       children: [
//         {
//           index: true,
//           element: <Home />,
//         },
//         {
//           path: "page2",
//           element: (
//             <ProtectedRoute>
//               <Page2 />
//             </ProtectedRoute>
//           ),
//         },
//         {
//           path: "chat",
//           element: (
//             <ProtectedRoute>
//               <Chat />
//             </ProtectedRoute>
//           ),
//         },
//       ],
//     },
//     {
//       path: "/login",
//       element: user ? <Navigate to="/" /> : <Login />,
//       action: loginAction,
//     },
//   ]);

//   return <RouterProvider router={routes} />;
// }

// export default App;

// <div className="flex h-[80vh] border rounded-lg shadow-lg overflow-hidden">
//   {/* Users list */}
//   <div className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col">
//     <div className="p-4 border-b font-semibold">Users</div>
//     <div className="flex-1 overflow-y-auto">
//       {users.map((u) => (
//         <div
//           key={u.id}
//           className={`p-3 cursor-pointer ${
//             selectedUser?.id === u.id ? "bg-gray-200" : ""
//           }`}
//           onClick={() => setSelectedUser(u)}
//         >
//           {u.username} {u.is_online ? "🟢" : "⚪"}
//         </div>
//       ))}
//     </div>
//   </div>

//   {/* Chat window */}
//   <div className="flex-1 flex flex-col">
//     <div className="flex-1 p-4 overflow-y-auto">
//       {messages.map((msg, i) => (
//         <div
//           key={i}
//           className={`my-1 p-2 rounded ${
//             msg.sender?.id === user.id
//               ? "bg-blue-200 self-end"
//               : "bg-gray-200 self-start"
//           }`}
//         >
//           {msg.content}
//         </div>
//       ))}
//       <div ref={messagesEndRef} />
//     </div>
//     <div className="p-4 border-t flex">
//       <input
//         type="text"
//         className="flex-1 border rounded px-2 py-1 mr-2"
//         value={content}
//         onChange={(e) => setContent(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//       />
//       <button
//         onClick={sendMessage}
//         className="px-4 py-1 bg-blue-500 text-white rounded"
//       >
//         Send
//       </button>
//     </div>
//   </div>
// </div>

///

// <div className="flex h-[80vh] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//   <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//     <div className="p-4 border-b border-gray-200 bg-gray-50">
//       <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//     </div>
//     <div className="flex-1 overflow-y-auto">
//       {users.map((user) => (
//         <div
//           key={user.id}
//           onClick={() => setSelectedUser(user)}
//           className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//             selectedUser?.id === user.id
//               ? "bg-blue-50 border-r-2 border-blue-500"
//               : ""
//           }`}
//         >
//           <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//             {user.fio?.charAt(0) || "?"}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="font-medium text-gray-900 text-sm truncate">
//               {user.fio || user.username || "No Name"}
//             </div>
//             <div className="text-xs text-gray-500 mt-0.5">
//               Last seen recently
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>

//   <div className="flex-1 flex flex-col bg-gray-50">
//     {selectedUser && (
//       <div className="p-4 bg-white border-b border-gray-200 flex items-center">
//         <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//           {selectedUser.fio?.charAt(0) || "?"}
//         </div>
//         <div>
//           <div className="font-medium text-gray-900 text-sm">
//             {selectedUser.fio || selectedUser.username || "No Name"}
//           </div>
//           <div className="text-xs text-gray-500">online</div>
//         </div>
//       </div>
//     )}

//     <div className="flex-1 overflow-y-auto p-4 space-y-2">
//       {messages.map((msg, index) => (
//         <div
//           key={index}
//           className={`flex ${
//             msg.sender === "me" ? "justify-end" : "justify-start"
//           }`}
//         >
//           <div
//             className={`max-w-[70%] px-3 py-2 rounded-2xl break-words relative  bg-blue-400 ${
//               msg.sender === "me"
//                 ? "bg-blue-500  text-white rounded-br-md shadow-sm"
//                 : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
//             }`}
//           >
//             {msg.sender !== "me" && (
//               <div className="text-xs  font-medium mb-1 text-blue-600">
//                 {typeof msg.sender === "object"
//                   ? msg.sender.fio || msg.sender.username
//                   : msg.sender}
//               </div>
//             )}

//             <div className="text-sm leading-relaxed">{msg.content}</div>

//             {/* Message time */}
//             <div
//               className={`text-xs mt-1 ${
//                 msg.sender === "me" ? "text-blue-100" : "text-gray-400"
//               }`}
//             >
//               {new Date().toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </div>
//           </div>
//         </div>
//       ))}
//       <div ref={messagesEndRef} />
//     </div>

//     {/* Input */}
//     <div className="flex items-center p-4 bg-white border-t border-gray-200">
//       <div className="flex-1 relative">
//         <input
//           type="text"
//           placeholder="Write a message..."
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//           className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
//         />
//         <button
//           onClick={sendMessage}
//           className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full transition-colors duration-200 flex items-center justify-center"
//         >
//           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//             <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//           </svg>
//         </button>
//       </div>
//     </div>
//   </div>
// </div>


// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useAuth } from "../context/AuthContext"; // 🔑 context for auth

// export default function TelegramStyleChat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // 🔑 Token
//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzNzEwLCJpYXQiOjE3NTU1ODE3MTAsImp0aSI6IjEzYTM4YzFmYWNkZjQ1NjhhMGFjZjgyOTE3NDBiMjkxIiwidXNlcl9pZCI6IjcifQ.YEyF6yYVbf6CdQRyZIJMFvIqSC0vIu_gGu6u9twmeM4";

//   // 1️⃣ Foydalanuvchilarni olish
//   useEffect(() => {
//     fetch("http://5.133.122.226:8001/api/employee/", {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setUsers(data.filter((u) => u.id !== user.id)); // o'zini olib tashlash
//         } else {
//           console.error("Foydalanuvchilar ma'lumotlari noto'g'ri formatda:", data);
//         }
//       })
//       .catch((err) => console.error(err));
//   }, [token]);

//   // 2️⃣ Chat room olish va WebSocket ulanish
//   useEffect(() => {
//     if (!selectedUser) return;
//     const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//     console.log(user.id, selectedUser.id, query);

//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     )
//       .then((res) => res.json())
//       .then(async (room) => {
//         if (!room || !room.chat_room) {
//           console.warn("Chat room topilmadi");
//           return;
//         }
//         setRoomId(room.chat_room);
//         // 🔹 Messages olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${room.chat_room}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           const msgs = await msgRes.json();
//           setMessages(Array.isArray(msgs) ? msgs : []);
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // 🔹 WebSocket ulanish
//         if (socketRef.current) socketRef.current.close();
//         socketRef.current = new WebSocket(
//           `ws://5.133.122.226:8001/ws/chat/chat_room/${room.chat_room}/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//         );

//         socketRef.current.onopen = () => console.log("WS connected ✅");
//         socketRef.current.onmessage = (e) => {
//           const newMsg = JSON.parse(e.data);
//           setMessages((prev) => [...prev, newMsg]);
//         };
//         socketRef.current.onclose = (event) =>
//           console.log("WebSocket yopildi:", event.code, event.reason);
//         socketRef.current.onerror = (err) => console.error("WS error ❌", err);
//       })
//       .catch((err) => console.error(err));

//     return () => socketRef.current?.close();
//   }, [selectedUser, token]);

//   // 3️⃣ Scroll pastga tushish
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 4️⃣ Xabar yuborish
//   const sendMessage = async () => {
//     if (!content.trim() || !roomId) return;

//     const newMsg = {
//       chat_room: roomId,
//       sender: "me",
//       message_type: "text",
//       content: content,
//     };

//     try {
//       const res = await fetch(
//         "http://5.133.122.226:8001/api/chat/messages/send_message/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(newMsg),
//         }
//       );

//       if (!res.ok) throw new Error("Xabar yuborishda xatolik");

//       const savedMsg = await res.json();

//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(JSON.stringify(savedMsg));
//       }

//       setMessages((prev) => [...prev, savedMsg]);
//       setContent("");
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div className="flex h-[80vh] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedUser?.id === user.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {user.fio || user.username || "No Name"}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   Last seen recently
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {selectedUser && (
//           <div className="p-4 bg-white border-b border-gray-200 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//               {selectedUser.fio?.charAt(0) || "?"}
//             </div>
//             <div>
//               <div className="font-medium text-gray-900 text-sm">
//                 {selectedUser.fio || selectedUser.username || "No Name"}
//               </div>
//               <div className="text-xs text-gray-500">online</div>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto p-4 space-y-2">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`flex ${
//                 msg.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[70%] px-3 py-2 rounded-2xl break-words relative  bg-blue-400 ${
//                   msg.sender === "me"
//                     ? "bg-blue-500  text-white rounded-br-md shadow-sm"
//                     : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
//                 }`}
//               >
//                 {msg.sender !== "me" && (
//                   <div className="text-xs  font-medium mb-1 text-blue-600">
//                     {typeof msg.sender === "object"
//                       ? msg.sender.fio || msg.sender.username
//                       : msg.sender}
//                   </div>
//                 )}

//                 <div className="text-sm leading-relaxed">{msg.content}</div>

//                 {/* Message time */}
//                 <div
//                   className={`text-xs mt-1 ${
//                     msg.sender === "me" ? "text-blue-100" : "text-gray-400"
//                   }`}
//                 >
//                   {new Date().toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="flex items-center p-4 bg-white border-t border-gray-200">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Write a message..."
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
//             />
//             <button
//               onClick={sendMessage}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full transition-colors duration-200 flex items-center justify-center"
//             >
//               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useAuth } from "../context/AuthContext"; // 🔑 context for auth

// export default function TelegramStyleChat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // 🔑 Token
//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzNzEwLCJpYXQiOjE3NTU1ODE3MTAsImp0aSI6IjEzYTM4YzFmYWNkZjQ1NjhhMGFjZjgyOTE3NDBiMjkxIiwidXNlcl9pZCI6IjcifQ.YEyF6yYVbf6CdQRyZIJMFvIqSC0vIu_gGu6u9twmeM4";

//   // 1️⃣ Foydalanuvchilarni olish
//   useEffect(() => {
//     fetch("http://5.133.122.226:8001/api/employee/", {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setUsers(data.filter((u) => u.id !== user.id)); // o'zini olib tashlash
//         } else {
//           console.error("Foydalanuvchilar ma'lumotlari noto'g'ri formatda:", data);
//         }
//       })
//       .catch((err) => console.error(err));
//   }, [token]);

//   // 2️⃣ Chat room olish va WebSocket ulanish
//   useEffect(() => {
//     if (!selectedUser) return;
//     const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//     console.log(user.id, selectedUser.id, query);

//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     )
//       .then((res) => res.json())
//       .then(async (room) => {
//         if (!room || !room.chat_room) {
//           console.warn("Chat room topilmadi");
//           return;
//         }
//         setRoomId(room.chat_room);
//         // 🔹 Messages olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${room.chat_room}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           const msgs = await msgRes.json();
//           setMessages(Array.isArray(msgs) ? msgs : []);
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // 🔹 WebSocket ulanish
//         if (socketRef.current) socketRef.current.close();
//         socketRef.current = new WebSocket(
//           `ws://5.133.122.226:8001/ws/chat/chat_room/${room.chat_room}/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//         );

//         socketRef.current.onopen = () => console.log("WS connected ✅");
//         socketRef.current.onmessage = (e) => {
//           const newMsg = JSON.parse(e.data);
//           setMessages((prev) => [...prev, newMsg]);
//         };
//         socketRef.current.onclose = (event) =>
//           console.log("WebSocket yopildi:", event.code, event.reason);
//         socketRef.current.onerror = (err) => console.error("WS error ❌", err);
//       })
//       .catch((err) => console.error(err));

//     return () => socketRef.current?.close();
//   }, [selectedUser, token]);

//   // 3️⃣ Scroll pastga tushish
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 4️⃣ Xabar yuborish
//   const sendMessage = async () => {
//     if (!content.trim() || !roomId) return;

//     const newMsg = {
//       chat_room: roomId,
//       sender: "me",
//       message_type: "text",
//       content: content,
//     };

//     try {
//       const res = await fetch(
//         "http://5.133.122.226:8001/api/chat/messages/send_message/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(newMsg),
//         }
//       );

//       if (!res.ok) throw new Error("Xabar yuborishda xatolik");

//       const savedMsg = await res.json();

//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(JSON.stringify(savedMsg));
//       }

//       setMessages((prev) => [...prev, savedMsg]);
//       setContent("");
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div className="flex h-[80vh] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedUser?.id === user.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {user.fio || user.username || "No Name"}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   Last seen recently
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {selectedUser && (
//           <div className="p-4 bg-white border-b border-gray-200 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//               {selectedUser.fio?.charAt(0) || "?"}
//             </div>
//             <div>
//               <div className="font-medium text-gray-900 text-sm">
//                 {selectedUser.fio || selectedUser.username || "No Name"}
//               </div>
//               <div className="text-xs text-gray-500">online</div>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto p-4 space-y-2">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`flex ${
//                 msg.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[70%] px-3 py-2 rounded-2xl break-words relative  bg-blue-400 ${
//                   msg.sender === "me"
//                     ? "bg-blue-500  text-white rounded-br-md shadow-sm"
//                     : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
//                 }`}
//               >
//                 {msg.sender !== "me" && (
//                   <div className="text-xs  font-medium mb-1 text-blue-600">
//                     {typeof msg.sender === "object"
//                       ? msg.sender.fio || msg.sender.username
//                       : msg.sender}
//                   </div>
//                 )}

//                 <div className="text-sm leading-relaxed">{msg.content}</div>

//                 {/* Message time */}
//                 <div
//                   className={`text-xs mt-1 ${
//                     msg.sender === "me" ? "text-blue-100" : "text-gray-400"
//                   }`}
//                 >
//                   {new Date().toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="flex items-center p-4 bg-white border-t border-gray-200">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Write a message..."
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
//             />
//             <button
//               onClick={sendMessage}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full transition-colors duration-200 flex items-center justify-center"
//             >
//               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useAuth } from "../context/AuthContext"; // 🔑 context for auth

// export default function TelegramStyleChat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // 🔑 Token
//   const token =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzNzEwLCJpYXQiOjE3NTU1ODE3MTAsImp0aSI6IjEzYTM4YzFmYWNkZjQ1NjhhMGFjZjgyOTE3NDBiMjkxIiwidXNlcl9pZCI6IjcifQ.YEyF6yYVbf6CdQRyZIJMFvIqSC0vIu_gGu6u9twmeM4";

//   // 1️⃣ Foydalanuvchilarni olish
//   useEffect(() => {
//     fetch("http://5.133.122.226:8001/api/employee/", {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setUsers(data.filter((u) => u.id !== user.id)); // o'zini olib tashlash
//         } else {
//           console.error("Foydalanuvchilar ma'lumotlari noto'g'ri formatda:", data);
//         }
//       })
//       .catch((err) => console.error(err));
//   }, [token]);

//   // 2️⃣ Chat room olish va WebSocket ulanish
//   useEffect(() => {
//     if (!selectedUser) return;
//     const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//     console.log(user.id, selectedUser.id, query);

//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     )
//       .then((res) => res.json())
//       .then(async (room) => {
//         if (!room || !room.chat_room) {
//           console.warn("Chat room topilmadi");
//           return;
//         }
//         setRoomId(room.chat_room);
//         // 🔹 Messages olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${room.chat_room}`,
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
//           const msgs = await msgRes.json();
//           setMessages(Array.isArray(msgs) ? msgs : []);
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // 🔹 WebSocket ulanish
//         if (socketRef.current) socketRef.current.close();
//         socketRef.current = new WebSocket(
//           `ws://5.133.122.226:8001/ws/chat/chat_room/${room.chat_room}/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2MDEzMjczLCJpYXQiOjE3NTU1ODEyNzMsImp0aSI6IjJmOWJlYWRiZmYyNTQzZjZhMmNhMzQ0YTc0N2Y4MDI2IiwidXNlcl9pZCI6IjEifQ.0oli7RGcYwPEJKSxAEIUhif_3Jx5iTEn4gWo5JDXpP8`
//         );

//         socketRef.current.onopen = () => console.log("WS connected ✅");
//         socketRef.current.onmessage = (e) => {
//           const newMsg = JSON.parse(e.data);
//           setMessages((prev) => [...prev, newMsg]);
//         };
//         socketRef.current.onclose = (event) =>
//           console.log("WebSocket yopildi:", event.code, event.reason);
//         socketRef.current.onerror = (err) => console.error("WS error ❌", err);
//       })
//       .catch((err) => console.error(err));

//     return () => socketRef.current?.close();
//   }, [selectedUser, token]);

//   // 3️⃣ Scroll pastga tushish
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 4️⃣ Xabar yuborish
//   const sendMessage = async () => {
//     if (!content.trim() || !roomId) return;

//     const newMsg = {
//       chat_room: roomId,
//       sender: "me",
//       message_type: "text",
//       content: content,
//     };

//     try {
//       const res = await fetch(
//         "http://5.133.122.226:8001/api/chat/messages/send_message/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(newMsg),
//         }
//       );

//       if (!res.ok) throw new Error("Xabar yuborishda xatolik");

//       const savedMsg = await res.json();

//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(JSON.stringify(savedMsg));
//       }

//       setMessages((prev) => [...prev, savedMsg]);
//       setContent("");
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div className="flex h-[80vh] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedUser?.id === user.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {user.fio || user.username || "No Name"}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   Last seen recently
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {selectedUser && (
//           <div className="p-4 bg-white border-b border-gray-200 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//               {selectedUser.fio?.charAt(0) || "?"}
//             </div>
//             <div>
//               <div className="font-medium text-gray-900 text-sm">
//                 {selectedUser.fio || selectedUser.username || "No Name"}
//               </div>
//               <div className="text-xs text-gray-500">online</div>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto p-4 space-y-2">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`flex ${
//                 msg.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[70%] px-3 py-2 rounded-2xl break-words relative  bg-blue-400 ${
//                   msg.sender === "me"
//                     ? "bg-blue-500  text-white rounded-br-md shadow-sm"
//                     : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
//                 }`}
//               >
//                 {msg.sender !== "me" && (
//                   <div className="text-xs  font-medium mb-1 text-blue-600">
//                     {typeof msg.sender === "object"
//                       ? msg.sender.fio || msg.sender.username
//                       : msg.sender}
//                   </div>
//                 )}

//                 <div className="text-sm leading-relaxed">{msg.content}</div>

//                 {/* Message time */}
//                 <div
//                   className={`text-xs mt-1 ${
//                     msg.sender === "me" ? "text-blue-100" : "text-gray-400"
//                   }`}
//                 >
//                   {new Date().toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input */}
//         <div className="flex items-center p-4 bg-white border-t border-gray-200">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Write a message..."
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
//             />
//             <button
//               onClick={sendMessage}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full transition-colors duration-200 flex items-center justify-center"
//             >
//               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { cookies } from "../config/cookies";

// export default function Login({ setIsAuth }) {
//   const [user, setUser] = useState("");
//   const [pass, setPass] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const req = await fetch("http://5.133.122.226:8001/api/login/", {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           username_or_email: user,
//           password: pass,
//         }),
//       });

//       const data = await req.json();
//       console.log("Server javobi:", data);

//       if (req.ok) {
//         cookies.set("token", data.token, {
//           path: "/",
//           maxAge: 36000,
//           secure: true,
//           sameSite: "strict",
//         });

//         localStorage.setItem("access_token", data.access);
//         navigate("/");
//       } else {
//         alert(data.detail || "Login yoki parol noto‘g‘ri!");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       alert("Xatolik yuz berdi!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-200">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-md w-80"
//       >
//         <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

//         <input
//           type="text"
//           placeholder="Username"
//           className="w-full border p-2 mb-3 rounded"
//           value={user}
//           onChange={(e) => setUser(e.target.value)}
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full border p-2 mb-3 rounded"
//           value={pass}
//           onChange={(e) => setPass(e.target.value)}
//         />

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//           disabled={loading}
//         >
//           {loading ? "Kirish..." : "Kirish"}
//         </button>
//       </form>
//     </div>
//   );
// }



// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";

// export default function TelegramStyleChat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);

//   const token = localStorage.getItem("access_token");

//   // 1️⃣ Foydalanuvchilarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetch("http://5.133.122.226:8001/api/employee/", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setUsers(data.filter((u) => u.id !== user.id));
//         }
//       })
//       .catch(console.error);
//   }, [token, user?.id]);

//   const addMessageSafely = useCallback((newMsg) => {
//     const messageId =
//       newMsg.id || `${newMsg.timestamp}-${newMsg.content}-${newMsg.sender}`;

//     if (messageIdsRef.current.has(messageId)) return;

//     messageIdsRef.current.add(messageId);
//     setMessages((prev) => [...prev, newMsg]);
//   }, []);

//   // 2️⃣ Notification WebSocket ulanish
//   useEffect(() => {
//     if (!token) return;

//     const notifUrl = `ws://5.133.122.226:8001/ws/notifications/?token=${token}`;
//     notifSocketRef.current = new WebSocket(notifUrl);

//     notifSocketRef.current.onopen = () => {
//       console.log("🔔 Notifications WS connected");
//     };

//     notifSocketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("🔔 Notification keldi:", data);

//         // Masalan, foydalanuvchi statusi o‘zgarishi yoki yangi chat haqida xabar
//         if (data.type === "user_status") {
//           setUsers((prev) =>
//             prev.map((u) =>
//               u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//             )
//           );
//         } else if (data.type === "new_message") {
//           // agar boshqa chatga xabar kelganini bildirish uchun
//           console.log("📩 New message notification:", data);
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = () => {
//       console.log("🔔 Notifications WS closed, reconnecting...");
//       setTimeout(() => {
//         if (token) {
//           notifSocketRef.current = new WebSocket(notifUrl);
//         }
//       }, 3000);
//     };

//     notifSocketRef.current.onerror = (err) => {
//       console.error("🔔 Notifications WS error:", err);
//     };

//     return () => {
//       notifSocketRef.current?.close(1000, "Unmounting notifications WS");
//     };
//   }, [token]);

//   // 3️⃣ Chat room olish va WS ulash
//   useEffect(() => {
//     if (!selectedUser || !user?.id || !token) return;

//     const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     )
//       .then((res) => res.json())
//       .then(async (room) => {
//         if (!room?.chat_room) return;

//         setRoomId(room.chat_room);
//         messageIdsRef.current.clear();

//         // Messages olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${room.chat_room}`,
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );
//           const msgs = await msgRes.json();
//           if (Array.isArray(msgs)) {
//             setMessages(msgs);
//             msgs.forEach((msg) => {
//               const messageId =
//                 msg.id ||
//                 `${msg.timestamp || msg.created_at}-${msg.content}-${
//                   msg.sender
//                 }`;
//               messageIdsRef.current.add(messageId);
//             });
//           } else {
//             setMessages([]);
//           }
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // WebSocket ulash
//         if (socketRef.current) {
//           socketRef.current.close();
//         }
//         const wsUrl = `ws://5.133.122.226:8001/ws/chat/chat_room/${room.chat_room}/?token=${token}`;
//         socketRef.current = new WebSocket(wsUrl);

//         socketRef.current.onopen = () => console.log("💬 Chat WS connected");
//         socketRef.current.onmessage = (e) => {
//           try {
//             const newMsg = JSON.parse(e.data);
//             if (
//               newMsg.type === "chat_message" ||
//               newMsg.type === "text" ||
//               newMsg.type === "message"
//             ) {
//               const processedMsg = {
//                 ...newMsg,
//                 id: newMsg.id || `ws-${Date.now()}-${Math.random()}`,
//                 timestamp:
//                   newMsg.timestamp ||
//                   newMsg.created_at ||
//                   new Date().toISOString(),
//                 sender:
//                   typeof newMsg.sender === "object"
//                     ? newMsg.sender.fio || newMsg.sender.username || "unknown"
//                     : newMsg.sender || "unknown",
//               };
//               addMessageSafely(processedMsg);
//             }
//           } catch (err) {
//             console.error("Chat WS parse error:", err);
//           }
//         };
//         socketRef.current.onclose = () => console.log("💬 Chat WS closed");
//         socketRef.current.onerror = (err) =>
//           console.error("💬 Chat WS error:", err);
//       })
//       .catch(console.error);

//     return () => {
//       socketRef.current?.close(1000, "Unmounting chat WS");
//     };
//   }, [selectedUser, token, user?.id, addMessageSafely]);

//   // 4️⃣ Scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 5️⃣ Send message
//   const sendMessage = async () => {
//     if (!content.trim() || !roomId || !user?.id) return;

//     const messageId = `local-${Date.now()}-${Math.random()}`;
//     const newMsg = {
//       chat_room: roomId,
//       type: "text",
//       content: content.trim(),
//       message_type: "text",
//       timestamp: new Date().toISOString(),
//       sender: "me",
//       id: messageId,
//     };

//     setContent("");
//     addMessageSafely(newMsg);

//     try {
//       await fetch("http://5.133.122.226:8001/api/chat/messages/send_message/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           ...newMsg,
//           sender: user.id,
//         }),
//       });
//     } catch (error) {
//       setContent(newMsg.content);
//     }

//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify(newMsg));
//     }
//   };

//   if (!user) {
//     return (
//       <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => setSelectedUser(user)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedUser?.id === user.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {user.fio?.charAt(0) || "?"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {user.fio || user.username || "No Name"}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   {user.is_online ? "Online" : "Last seen recently"}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {selectedUser && (
//           <div className="p-4 bg-white border-b border-gray-200 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//               {selectedUser.fio?.charAt(0) || "?"}
//             </div>
//             <div>
//               <div className="font-medium text-gray-900 text-sm">
//                 {selectedUser.fio || selectedUser.username || "No Name"}
//               </div>
//               <div className="text-xs text-gray-500">
//                 {selectedUser.is_online ? "online" : "offline"}
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//           {messages.map((msg, index) => (
//             <div
//               key={msg.id || index}
//               className={`flex ${
//                 msg.sender === "me" ? "justify-end" : "justify-start"
//               }`}
//             >
//               {msg.sender !== "me" && (
//                 <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                   {typeof msg.sender === "string"
//                     ? msg.sender
//                     : msg.sender?.username}
//                 </div>
//               )}

//               <div className="flex flex-col max-w-[75%]">
//                 {msg.sender !== "me" && (
//                   <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                     {typeof msg.sender === "object"
//                       ? msg.sender.fio || msg.sender.username
//                       : msg.sender}
//                   </div>
//                 )}

//                 <div
//                   className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                     msg.sender === "me"
//                       ? "bg-blue-500 text-white rounded-br-md ml-auto"
//                       : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
//                   }`}
//                 >
//                   <div className="text-sm leading-relaxed">{msg.content}</div>

//                   <div
//                     className={`text-xs mt-2 ${
//                       msg.sender === "me" ? "text-blue-100" : "text-gray-500"
//                     }`}
//                   >
//                     {new Date(
//                       msg.timestamp || msg.created_at
//                     ).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </div>
//                 </div>
//               </div>

//               {msg.sender === "me" && (
//                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
//                   Me
//                 </div>
//               )}
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               placeholder="Type your message..."
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//             />
//             <button
//               onClick={sendMessage}
//               disabled={!content.trim() || !roomId}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
//             >
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";

// export default function TelegramStyleChat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);

//   const token = localStorage.getItem("access_token");

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       // Agar sender object bo'lsa
//       let senderName = "unknown";
//       let senderId = "unknown";

//       if (typeof msg.sender === "object" && msg.sender !== null) {
//         senderName = msg.sender.fio || msg.sender.username || "unknown";
//         senderId = msg.sender.id || "unknown";
//       } else if (typeof msg.sender === "string") {
//         senderName = msg.sender;
//         senderId = msg.sender;
//       }

//       return {
//         ...msg,
//         id: msg.id || `msg-${Date.now()}-${Math.random()}`,
//         timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
//         sender: senderId,
//         sender_name: senderName,
//         content: msg.content || "",
//         message_type: msg.message_type || "text",
//         is_my_message: msg.sender === user?.id || senderId === user?.id,
//       };
//     },
//     [user?.id]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       const formattedMsg = formatMessage(newMsg);
//       const messageId = formattedMsg.id;

//       if (messageIdsRef.current.has(messageId)) {
//         console.log("Duplicate message skipped:", messageId);
//         return;
//       }

//       messageIdsRef.current.add(messageId);
//       setMessages((prev) => [...prev, formattedMsg]);
//     },
//     [formatMessage]
//   );

//   // 1️⃣ Foydalanuvchilarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetch("http://5.133.122.226:8001/api/employee/", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setUsers(data.filter((u) => u.id !== user.id));
//         }
//       })
//       .catch((error) => {
//         console.error("Foydalanuvchilarni olishda xatolik:", error);
//       });
//   }, [token, user?.id]);

//   // 2️⃣ Notification WebSocket ulanish
//   useEffect(() => {
//     if (!token) return;

//     const notifUrl = `ws://5.133.122.226:8001/ws/notifications/?token=${token}`;
//     notifSocketRef.current = new WebSocket(notifUrl);

//     notifSocketRef.current.onopen = () => {
//       console.log("🔔 Notifications WS connected");
//     };

//     notifSocketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("🔔 Notification keldi:", data);

//         if (data.type === "user_status") {
//           setUsers((prev) =>
//             prev.map((u) =>
//               u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//             )
//           );
//         } else if (data.type === "new_message") {
//           console.log("📩 New message notification:", data);
//         } else if (data.type === "notification") {
//           console.log("📢 General notification:", data.notification);
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log(
//         "🔔 Notifications WS closed, code:",
//         event.code,
//         "reason:",
//         event.reason
//       );
//       setTimeout(() => {
//         if (token) {
//           notifSocketRef.current = new WebSocket(notifUrl);
//         }
//       }, 3000);
//     };

//     notifSocketRef.current.onerror = (err) => {
//       console.error("🔔 Notifications WS error:", err);
//     };

//     return () => {
//       if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
//         notifSocketRef.current.close(1000, "Unmounting notifications WS");
//       }
//     };
//   }, [token]);

//   // WebSocket reconnect funksiyasi
//   const reconnectWebSocket = useCallback(() => {
//     if (!roomId || !token) {
//       console.log("Reconnect uchun roomId yoki token yo'q");
//       return;
//     }

//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       console.log("WebSocket allaqachon ochiq");
//       return;
//     }

//     console.log("WebSocket qayta ulanmoqda...");

//     const wsUrl = `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;
//     socketRef.current = new WebSocket(wsUrl);

//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS reconnected");
//       setIsConnected(true);
//     };

//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           const newMsg = data.message;
//           addMessageSafely(newMsg);
//         } else if (data.content && (data.sender || data.sender_id)) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log(
//         "💬 Chat WS closed, code:",
//         event.code,
//         "reason:",
//         event.reason
//       );
//       setIsConnected(false);
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 Chat WS error:", err);
//       setIsConnected(false);
//     };
//   }, [roomId, token, addMessageSafely]);

//   // 3️⃣ Chat room olish va WS ulash
//   useEffect(() => {
//     if (!selectedUser || !user?.id || !token) {
//       console.log("Chat room olish uchun shartlar bajarilmagan");
//       return;
//     }

//     console.log("Chat room olinmoqda...", selectedUser.id);

//     const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//     fetch(
//       `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     )
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then(async (roomData) => {
//         console.log("Room data received:", roomData);

//         if (!roomData?.chat_room) {
//           console.log("Chat room topilmadi");
//           return;
//         }

//         setRoomId(roomData.chat_room);
//         messageIdsRef.current.clear();

//         // Messages olish
//         try {
//           const msgRes = await fetch(
//             `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${roomData.chat_room}`,
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );

//           if (!msgRes.ok) throw new Error("Messages olishda xatolik");

//           const msgs = await msgRes.json();
//           console.log("Messages received:", msgs);

//           if (Array.isArray(msgs)) {
//             const formattedMessages = msgs.map((msg) => formatMessage(msg));
//             setMessages(formattedMessages);
//             formattedMessages.forEach((msg) => {
//               messageIdsRef.current.add(msg.id);
//             });
//           } else {
//             setMessages([]);
//           }
//         } catch (err) {
//           console.error("Messages olishda xatolik:", err);
//           setMessages([]);
//         }

//         // Eski WebSocket ni yopish
//         if (socketRef.current) {
//           socketRef.current.close(1000, "New room selection");
//         }

//         // Yangi WebSocket ulash
//         reconnectWebSocket();
//       })
//       .catch((error) => {
//         console.error("Chat room olishda xatolik:", error);
//       });

//     return () => {
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         socketRef.current.close(1000, "Unmounting chat WS");
//       }
//     };
//   }, [selectedUser, token, user?.id, reconnectWebSocket, formatMessage]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && token) {
//       reconnectInterval = setInterval(() => {
//         if (socketRef.current?.readyState !== WebSocket.OPEN) {
//           console.log("WebSocket yopiq, qayta ulanmoqda...");
//           reconnectWebSocket();
//         }
//       }, 5000);
//     }

//     return () => {
//       if (reconnectInterval) {
//         clearInterval(reconnectInterval);
//       }
//     };
//   }, [roomId, token, reconnectWebSocket]);

//   // 4️⃣ Scroll
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 5️⃣ Send message
//   const sendMessage = async () => {
//     if (!content.trim() || !roomId || !user?.id) {
//       console.log("Message yuborish uchun shartlar bajarilmagan");
//       return;
//     }

//     const messageData = {
//       chat_room: roomId,
//       content: content.trim(),
//       message_type: "text",
//     };

//     setContent("");

//     try {
//       console.log("API ga message yuborilmoqda...", messageData);

//       // Faqat API orqali yuboramiz
//       const response = await fetch(
//         "http://5.133.122.226:8001/api/chat/messages/send_message/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(messageData),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       // ❌ Endi bu joyda local qo‘shmaymiz
//       // ✅ Xabarni backend WS orqali qaytaradi, biz uni addMessageSafely() bilan olamiz
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);
//       alert(`Message yuborishda xatolik: ${error.message}`);
//     }
//   };

//   // Connection statusini tekshirish
//   useEffect(() => {
//     const checkConnection = () => {
//       if (socketRef.current) {
//         const state = socketRef.current.readyState;
//         const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
//         console.log(`WebSocket holati: ${states[state]} (${state})`);
//       }
//     };

//     const interval = setInterval(checkConnection, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   if (!user) {
//     return (
//       <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//           <div className="text-xs text-gray-500 mt-1">
//             Status: {isConnected ? "🟢" : "🔴"}
//           </div>
//         </div>
//         <div className="flex-1 overflow-y-auto">
//           {users.map((userItem) => (
//             <div
//               key={userItem.id}
//               onClick={() => setSelectedUser(userItem)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedUser?.id === userItem.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {userItem.fio?.charAt(0) || userItem.username?.charAt(0) || "?"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {userItem.fio || userItem.username || "No Name"}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5 flex items-center">
//                   <span
//                     className={`w-2 h-2 rounded-full mr-1 ${
//                       userItem.is_online ? "bg-green-500" : "bg-gray-400"
//                     }`}
//                   ></span>
//                   {userItem.is_online ? "Online" : "Offline"}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {selectedUser ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedUser.fio?.charAt(0) ||
//                     selectedUser.username?.charAt(0) ||
//                     "?"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedUser.fio || selectedUser.username || "No Name"}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     <span
//                       className={`w-2 h-2 rounded-full mr-1 ${
//                         selectedUser.is_online ? "bg-green-500" : "bg-gray-400"
//                       }`}
//                     ></span>
//                     {selectedUser.is_online ? "online" : "offline"}
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500">
//                 Room: {roomId ? roomId.slice(0, 8) + "..." : "Loading..."}
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//               {messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage =
//                     msg.is_my_message || msg.sender === user.id;
//                   const senderName =
//                     msg.sender_name ||
//                     (typeof msg.sender === "object"
//                       ? msg.sender.fio || msg.sender.username
//                       : isMyMessage
//                       ? "Me"
//                       : "User");

//                   return (
//                     <div
//                       key={msg.id || index}
//                       className={`flex ${
//                         isMyMessage ? "justify-end" : "justify-start"
//                       }`}
//                     >
//                       {!isMyMessage && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {!isMyMessage && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md" // mening xabarim
//                               : "bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200" // menga kelgan
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.content}
//                           </div>

//                           <div
//                             className={`text-xs mt-2 flex justify-end ${
//                               isMyMessage ? "text-blue-100" : "text-gray-500"
//                             }`}
//                           >
//                             {new Date(msg.timestamp).toLocaleTimeString([], {
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             })}
//                             {msg.id?.startsWith("local-") && " ⏳"}
//                           </div>
//                         </div>
//                       </div>

//                       {isMyMessage && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
//                           Me
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
//               <div className="flex-1 relative">
//                 <input
//                   type="text"
//                   placeholder="Type your message..."
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!roomId || !isConnected}
//                 />
//                 <button
//                   onClick={sendMessage}
//                   disabled={!content.trim() || !roomId || !isConnected}
//                   className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
//                 >
//                   <svg
//                     className="w-5 h-5"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a user to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose someone from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }