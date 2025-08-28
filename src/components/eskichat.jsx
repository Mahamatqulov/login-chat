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

//////////////////////////////

// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { FaUserFriends } from "react-icons/fa";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [groupId, setGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("users");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);

//   const token = localStorage.getItem("access_token");

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       let senderName = "unknown";
//       let senderId = "unknown";

//       // Sender ni aniqlash
//       if (typeof msg.sender === "object" && msg.sender !== null) {
//         senderName = msg.sender.fio || msg.sender.username || "unknown";
//         senderId = msg.sender.id || "unknown";
//       } else if (typeof msg.sender === "string") {
//         // Agar sender ID bo'lsa
//         if (msg.sender === user?.id) {
//           senderName = "Me";
//           senderId = user.id;
//         } else {
//           // Boshqa user bo'lsa, users ro'yxatidan topish
//           const senderUser = users.find((u) => u.id === msg.sender);
//           senderName = senderUser?.fio || senderUser?.username || "User";
//           senderId = msg.sender;
//         }
//       }

//       return {
//         ...msg,
//         id: msg.id || `msg-${Date.now()}-${Math.random()}`,
//         timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
//         sender: senderId,
//         sender_name: senderName,
//         content: msg.content || "",
//         message_type: msg.message_type || "text",
//         is_my_message: senderId === user?.id,
//       };
//     },
//     [user?.id, users]
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

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 100);
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

//   // 1.1️⃣ Guruhlarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetchGroups();
//   }, [token, user?.id]);

//   // Guruhlarni yangilash funksiyasi
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch("http://5.133.122.226:8001/api/chat/groups/", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setGroupId(data);

//           // faqat id larni olish
//           const groupId = data.map((group) => group.id);
//           console.log("Group IDs:", groupId);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

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
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
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
//   }, [token, selectedGroup, addMessageSafely, fetchGroups]);

//   // WebSocket reconnect funksiyasi
//   const reconnectWebSocket = useCallback(() => {
//     if (!roomId || !token || !groupId) return;

//     if (socketRef.current?.readyState === WebSocket.OPEN) return;

//     console.log("WebSocket qayta ulanmoqda...");

//     // Agar guruh chat bo'lsa, boshqa URL ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const wsUrl = isGroupChat
//       ? `ws://5.133.122.226:8001/ws/chat/group/${groupId}/?token=${token}`
//       : `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;

//     socketRef.current = new WebSocket(wsUrl);

//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       setIsConnected(true);
//     };

//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         // Turli xil message formatlarini qayta ishlash
//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log("💬 Chat WS closed");
//       setIsConnected(false);
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 Chat WS error:", err);
//       setIsConnected(false);
//     };
//   }, [roomId, token, addMessageSafely, selectedGroup]);

//   // 3️⃣ Chat room olish va WS ulash (shaxsiy chat yoki guruh chat)
//   useEffect(() => {
//     if ((!selectedUser && !selectedGroup) || !user?.id || !token) return;

//     console.log(
//       "Chat room olinmoqda...",
//       selectedUser?.id || selectedGroup?.id
//     );
//     setIsLoading(true);

//     // Agar guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/groups/${selectedGroup.id}/messages/`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           console.log("Group messages received:", msgs);

//           if (Array.isArray(msgs)) {
//             const formattedMessages = msgs.map((msg) => formatMessage(msg));
//             setMessages(formattedMessages);
//             formattedMessages.forEach((msg) => {
//               messageIdsRef.current.add(msg.id);
//             });
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });

//       // Eski WebSocket ni yopish
//       if (socketRef.current) {
//         socketRef.current.close(1000, "New room selection");
//       }

//       // Yangi WebSocket ulash
//       reconnectWebSocket();
//       return;
//     }

//     // Agar shaxsiy user tanlangan bo'lsa
//     if (selectedUser) {
//       const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//       fetch(
//         `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then(async (roomData) => {
//           console.log("Room data received:", roomData);

//           if (!roomData?.chat_room) {
//             throw new Error("Chat room topilmadi");
//           }

//           setRoomId(roomData.chat_room);
//           messageIdsRef.current.clear();

//           // Messages olish
//           try {
//             const msgRes = await fetch(
//               `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${roomData.chat_room}`,
//               {
//                 headers: { Authorization: `Bearer ${token}` },
//               }
//             );

//             if (!msgRes.ok) throw new Error("Messages olishda xatolik");

//             const msgs = await msgRes.json();
//             console.log("Messages received:", msgs);

//             if (Array.isArray(msgs)) {
//               const formattedMessages = msgs.map((msg) => formatMessage(msg));
//               setMessages(formattedMessages);
//               formattedMessages.forEach((msg) => {
//                 messageIdsRef.current.add(msg.id);
//               });
//             }
//           } catch (err) {
//             console.error("Messages olishda xatolik:", err);
//           }

//           // Eski WebSocket ni yopish
//           if (socketRef.current) {
//             socketRef.current.close(1000, "New room selection");
//           }

//           // Yangi WebSocket ulash
//           reconnectWebSocket();
//         })
//         .catch((error) => {
//           console.error("Chat room olishda xatolik:", error);
//           alert("Chat room olishda xatolik: " + error.message);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });
//     }

//     return () => {
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         socketRef.current.close(1000, "Unmounting chat WS");
//       }
//     };
//   }, [
//     selectedUser,
//     selectedGroup,
//     token,
//     user?.id,
//     reconnectWebSocket,
//     formatMessage,
//   ]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && token) {
//       reconnectInterval = setInterval(() => {
//         if (socketRef.current?.readyState !== WebSocket.OPEN) {
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
//     if (!content.trim() || !roomId || !user?.id) return;

//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Agar guruh bo'lsa, boshqa API endpoint ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const messageData = isGroupChat
//       ? {
//           group: roomId,
//           content: content.trim(),
//           message_type: "text",
//         }
//       : {
//           chat_room: roomId,
//           content: content.trim(),
//           message_type: "text",
//         };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       // Local message belgisi
//       is_local: true,
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       // API orqali yuborish
//       const endpoint = isGroupChat
//         ? "http://5.133.122.226:8001/api/chat/groups/send_message/"
//         : "http://5.133.122.226:8001/api/chat/messages/send_message/";

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       // Agar API dan qaytgan message local messagedan farq qilsa, yangilash
//       if (responseData.id && responseData.id !== messageId) {
//         // Local messageni olib tashlash
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);

//         // API dan qaytgan messageni qo'shish
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       // Xatolik bo'lsa, messageni qayta tiklash
//       setContent(content.trim());

//       // Local messageni olib tashlash
//       setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//       messageIdsRef.current.delete(messageId);
//     }
//   };

//   // Guruh yaratish funksiyasi
//   const createGroup = async () => {
//     if (!newGroupName.trim() || selectedMembers.length === 0) {
//       alert("Guruh nomi va a'zolar tanlanishi shart");
//       return;
//     }

//     try {
//       const memberIds = selectedMembers.map((member) => member.id);
//       memberIds.push(user.id); // Adminni ham qo'shamiz

//       const response = await fetch(
//         "http://5.133.122.226:8001/api/chat/groups/create_group/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newGroupDescription,
//             is_public: isPublicGroup,
//             member_ids: memberIds,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Guruh yaratishda xatolik");
//       }

//       const groupData = await response.json();
//       console.log("Guruh yaratildi:", groupData);

//       // Guruhlar ro'yxatini yangilash
//       fetchGroups();

//       // Modalni yopish va formani tozalash
//       setShowCreateGroupModal(false);
//       setNewGroupName("");
//       setNewGroupDescription("");
//       setSelectedMembers([]);
//       setIsPublicGroup(true);

//       alert("Guruh muvaffaqiyatli yaratildi!");
//     } catch (error) {
//       console.error("Guruh yaratishda xatolik:", error);
//       alert("Guruh yaratishda xatolik: " + error.message);
//     }
//   };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     if (chat.chat_type === "group") {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   // Joriy tanlangan chat
//   const currentChat = selectedUser || selectedGroup;

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//             <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button>
//           </div>
//           <div className="text-xs text-gray-500 mt-1">
//             Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "users"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("users")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <FaUserFriends size={14} />
//               <span>Contacts</span>
//             </div>
//           </button>
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {activeTab === "users"
//             ? // Foydalanuvchilar ro'yxati
//               users.map((userItem) => (
//                 <div
//                   key={userItem.id}
//                   onClick={() => selectChat(userItem)}
//                   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                     selectedUser?.id === userItem.id
//                       ? "bg-blue-50 border-r-2 border-blue-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                     {userItem.fio?.charAt(0) ||
//                       userItem.username?.charAt(0) ||
//                       "?"}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-gray-900 text-sm truncate">
//                       {userItem.fio || userItem.username || "No Name"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5 flex items-center">
//                       <span
//                         className={`w-2 h-2 rounded-full mr-1 ${
//                           userItem.is_online ? "bg-green-500" : "bg-gray-400"
//                         }`}
//                       ></span>
//                       {userItem.is_online ? "Online" : "Offline"}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             : // Guruhlar ro'yxati
//               groups.map((group) => (
//                 <div
//                   key={group.id}
//                   onClick={() => selectChat(group)}
//                   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                     selectedGroup?.id === group.id
//                       ? "bg-blue-50 border-r-2 border-blue-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                     {group.name?.charAt(0) || "G"}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-gray-900 text-sm truncate">
//                       {group.name || "No Name"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5">
//                       {group.member_count} members • {group.group_type}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedUser
//                     ? selectedUser.fio?.charAt(0) ||
//                       selectedUser.username?.charAt(0) ||
//                       "?"
//                     : selectedGroup.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedUser
//                       ? selectedUser.fio || selectedUser.username || "No Name"
//                       : selectedGroup.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     {selectedUser ? (
//                       <>
//                         <span
//                           className={`w-2 h-2 rounded-full mr-1 ${
//                             selectedUser.is_online
//                               ? "bg-green-500"
//                               : "bg-gray-400"
//                           }`}
//                         ></span>
//                         {selectedUser.is_online ? "online" : "offline"}
//                       </>
//                     ) : (
//                       <>
//                         <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                         {selectedGroup.member_count} members
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.is_my_message;
//                   const senderName = msg.sender_name;

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
//                         {!isMyMessage && !selectedUser && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
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
//                   disabled={!roomId || !isConnected || isLoading}
//                 />
//                 <button
//                   onClick={sendMessage}
//                   disabled={
//                     !content.trim() || !roomId || !isConnected || isLoading
//                   }
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
//                 Select a user or group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose someone from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

/*

"use client";
import { useEffect, useState } from "react";

export default function GroupsPage() {
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    is_public: true,
    members: [],
  });

  const token = localStorage.getItem("accses_token");
  useEffect(() => {
    fetch("http://5.133.122.226:8001/api/employee/")
      .then((res) => res.json())
      .then((data) => setEmployees(data));
  }, []);

  // Guruhlarni olish
  useEffect(() => {
    if (!token) return;
    fetch("http://5.133.122.226:8001/api/chat/groups/", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // agar data massiv bo'lsa
        if (Array.isArray(data)) {
          setGroups(data);
        }
        // agar data.results bo'lsa
        else if (Array.isArray(data.results)) {
          setGroups(data.results);
        } else {
          setGroups([]);
        }
      })
      .catch((err) => console.error(err));
  }, [token]);

  // Guruh yaratish
  const handleCreateGroup = async () => {
    console.log("API-ga ketayotgan ma'lumot:", newGroup);

    await fetch("http://5.133.122.226:8001/api/chat/groups/create_group/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ✅ JSON yuborishi uchun shart
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newGroup),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API javobi:", data); // ✅ API qaytargan ma'lumot ham chiqadi
      })
      .catch((err) => console.error("Xato:", err));

    setIsModalOpen(false);
  };

  // User qo‘shish/olib tashlash
  const toggleMember = (id) => {
    setNewGroup((prev) => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter((m) => m !== id)
        : [...prev.members, id],
    }));
  };

  return (
    <div className="flex h-[90vh] bg-gray-50 p-6 gap-6">
   //   {/* Users */
//       <div className="w-1/2 bg-white p-4 rounded-lg shadow">
//         <h2 className="text-lg font-semibold mb-4">Users</h2>
//         <ul className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
//           {employees.map((emp) => (
//             <li
//               key={emp.id}
//               className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
//             >
//               {emp.fio || "Ismi yo'q"}{" "}
//               <span className="text-gray-500">@{emp.username}</span>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Groups */}
//       <div className="w-1/2 bg-white p-4 rounded-lg shadow flex flex-col">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold">Groups</h2>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
//           >
//             + Guruh yaratish
//           </button>
//         </div>
//         <ul className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
//           {groups.map((group) => (
//             <li
//               key={group.id}
//               className="p-2 border rounded-md hover:bg-gray-100 cursor-pointer"
//             >
//               <div className="font-medium">{group.name}</div>
//               <div className="text-sm text-gray-500">
//                 {group.is_public ? "Public" : "Private"}
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white w-[500px] rounded-lg shadow-lg p-6">
//             <h3 className="text-xl font-semibold mb-4">Yangi guruh yaratish</h3>
//             <div className="flex flex-col gap-3">
//               <input
//                 type="text"
//                 placeholder="Guruh nomi"
//                 className="border p-2 rounded-md"
//                 value={newGroup.name}
//                 onChange={(e) =>
//                   setNewGroup({ ...newGroup, name: e.target.value })
//                 }
//               />
//               <textarea
//                 placeholder="Description"
//                 className="border p-2 rounded-md"
//                 value={newGroup.description}
//                 onChange={(e) =>
//                   setNewGroup({ ...newGroup, description: e.target.value })
//                 }
//               />
//               <div className="flex items-center gap-2">
//                 <label className="flex items-center gap-1">
//                   <input
//                     type="radio"
//                     name="privacy"
//                     checked={newGroup.is_public}
//                     onChange={() =>
//                       setNewGroup({ ...newGroup, is_public: true })
//                     }
//                   />
//                   Public
//                 </label>
//                 <label className="flex items-center gap-1">
//                   <input
//                     type="radio"
//                     name="privacy"
//                     checked={!newGroup.is_public}
//                     onChange={() =>
//                       setNewGroup({ ...newGroup, is_public: false })
//                     }
//                   />
//                   Private
//                 </label>
//               </div>

//               <div className="max-h-[200px] overflow-y-auto border p-2 rounded-md">
//                 <h4 className="font-medium mb-2">Users tanlang:</h4>
//                 {employees.map((emp) => (
//                   <label
//                     key={emp.id}
//                     className="flex items-center gap-2 cursor-pointer mb-1"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={newGroup.members.includes(emp.id)}
//                       onChange={() => toggleMember(emp.id)}
//                     />
//                     {emp.fio}{" "}
//                     <span className="text-gray-500">@{emp.username}</span>
//                   </label>
//                 ))}
//               </div>

//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="px-3 py-1 border rounded-md"
//                 >
//                   Bekor qilish
//                 </button>
//                 <button
//                   onClick={handleCreateGroup}
//                   className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
//                 >
//                   Yaratish
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

//////////// chat


"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublicGroup, setIsPublicGroup] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const notifSocketRef = useRef(null);
  const isComponentMounted = useRef(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Message formatini to'g'rilash funksiyasi
  const formatMessage = useCallback(
    (msg) => {
      let senderName = "unknown";
      let senderId = "unknown";

      // Sender ni aniqlash
      if (typeof msg.sender === "object" && msg.sender !== null) {
        senderName = msg.sender.fio || msg.sender.username || "unknown";
        senderId = msg.sender.id || "unknown";
      } else if (typeof msg.sender === "string") {
        // Agar sender ID bo'lsa
        if (msg.sender === user?.id) {
          senderName = "Me";
          senderId = user.id;
        } else {
          // Boshqa user bo'lsa, users ro'yxatidan topish
          const senderUser = users.find((u) => u.id === msg.sender);
          senderName = senderUser?.fio || senderUser?.username || "User";
          senderId = msg.sender;
        }
      }

      return {
        ...msg,
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
        sender: senderId,
        sender_name: senderName,
        content: msg.content || "",
        message_type: msg.message_type || "text",
        is_my_message: senderId === user?.id,
      };
    },
    [user?.id, users]
  );

  // Xavfsiz message qo'shish
  const addMessageSafely = useCallback(
    (newMsg) => {
      if (!isComponentMounted.current) return;

      const formattedMsg = formatMessage(newMsg);
      const messageId = formattedMsg.id;

      if (messageIdsRef.current.has(messageId)) {
        console.log("Duplicate message skipped:", messageId);
        return;
      }

      messageIdsRef.current.add(messageId);
      setMessages((prev) => [...prev, formattedMsg]);

      // Yangi message qo'shilganda scroll qilish
      setTimeout(() => {
        if (isComponentMounted.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    },
    [formatMessage]
  );

  // 1️⃣ Foydalanuvchilarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`http://5.133.122.226:8001/api/employee/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          setUsers(data.filter((u) => u.id !== user.id));
        }
      })
      .catch((error) => {
        console.error("Foydalanuvchilarni olishda xatolik:", error);
      });
  }, [token, user?.id]);

  // 1.1️⃣ Guruhlarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetchGroups();
  }, [token, user?.id]);

  // Guruhlarni yangilash funksiyasi
  // ...existing code...
  const fetchGroups = useCallback(() => {
    if (!token) return;

    fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          // dedupe by id and add chat_type
          const map = new Map();
          data.forEach((g) => {
            if (g && g.id != null) {
              map.set(g.id, { ...g, chat_type: "group" });
            }
          });
          const uniqueGroups = Array.from(map.values());
          console.log("Groups loaded (unique):", uniqueGroups);
          setGroups(uniqueGroups);
        }
      })
      .catch((error) => {
        console.error("Guruhlarni olishda xatolik:", error);
      });
  }, [token]);
  // ...existing code...

  const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, reason);
    }
  }, []);

  // 2️⃣ Notification WebSocket ulanish
  useEffect(() => {
    if (!token) return;

    const notifUrl = `ws://5.133.122.226:8001/ws/notifications/?token=${token}`;
    notifSocketRef.current = new WebSocket(notifUrl);

    notifSocketRef.current.onopen = () => {
      console.log("🔔 Notifications WS connected");
    };

    notifSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("🔔 Notification keldi:", data);

        if (!isComponentMounted.current) return;

        if (data.type === "user_status") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.user_id ? { ...u, is_online: data.is_online } : u
            )
          );
        } else if (
          data.type === "group_message" ||
          data.type === "group_update"
        ) {
          // Guruh yangilanishlari
          fetchGroups();

          // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
          if (
            selectedGroup &&
            data.message &&
            data.message.group === selectedGroup.id
          ) {
            addMessageSafely(data.message);
          }
        }
      } catch (err) {
        console.error("Notification parse error:", err);
      }
    };

    notifSocketRef.current.onclose = (event) => {
      console.log("🔔 Notifications WS closed");
      if (isComponentMounted.current && token) {
        setTimeout(() => {
          if (isComponentMounted.current && token) {
            notifSocketRef.current = new WebSocket(notifUrl);
          }
        }, 3000);
      }
    };

    notifSocketRef.current.onerror = (err) => {
      console.error("🔔 Notifications WS error:", err);
    };

    return () => {
      cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
    };
  }, [token, selectedGroup, addMessageSafely, fetchGroups, cleanupWebSocket]);

  // WebSocket reconnect funksiyasi
  // const reconnectWebSocket = useCallback(() => {
  //   const hasRequiredId = selectedGroup ? currentGroupId : roomId;
  //   if (!hasRequiredId || !token) return;
  //   if (socketRef.current?.readyState === WebSocket.OPEN) return;
  //   if (!isComponentMounted.current) return;

  //   console.log("WebSocket qayta ulanmoqda...");

  //   // Agar guruh chat bo'lsa, boshqa URL ishlatamiz
  //   const isGroupChat = selectedGroup !== null;
  //   const wsUrl = isGroupChat
  //     ? `ws://5.133.122.226:8001/ws/chat/group/${currentGroupId}/?token=${token}`
  //     : `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;

  //   socketRef.current = new WebSocket(wsUrl);

  //   socketRef.current.onopen = () => {
  //     console.log("💬 Chat WS connected");
  //     if (isComponentMounted.current) {
  //       setIsConnected(true);
  //     }
  //   };

  //   socketRef.current.onmessage = (e) => {
  //     try {
  //       const data = JSON.parse(e.data);
  //       console.log("WebSocket message received:", data);

  //       if (!isComponentMounted.current) return;

  //       // Turli xil message formatlarini qayta ishlash
  //       if (data.type === "chat_message" && data.message) {
  //         addMessageSafely(data.message);
  //       } else if (data.type === "group_message" && data.message) {
  //         addMessageSafely(data.message);
  //       } else if (data.content && data.sender) {
  //         addMessageSafely(data);
  //       } else if (data.type === "message") {
  //         addMessageSafely(data);
  //       }
  //     } catch (err) {
  //       console.error("WebSocket parse error:", err);
  //     }
  //   };

  //   socketRef.current.onclose = (event) => {
  //     console.log("💬 Chat WS closed");
  //     if (isComponentMounted.current) {
  //       setIsConnected(false);
  //     }
  //   };

  //   socketRef.current.onerror = (err) => {
  //     console.error("💬 Chat WS error:", err);
  //     if (isComponentMounted.current) {
  //       setIsConnected(false);
  //     }
  //   };
  // }, [roomId, token, currentGroupId, addMessageSafely, selectedGroup]);
  // ...existing code...
  const reconnectWebSocket = useCallback(() => {
    const targetId = selectedGroup?.id ?? currentGroupId ?? roomId;
    if (!targetId || !token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (!isComponentMounted.current) return;

    console.log("WebSocket qayta ulanmoqda... targetId:", targetId);

    const wsUrl = selectedGroup`ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;

    socketRef.current = new WebSocket(wsUrl);
    socketRef.current.onopen = () => {
      console.log("💬 Chat WS connected");
      if (isComponentMounted.current) {
        setIsConnected(true);
      }
    };
  }, [roomId, token, currentGroupId, addMessageSafely, selectedGroup]);
  // ...existing code...

  // 3️⃣ Chat room olish va WS ulash (shaxsiy chat yoki guruh chat)
  useEffect(() => {
    if ((!selectedUser && !selectedGroup) || !user?.id || !token) return;

    console.log(
      "Chat room olinmoqda...",
      selectedUser?.id || selectedGroup?.id
    );
    setIsLoading(true);

    // Agar guruh tanlangan bo'lsa
    if (selectedGroup) {
      setCurrentGroupId(selectedGroup.id);
      setRoomId(selectedGroup.id);
      messageIdsRef.current.clear();

      // Guruh messages olish
      fetch(
        `http://5.133.122.226:8001/api/chat/groups/${selectedGroup.id}/messages/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((msgs) => {
          console.log("Group messages received:", msgs);

          if (Array.isArray(msgs) && isComponentMounted.current) {
            const formattedMessages = msgs.map((msg) => formatMessage(msg));
            setMessages(formattedMessages);
            formattedMessages.forEach((msg) => {
              messageIdsRef.current.add(msg.id);
            });
          }
        })
        .catch((err) => {
          console.error("Group messages olishda xatolik:", err);
        })
        .finally(() => {
          if (isComponentMounted.current) {
            setIsLoading(false);
          }
        });

      // Eski WebSocket ni yopish
      cleanupWebSocket(socketRef.current, "New room selection");

      // Yangi WebSocket ulash
      setTimeout(() => {
        if (isComponentMounted.current) {
          reconnectWebSocket();
        }
      }, 100);
      return;
    }

    // Agar shaxsiy user tanlangan bo'lsa
    if (selectedUser) {
      setCurrentGroupId(null);
      const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
      fetch(
        `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then(async (roomData) => {
          console.log("Room data received:", roomData);

          if (!roomData?.chat_room) {
            throw new Error("Chat room topilmadi");
          }

          if (!isComponentMounted.current) return;

          setRoomId(roomData.chat_room);
          messageIdsRef.current.clear();

          // Messages olish
          try {
            const msgRes = await fetch(
              `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${roomData.chat_room}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!msgRes.ok) throw new Error("Messages olishda xatolik");

            const msgs = await msgRes.json();
            console.log("Messages received:", msgs);

            if (Array.isArray(msgs) && isComponentMounted.current) {
              const formattedMessages = msgs.map((msg) => formatMessage(msg));
              setMessages(formattedMessages);
              formattedMessages.forEach((msg) => {
                messageIdsRef.current.add(msg.id);
              });
            }
          } catch (err) {
            console.error("Messages olishda xatolik:", err);
          }

          // Eski WebSocket ni yopish
          cleanupWebSocket(socketRef.current, "New room selection");

          // Yangi WebSocket ulash
          setTimeout(() => {
            if (isComponentMounted.current) {
              reconnectWebSocket();
            }
          }, 100);
        })
        .catch((error) => {
          console.error("Chat room olishda xatolik:", error);
          if (isComponentMounted.current) {
            toast.error("Chat room olishda xatolik: " + error.message);
          }
        })
        .finally(() => {
          if (isComponentMounted.current) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      cleanupWebSocket(socketRef.current, "Unmounting chat WS");
    };
  }, [
    selectedUser,
    selectedGroup,
    token,
    user?.id,
    reconnectWebSocket,
    formatMessage,
    cleanupWebSocket,
  ]);

  // Reconnect useEffect
  useEffect(() => {
    let reconnectInterval;

    if (roomId && token && isComponentMounted.current) {
      reconnectInterval = setInterval(() => {
        if (
          socketRef.current?.readyState !== WebSocket.OPEN &&
          isComponentMounted.current
        ) {
          reconnectWebSocket();
        }
      }, 5000);
    }

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [roomId, token, reconnectWebSocket]);

  // 4️⃣ Scroll
  useEffect(() => {
    if (isComponentMounted.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 5️⃣ Send message
  const sendMessage = async () => {
    if (!content.trim() || !roomId || !user?.id || isSending) return;

    setIsSending(true);
    const messageId = `local-${Date.now()}-${Math.random()}`;

    // Agar guruh bo'lsa, boshqa API endpoint ishlatamiz
    const isGroupChat = selectedGroup !== null;
    const messageData = isGroupChat
      ? {
          group: currentGroupId,
          content: content.trim(),
          message_type: "text",
        }
      : {
          chat_room: roomId,
          content: content.trim(),
          message_type: "text",
        };

    // Local message yaratish (faqat o'zim ko'raman)
    const localMessage = {
      ...messageData,
      id: messageId,
      timestamp: new Date().toISOString(),
      sender: user.id,
      sender_info: {
        id: user.id,
        fio: user.fio,
        username: user.username,
      },
      // Local message belgisi
      is_local: true,
    };

    setContent("");
    addMessageSafely(localMessage);

    try {
      // API orqali yuborish
      const endpoint = isGroupChat
        ? `http://5.133.122.226:8001/api/chat/messages/send_message/`
        : `http://5.133.122.226:8001/api/chat/messages/send_message/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Message yuborishda xatolik");
      }

      const responseData = await response.json();
      console.log("API response:", responseData);

      // Agar API dan qaytgan message local messagedan farq qilsa, yangilash
      if (
        responseData.id &&
        responseData.id !== messageId &&
        isComponentMounted.current
      ) {
        // Local messageni olib tashlash
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);

        // API dan qaytgan messageni qo'shish
        addMessageSafely(responseData);
      }
    } catch (error) {
      console.error("Message yuborishda xatolik:", error);

      if (isComponentMounted.current) {
        // Xatolik bo'lsa, messageni qayta tiklash
        setContent(content.trim());

        // Local messageni olib tashlash
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);
      }
    } finally {
      if (isComponentMounted.current) {
        setIsSending(false);
      }
    }
  };

  // Guruh yaratish funksiyasi
  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.warn("Guruh nomi va a'zolar tanlanishi shart");
      return;
    }

    try {
      const memberIds = selectedMembers.map((member) => member.id);
      memberIds.push(user.id); // Adminni ham qo'shamiz

      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/groups/create_group/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            is_public: isPublicGroup,
            member_ids: memberIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Guruh yaratishda xatolik");
      }

      const groupData = await response.json();
      console.log("Guruh yaratildi:", groupData);

      // Guruhlar ro'yxatini yangilash
      fetchGroups();

      // Modalni yopish va formani tozalash
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
      setIsPublicGroup(true);

      toast.success("Guruh muvaffaqiyatli yaratildi!");
    } catch (error) {
      console.error("Guruh yaratishda xatolik:", error);
      toast.error("Guruh yaratishda xatolik: " + error.message);
    }
  };

  // A'zoni tanlash/olib tashlash
  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Chatni tanlash
  const selectChat = (chat) => {
    // single, reliable heuristic
    const isGroup =
      chat?.chat_type === "group" ||
      !!chat?.group_type ||
      typeof chat?.member_count === "number" ||
      (!!chat?.name && !chat?.username);

    if (isGroup) {
      setSelectedGroup(chat);
      setSelectedUser(null);
    } else {
      setSelectedUser(chat);
      setSelectedGroup(null);
    }
  };
  // Joriy tanlangan chat
  const currentChat = selectedUser || selectedGroup;

  if (!user) {
    return (
      <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
      <ToastContainer />
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-900 text-base">Chats</h2>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Create group"
            >
              <BsPlus size={20} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>
        </div>

        {/* Tablar */}
        <div className="flex border-b border-gray-200">
          {/* <button
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <div className="flex items-center justify-center gap-1">
              <FaUserFriends size={14} />
              <span>Contacts</span>
            </div>
          </button> */}
          <button
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === "groups"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            <div className="flex items-center justify-center gap-1">
              <BsPeople size={16} />
              <span>Groups</span>
            </div>
          </button>
        </div>
        {/* 
        <div className="flex-1 overflow-y-auto">
          {activeTab === "users"
            ? // Foydalanuvchilar ro'yxati
              users.map((userItem) => (
                <div
                  key={userItem.id}
                  onClick={() => selectChat(userItem)}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                    selectedUser?.id === userItem.id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                    {userItem.fio?.charAt(0) ||
                      userItem.username?.charAt(0) ||
                      "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {userItem.fio || userItem.username || "No Name"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-1 ${
                          userItem.is_online ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      {userItem.is_online ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              ))
            : // Guruhlar ro'yxati
              groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => selectChat(group)}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                    selectedGroup?.id === group.id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                    {group.name?.charAt(0) || "G"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {group.name || "No Name"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {group.member_count} members • {group.group_type}
                    </div>
                  </div>
                </div>
              ))}
        </div> */}
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {currentChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                  {selectedUser
                    ? selectedUser.fio?.charAt(0) ||
                      selectedUser.username?.charAt(0) ||
                      "?"
                    : selectedGroup.name?.charAt(0) || "G"}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {selectedUser
                      ? selectedUser.fio || selectedUser.username || "No Name"
                      : selectedGroup.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {selectedUser ? (
                      <>
                        <span
                          className={`w-2 h-2 rounded-full mr-1 ${
                            selectedUser.is_online
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        {selectedUser.is_online ? "online" : "offline"}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
                        {selectedGroup.member_count} members
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 cursor-pointer pr-5">
                <BsTelephoneForwardFill size={18} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">No messages yet</div>
                  <div className="text-sm">Start a conversation!</div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMyMessage = msg.is_my_message;
                  const senderName = msg.sender_name;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${
                        isMyMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMyMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
                          {senderName?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="flex flex-col max-w-[75%]">
                        {!isMyMessage && !selectedUser && (
                          <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
                            {senderName}
                          </div>
                        )}

                        <div
                          className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
                            isMyMessage
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {msg.content}
                          </div>

                          <div
                            className={`text-xs mt-2 flex justify-end ${
                              isMyMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {msg.id?.startsWith("local-") && " ⏳"}
                          </div>
                        </div>
                      </div>

                      {isMyMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
                          Me
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
                  disabled={!roomId || !isConnected || isLoading || isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !content.trim() ||
                    !roomId ||
                    !isConnected ||
                    isLoading ||
                    isSending
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">
                Select a user or group to start chatting
              </div>
              <div className="text-sm">
                Choose someone from the left sidebar
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guruh yaratish modali */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group description"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublicGroup}
                  onChange={(e) => setIsPublicGroup(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Public Group</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Members
              </label>
              <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some((m) => m.id === user.id)}
                      onChange={() => toggleMemberSelection(user)}
                      className="mr-2"
                    />
                    <span className="text-sm">{user.fio || user.username}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMembers.length} members selected
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("groups");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublicGroup, setIsPublicGroup] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const notifSocketRef = useRef(null);
  const isComponentMounted = useRef(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (notifSocketRef.current) {
        notifSocketRef.current.close();
      }
    };
  }, []);

  // Message formatini to'g'rilash funksiyasi
  const formatMessage = useCallback(
    (msg) => {
      let senderName = "unknown";
      let senderId = "unknown";

      // Sender ni aniqlash
      if (typeof msg.sender === "object" && msg.sender !== null) {
        senderName = msg.sender.fio || msg.sender.username || "unknown";
        senderId = msg.sender.id || "unknown";
      } else if (typeof msg.sender === "string") {
        // Agar sender ID bo'lsa
        if (msg.sender === user?.id) {
          senderName = "Me";
          senderId = user.id;
        } else {
          // Boshqa user bo'lsa, users ro'yxatidan topish
          const senderUser = users.find((u) => u.id === msg.sender);
          senderName = senderUser?.fio || senderUser?.username || "User";
          senderId = msg.sender;
        }
      }

      return {
        ...msg,
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
        sender: senderId,
        sender_name: senderName,
        content: msg.content || "",
        message_type: msg.message_type || "text",
        is_my_message: senderId === user?.id,
      };
    },
    [user?.id, users]
  );

  // Xavfsiz message qo'shish
  const addMessageSafely = useCallback(
    (newMsg) => {
      if (!isComponentMounted.current) return;

      const formattedMsg = formatMessage(newMsg);
      const messageId = formattedMsg.id;

      if (messageIdsRef.current.has(messageId)) {
        console.log("Duplicate message skipped:", messageId);
        return;
      }

      messageIdsRef.current.add(messageId);
      setMessages((prev) => [...prev, formattedMsg]);

      // Yangi message qo'shilganda scroll qilish
      setTimeout(() => {
        if (isComponentMounted.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    },
    [formatMessage]
  );

  // Foydalanuvchilarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`http://5.133.122.226:8001/api/employee/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          setUsers(data.filter((u) => u.id !== user.id));
        }
      })
      .catch((error) => {
        console.error("Foydalanuvchilarni olishda xatolik:", error);
      });
  }, [token, user?.id]);

  // Guruhlarni olish
  const fetchGroups = useCallback(() => {
    if (!token) return;

    fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          // dedupe by id and add chat_type
          const map = new Map();
          data.forEach((g) => {
            if (g && g.id != null) {
              map.set(g.id, { ...g, chat_type: "group" });
            }
          });
          const uniqueGroups = Array.from(map.values());
          console.log("Groups loaded (unique):", uniqueGroups);
          setGroups(uniqueGroups);
        }
      })
      .catch((error) => {
        console.error("Guruhlarni olishda xatolik:", error);
      });
  }, [token]);

  useEffect(() => {
    if (!user?.id || !token) return;
    fetchGroups();
  }, [token, user?.id, fetchGroups]);

  const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, reason);
    }
  }, []);

  // Notification WebSocket ulanish
  useEffect(() => {
    if (!token) return;

    const notifUrl = `ws://5.133.122.226:8001/ws/notifications/?token=${token}`;
    notifSocketRef.current = new WebSocket(notifUrl);

    notifSocketRef.current.onopen = () => {
      console.log("🔔 Notifications WS connected");
    };

    notifSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("🔔 Notification keldi:", data);

        if (!isComponentMounted.current) return;

        if (data.type === "user_status") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.user_id ? { ...u, is_online: data.is_online } : u
            )
          );
        } else if (
          data.type === "group_message" ||
          data.type === "group_update"
        ) {
          // Guruh yangilanishlari
          fetchGroups();

          // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
          if (
            selectedGroup &&
            data.message &&
            data.message.group === selectedGroup.id
          ) {
            addMessageSafely(data.message);
          }
        }
      } catch (err) {
        console.error("Notification parse error:", err);
      }
    };

    notifSocketRef.current.onclose = (event) => {
      console.log("🔔 Notifications WS closed");
      if (isComponentMounted.current && token) {
        setTimeout(() => {
          if (isComponentMounted.current && token) {
            notifSocketRef.current = new WebSocket(notifUrl);
          }
        }, 3000);
      }
    };

    notifSocketRef.current.onerror = (err) => {
      console.error("🔔 Notifications WS error:", err);
    };

    return () => {
      cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
    };
  }, [token, selectedGroup, addMessageSafely, fetchGroups, cleanupWebSocket]);

  // WebSocket yeniden bağlanma fonksiyonu
  const reconnectWebSocket = useCallback(() => {
    const targetId = selectedGroup?.id ?? currentGroupId ?? roomId;
    if (!targetId || !token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (!isComponentMounted.current) return;

    console.log("WebSocket qayta ulanmoqda... targetId:", targetId);

    // WebSocket URL'sini doğru şekilde oluştur
    const wsUrl = `ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;

    socketRef.current = new WebSocket(wsUrl);
    socketRef.current.onopen = () => {
      console.log("💬 Chat WS connected");
      if (isComponentMounted.current) {
        setIsConnected(true);
      }
    };
    
    // WebSocket mesaj işleyicilerini ekle
    socketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("💬 WebSocket message:", data);
        
        if (data.type === 'chat_message' && data.message) {
          addMessageSafely(data.message);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
    
    socketRef.current.onclose = (event) => {
      console.log("💬 WebSocket closed");
      if (isComponentMounted.current) {
        setIsConnected(false);
      }
    };
    
    socketRef.current.onerror = (err) => {
      console.error("💬 WebSocket error:", err);
    };
  }, [token, currentGroupId, addMessageSafely, selectedGroup]);

  // Chat room olish va WS ulash (guruh chat)
  useEffect(() => {
    if (!selectedGroup || !user?.id || !token) return;

    console.log("Guruh chat room olinmoqda...", selectedGroup?.id);
    setIsLoading(true);

    // Guruh tanlangan bo'lsa
    if (selectedGroup) {
      setCurrentGroupId(selectedGroup.id);
      setRoomId(selectedGroup.id);
      messageIdsRef.current.clear();

      // Guruh messages olish
      fetch(
        `http://5.133.122.226:8001/api/chat/messages/?group_id=${selectedGroup.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((msgs) => {
          console.log("Group messages received:", msgs);

          if (Array.isArray(msgs) && isComponentMounted.current) {
            const formattedMessages = msgs.map((msg) => formatMessage(msg));
            setMessages(formattedMessages);
            formattedMessages.forEach((msg) => {
              messageIdsRef.current.add(msg.id);
            });
          }
        })
        .catch((err) => {
          console.error("Group messages olishda xatolik:", err);
        })
        .finally(() => {
          if (isComponentMounted.current) {
            setIsLoading(false);
          }
        });

      // Eski WebSocket ni yopish
      cleanupWebSocket(socketRef.current, "New room selection");

      // Yangi WebSocket ulash
      setTimeout(() => {
        if (isComponentMounted.current) {
          reconnectWebSocket();
        }
      }, 100);
    }

    return () => {
      cleanupWebSocket(socketRef.current, "Unmounting chat WS");
    };
  }, [
    selectedGroup,
    token,
    user?.id,
    reconnectWebSocket,
    formatMessage,
    cleanupWebSocket,
  ]);

  // Reconnect useEffect
  useEffect(() => {
    let reconnectInterval;

    if (roomId && token && isComponentMounted.current) {
      reconnectInterval = setInterval(() => {
        if (
          socketRef.current?.readyState !== WebSocket.OPEN &&
          isComponentMounted.current
        ) {
          reconnectWebSocket();
        }
      }, 5000);
    }

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [roomId, token, reconnectWebSocket]);

  // Scroll
  useEffect(() => {
    if (isComponentMounted.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!content.trim() || !currentGroupId || !user?.id || isSending) return;

    setIsSending(true);
    const messageId = `local-${Date.now()}-${Math.random()}`;

    // Grup mesajı için doğru veri yapısı
    const messageData = {
      group: currentGroupId,  // currentGroupId kullan
      content: content.trim(),
      message_type: "text",
    };

    // Local message yaratish (faqat o'zim ko'raman)
    const localMessage = {
      ...messageData,
      id: messageId,
      timestamp: new Date().toISOString(),
      sender: user.id,
      sender_info: {
        id: user.id,
        fio: user.fio,
        username: user.username,
      },
      is_local: true,
    };

    setContent("");
    addMessageSafely(localMessage);

    try {
      // Doğru API endpoint
      const endpoint = `http://5.133.122.226:8001/api/chat/messages/send_message/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Message yuborishda xatolik");
      }

      const responseData = await response.json();
      console.log("API response:", responseData);

      // Local mesajı kaldır ve API'den gelen mesajı ekle
      if (responseData.id && responseData.id !== messageId && isComponentMounted.current) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);
        addMessageSafely(responseData);
      }
    } catch (error) {
      console.error("Message yuborishda xatolik:", error);

      if (isComponentMounted.current) {
        // Hata durumunda mesajı geri yükle
        setContent(content.trim());
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);
        toast.error("Message yuborishda xatolik: " + error.message);
      }
    } finally {
      if (isComponentMounted.current) {
        setIsSending(false);
      }
    }
  };

  // Guruh yaratish funksiyasi
  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.warn("Guruh nomi va a'zolar tanlanishi shart");
      return;
    }

    try {
      const memberIds = selectedMembers.map((member) => member.id);
      memberIds.push(user.id); // Adminni ham qo'shamiz

      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/groups/create_group/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            is_public: isPublicGroup,
            member_ids: memberIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Guruh yaratishda xatolik");
      }

      const groupData = await response.json();
      console.log("Guruh yaratildi:", groupData);

      // Guruhlar ro'yxatini yangilash
      fetchGroups();

      // Modalni yopish va formani tozalash
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
      setIsPublicGroup(true);

      toast.success("Guruh muvaffaqiyatli yaratildi!");
    } catch (error) {
      console.error("Guruh yaratishda xatolik:", error);
      toast.error("Guruh yaratishda xatolik: " + error.message);
    }
  };

  // A'zoni tanlash/olib tashlash
  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Chatni tanlash
  const selectChat = (chat) => {
    // single, reliable heuristic
    const isGroup =
      chat?.chat_type === "group" ||
      !!chat?.group_type ||
      typeof chat?.member_count === "number" ||
      (!!chat?.name && !chat?.username);

    if (isGroup) {
      setSelectedGroup(chat);
      setSelectedUser(null);
    } else {
      setSelectedUser(chat);
      setSelectedGroup(null);
    }
  };
  
  // Joriy tanlangan chat
  const currentChat = selectedUser || selectedGroup;

  if (!user) {
    return (
      <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
      <ToastContainer />
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Create group"
            >
              <BsPlus size={20} />
            </button>
          </div>
        </div>

        {/* Tablar */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === "groups"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            <div className="flex items-center justify-center gap-1">
              <BsPeople size={16} />
              <span>Groups</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => selectChat(group)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                selectedGroup?.id === group.id
                  ? "bg-blue-50 border-r-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                {group.name?.charAt(0) || "G"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {group.name || "No Name"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {group.member_count} members • {group.group_type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {currentChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                  {selectedGroup?.name?.charAt(0) || "G"}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {selectedGroup?.name || "No Name"}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
                    {selectedGroup?.member_count} members
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 cursor-pointer pr-5">
                <BsTelephoneForwardFill size={18} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">No messages yet</div>
                  <div className="text-sm">Start a conversation!</div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMyMessage = msg.is_my_message;
                  const senderName = msg.sender_name;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${
                        isMyMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMyMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
                          {senderName?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="flex flex-col max-w-[75%]">
                        {!isMyMessage && !selectedUser && (
                          <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
                            {senderName}
                          </div>
                        )}

                        <div
                          className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
                            isMyMessage
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {msg.content}
                          </div>

                          <div
                            className={`text-xs mt-2 flex justify-end ${
                              isMyMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {msg.id?.startsWith("local-") && " ⏳"}
                          </div>
                        </div>
                      </div>

                      {isMyMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
                          Me
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
                  disabled={!roomId || !isConnected || isLoading || isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !content.trim() ||
                    !roomId ||
                    !isConnected ||
                    isLoading ||
                    isSending
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">
                Select a group to start chatting
              </div>
              <div className="text-sm">
                Choose a group from the left sidebar
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guruh yaratish modali */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group description"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublicGroup}
                  onChange={(e) => setIsPublicGroup(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Public Group</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Members
              </label>
              <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some((m) => m.id === user.id)}
                      onChange={() => toggleMemberSelection(user)}
                      className="mr-2"
                    />
                    <span className="text-sm">{user.fio || user.username}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMembers.length} members selected
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




/////////////////////////
// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { FaUserFriends } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
// import { MdEdit } from "react-icons/md";
// import { RiEdit2Fill } from "react-icons/ri";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [groupId, setGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("users");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);
//   const [editingMessage, setEditingMessage] = useState(null);

//   const token = localStorage.getItem("access_token");

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       // Normalize every message to have the same fields
//       const baseId = msg.id || `msg-${Date.now()}-${Math.random()}`;
//       const timestamp =
//         msg.created_at || msg.timestamp || new Date().toISOString();

//       // Deleted message: still return full normalized shape
//       if (msg.isDeleted) {
//         // try to keep sender info if present
//         let senderId =
//           msg.sender_id ?? msg.sender ?? (msg.sender && msg.sender.id) ?? null;
//         let senderName =
//           msg.sender_name ??
//           (msg.sender && (msg.sender.fio || msg.sender.username)) ??
//           (senderId === user?.id ? "Me" : "User");

//         return {
//           ...msg,
//           id: baseId,
//           timestamp,
//           sender_id: senderId,
//           sender_name: senderName,
//           content: msg.content ?? "", // keep empty string instead of null
//           message_type: msg.message_type || "text",
//           isDeleted: true,
//           is_my_message: String(senderId) === String(user?.id),
//         };
//       }

//       // Non-deleted: normalize sender (object / string / number)
//       let senderId = null;
//       let senderName = "User";
//       if (msg.sender && typeof msg.sender === "object") {
//         senderId = msg.sender.id ?? null;
//         senderName = msg.sender.fio || msg.sender.username || senderName;
//       } else {
//         senderId = msg.sender ?? msg.sender_id ?? null;
//         if (String(senderId) === String(user?.id)) {
//           senderName = "Me";
//         } else {
//           const u = users.find((x) => String(x.id) === String(senderId));
//           senderName = u?.fio || u?.username || senderName;
//         }
//       }

//       return {
//         ...msg,
//         id: baseId,
//         timestamp,
//         sender_id: senderId,
//         sender_name: senderName,
//         content: msg.content ?? "",
//         message_type: msg.message_type || "text",
//         isDeleted: false,
//         is_my_message: String(senderId) === String(user?.id),
//       };
//     },
//     [user?.id, users]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       const formattedMsg = formatMessage(newMsg);
//       const messageId = String(formattedMsg.id);

//       setMessages((prev) => {
//         // if exists -> replace, else append
//         const idx = prev.findIndex((m) => String(m.id) === messageId);
//         if (idx !== -1) {
//           const copy = [...prev];
//           copy[idx] = { ...copy[idx], ...formattedMsg };
//           return copy;
//         } else {
//           messageIdsRef.current.add(messageId);
//           return [...prev, formattedMsg];
//         }
//       });

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 100);
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

//   // 1.1️⃣ Guruhlarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetchGroups();
//   }, [token, user?.id]);

//   // Guruhlarni yangilash funksiyasi
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch("http://5.133.122.226:8001/api/chat/groups/", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setGroupId(data);

//           // faqat id larni olish
//           const groupId = data.map((group) => group.id);
//           console.log("Group IDs:", groupId);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

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
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
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
//   }, [token, selectedGroup, addMessageSafely, fetchGroups]);

//   // WebSocket reconnect funksiyasi
//   const reconnectWebSocket = useCallback(() => {
//     if (!roomId || !token || !groupId) return;

//     if (socketRef.current?.readyState === WebSocket.OPEN) return;

//     console.log("WebSocket qayta ulanmoqda...");

//     // Agar guruh chat bo'lsa, boshqa URL ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const wsUrl = isGroupChat
//       ? `ws://5.133.122.226:8001/ws/chat/group/${groupId}/?token=${token}`
//       : `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;

//     socketRef.current = new WebSocket(wsUrl);

//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       setIsConnected(true);
//     };

//     // WebSocket onmessage handler ni to'liq qayta yozing
//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "" }
//                 : msg
//             )
//           );
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log("💬 Chat WS closed");
//       setIsConnected(false);
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 Chat WS error:", err);
//       setIsConnected(false);
//     };
//   }, [roomId, token, addMessageSafely, selectedGroup]);

//   // 3️⃣ Chat room olish va WS ulash (shaxsiy chat yoki guruh chat)
//   useEffect(() => {
//     if ((!selectedUser && !selectedGroup) || !user?.id || !token) return;

//     console.log(
//       "Chat room olinmoqda...",
//       selectedUser?.id || selectedGroup?.id
//     );
//     setIsLoading(true);

//     // Agar guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/groups/${selectedGroup.id}/messages/`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           if (Array.isArray(msgs)) {
//             const formatted = msgs.map((m) => formatMessage(m));
//             // dedupe by id
//             const unique = formatted.filter(
//               (m, i, arr) =>
//                 arr.findIndex((x) => String(x.id) === String(m.id)) === i
//             );
//             setMessages(unique);
//             unique.forEach((m) => messageIdsRef.current.add(String(m.id)));
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });

//       // Eski WebSocket ni yopish
//       if (socketRef.current) {
//         socketRef.current.close(1000, "New room selection");
//       }

//       // Yangi WebSocket ulash
//       reconnectWebSocket();
//       return;
//     }

//     // Agar shaxsiy user tanlangan bo'lsa
//     if (selectedUser) {
//       const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//       fetch(
//         `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then(async (roomData) => {
//           console.log("Room data received:", roomData);

//           if (!roomData?.chat_room) {
//             throw new Error("Chat room topilmadi");
//           }

//           setRoomId(roomData.chat_room);
//           messageIdsRef.current.clear();

//           // Messages olish
//           try {
//             const msgRes = await fetch(
//               `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${roomData.chat_room}`,
//               {
//                 headers: { Authorization: `Bearer ${token}` },
//               }
//             );

//             if (!msgRes.ok) throw new Error("Messages olishda xatolik");

//             const msgs = await msgRes.json();
//             console.log("Messages received:", msgs);

//             if (Array.isArray(msgs)) {
//               const formattedMessages = msgs.map((msg) => formatMessage(msg));
//               setMessages(formattedMessages);
//               formattedMessages.forEach((msg) => {
//                 messageIdsRef.current.add(msg.id);
//               });
//             }
//           } catch (err) {
//             console.error("Messages olishda xatolik:", err);
//           }

//           // Eski WebSocket ni yopish
//           if (socketRef.current) {
//             socketRef.current.close(1000, "New room selection");
//           }

//           // Yangi WebSocket ulash
//           reconnectWebSocket();
//         })
//         .catch((error) => {
//           console.error("Chat room olishda xatolik:", error);
//           alert("Chat room olishda xatolik: " + error.message);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });
//     }

//     return () => {
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         socketRef.current.close(1000, "Unmounting chat WS");
//       }
//     };
//   }, [
//     selectedUser,
//     selectedGroup,
//     token,
//     user?.id,
//     reconnectWebSocket,
//     formatMessage,
//   ]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && groupId && token) {
//       reconnectInterval = setInterval(() => {
//         if (socketRef.current?.readyState !== WebSocket.OPEN) {
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
//     if (!content.trim() || !roomId || !user?.id) return;

//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Agar guruh bo'lsa, boshqa API endpoint ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const messageData = isGroupChat
//       ? {
//           group: groupId,
//           content: content.trim(),
//           message_type: "text",
//         }
//       : {
//           chat_room: roomId,
//           content: content.trim(),
//           message_type: "text",
//         };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       // Local message belgisi
//       is_local: true,
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       // API orqali yuborish
//       const endpoint = isGroupChat
//         ? "http://5.133.122.226:8001/api/chat/groups/send_message/"
//         : "http://5.133.122.226:8001/api/chat/messages/send_message/";

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       // Agar API dan qaytgan message local messagedan farq qilsa, yangilash
//       if (responseData.id && responseData.id !== messageId) {
//         // Local messageni olib tashlash
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);

//         // API dan qaytgan messageni qo'shish
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       // Xatolik bo'lsa, messageni qayta tiklash
//       setContent(content.trim());

//       // Local messageni olib tashlash
//       setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//       messageIdsRef.current.delete(messageId);
//     }
//   };

//   // Guruh yaratish funksiyasi
//   // const createGroup = async () => {
//   //   if (!newGroupName.trim() || selectedMembers.length === 0) {
//   //     alert("Guruh nomi va a'zolar tanlanishi shart");
//   //     return;
//   //   }

//   //   try {
//   //     const memberIds = selectedMembers.map((member) => member.id);
//   //     memberIds.push(user.id); // Adminni ham qo'shamiz

//   //     const response = await fetch(
//   //       "http://5.133.122.226:8001/api/chat/groups/create_group/",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${token}`,
//   //         },
//   //         body: JSON.stringify({
//   //           name: newGroupName,
//   //           description: newGroupDescription,
//   //           is_public: isPublicGroup,
//   //           member_ids: memberIds,
//   //         }),
//   //       }
//   //     );

//   //     if (!response.ok) {
//   //       const errorData = await response.json();
//   //       throw new Error(errorData.message || "Guruh yaratishda xatolik");
//   //     }

//   //     const groupData = await response.json();
//   //     console.log("Guruh yaratildi:", groupData);

//   //     // Guruhlar ro'yxatini yangilash
//   //     fetchGroups();

//   //     // Modalni yopish va formani tozalash
//   //     setShowCreateGroupModal(false);
//   //     setNewGroupName("");
//   //     setNewGroupDescription("");
//   //     setSelectedMembers([]);
//   //     setIsPublicGroup(true);

//   //     alert("Guruh muvaffaqiyatli yaratildi!");
//   //   } catch (error) {
//   //     console.error("Guruh yaratishda xatolik:", error);
//   //     alert("Guruh yaratishda xatolik: " + error.message);
//   //   }
//   // };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     if (chat.chat_type === "group") {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   // Joriy tanlangan chat
//   const currentChat = selectedUser || selectedGroup;

//   // Xabarni o‘chirish funksiyasi
//   // delete funksiyasi
//   const deleteMessage = async (messageId) => {
//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const err = await response.json().catch(() => ({}));
//         throw new Error(err.message || "Delete xatolik!");
//       }

//       // Faqatgina isDeleted flagini yangilaymiz (id saqlanadi)
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId)
//             ? { ...msg, isDeleted: true, content: "" }
//             : msg
//         )
//       );

//       console.log("Message deleted:", messageId);
//     } catch (err) {
//       console.error("❌ Message delete error:", err);
//       alert("Xabarni o'chirishda xatolik: " + err.message);
//     }
//   };

//   // 6️⃣ Message edit qilish funksiyasi
//   const editMessage = async (messageId, newContent) => {
//     if (!newContent.trim()) return;

//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ content: newContent }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Server error ${response.status}: ${errorText}`);
//       }

//       const updatedMessage = await response.json();

//       // Format the updated message
//       const formattedMessage = formatMessage(updatedMessage);

//       // Update the message in state
//       setMessages((prev) =>
//         prev.map((msg) => (msg.id === messageId ? formattedMessage : msg))
//       );

//       setEditingMessage(null);
//       setContent("");

//       console.log("✅ Message tahrirlandi:", updatedMessage);
//     } catch (err) {
//       console.error("❌ Message edit error:", err.message);
//     }
//   };

//   const startEdit = (msg) => {
//     setEditingMessage(msg); // qaysi xabarni edit qilyapmiz
//     setContent(msg.content); // inputga eski text qaytadi
//   };
//   // Tahrir qilishni boshlash
//   const saveEdit = () => {
//     if (editingMessage) {
//       editMessage(editingMessage.id, content);
//       setEditingMessage(null); // tugagach reset qilamiz
//       setContent(""); // inputni tozalaymiz
//     }
//   };
//   useEffect(() => {
//     if (!socketRef) return;

//     socketRef.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       if (data.action === "new_message") {
//         setMessages((prev) => [...prev, data.message]);
//       }

//       if (data.action === "edit_message") {
//         setMessages((prev) =>
//           prev.map((msg) =>
//             msg.id === data.message.id ? { ...msg, ...data.message } : msg
//           )
//         );
//       }

//       if (data.action === "delete_message") {
//         setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
//       }
//     };
//   }, [socketRef]);

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//             {/* <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button> */}
//           </div>
//           <div className="text-xs text-gray-500 mt-1">
//             Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "users"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-blue-600 border-b-2 border-blue-600"
//             }`}
//             onClick={() => setActiveTab("users")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <FaUserFriends size={14} />
//               <span>Contacts</span>
//             </div>
//           </button>
//           {/* <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button> */}
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {activeTab === "users"
//             ? // Foydalanuvchilar ro'yxati
//               users.map((userItem) => (
//                 <div
//                   key={userItem.id}
//                   onClick={() => selectChat(userItem)}
//                   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                     selectedUser?.id === userItem.id
//                       ? "bg-blue-50 border-r-2 border-blue-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                     {userItem.fio?.charAt(0) ||
//                       userItem.username?.charAt(0) ||
//                       "?"}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-gray-900 text-sm truncate">
//                       {userItem.fio || userItem.username || "No Name"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5 flex items-center">
//                       <span
//                         className={`w-2 h-2 rounded-full mr-1 ${
//                           userItem.is_online ? "bg-green-500" : "bg-gray-400"
//                         }`}
//                       ></span>
//                       {userItem.is_online ? "Online" : "Offline"}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             : // Guruhlar ro'yxati
//               groups.map((group) => (
//                 <div
//                   key={group.id}
//                   onClick={() => selectChat(group)}
//                   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                     selectedGroup?.id === group.id
//                       ? "bg-blue-50 border-r-2 border-blue-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                     {group.name?.charAt(0) || "G"}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-gray-900 text-sm truncate">
//                       {group.name || "No Name"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5">
//                       {group.member_count} members • {group.group_type}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedUser
//                     ? selectedUser.fio?.charAt(0) ||
//                       selectedUser.username?.charAt(0) ||
//                       "?"
//                     : selectedGroup.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedUser
//                       ? selectedUser.fio || selectedUser.username || "No Name"
//                       : selectedGroup.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     {selectedUser ? (
//                       <>
//                         <span
//                           className={`w-2 h-2 rounded-full mr-1 ${
//                             selectedUser.is_online
//                               ? "bg-green-500"
//                               : "bg-gray-400"
//                           }`}
//                         ></span>
//                         {selectedUser.is_online ? "online" : "offline"}
//                       </>
//                     ) : (
//                       <>
//                         <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                         {selectedGroup.member_count} members
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 ">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.sender_id === user?.id;
//                   const senderName = msg.sender_name;

//                   return (
//                     <div
//                       key={String(msg.id)}
//                       className={`flex ${
//                         isMyMessage ? "justify-end " : "justify-start"
//                       }`}
//                     >
//                       {/* 👇 Sender avatar faqat delete qilinmagan xabarda ko‘rsatiladi */}
//                       {!isMyMessage && !msg.isDeleted && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {/* Sender ismi faqat delete qilinmagan xabarda */}
//                         {!isMyMessage && !selectedUser && !msg.isDeleted && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-gray-200 text-gray-800 rounded-bl-md"
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.isDeleted ? (
//                               <span className="italic text-gray-400">
//                                 o‘chirilgan xabar
//                               </span>
//                             ) : (
//                               <>
//                                 {msg.content}
//                                 {msg.is_edited && (
//                                   <span className="text-xs ml-2 italic opacity-70">
//                                     (tahrirlangan)
//                                   </span>
//                                 )}
//                               </>
//                             )}
//                           </div>

//                           {!msg.isDeleted && (
//                             <div
//                               className={`text-xs mt-2 flex justify-between items-center ${
//                                 isMyMessage ? "text-blue-100" : "text-gray-500"
//                               }`}
//                             >
//                               <span>
//                                 {new Date(msg.timestamp).toLocaleTimeString(
//                                   [],
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   }
//                                 )}
//                                 {msg.id?.startsWith("local-") && " ⏳"}
//                                 <button
//                                   className="ml-2 text-xs hover:text-red-500 cursor-pointer"
//                                   onClick={() => deleteMessage(msg.id)}
//                                 >
//                                   <MdDelete />
//                                 </button>
//                                 <button
//                                   className="ml-2 text-xs hover:text-yellow-500 cursor-pointer"
//                                   onClick={() => startEdit(msg)}
//                                 >
//                                   <MdEdit />
//                                 </button>
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {isMyMessage && !msg.isDeleted && (
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
//                   onKeyDown={(e) =>
//                     e.key === "Enter" &&
//                     (editingMessage ? saveEdit() : sendMessage())
//                   }
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!roomId || !isConnected || isLoading}
//                 />

//                 {/* Agar edit rejimi bo'lsa Save tugma chiqadi */}
//                 {editingMessage ? (
//                   <button
//                     onClick={saveEdit}
//                     disabled={!content.trim()}
//                     className="absolute flex justify-center items-center right-2 top-1/2 transform -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-white w-10 h-10 rounded-full"
//                   >
//                     <RiEdit2Fill />
//                   </button>
//                 ) : (
//                   <button
//                     onClick={sendMessage}
//                     disabled={!content.trim()}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full"
//                   >
//                     ➤
//                   </button>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a user or group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose someone from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
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
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { FaUserFriends } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
// import { MdEdit } from "react-icons/md";
// import { RiEdit2Fill } from "react-icons/ri";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [groupId, setGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("users");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);
//   const [editingMessage, setEditingMessage] = useState(null);

//   const token = localStorage.getItem("access_token");

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       // Normalize every message to have the same fields
//       const baseId = msg.id || `msg-${Date.now()}-${Math.random()}`;
//       const timestamp =
//         msg.created_at || msg.timestamp || new Date().toISOString();

//       // Deleted message: still return full normalized shape
//       if (msg.isDeleted) {
//         // try to keep sender info if present
//         let senderId =
//           msg.sender_id ?? msg.sender ?? (msg.sender && msg.sender.id) ?? null;
//         let senderName =
//           msg.sender_name ??
//           (msg.sender && (msg.sender.fio || msg.sender.username)) ??
//           (senderId === user?.id ? "Me" : "User");

//         return {
//           ...msg,
//           id: baseId,
//           timestamp,
//           sender_id: senderId,
//           sender_name: senderName,
//           content: msg.content ?? "", // keep empty string instead of null
//           message_type: msg.message_type || "text",
//           isDeleted: true,
//           is_my_message: String(senderId) === String(user?.id),
//         };
//       }

//       // Non-deleted: normalize sender (object / string / number)
//       let senderId = null;
//       let senderName = "User";
//       if (msg.sender && typeof msg.sender === "object") {
//         senderId = msg.sender.id ?? null;
//         senderName = msg.sender.fio || msg.sender.username || senderName;
//       } else {
//         senderId = msg.sender ?? msg.sender_id ?? null;
//         if (String(senderId) === String(user?.id)) {
//           senderName = "Me";
//         } else {
//           const u = users.find((x) => String(x.id) === String(senderId));
//           senderName = u?.fio || u?.username || senderName;
//         }
//       }

//       return {
//         ...msg,
//         id: baseId,
//         timestamp,
//         sender_id: senderId,
//         sender_name: senderName,
//         content: msg.content ?? "",
//         message_type: msg.message_type || "text",
//         is_edited: msg.is_edited || false,
//         isDeleted: false,
//         is_my_message: String(senderId) === String(user?.id),
//       };
//     },
//     [user?.id, users]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       const formattedMsg = formatMessage(newMsg);
//       const messageId = String(formattedMsg.id);

//       setMessages((prev) => {
//         // if exists -> replace, else append
//         const idx = prev.findIndex((m) => String(m.id) === messageId);
//         if (idx !== -1) {
//           const copy = [...prev];
//           copy[idx] = { ...copy[idx], ...formattedMsg };
//           return copy;
//         } else {
//           messageIdsRef.current.add(messageId);
//           return [...prev, formattedMsg];
//         }
//       });

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 100);
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

//   // 1.1️⃣ Guruhlarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetchGroups();
//   }, [token, user?.id]);

//   // Guruhlarni yangilash funksiyasi
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch("http://5.133.122.226:8001/api/chat/groups/", {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setGroups(data);

//           // faqat id larni olish
//           const groupIds = data.map((group) => group.id);
//           console.log("Group IDs:", groupIds);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

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
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "" }
//                 : msg
//             )
//           );
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
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
//   }, [token, selectedGroup, addMessageSafely, fetchGroups, formatMessage]);

//   // WebSocket reconnect funksiyasi
//   const reconnectWebSocket = useCallback(() => {
//     if (!roomId || !token) return;

//     if (socketRef.current?.readyState === WebSocket.OPEN) return;

//     console.log("WebSocket qayta ulanmoqda...");

//     // Agar guruh chat bo'lsa, boshqa URL ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const wsUrl = isGroupChat
//       ? `ws://5.133.122.226:8001/ws/chat/group/${selectedGroup.id}/?token=${token}`
//       : `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;

//     socketRef.current = new WebSocket(wsUrl);

//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       setIsConnected(true);
//     };

//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "" }
//                 : msg
//             )
//           );
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log("💬 Chat WS closed");
//       setIsConnected(false);
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 Chat WS error:", err);
//       setIsConnected(false);
//     };
//   }, [roomId, token, addMessageSafely, selectedGroup, formatMessage]);

//   // 3️⃣ Chat room olish va WS ulash (shaxsiy chat yoki guruh chat)
//   useEffect(() => {
//     if ((!selectedUser && !selectedGroup) || !user?.id || !token) return;

//     console.log(
//       "Chat room olinmoqda...",
//       selectedUser?.id || selectedGroup?.id
//     );
//     setIsLoading(true);

//     // Agar guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/groups/${selectedGroup.id}/messages/`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           if (Array.isArray(msgs)) {
//             const formatted = msgs.map((m) => formatMessage(m));
//             // dedupe by id
//             const unique = formatted.filter(
//               (m, i, arr) =>
//                 arr.findIndex((x) => String(x.id) === String(m.id)) === i
//             );
//             setMessages(unique);
//             unique.forEach((m) => messageIdsRef.current.add(String(m.id)));
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });

//       // Eski WebSocket ni yopish
//       if (socketRef.current) {
//         socketRef.current.close(1000, "New room selection");
//       }

//       // Yangi WebSocket ulash
//       reconnectWebSocket();
//       return;
//     }

//     // Agar shaxsiy user tanlangan bo'lsa
//     if (selectedUser) {
//       const query = `user_ids=${user.id}&user_ids=${selectedUser.id}`;
//       fetch(
//         `http://5.133.122.226:8001/api/chat/chat-rooms/get_room_by_id?${query}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then(async (roomData) => {
//           console.log("Room data received:", roomData);

//           if (!roomData?.chat_room) {
//             throw new Error("Chat room topilmadi");
//           }

//           setRoomId(roomData.chat_room);
//           messageIdsRef.current.clear();

//           // Messages olish
//           try {
//             const msgRes = await fetch(
//               `http://5.133.122.226:8001/api/chat/messages/?chat_room_id=${roomData.chat_room}`,
//               {
//                 headers: { Authorization: `Bearer ${token}` },
//               }
//             );

//             if (!msgRes.ok) throw new Error("Messages olishda xatolik");

//             const msgs = await msgRes.json();
//             console.log("Messages received:", msgs);

//             if (Array.isArray(msgs)) {
//               const formattedMessages = msgs.map((msg) => formatMessage(msg));
//               setMessages(formattedMessages);
//               formattedMessages.forEach((msg) => {
//                 messageIdsRef.current.add(msg.id);
//               });
//             }
//           } catch (err) {
//             console.error("Messages olishda xatolik:", err);
//           }

//           // Eski WebSocket ni yopish
//           if (socketRef.current) {
//             socketRef.current.close(1000, "New room selection");
//           }

//           // Yangi WebSocket ulash
//           reconnectWebSocket();
//         })
//         .catch((error) => {
//           console.error("Chat room olishda xatolik:", error);
//           alert("Chat room olishda xatolik: " + error.message);
//         })
//         .finally(() => {
//           setIsLoading(false);
//         });
//     }

//     return () => {
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         socketRef.current.close(1000, "Unmounting chat WS");
//       }
//     };
//   }, [
//     selectedUser,
//     selectedGroup,
//     token,
//     user?.id,
//     reconnectWebSocket,
//     formatMessage,
//   ]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && token) {
//       reconnectInterval = setInterval(() => {
//         if (socketRef.current?.readyState !== WebSocket.OPEN) {
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
//     if (!content.trim() || !roomId || !user?.id) return;

//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Agar guruh bo'lsa, boshqa API endpoint ishlatamiz
//     const isGroupChat = selectedGroup !== null;
//     const messageData = isGroupChat
//       ? {
//           group: selectedGroup.id,
//           content: content.trim(),
//           message_type: "text",
//         }
//       : {
//           chat_room: roomId,
//           content: content.trim(),
//           message_type: "text",
//         };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       // Local message belgisi
//       is_local: true,
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       // API orqali yuborish
//       const endpoint = isGroupChat;
//       ("http://5.133.122.226:8001/api/chat/messages/send_message/");

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       // Agar API dan qaytgan message local messagedan farq qilsa, yangilash
//       if (responseData.id && responseData.id !== messageId) {
//         // Local messageni olib tashlash
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);

//         // API dan qaytgan messageni qo'shish
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       // Xatolik bo'lsa, messageni qayta tiklash
//       setContent(content.trim());

//       // Local messageni olib tashlash
//       setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//       messageIdsRef.current.delete(messageId);
//     }
//   };

//   //  Guruh yaratish funksiyasi
//   const createGroup = async () => {
//     if (!newGroupName.trim() || selectedMembers.length === 0) {
//       alert("Guruh nomi va a'zolar tanlanishi shart");
//       return;
//     }

//     try {
//       const memberIds = selectedMembers.map((member) => member.id);
//       memberIds.push(user.id); // Adminni ham qo'shamiz

//       const response = await fetch(
//         "http://5.133.122.226:8001/api/chat/groups/create_group/",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newGroupDescription,
//             is_public: isPublicGroup,
//             member_ids: memberIds,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Guruh yaratishda xatolik");
//       }

//       const groupData = await response.json();
//       console.log("Guruh yaratildi:", groupData);

//       // Guruhlar ro'yxatini yangilash
//       fetchGroups();

//       // Modalni yopish va formani tozalash
//       setShowCreateGroupModal(false);
//       setNewGroupName("");
//       setNewGroupDescription("");
//       setSelectedMembers([]);
//       setIsPublicGroup(true);

//       alert("Guruh muvaffaqiyatli yaratildi!");
//     } catch (error) {
//       console.error("Guruh yaratishda xatolik:", error);
//       alert("Guruh yaratishda xatolik: " + error.message);
//     }
//   };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     if (chat.chat_type === "group") {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   // Joriy tanlangan chat
//   const currentChat = selectedUser || selectedGroup;

//   // Xabarni o'chirish funksiyasi
//   const deleteMessage = async (messageId) => {
//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const err = await response.json().catch(() => ({}));
//         throw new Error(err.message || "Delete xatolik!");
//       }

//       // Faqatgina isDeleted flagini yangilaymiz (id saqlanadi)
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId)
//             ? { ...msg, isDeleted: true, content: "" }
//             : msg
//         )
//       );

//       console.log("Message deleted:", messageId);
//     } catch (err) {
//       console.error("❌ Message delete error:", err);
//       alert("Xabarni o'chirishda xatolik: " + err.message);
//     }
//   };

//   // 6️⃣ Message edit qilish funksiyasi
//   const editMessage = async (messageId, newContent) => {
//     if (!newContent.trim()) return;

//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ content: newContent }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Server error ${response.status}: ${errorText}`);
//       }

//       const updatedMessage = await response.json();

//       // Format the updated message
//       const formattedMessage = formatMessage(updatedMessage);

//       // Update the message in state
//       setMessages((prev) =>
//         prev.map((msg) => (msg.id === messageId ? formattedMessage : msg))
//       );

//       setEditingMessage(null);
//       setContent("");

//       console.log("✅ Message tahrirlandi:", updatedMessage);
//     } catch (err) {
//       console.error("❌ Message edit error:", err.message);
//     }
//   };

//   // Tahrirlashni boshlash
//   const startEdit = (msg) => {
//     setEditingMessage(msg);
//     setContent(msg.content);
//   };

//   // Tahrirlashni bekor qilish
//   const cancelEdit = () => {
//     setEditingMessage(null);
//     setContent("");
//   };

//   // Tahrirlashni saqlash
//   const saveEdit = () => {
//     if (editingMessage) {
//       editMessage(editingMessage.id, content);
//     }
//   };

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Chats</h2>
//             <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button>
//           </div>
//           <div className="text-xs text-gray-500 mt-1">
//             Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           {/* <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "users"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("users")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <FaUserFriends size={14} />
//               <span>Contacts</span>
//             </div>
//           </button> */}
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {activeTab === "users"
//             ? groups.map((group) => (
//                 <div
//                   key={group.id}
//                   onClick={() => selectChat({ ...group, chat_type: "group" })}
//                   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                     selectedGroup?.id === group.id
//                       ? "bg-blue-50 border-r-2 border-blue-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                     {group.name?.charAt(0) || "G"}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-gray-900 text-sm truncate">
//                       {group.name || "No Name"}
//                     </div>
//                     <div className="text-xs text-gray-500 mt-0.5">
//                       {group.member_count} members • {group.group_type}
//                     </div>
//                   </div>
//                 </div>
//               )) // Foydalanuvchilar ro'yxati
//             : users.map((userItem) => (
//                 // <div
//                 //   key={userItem.id}
//                 //   onClick={() => selectChat({ ...userItem, chat_type: "user" })}
//                 //   className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 //     selectedUser?.id === userItem.id
//                 //       ? "bg-blue-50 border-r-2 border-blue-500"
//                 //       : ""
//                 //   }`}
//                 // >
//                 //   <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 //     {userItem.fio?.charAt(0) ||
//                 //       userItem.username?.charAt(0) ||
//                 //       "?"}
//                 //   </div>
//                 //   <div className="flex-1 min-w-0">
//                 //     <div className="font-medium text-gray-900 text-sm truncate">
//                 //       {userItem.fio || userItem.username || "No Name"}
//                 //     </div>
//                 //     <div className="text-xs text-gray-500 mt-0.5 flex items-center">
//                 //       <span
//                 //         className={`w-2 h-2 rounded-full mr-1 ${
//                 //           userItem.is_online ? "bg-green-500" : "bg-gray-400"
//                 //         }`}
//                 //       ></span>
//                 //       {userItem.is_online ? "Online" : "Offline"}
//                 //     </div>
//                 //   </div>
//                 // </div>
//                 <div></div>
//               ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedUser
//                     ? selectedUser.fio?.charAt(0) ||
//                       selectedUser.username?.charAt(0) ||
//                       "?"
//                     : selectedGroup.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedUser
//                       ? selectedUser.fio || selectedUser.username || "No Name"
//                       : selectedGroup.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     {selectedUser ? (
//                       <>
//                         <span
//                           className={`w-2 h-2 rounded-full mr-1 ${
//                             selectedUser.is_online
//                               ? "bg-green-500"
//                               : "bg-gray-400"
//                           }`}
//                         ></span>
//                         {selectedUser.is_online ? "online" : "offline"}
//                       </>
//                     ) : (
//                       <>
//                         <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                         {selectedGroup.member_count} members
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 ">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.is_my_message;
//                   const senderName = msg.sender_name;

//                   return (
//                     <div
//                       key={String(msg.id)}
//                       className={`flex ${
//                         isMyMessage ? "justify-end " : "justify-start"
//                       }`}
//                     >
//                       {/* 👇 Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
//                       {!isMyMessage && !msg.isDeleted && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {/* Sender ismi faqat delete qilinmagan xabarda */}
//                         {!isMyMessage && !selectedUser && !msg.isDeleted && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-gray-200 text-gray-800 rounded-bl-md"
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.isDeleted ? (
//                               <span className="italic text-gray-400">
//                                 o'chirilgan xabar
//                               </span>
//                             ) : (
//                               <>
//                                 {msg.content}
//                                 {msg.is_edited && (
//                                   <span className="text-xs ml-2 italic opacity-70">
//                                     (tahrirlangan)
//                                   </span>
//                                 )}
//                               </>
//                             )}
//                           </div>

//                           {!msg.isDeleted && (
//                             <div
//                               className={`text-xs mt-2 flex justify-between items-center ${
//                                 isMyMessage ? "text-blue-100" : "text-gray-500"
//                               }`}
//                             >
//                               <span>
//                                 {new Date(msg.timestamp).toLocaleTimeString(
//                                   [],
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   }
//                                 )}
//                                 {msg.is_edited && " ✏️"}
//                               </span>

//                               {isMyMessage && (
//                                 <div className="flex ml-2">
//                                   <button
//                                     className="hover:text-red-500 cursor-pointer"
//                                     onClick={() => deleteMessage(msg.id)}
//                                     title="O'chirish"
//                                   >
//                                     <MdDelete />
//                                   </button>
//                                   <button
//                                     className="ml-2 hover:text-yellow-500 cursor-pointer"
//                                     onClick={() => startEdit(msg)}
//                                     title="Tahrirlash"
//                                   >
//                                     <MdEdit />
//                                   </button>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {isMyMessage && !msg.isDeleted && (
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
//                   placeholder={
//                     editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
//                   }
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       editingMessage ? saveEdit() : sendMessage();
//                     } else if (e.key === "Escape") {
//                       cancelEdit();
//                     }
//                   }}
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!roomId || !isConnected || isLoading}
//                 />

//                 {editingMessage ? (
//                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
//                     <button
//                       onClick={saveEdit}
//                       disabled={!content.trim()}
//                       className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Saqlash"
//                     >
//                       ✓
//                     </button>
//                     <button
//                       onClick={cancelEdit}
//                       className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Bekor qilish"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={sendMessage}
//                     disabled={!content.trim()}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                     title="Yuborish"
//                   >
//                     ➤
//                   </button>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a user or group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose someone from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


///////////////////////


// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { ToastContainer, toast } from "react-toastify";
// import { MdDelete } from "react-icons/md";
// import { MdEdit } from "react-icons/md";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [currentGroupId, setCurrentGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("groups");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const [isSending, setIsSending] = useState(false);

//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);
//   const isComponentMounted = useRef(true);
//   const [editingMessage, setEditingMessage] = useState(null);

//   const token = localStorage.getItem("access_token");

//   useEffect(() => {
//     isComponentMounted.current = true;
//     return () => {
//       isComponentMounted.current = false;
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//       if (notifSocketRef.current) {
//         notifSocketRef.current.close();
//       }
//     };
//   }, []);

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       let senderName = "unknown";
//       let senderId = "unknown";

//       // Sender ni aniqlash
//       if (typeof msg.sender === "object" && msg.sender !== null) {
//         senderName = msg.sender.fio || msg.sender.username || "unknown";
//         senderId = msg.sender.id || "unknown";
//       } else if (typeof msg.sender === "string") {
//         // Agar sender ID bo'lsa
//         if (msg.sender === user?.id) {
//           senderName = "Me";
//           senderId = user.id;
//         } else {
//           // Boshqa user bo'lsa, users ro'yxatidan topish
//           const senderUser = users.find((u) => u.id === msg.sender);
//           senderName = senderUser?.fio || senderUser?.username || "User";
//           senderId = msg.sender;
//         }
//       }

//       return {
//         ...msg,
//         id: msg.id || `msg-${Date.now()}-${Math.random()}`,
//         timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
//         sender: senderId,
//         sender_name: senderName,
//         content: msg.content || "",
//         message_type: msg.message_type || "text",
//         is_my_message: senderId === user?.id,
//       };
//     },
//     [user?.id, users]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       if (!isComponentMounted.current) return;

//       const formattedMsg = formatMessage(newMsg);
//       const messageId = formattedMsg.id;

//       if (messageIdsRef.current.has(messageId)) {
//         console.log("Duplicate message skipped:", messageId);
//         return;
//       }

//       messageIdsRef.current.add(messageId);
//       setMessages((prev) => [...prev, formattedMsg]);

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//       }, 100);
//     },
//     [formatMessage]
//   );

//   // Foydalanuvchilarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetch(`http://5.133.122.226:8001/api/employee/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           setUsers(data.filter((u) => u.id !== user.id));
//         }
//       })
//       .catch((error) => {
//         console.error("Foydalanuvchilarni olishda xatolik:", error);
//       });
//   }, [token, user?.id]);

//   // Guruhlarni olish
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           // dedupe by id and add chat_type
//           const map = new Map();
//           data.forEach((g) => {
//             if (g && g.id != null) {
//               map.set(g.id, { ...g, chat_type: "group" });
//             }
//           });
//           const uniqueGroups = Array.from(map.values());
//           console.log("Groups loaded (unique):", uniqueGroups);
//           setGroups(uniqueGroups);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

//   useEffect(() => {
//     if (!user?.id || !token) return;
//     fetchGroups();
//   }, [token, user?.id, fetchGroups]);

//   const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.close(1000, reason);
//     }
//   }, []);

//   // Notification WebSocket ulanish
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

//         if (!isComponentMounted.current) return;

//         if (data.type === "user_status") {
//           setUsers((prev) =>
//             prev.map((u) =>
//               u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//             )
//           );
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
//       if (isComponentMounted.current && token) {
//         setTimeout(() => {
//           if (isComponentMounted.current && token) {
//             notifSocketRef.current = new WebSocket(notifUrl);
//           }
//         }, 3000);
//       }
//     };

//     notifSocketRef.current.onerror = (err) => {
//       console.error("🔔 Notifications WS error:", err);
//     };

//     return () => {
//       cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
//     };
//   }, [token, selectedGroup, addMessageSafely, fetchGroups, cleanupWebSocket]);

//   // WebSocket yeniden bağlanma fonksiyonu
//   const reconnectWebSocket = useCallback(() => {
//     const targetId = selectedGroup?.id ?? currentGroupId;
//     if (!targetId || !token) return;
//     if (socketRef.current?.readyState === WebSocket.OPEN) return;
//     if (!isComponentMounted.current) return;

//     console.log("WebSocket qayta ulanmoqda... targetId:", targetId);

//     // WebSocket URL'sini doğru şekilde oluştur
//     const wsUrl = `ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;

//     socketRef.current = new WebSocket(wsUrl);
//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       if (isComponentMounted.current) {
//         setIsConnected(true);
//       }
//     };

//     // WebSocket mesaj işleyicilerini ekle
//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "" }
//                 : msg
//             )
//           );
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log("💬 WebSocket closed");
//       if (isComponentMounted.current) {
//         setIsConnected(false);
//       }
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 WebSocket error:", err);
//     };
//   }, [token, currentGroupId, addMessageSafely, selectedGroup]);

//   // Chat room olish va WS ulash (guruh chat)
//   useEffect(() => {
//     if (!selectedGroup || !user?.id || !token) return;

//     console.log("Guruh chat room olinmoqda...", selectedGroup?.id);
//     setIsLoading(true);

//     // Guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setCurrentGroupId(selectedGroup.id);
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/messages/?group_id=${selectedGroup.id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           console.log("Group messages received:", msgs);

//           if (Array.isArray(msgs) && isComponentMounted.current) {
//             const formattedMessages = msgs.map((msg) => formatMessage(msg));
//             setMessages(formattedMessages);
//             formattedMessages.forEach((msg) => {
//               messageIdsRef.current.add(msg.id);
//             });
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           if (isComponentMounted.current) {
//             setIsLoading(false);
//           }
//         });

//       // Eski WebSocket ni yopish
//       cleanupWebSocket(socketRef.current, "New room selection");

//       // Yangi WebSocket ulash
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           reconnectWebSocket();
//         }
//       }, 100);
//     }

//     return () => {
//       cleanupWebSocket(socketRef.current, "Unmounting chat WS");
//     };
//   }, [
//     selectedGroup,
//     token,
//     user?.id,
//     reconnectWebSocket,
//     formatMessage,
//     cleanupWebSocket,
//   ]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && token && isComponentMounted.current) {
//       reconnectInterval = setInterval(() => {
//         if (
//           socketRef.current?.readyState !== WebSocket.OPEN &&
//           isComponentMounted.current
//         ) {
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

//   // Scroll
//   useEffect(() => {
//     if (isComponentMounted.current) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   // Send message
//   const sendMessage = async () => {
//     if (!content.trim() || !currentGroupId || !user?.id || isSending) return;

//     setIsSending(true);
//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Grup mesajı için doğru veri yapısı
//     const messageData = {
//       group: currentGroupId, // currentGroupId kullan
//       content: content.trim(),
//       message_type: "text",
//     };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       is_local: true,
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       const endpoint = `http://5.133.122.226:8001/api/chat/messages/send_message/`;

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       if (
//         responseData.id &&
//         responseData.id !== messageId &&
//         isComponentMounted.current
//       ) {
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       if (isComponentMounted.current) {
//         setContent(content.trim());
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         toast.error("Message yuborishda xatolik: " + error.message);
//       }
//     } finally {
//       if (isComponentMounted.current) {
//         setIsSending(false);
//       }
//     }
//   };

//   // Guruh yaratish funksiyasi
//   const createGroup = async () => {
//     if (!newGroupName.trim() || selectedMembers.length === 0) {
//       toast.warn("Guruh nomi va a'zolar tanlanishi shart");
//       return;
//     }

//     try {
//       const memberIds = selectedMembers.map((member) => member.id);
//       memberIds.push(user.id); // Adminni ham qo'shamiz

//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/groups/create_group/`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newGroupDescription,
//             is_public: isPublicGroup,
//             member_ids: memberIds,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Guruh yaratishda xatolik");
//       }

//       const groupData = await response.json();
//       console.log("Guruh yaratildi:", groupData);

//       // Guruhlar ro'yxatini yangilash
//       fetchGroups();

//       // Modalni yopish va formani tozalash
//       setShowCreateGroupModal(false);
//       setNewGroupName("");
//       setNewGroupDescription("");
//       setSelectedMembers([]);
//       setIsPublicGroup(true);

//       toast.success("Guruh muvaffaqiyatli yaratildi!");
//     } catch (error) {
//       console.error("Guruh yaratishda xatolik:", error);
//       toast.error("Guruh yaratishda xatolik: " + error.message);
//     }
//   };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     // single, reliable heuristic
//     const isGroup =
//       chat?.chat_type === "group" ||
//       !!chat?.group_type ||
//       typeof chat?.member_count === "number" ||
//       (!!chat?.name && !chat?.username);

//     if (isGroup) {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   // Joriy tanlangan chat
//   const currentChat = selectedUser || selectedGroup;
//   ////////////////////////////////
//   const deleteMessage = async (messageId) => {
//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const err = await response.json().catch(() => ({}));
//         throw new Error(err.message || "Delete xatolik!");
//       }

//       socketRef.current.send(
//         JSON.stringify({
//           type: "message_deleted",
//           message_id: messageId,
//         })
//       );

//       // Faqatgina isDeleted flagini yangilaymiz (id saqlanadi)
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId)
//             ? { ...msg, isDeleted: true, content: "" }
//             : msg
//         )
//       );
//       console.log("Message deleted:", messageId);
//     } catch (err) {
//       console.error("❌ Message delete error:", err);
//       toast.error("Xabarni o'chirishda xatolik: " + err.message);
//     }
//   };

//   // 6️⃣ Message edit qilish funksiyasi
//   const editMessage = async (messageId, newContent) => {
//     if (!newContent.trim()) return;

//     // Loading holatini ko'rsatish
//     setMessages((prev) =>
//       prev.map((msg) =>
//         msg.id === messageId
//           ? { ...msg, content: newContent, isEditing: true, isLoading: true }
//           : msg
//       )
//     );

//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ content: newContent }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Server error ${response.status}: ${errorText}`);
//       }

//       const updatedMessage = await response.json();

//       socketRef.current.send(
//         JSON.stringify({
//           type: "message_edited",
//           message: {
//             id: messageId,
//             content: newContent,
//           },
//         })
//       );

//       setEditingMessage(null);
//       setContent("");

//       console.log("✅ Message tahrirlandi:", updatedMessage);
//     } catch (err) {
//       console.error("❌ Message edit error:", err.message);

//       // Error holat - faqat error state yangilash
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === messageId
//             ? {
//                 ...msg,
//                 isEditing: false,
//                 isLoading: false,
//                 error: err.message,
//                 // Original contentni qaytarish
//                 content: msg.content, // original contentni saqlab qolish
//               }
//             : msg
//         )
//       );

//       // Foydalanuvchiga xabar berish (toast yoki alert)

//       // Editing rejimini butunlay yopish
//       setEditingMessage(null);
//       setContent("");
//     }
//   };

//   const startEdit = (msg) => {
//     setEditingMessage(msg);
//     setContent(msg.content);
//   };

//   // Tahrirlashni bekor qilish
//   const cancelEdit = () => {
//     setEditingMessage(null);
//     setContent("");
//   };

//   // Tahrirlashni saqlash
//   const saveEdit = () => {
//     if (editingMessage) {
//       editMessage(editingMessage.id, content);
//     }
//   };

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <ToastContainer />
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
//             <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {groups.map((group) => (
//             <div
//               key={group.id}
//               onClick={() => selectChat(group)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedGroup?.id === group.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {group.name?.charAt(0) || "G"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {group.name}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   {group.member_count} members • {group.group_type}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedGroup?.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedGroup?.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                     {selectedGroup?.member_count} members
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.is_my_message;
//                   const senderName = msg.sender_name;

//                   return (
//                     <div
//                       key={String(msg.id)}
//                       className={`flex ${
//                         isMyMessage ? "justify-end " : "justify-start"
//                       }`}
//                     >
//                       {/* 👇 Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
//                       {!isMyMessage && !msg.isDeleted && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {/* Sender ismi faqat delete qilinmagan xabarda */}
//                         {!isMyMessage && !selectedUser && !msg.isDeleted && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-gray-200 text-gray-800 rounded-bl-md"
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.isDeleted ? (
//                               <span className="italic text-gray-400">
//                                 o'chirilgan xabar
//                               </span>
//                             ) : (
//                               <>
//                                 {msg.content}
//                                 {msg.is_edited && (
//                                   <span className="text-xs ml-2 italic opacity-70">
//                                     (tahrirlangan)
//                                   </span>
//                                 )}
//                               </>
//                             )}
//                           </div>

//                           {!msg.isDeleted && (
//                             <div
//                               className={`text-xs mt-2 flex justify-between items-center ${
//                                 isMyMessage ? "text-blue-100" : "text-gray-500"
//                               }`}
//                             >
//                               <span>
//                                 {new Date(msg.timestamp).toLocaleTimeString(
//                                   [],
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   }
//                                 )}
//                                 {msg.is_edited && " ✏️"}
//                               </span>

//                               {isMyMessage && (
//                                 <div className="flex ml-2">
//                                   <button
//                                     className="hover:text-red-500 cursor-pointer"
//                                     onClick={() => deleteMessage(msg.id)}
//                                     title="O'chirish"
//                                   >
//                                     <MdDelete />
//                                   </button>
//                                   <button
//                                     className="ml-2 hover:text-yellow-500 cursor-pointer"
//                                     onClick={() => startEdit(msg)}
//                                     title="Tahrirlash"
//                                   >
//                                     <MdEdit />
//                                   </button>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {isMyMessage && !msg.isDeleted && (
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
//                   placeholder={
//                     editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
//                   }
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       editingMessage ? saveEdit() : sendMessage();
//                     } else if (e.key === "Escape") {
//                       cancelEdit();
//                     }
//                   }}
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!isConnected || isLoading}
//                 />

//                 {editingMessage ? (
//                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
//                     <button
//                       onClick={saveEdit}
//                       disabled={!content.trim()}
//                       className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Saqlash"
//                     >
//                       ✓
//                     </button>
//                     <button
//                       onClick={cancelEdit}
//                       className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Bekor qilish"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={sendMessage}
//                     disabled={!content.trim()}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                     title="Yuborish"
//                   >
//                     ➤
//                   </button>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose a group from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

//////////////////

// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { ToastContainer, toast } from "react-toastify";
// import { MdDelete } from "react-icons/md";
// import { MdEdit } from "react-icons/md";
// import "react-toastify/dist/ReactToastify.css";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [currentGroupId, setCurrentGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("groups");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const [isSending, setIsSending] = useState(false);
//   const [editingMessage, setEditingMessage] = useState(null);

//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);
//   const isComponentMounted = useRef(true);

//   const token = localStorage.getItem("access_token");

//   useEffect(() => {
//     isComponentMounted.current = true;
//     return () => {
//       isComponentMounted.current = false;
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//       if (notifSocketRef.current) {
//         notifSocketRef.current.close();
//       }
//     };
//   }, []);

//   // Message formatini to'g'rilash funksiyasi
//   const formatMessage = useCallback(
//     (msg) => {
//       let senderName = "unknown";
//       let senderId = "unknown";

//       // Sender ni aniqlash
//       if (typeof msg.sender === "object" && msg.sender !== null) {
//         senderName = msg.sender.fio || msg.sender.username || "unknown";
//         senderId = msg.sender.id || "unknown";
//       } else if (typeof msg.sender === "string") {
//         // Agar sender ID bo'lsa
//         if (msg.sender === user?.id) {
//           senderName = "Me";
//           senderId = user.id;
//         } else {
//           // Boshqa user bo'lsa, users ro'yxatidan topish
//           const senderUser = users.find((u) => u.id === msg.sender);
//           senderName = senderUser?.fio || senderUser?.username || "User";
//           senderId = msg.sender;
//         }
//       }

//       return {
//         ...msg,
//         id: msg.id || `msg-${Date.now()}-${Math.random()}`,
//         timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
//         sender: senderId,
//         sender_name: senderName,
//         content: msg.content || "",
//         message_type: msg.message_type || "text",
//         is_my_message: senderId === user?.id,
//         is_edited: msg.is_edited || false,
//         isDeleted: msg.isDeleted || false,
//       };
//     },
//     [user?.id, users]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       if (!isComponentMounted.current) return;

//       const formattedMsg = formatMessage(newMsg);
//       const messageId = formattedMsg.id;

//       if (messageIdsRef.current.has(messageId)) {
//         console.log("Duplicate message skipped:", messageId);
//         return;
//       }

//       messageIdsRef.current.add(messageId);
//       setMessages((prev) => [...prev, formattedMsg]);

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//       }, 100);
//     },
//     [formatMessage]
//   );

//   // Foydalanuvchilarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetch(`http://5.133.122.226:8001/api/employee/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           setUsers(data.filter((u) => u.id !== user.id));
//         }
//       })
//       .catch((error) => {
//         console.error("Foydalanuvchilarni olishda xatolik:", error);
//       });
//   }, [token, user?.id]);

//   // Guruhlarni olish
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           // dedupe by id and add chat_type
//           const map = new Map();
//           data.forEach((g) => {
//             if (g && g.id != null) {
//               map.set(g.id, { ...g, chat_type: "group" });
//             }
//           });
//           const uniqueGroups = Array.from(map.values());
//           console.log("Groups loaded (unique):", uniqueGroups);
//           setGroups(uniqueGroups);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

//   useEffect(() => {
//     if (!user?.id || !token) return;
//     fetchGroups();
//   }, [token, user?.id, fetchGroups]);

//   const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.close(1000, reason);
//     }
//   }, []);

//   // Notification WebSocket ulanish
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

//         if (!isComponentMounted.current) return;

//         if (data.type === "user_status") {
//           setUsers((prev) =>
//             prev.map((u) =>
//               u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//             )
//           );
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//           toast.success("Xabar tahrirlandi");
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//           toast.info("Xabar o'chirildi");
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
//       if (isComponentMounted.current && token) {
//         setTimeout(() => {
//           if (isComponentMounted.current && token) {
//             notifSocketRef.current = new WebSocket(notifUrl);
//           }
//         }, 3000);
//       }
//     };

//     notifSocketRef.current.onerror = (err) => {
//       console.error("🔔 Notifications WS error:", err);
//     };

//     return () => {
//       cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
//     };
//   }, [
//     token,
//     selectedGroup,
//     addMessageSafely,
//     fetchGroups,
//     cleanupWebSocket,
//     formatMessage,
//   ]);

//   // WebSocket yeniden bağlanma fonksiyonu
//   const reconnectWebSocket = useCallback(() => {
//     const targetId = selectedGroup?.id ?? currentGroupId;
//     if (!targetId || !token) return;
//     if (socketRef.current?.readyState === WebSocket.OPEN) return;
//     if (!isComponentMounted.current) return;

//     console.log("WebSocket qayta ulanmoqda... targetId:", targetId);

//     // WebSocket URL'sini doğru şekilde oluştur
//     const wsUrl = `ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;

//     // Eski WebSocket ni yopish
//     if (socketRef.current) {
//       socketRef.current.close();
//     }

//     socketRef.current = new WebSocket(wsUrl);
//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       if (isComponentMounted.current) {
//         setIsConnected(true);
//       }
//     };

//     // WebSocket mesaj işleyicilerini ekle
//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//           toast.success("Xabar tahrirlandi");
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // O'chirilgan xabarni yangilash
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === data.message_id
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//           toast.info("Xabar o'chirildi");
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };

//     socketRef.current.onclose = (event) => {
//       console.log("💬 WebSocket closed");
//       if (isComponentMounted.current) {
//         setIsConnected(false);
//       }

//       // Avtomatik qayta ulanish
//       setTimeout(() => {
//         if (
//           isComponentMounted.current &&
//           token &&
//           (selectedGroup?.id || currentGroupId)
//         ) {
//           reconnectWebSocket();
//         }
//       }, 3000);
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 WebSocket error:", err);
//     };
//   }, [token, currentGroupId, addMessageSafely, selectedGroup, formatMessage]);

//   // Chat room olish va WS ulash (guruh chat)
//   useEffect(() => {
//     if (!selectedGroup || !user?.id || !token) return;

//     console.log("Guruh chat room olinmoqda...", selectedGroup?.id);
//     setIsLoading(true);

//     // Guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setCurrentGroupId(selectedGroup.id);
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/messages/?group_id=${selectedGroup.id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           console.log("Group messages received:", msgs);

//           if (Array.isArray(msgs) && isComponentMounted.current) {
//             const formattedMessages = msgs.map((msg) => formatMessage(msg));
//             setMessages(formattedMessages);
//             formattedMessages.forEach((msg) => {
//               messageIdsRef.current.add(msg.id);
//             });
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           if (isComponentMounted.current) {
//             setIsLoading(false);
//           }
//         });

//       // Eski WebSocket ni yopish
//       cleanupWebSocket(socketRef.current, "New room selection");

//       // Yangi WebSocket ulash
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           reconnectWebSocket();
//         }
//       }, 100);
//     }

//     return () => {
//       cleanupWebSocket(socketRef.current, "Unmounting chat WS");
//     };
//   }, [
//     selectedGroup,
//     token,
//     user?.id,
//     reconnectWebSocket,
//     formatMessage,
//     cleanupWebSocket,
//   ]);

//   // Reconnect useEffect
//   useEffect(() => {
//     let reconnectInterval;

//     if (roomId && token && isComponentMounted.current) {
//       reconnectInterval = setInterval(() => {
//         if (
//           socketRef.current?.readyState !== WebSocket.OPEN &&
//           isComponentMounted.current
//         ) {
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

//   // Scroll
//   useEffect(() => {
//     if (isComponentMounted.current) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   // Send message
//   const sendMessage = async () => {
//     if (!content.trim() || !currentGroupId || !user?.id || isSending) return;

//     setIsSending(true);
//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Grup mesajı için doğru veri yapısı
//     const messageData = {
//       group: currentGroupId, // currentGroupId kullan
//       content: content.trim(),
//       message_type: "text",
//     };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       is_local: true,
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       const endpoint = `http://5.133.122.226:8001/api/chat/messages/send_message/`;

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       if (
//         responseData.id &&
//         responseData.id !== messageId &&
//         isComponentMounted.current
//       ) {
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       if (isComponentMounted.current) {
//         setContent(content.trim());
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         toast.error("Message yuborishda xatolik: " + error.message);
//       }
//     } finally {
//       if (isComponentMounted.current) {
//         setIsSending(false);
//       }
//     }
//   };

//   // Guruh yaratish funksiyasi
//   const createGroup = async () => {
//     if (!newGroupName.trim() || selectedMembers.length === 0) {
//       toast.warn("Guruh nomi va a'zolar tanlanishi shart");
//       return;
//     }

//     try {
//       const memberIds = selectedMembers.map((member) => member.id);
//       memberIds.push(user.id); // Adminni ham qo'shamiz

//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/groups/create_group/`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newGroupDescription,
//             is_public: isPublicGroup,
//             member_ids: memberIds,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Guruh yaratishda xatolik");
//       }

//       const groupData = await response.json();
//       console.log("Guruh yaratildi:", groupData);

//       // Guruhlar ro'yxatini yangilash
//       fetchGroups();

//       // Modalni yopish va formani tozalash
//       setShowCreateGroupModal(false);
//       setNewGroupName("");
//       setNewGroupDescription("");
//       setSelectedMembers([]);
//       setIsPublicGroup(true);

//       toast.success("Guruh muvaffaqiyatli yaratildi!");
//     } catch (error) {
//       console.error("Guruh yaratishda xatolik:", error);
//       toast.error("Guruh yaratishda xatolik: " + error.message);
//     }
//   };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     // single, reliable heuristic
//     const isGroup =
//       chat?.chat_type === "group" ||
//       !!chat?.group_type ||
//       typeof chat?.member_count === "number" ||
//       (!!chat?.name && !chat?.username);

//     if (isGroup) {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   // Joriy tanlangan chat
//   const currentChat = selectedUser || selectedGroup;

//   // Message delete qilish funksiyasi
//   const deleteMessage = async (messageId) => {
//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const err = await response.json().catch(() => ({}));
//         throw new Error(err.message || "Delete xatolik!");
//       }

//       // WebSocket orqali boshqa foydalanuvchilarga xabar berish
//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(
//           JSON.stringify({
//             type: "delete_message",
//             message_id: messageId,
//           })
//         );
//       }

//       // Local state yangilash
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId)
//             ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//             : msg
//         )
//       );

//       console.log("Message deleted:", messageId);
//       toast.success("Xabar o'chirildi");
//     } catch (err) {
//       console.error("❌ Message delete error:", err);
//       toast.error("Xabarni o'chirishda xatolik: " + err.message);
//     }
//   };

//   // Message edit qilish funksiyasi
//   const editMessage = async (messageId, newContent) => {
//     if (!newContent.trim()) return;

//     try {
//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ content: newContent }),
//         }
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Server error ${response.status}: ${errorText}`);
//       }

//       const updatedMessage = await response.json();

//       // WebSocket orqali boshqa foydalanuvchilarga xabar berish
//       if (
//         socketRef.current &&
//         socketRef.current.readyState === WebSocket.OPEN
//       ) {
//         socketRef.current.send(
//           JSON.stringify({
//             type: "edit_message",
//             message: {
//               id: messageId,
//               content: newContent,
//               is_edited: true,
//             },
//           })
//         );
//       }

//       // Local state yangilash
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === messageId
//             ? {
//                 ...msg,
//                 content: newContent,
//                 is_edited: true,
//                 isLoading: false,
//               }
//             : msg
//         )
//       );

//       setEditingMessage(null);
//       setContent("");
//       toast.success("Xabar tahrirlandi");
//     } catch (err) {
//       console.error("❌ Message edit error:", err.message);
//       toast.error("Xabarni tahrirlashda xatolik: " + err.message);

//       // Error holatda editing rejimini yopish
//       setEditingMessage(null);
//       setContent("");
//     }
//   };

//   const startEdit = (msg) => {
//     setEditingMessage(msg);
//     setContent(msg.content);
//   };

//   // Tahrirlashni bekor qilish
//   const cancelEdit = () => {
//     setEditingMessage(null);
//     setContent("");
//   };

//   // Tahrirlashni saqlash
//   const saveEdit = () => {
//     if (editingMessage) {
//       editMessage(editingMessage.id, content);
//     }
//   };

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <ToastContainer position="top-right" autoClose={3000} />
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
//             <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {groups.map((group) => (
//             <div
//               key={group.id}
//               onClick={() => selectChat(group)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedGroup?.id === group.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {group.name?.charAt(0) || "G"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {group.name}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   {group.member_count} members • {group.group_type}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedGroup?.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedGroup?.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                     {selectedGroup?.member_count} members
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.is_my_message;
//                   const senderName = msg.sender_name;

//                   return (
//                     <div
//                       key={String(msg.id)}
//                       className={`flex ${
//                         isMyMessage ? "justify-end " : "justify-start"
//                       }`}
//                     >
//                       {/* Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
//                       {!isMyMessage && !msg.isDeleted && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {/* Sender ismi faqat delete qilinmagan xabarda */}
//                         {!isMyMessage && !selectedUser && !msg.isDeleted && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-gray-200 text-gray-800 rounded-bl-md"
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.isDeleted ? (
//                               <span className="italic text-gray-400">
//                                 o'chirilgan xabar
//                               </span>
//                             ) : msg.isLoading ? (
//                               <span className="italic text-gray-400">
//                                 Yuklanmoqda...
//                               </span>
//                             ) : (
//                               <>
//                                 {msg.content}
//                                 {msg.is_edited && (
//                                   <span className="text-xs ml-2 italic opacity-70">
//                                     (tahrirlangan)
//                                   </span>
//                                 )}
//                               </>
//                             )}
//                           </div>

//                           {!msg.isDeleted && (
//                             <div
//                               className={`text-xs mt-2 flex justify-between items-center ${
//                                 isMyMessage ? "text-blue-100" : "text-gray-500"
//                               }`}
//                             >
//                               <span>
//                                 {new Date(msg.timestamp).toLocaleTimeString(
//                                   [],
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   }
//                                 )}
//                                 {msg.is_edited && " ✏️"}
//                               </span>

//                               {isMyMessage && !msg.isLoading && (
//                                 <div className="flex ml-2">
//                                   <button
//                                     className="hover:text-red-500 cursor-pointer"
//                                     onClick={() => deleteMessage(msg.id)}
//                                     title="O'chirish"
//                                   >
//                                     <MdDelete />
//                                   </button>
//                                   <button
//                                     className="ml-2 hover:text-yellow-500 cursor-pointer"
//                                     onClick={() => startEdit(msg)}
//                                     title="Tahrirlash"
//                                   >
//                                     <MdEdit />
//                                   </button>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {isMyMessage && !msg.isDeleted && (
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
//                   placeholder={
//                     editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
//                   }
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       editingMessage ? saveEdit() : sendMessage();
//                     } else if (e.key === "Escape") {
//                       cancelEdit();
//                     }
//                   }}
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!isConnected || isLoading}
//                 />

//                 {editingMessage ? (
//                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
//                     <button
//                       onClick={saveEdit}
//                       disabled={!content.trim()}
//                       className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Saqlash"
//                     >
//                       ✓
//                     </button>
//                     <button
//                       onClick={cancelEdit}
//                       className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Bekor qilish"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={sendMessage}
//                     disabled={!content.trim()}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                     title="Yuborish"
//                   >
//                     ➤
//                   </button>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose a group from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }/////////
//////////////////////////
// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
// import { ToastContainer, toast } from "react-toastify";
// import { MdDelete } from "react-icons/md";
// import { MdEdit } from "react-icons/md";
// import "react-toastify/dist/ReactToastify.css";

// export default function Chat() {
//   const { user } = useAuth();
//   const [users, setUsers] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [roomId, setRoomId] = useState(null);
//   const [currentGroupId, setCurrentGroupId] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("groups");
//   const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState("");
//   const [newGroupDescription, setNewGroupDescription] = useState("");
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isPublicGroup, setIsPublicGroup] = useState(true);
//   const [isSending, setIsSending] = useState(false);
//   const [editingMessage, setEditingMessage] = useState(null);

//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());
//   const notifSocketRef = useRef(null);
//   const isComponentMounted = useRef(true);
//   const reconnectTimeoutRef = useRef(null);

//   const token = localStorage.getItem("access_token");

//   useEffect(() => {
//     isComponentMounted.current = true;
//     return () => {
//       isComponentMounted.current = false;
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//       if (notifSocketRef.current) {
//         notifSocketRef.current.close();
//       }
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Message formatini to'g'rilash funksiyasi - YAXSHILANGAN
//   const formatMessage = useCallback(
//     (msg) => {
//       let senderName = "";
//       let senderId = "";

//       // Sender ni aniqlash
//       if (typeof msg.sender === "object" && msg.sender !== null) {
//         senderName = msg.sender.fio || msg.sender.username || "User";
//         senderId = msg.sender.id;
//       } else if (typeof msg.sender === "string") {
//         // Agar sender ID bo'lsa
//         senderId = msg.sender;
//         if (msg.sender === user?.id) {
//           senderName = "Me";
//         } else {
//           // Boshqa user bo'lsa, users ro'yxatidan topish
//           const senderUser = users.find(
//             (u) => String(u.id) === String(msg.sender)
//           );
//           senderName = senderUser?.fio || senderUser?.username || "User";
//         }
//       }

//       // Xabarning kimga tegishli ekanligini aniqlash - TO'G'RI
//       const is_my_message = String(senderId) === String(user?.id);

//       return {
//         ...msg,
//         id: msg.id || `msg-${Date.now()}-${Math.random()}`,
//         timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
//         sender: senderId,
//         sender_name: senderName,
//         content: msg.content || "",
//         message_type: msg.message_type || "text",
//         is_my_message: is_my_message, // To'g'ri aniqlash
//         is_edited: msg.is_edited || false,
//         isDeleted: msg.isDeleted || false,
//         // Xabarning original content ni saqlash (edit/delete uchun)
//         originalContent: msg.originalContent || msg.content,
//       };
//     },
//     [user?.id, users]
//   );

//   // Xavfsiz message qo'shish
//   const addMessageSafely = useCallback(
//     (newMsg) => {
//       if (!isComponentMounted.current) return;

//       const formattedMsg = formatMessage(newMsg);
//       const messageId = formattedMsg.id;

//       if (messageIdsRef.current.has(messageId)) {
//         console.log("Duplicate message skipped:", messageId);
//         return;
//       }

//       messageIdsRef.current.add(messageId);
//       setMessages((prev) => [...prev, formattedMsg]);

//       // Yangi message qo'shilganda scroll qilish
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//       }, 100);
//     },
//     [formatMessage]
//   );

//   // Foydalanuvchilarni olish
//   useEffect(() => {
//     if (!user?.id || !token) return;

//     fetch(`http://5.133.122.226:8001/api/employee/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           setUsers(data.filter((u) => u.id !== user.id));
//         }
//       })
//       .catch((error) => {
//         console.error("Foydalanuvchilarni olishda xatolik:", error);
//       });
//   }, [token, user?.id]);

//   // Guruhlarni olish
//   const fetchGroups = useCallback(() => {
//     if (!token) return;

//     fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
//       method: "GET",
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data) && isComponentMounted.current) {
//           // dedupe by id and add chat_type
//           const map = new Map();
//           data.forEach((g) => {
//             if (g && g.id != null) {
//               map.set(g.id, { ...g, chat_type: "group" });
//             }
//           });
//           const uniqueGroups = Array.from(map.values());
//           console.log("Groups loaded (unique):", uniqueGroups);
//           setGroups(uniqueGroups);
//         }
//       })
//       .catch((error) => {
//         console.error("Guruhlarni olishda xatolik:", error);
//       });
//   }, [token]);

//   useEffect(() => {
//     if (!user?.id || !token) return;
//     fetchGroups();
//   }, [token, user?.id, fetchGroups]);

//   const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.close(1000, reason);
//     }
//   }, []);

//   // Notification WebSocket ulanish
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

//         if (!isComponentMounted.current) return;

//         if (data.type === "user_status") {
//           setUsers((prev) =>
//             prev.map((u) =>
//               u.id === data.user_id ? { ...u, is_online: data.is_online } : u
//             )
//           );
//         } else if (
//           data.type === "group_message" ||
//           data.type === "group_update"
//         ) {
//           // Guruh yangilanishlari
//           fetchGroups();

//           // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
//           if (
//             selectedGroup &&
//             data.message &&
//             data.message.group === selectedGroup.id
//           ) {
//             addMessageSafely(data.message);
//           }
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash - REAL VAQTDA
//           console.log("🔔 Message edited notification:", data.message);
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg.id === formattedMessage.id ? formattedMessage : msg
//             )
//           );
//           // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
//           if (String(formattedMessage.sender) !== String(user?.id)) {
//             toast.success("Xabar tahrirlandi");
//           }
//         } else if (data.type === "delete_message" && data.message_id) {
//           // O'chirilgan xabarni yangilash - REAL VAQTDA
//           console.log("🔔 Message deleted notification:", data.message_id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//           // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
//           const deletedMessage = messages.find(
//             (msg) => String(msg.id) === String(data.message_id)
//           );
//           if (
//             deletedMessage &&
//             String(deletedMessage.sender) !== String(user?.id)
//           ) {
//             toast.info("Xabar o'chirildi");
//           }
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // Qo'shimcha format uchun - server boshqa format yuborayotgan bo'lishi mumkin
//           console.log(
//             "🔔 Message deleted notification (alternative format):",
//             data.message_id
//           );
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         } else if (data.action === "delete_message" && data.message_id) {
//           // Alternative format uchun
//           console.log("🗑️ Message deleted (action format):", data.message_id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         } else if (data.type === "delete" && data.id) {
//           // Simple format uchun
//           console.log("🗑️ Message deleted (simple format):", data.id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         }
//       } catch (err) {
//         console.error("Notification parse error:", err);
//       }
//     };

//     notifSocketRef.current.onclose = (event) => {
//       console.log("🔔 Notifications WS closed");
//       if (isComponentMounted.current && token) {
//         setTimeout(() => {
//           if (isComponentMounted.current && token) {
//             notifSocketRef.current = new WebSocket(notifUrl);
//           }
//         }, 3000);
//       }
//     };

//     notifSocketRef.current.onerror = (err) => {
//       console.error("🔔 Notifications WS error:", err);
//     };

//     return () => {
//       cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
//     };
//   }, [
//     token,
//     selectedGroup,
//     addMessageSafely,
//     fetchGroups,
//     cleanupWebSocket,
//     formatMessage,
//   ]);

//   // WebSocket ulanish funksiyasi
//   const connectWebSocket = useCallback(() => {
//     const targetId = selectedGroup?.id ?? currentGroupId;
//     if (!targetId || !token) return;
//     if (socketRef.current?.readyState === WebSocket.OPEN) return;
//     if (!isComponentMounted.current) return;

//     console.log("WebSocket ulanmoqda... targetId:", targetId);

//     // WebSocket URL'sini doğru şekilde oluştur
//     const wsUrl = `ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;

//     // Eski WebSocket ni yopish
//     if (socketRef.current) {
//       socketRef.current.close();
//     }

//     socketRef.current = new WebSocket(wsUrl);

//     socketRef.current.onopen = () => {
//       console.log("💬 Chat WS connected");
//       if (isComponentMounted.current) {
//         setIsConnected(true);
//       }
//     };

//     // WebSocket mesaj işleyicilerini ekle
//     socketRef.current.onmessage = (e) => {
//       try {
//         const data = JSON.parse(e.data);
//         console.log("WebSocket message received:", data);

//         if (data.type === "chat_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "group_message" && data.message) {
//           addMessageSafely(data.message);
//         } else if (data.type === "message_edited" && data.message) {
//           // Tahrirlangan xabarni yangilash - REAL VAQTDA
//           console.log("📝 Message edited received:", data.message);
//           const formattedMessage = formatMessage(data.message);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(formattedMessage.id)
//                 ? formattedMessage
//                 : msg
//             )
//           );
//           // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
//           if (String(formattedMessage.sender) !== String(user?.id)) {
//             toast.success("Xabar tahrirlandi");
//           }
//         } else if (data.type === "delete_message" && data.message_id) {
//           // O'chirilgan xabarni yangilash - REAL VAQTDA
//           console.log("🗑️ Message deleted received:", data.message_id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//           // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
//           const deletedMessage = messages.find(
//             (msg) => String(msg.id) === String(data.message_id)
//           );
//           if (
//             deletedMessage &&
//             String(deletedMessage.sender) !== String(user?.id)
//           ) {
//             toast.info("Xabar o'chirildi");
//           }
//         } else if (data.type === "message_deleted" && data.message_id) {
//           // Qo'shimcha format uchun - server boshqa format yuborayotgan bo'lishi mumkin
//           console.log(
//             "🗑️ Message deleted (alternative format):",
//             data.message_id
//           );
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         } else if (data.action === "delete_message" && data.message_id) {
//           // Alternative format uchun
//           console.log("🗑️ Message deleted (action format):", data.message_id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.message_id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         } else if (data.type === "delete" && data.id) {
//           // Simple format uchun
//           console.log("🗑️ Message deleted (simple format):", data.id);
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(data.id)
//                 ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//                 : msg
//             )
//           );
//         } else if (data.content && data.sender) {
//           addMessageSafely(data);
//         } else if (data.type === "message") {
//           addMessageSafely(data);
//         }
//       } catch (err) {
//         console.error("WebSocket parse error:", err);
//       }
//     };
//     // ... existing code ...

//     // Message edit qilish funksiyasi - REAL VAQTDA ISHLASH UCHUN
//     const editMessage = async (messageId, newContent) => {
//       if (!newContent.trim()) return;

//       try {
//         // Avval local state yangilash (tezroq UI response uchun)
//         setMessages((prev) =>
//           prev.map((msg) =>
//             String(msg.id) === String(messageId)
//               ? { ...msg, content: newContent, is_edited: true }
//               : msg
//           )
//         );

//         const response = await fetch(
//           `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//           {
//             method: "PATCH",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({ content: newContent }),
//           }
//         );

//         if (!response.ok) {
//           // Agar serverda xatolik bo'lsa, oldingi holatga qaytarish
//           setMessages((prev) =>
//             prev.map((msg) =>
//               String(msg.id) === String(messageId)
//                 ? {
//                     ...msg,
//                     content: msg.originalContent || msg.content,
//                     is_edited: false,
//                   }
//                 : msg
//             )
//           );
//           throw new Error("Edit xatolik!");
//         }

//         const updatedMessage = await response.json();
//         const formattedMessage = formatMessage(updatedMessage);

//         // Local state ni serverdan kelgan ma'lumot bilan yangilash
//         setMessages((prev) =>
//           prev.map((msg) =>
//             String(msg.id) === String(messageId) ? formattedMessage : msg
//           )
//         );

//         // WebSocket orqali boshqa foydalanuvchilarga xabar berish - TO'G'RI FORMAT
//         if (socketRef.current?.readyState === WebSocket.OPEN) {
//           socketRef.current.send(
//             JSON.stringify({
//               type: "message_edited", // Bu yerda "delete_message" emas, "message_edited" bo'lishi kerak
//               message: formattedMessage,
//               group_id: currentGroupId,
//               user_id: user?.id,
//             })
//           );
//         }

//         setEditingMessage(null);
//         setContent("");
//         toast.success("Xabar tahrirlandi");
//       } catch (err) {
//         console.error("❌ Message edit error:", err.message);
//         toast.error("Xabarni tahrirlashda xatolik: " + err.message);
//         setEditingMessage(null);
//         setContent("");
//       }
//     };
//     // ... existing code ...

//     socketRef.current.onclose = (event) => {
//       console.log("💬 WebSocket closed");
//       if (isComponentMounted.current) {
//         setIsConnected(false);
//       }

//       // Avtomatik qayta ulanish
//       if (
//         isComponentMounted.current &&
//         token &&
//         (selectedGroup?.id || currentGroupId)
//       ) {
//         reconnectTimeoutRef.current = setTimeout(() => {
//           connectWebSocket();
//         }, 3000);
//       }
//     };

//     socketRef.current.onerror = (err) => {
//       console.error("💬 WebSocket error:", err);
//     };
//   }, [token, currentGroupId, addMessageSafely, selectedGroup, formatMessage]);

//   // Chat room olish va WS ulash (guruh chat)
//   useEffect(() => {
//     if (!selectedGroup || !user?.id || !token) return;

//     console.log("Guruh chat room olinmoqda...", selectedGroup?.id);
//     setIsLoading(true);

//     // Guruh tanlangan bo'lsa
//     if (selectedGroup) {
//       setCurrentGroupId(selectedGroup.id);
//       setRoomId(selectedGroup.id);
//       messageIdsRef.current.clear();

//       // Guruh messages olish
//       fetch(
//         `http://5.133.122.226:8001/api/chat/messages/?group_id=${selectedGroup.id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       )
//         .then((res) => {
//           if (!res.ok) throw new Error("Network response was not ok");
//           return res.json();
//         })
//         .then((msgs) => {
//           console.log("Group messages received:", msgs);

//           if (Array.isArray(msgs) && isComponentMounted.current) {
//             const formattedMessages = msgs.map((msg) => formatMessage(msg));
//             setMessages(formattedMessages);
//             formattedMessages.forEach((msg) => {
//               messageIdsRef.current.add(msg.id);
//             });
//           }
//         })
//         .catch((err) => {
//           console.error("Group messages olishda xatolik:", err);
//         })
//         .finally(() => {
//           if (isComponentMounted.current) {
//             setIsLoading(false);
//           }
//         });

//       // Eski WebSocket ni yopish
//       cleanupWebSocket(socketRef.current, "New room selection");

//       // Yangi WebSocket ulash
//       setTimeout(() => {
//         if (isComponentMounted.current) {
//           connectWebSocket();
//         }
//       }, 100);
//     }

//     return () => {
//       cleanupWebSocket(socketRef.current, "Unmounting chat WS");
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//     };
//   }, [
//     selectedGroup,
//     token,
//     user?.id,
//     connectWebSocket,
//     formatMessage,
//     cleanupWebSocket,
//   ]);

//   // Scroll
//   useEffect(() => {
//     if (isComponentMounted.current) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   // Send message
//   const sendMessage = async () => {
//     if (!content.trim() || !currentGroupId || !user?.id || isSending) return;

//     setIsSending(true);
//     const messageId = `local-${Date.now()}-${Math.random()}`;

//     // Grup mesajı için doğru veri yapısı
//     const messageData = {
//       group: currentGroupId, // currentGroupId kullan
//       content: content.trim(),
//       message_type: "text",
//     };

//     // Local message yaratish (faqat o'zim ko'raman)
//     const localMessage = {
//       ...messageData,
//       id: messageId,
//       timestamp: new Date().toISOString(),
//       sender: user.id,
//       sender_info: {
//         id: user.id,
//         fio: user.fio,
//         username: user.username,
//       },
//       is_local: true,
//       // Qo'shimcha: xabarning to'g'ri joylashishi uchun flag
//       is_my_message: true, // Bu xabar men yuborganimni bildiradi
//     };

//     setContent("");
//     addMessageSafely(localMessage);

//     try {
//       const endpoint = `http://5.133.122.226:8001/api/chat/messages/send_message/`;

//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(messageData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Message yuborishda xatolik");
//       }

//       const responseData = await response.json();
//       console.log("API response:", responseData);

//       if (
//         responseData.id &&
//         responseData.id !== messageId &&
//         isComponentMounted.current
//       ) {
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         addMessageSafely(responseData);
//       }
//     } catch (error) {
//       console.error("Message yuborishda xatolik:", error);

//       if (isComponentMounted.current) {
//         setContent(content.trim());
//         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
//         messageIdsRef.current.delete(messageId);
//         toast.error("Message yuborishda xatolik: " + error.message);
//       }
//     } finally {
//       if (isComponentMounted.current) {
//         setIsSending(false);
//       }
//     }
//   };

//   // Guruh yaratish funksiyasi
//   const createGroup = async () => {
//     if (!newGroupName.trim() || selectedMembers.length === 0) {
//       toast.warn("Guruh nomi va a'zolar tanlanishi shart");
//       return;
//     }

//     try {
//       const memberIds = selectedMembers.map((member) => member.id);
//       memberIds.push(user.id); // Adminni ham qo'shamiz

//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/groups/create_group/`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newGroupName,
//             description: newGroupDescription,
//             is_public: isPublicGroup,
//             member_ids: memberIds,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Guruh yaratishda xatolik");
//       }

//       const groupData = await response.json();
//       console.log("Guruh yaratildi:", groupData);

//       // Guruhlar ro'yxatini yangilash
//       fetchGroups();

//       // Modalni yopish va formani tozalash
//       setShowCreateGroupModal(false);
//       setNewGroupName("");
//       setNewGroupDescription("");
//       setSelectedMembers([]);
//       setIsPublicGroup(true);

//       toast.success("Guruh muvaffaqiyatli yaratildi!");
//     } catch (error) {
//       console.error("Guruh yaratishda xatolik:", error);
//       toast.error("Guruh yaratishda xatolik: " + error.message);
//     }
//   };

//   // A'zoni tanlash/olib tashlash
//   const toggleMemberSelection = (member) => {
//     if (selectedMembers.some((m) => m.id === member.id)) {
//       setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };

//   // Chatni tanlash
//   const selectChat = (chat) => {
//     // single, reliable heuristic
//     const isGroup =
//       chat?.chat_type === "group" ||
//       !!chat?.group_type ||
//       typeof chat?.member_count === "number" ||
//       (!!chat?.name && !chat?.username);

//     if (isGroup) {
//       setSelectedGroup(chat);
//       setSelectedUser(null);
//     } else {
//       setSelectedUser(chat);
//       setSelectedGroup(null);
//     }
//   };

//   const currentChat = selectedGroup;

//   // Message delete qilish funksiyasi - REAL VAQTDA ISHLASH UCHUN
//   const deleteMessage = async (messageId) => {
//     try {
//       console.log("🗑️ Starting delete message:", messageId);
//       console.log("🔌 WebSocket status - Chat:", socketRef.current?.readyState);
//       console.log(
//         "🔌 WebSocket status - Notification:",
//         notifSocketRef.current?.readyState
//       );

//       // Avval local state yangilash (tezroq UI response uchun)
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId)
//             ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
//             : msg
//         )
//       );

//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         // Agar serverda xatolik bo'lsa, oldingi holatga qaytarish
//         setMessages((prev) =>
//           prev.map((msg) =>
//             String(msg.id) === String(messageId)
//               ? {
//                   ...msg,
//                   isDeleted: false,
//                   content: msg.originalContent || msg.content,
//                 }
//               : msg
//           )
//         );
//         throw new Error("Delete xatolik!");
//       }

//       // WebSocket orqali boshqa foydalanuvchilarga xabar berish - SERVER FORMATIGA MOS
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         // Format 1: Asosiy format
//         const deletePayload1 = {
//           type: "delete_message",
//           message_id: messageId,
//           message_type: "text",
//           group_id: currentGroupId,
//           user_id: user?.id,
//           timestamp: new Date().toISOString(),
//         };

//         // Format 2: Alternative format
//         const deletePayload2 = {
//           action: "delete_message",
//           message_id: messageId,
//           message_type: "text",
//           group_id: currentGroupId,
//           user_id: user?.id,
//         };

//         // Format 3: Simple format
//         const deletePayload3 = {
//           type: "delete",
//           id: messageId,
//           group: currentGroupId,
//         };

//         console.log(
//           "🗑️ Sending delete message via WebSocket (multiple formats):",
//           {
//             format1: deletePayload1,
//             format2: deletePayload2,
//             format3: deletePayload3,
//           }
//         );

//         // Barcha formatlarni yuborish
//         socketRef.current.send(JSON.stringify(deletePayload1));
//         setTimeout(
//           () => socketRef.current.send(JSON.stringify(deletePayload2)),
//           100
//         );
//         setTimeout(
//           () => socketRef.current.send(JSON.stringify(deletePayload3)),
//           200
//         );
//       } else {
//         console.warn("⚠️ WebSocket not connected for delete message");
//       }

//       // Notification WebSocket orqali ham xabar berish - REAL VAQTDA ISHLASH UCHUN
//       if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
//         const deletePayload = {
//           type: "delete_message",
//           message_id: messageId,
//           group_id: currentGroupId,
//           user_id: user?.id,
//           timestamp: new Date().toISOString(),
//         };
//         console.log("🔔 Sending delete notification:", deletePayload);
//         notifSocketRef.current.send(JSON.stringify(deletePayload));
//       } else {
//         console.warn(
//           "⚠️ Notification WebSocket not connected for delete message"
//         );
//       }

//       toast.success("Xabar o'chirildi");
//     } catch (err) {
//       console.error("❌ Message delete error:", err);
//       toast.error("Xabarni o'chirishda xatolik: " + err.message);
//     }
//   };

//   // Message edit qilish funksiyasi - REAL VAQTDA ISHLASH UCHUN
//   const editMessage = async (messageId, newContent) => {
//     if (!newContent.trim()) return;

//     try {
//       console.log(
//         "📝 Starting edit message:",
//         messageId,
//         "New content:",
//         newContent
//       );
//       console.log("🔌 WebSocket status - Chat:", socketRef.current?.readyState);
//       console.log(
//         "🔌 WebSocket status - Notification:",
//         notifSocketRef.current?.readyState
//       );

//       // Avval local state yangilash (tezroq UI response uchun)
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId ? formattedMessage : msg)
//             ? { ...msg, content: newContent, is_edited: true }
//             : msg
//         )
//       );

//       const response = await fetch(
//         `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ content: newContent }),
//         }
//       );

//       if (!response.ok) {
//         // Agar serverda xatolik bo'lsa, oldingi holatga qaytarish
//         const updatedMessage = await response.json();
//         const formattedMessage = formatMessage(updatedMessage);
//         setMessages((prev) =>
//           prev.map((msg) =>
//             String(msg.id) === String(messageId ? formattedMessage : msg)
//               ? {
//                   ...msg,
//                   content: msg.originalContent || msg.content,
//                   is_edited: false,
//                 }
//               : msg
//           )
//         );
//         throw new Error("Edit xatolik!");
//       }

//       const updatedMessage = await response.json();
//       const formattedMessage = formatMessage(updatedMessage);

//       // Local state ni serverdan kelgan ma'lumot bilan yangilash
//       setMessages((prev) =>
//         prev.map((msg) =>
//           String(msg.id) === String(messageId) ? formattedMessage : msg
//         )
//       );

//       // WebSocket orqali boshqa foydalanuvchilarga xabar berish - SERVER FORMATIGA MOS
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         // Format 1: Asosiy format
//         const editPayload1 = {
//           type: "message_edited",
//           message: {
//             id: messageId,
//             content: newContent,
//             is_edited: true,
//             group_id: currentGroupId,
//             user_id: user?.id,
//             timestamp: new Date().toISOString(),
//           },
//           group_id: currentGroupId,
//           user_id: user?.id,
//         };

//         // Format 2: Alternative format
//         const editPayload2 = {
//           action: "edit_message",
//           message_id: messageId,
//           content: newContent,
//           group_id: currentGroupId,
//           user_id: user?.id,
//         };

//         // Format 3: Simple format
//         const editPayload3 = {
//           type: "edit",
//           id: messageId,
//           content: newContent,
//           group: currentGroupId,
//         };

//         console.log(
//           "📝 Sending edit message via WebSocket (multiple formats):",
//           {
//             format1: editPayload1,
//             format2: editPayload2,
//             format3: editPayload3,
//           }
//         );

//         // Barcha formatlarni yuborish
//         socketRef.current.send(JSON.stringify(editPayload1));
//         setTimeout(
//           () => socketRef.current.send(JSON.stringify(editPayload2)),
//           100
//         );
//         setTimeout(
//           () => socketRef.current.send(JSON.stringify(editPayload3)),
//           200
//         );
//       } else {
//         console.warn("⚠️ WebSocket not connected for edit message");
//       }

//       // Notification WebSocket orqali ham xabar berish - REAL VAQTDA ISHLASH UCHUN
//       if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
//         const editPayload = {
//           type: "message_edited",
//           message: {
//             id: messageId,
//             content: newContent,
//             is_edited: true,
//             group_id: currentGroupId,
//             user_id: user?.id,
//             timestamp: new Date().toISOString(),
//           },
//           group_id: currentGroupId,
//           user_id: user?.id,
//         };
//         console.log("🔔 Sending edit notification:", editPayload);
//         notifSocketRef.current.send(JSON.stringify(editPayload));
//       } else {
//         console.warn(
//           "⚠️ Notification WebSocket not connected for edit message"
//         );
//       }

//       setEditingMessage(null);
//       setContent("");
//       toast.success("Xabar tahrirlandi");
//     } catch (err) {
//       console.error("❌ Message edit error:", err.message);
//       toast.error("Xabarni tahrirlashda xatolik: " + err.message);
//       setEditingMessage(null);
//       setContent("");
//     }
//   };
//   // ... existing code ...

//   const startEdit = (msg) => {
//     setEditingMessage(msg);
//     setContent(msg.content);
//   };

//   // Tahrirlashni bekor qilish
//   const cancelEdit = () => {
//     setEditingMessage(null);
//     setContent("");
//   };

//   // Tahrirlashni saqlash
//   const saveEdit = () => {
//     if (editingMessage) {
//       editMessage(editingMessage.id, content);
//     }
//   };

//   if (!user) {
//     return (
//       <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
//       <ToastContainer position="top-right" autoClose={3000} />
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200 bg-gray-50">
//           <div className="flex justify-between items-center">
//             <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
//             <button
//               onClick={() => setShowCreateGroupModal(true)}
//               className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
//               title="Create group"
//             >
//               <BsPlus size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Tablar */}
//         <div className="flex border-b border-gray-200">
//           <button
//             className={`flex-1 py-2 text-center font-medium text-sm ${
//               activeTab === "groups"
//                 ? "text-blue-600 border-b-2 border-blue-600"
//                 : "text-gray-500"
//             }`}
//             onClick={() => setActiveTab("groups")}
//           >
//             <div className="flex items-center justify-center gap-1">
//               <BsPeople size={16} />
//               <span>Groups</span>
//             </div>
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {groups.map((group) => (
//             <div
//               key={group.id}
//               onClick={() => selectChat(group)}
//               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
//                 selectedGroup?.id === group.id
//                   ? "bg-blue-50 border-r-2 border-blue-500"
//                   : ""
//               }`}
//             >
//               <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
//                 {group.name?.charAt(0) || "G"}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 text-sm truncate">
//                   {group.name}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   {group.member_count} members • {group.group_type}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col bg-gray-50">
//         {currentChat ? (
//           <>
//             <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
//                   {selectedGroup?.name?.charAt(0) || "G"}
//                 </div>
//                 <div>
//                   <div className="font-medium text-gray-900 text-sm">
//                     {selectedGroup?.name}
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center">
//                     <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//                     {selectedGroup?.member_count} members
//                   </div>
//                 </div>
//               </div>
//               <div className="text-xs text-gray-500 cursor-pointer pr-5">
//                 <BsTelephoneForwardFill size={18} />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
//               {isLoading ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">Loading messages...</div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="text-center text-gray-500 py-8">
//                   <div className="text-lg">No messages yet</div>
//                   <div className="text-sm">Start a conversation!</div>
//                 </div>
//               ) : (
//                 messages.map((msg, index) => {
//                   const isMyMessage = msg.is_my_message;
//                   const senderName = msg.sender_name;

//                   return (
//                     <div
//                       key={String(msg.id)}
//                       className={`flex ${
//                         isMyMessage ? "justify-end " : "justify-start"
//                       }`}
//                     >
//                       {/* Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
//                       {!isMyMessage && !msg.isDeleted && (
//                         <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
//                           {senderName?.charAt(0) || "?"}
//                         </div>
//                       )}

//                       <div className="flex flex-col max-w-[75%]">
//                         {/* Sender ismi faqat delete qilinmagan xabarda */}
//                         {!isMyMessage && !selectedUser && !msg.isDeleted && (
//                           <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
//                             {senderName}
//                           </div>
//                         )}

//                         <div
//                           className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
//                             isMyMessage
//                               ? "bg-blue-500 text-white rounded-br-md"
//                               : "bg-gray-200 text-gray-800 rounded-bl-md"
//                           }`}
//                         >
//                           <div className="text-sm leading-relaxed">
//                             {msg.isDeleted ? (
//                               <span className="italic text-gray-400">
//                                 o'chirilgan xabar
//                               </span>
//                             ) : msg.isLoading ? (
//                               <span className="italic text-gray-400">
//                                 Yuklanmoqda...
//                               </span>
//                             ) : (
//                               <>
//                                 {msg.content}
//                                 {msg.is_edited && (
//                                   <span className="text-xs ml-2 italic opacity-70">
//                                     (tahrirlangan)
//                                   </span>
//                                 )}
//                               </>
//                             )}
//                           </div>

//                           {!msg.isDeleted && (
//                             <div
//                               className={`text-xs mt-2 flex justify-between items-center ${
//                                 isMyMessage ? "text-blue-100" : "text-gray-500"
//                               }`}
//                             >
//                               <span>
//                                 {new Date(msg.timestamp).toLocaleTimeString(
//                                   [],
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   }
//                                 )}
//                                 {msg.is_edited && " ✏️"}
//                               </span>

//                               {isMyMessage && !msg.isLoading && (
//                                 <div className="flex ml-2">
//                                   <button
//                                     className="hover:text-red-500 cursor-pointer"
//                                     onClick={() => deleteMessage(msg.id)}
//                                     title="O'chirish"
//                                   >
//                                     <MdDelete />
//                                   </button>
//                                   <button
//                                     className="ml-2 hover:text-yellow-500 cursor-pointer"
//                                     onClick={() => startEdit(msg)}
//                                     title="Tahrirlash"
//                                   >
//                                     <MdEdit />
//                                   </button>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {isMyMessage && !msg.isDeleted && (
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
//                   placeholder={
//                     editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
//                   }
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       editingMessage ? saveEdit() : sendMessage();
//                     } else if (e.key === "Escape") {
//                       cancelEdit();
//                     }
//                   }}
//                   className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
//                   disabled={!isConnected || isLoading}
//                 />

//                 {editingMessage ? (
//                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
//                     <button
//                       onClick={saveEdit}
//                       disabled={!content.trim()}
//                       className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Saqlash"
//                     >
//                       ✓
//                     </button>
//                     <button
//                       onClick={cancelEdit}
//                       className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                       title="Bekor qilish"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={sendMessage}
//                     disabled={!content.trim()}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                     title="Yuborish"
//                   >
//                     ➤
//                   </button>
//                 )}
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-gray-500 text-center">
//               <div className="text-lg mb-2">
//                 Select a group to start chatting
//               </div>
//               <div className="text-sm">
//                 Choose a group from the left sidebar
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Guruh yaratish modali */}
//       {showCreateGroupModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-xl font-bold mb-4">Create New Group</h2>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 value={newGroupName}
//                 onChange={(e) => setNewGroupName(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group name"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={newGroupDescription}
//                 onChange={(e) => setNewGroupDescription(e.target.value)}
//                 className="w-full border border-gray-300 rounded px-3 py-2"
//                 placeholder="Enter group description"
//                 rows="3"
//               />
//             </div>

//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isPublicGroup}
//                   onChange={(e) => setIsPublicGroup(e.target.checked)}
//                   className="mr-2"
//                 />
//                 <span className="text-sm">Public Group</span>
//               </label>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-2">
//                 Select Members
//               </label>
//               <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//                 {users.map((user) => (
//                   <div key={user.id} className="flex items-center mb-2">
//                     <input
//                       type="checkbox"
//                       checked={selectedMembers.some((m) => m.id === user.id)}
//                       onChange={() => toggleMemberSelection(user)}
//                       className="mr-2"
//                     />
//                     <span className="text-sm">{user.fio || user.username}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {selectedMembers.length} members selected
//               </div>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowCreateGroupModal(false)}
//                 className="px-4 py-2 border border-gray-300 rounded text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createGroup}
//                 className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
//               >
//                 Create Group
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


////////////


/// ishlaydigan gruopcaht 

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("groups");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublicGroup, setIsPublicGroup] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const notifSocketRef = useRef(null);
  const isComponentMounted = useRef(true);
  const reconnectTimeoutRef = useRef(null);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (notifSocketRef.current) {
        notifSocketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Message formatini to'g'rilash funksiyasi - YAXSHILANGAN
  const formatMessage = useCallback(
    (msg) => {
      let senderName = "";
      let senderId = "";

      // Sender ni aniqlash
      if (typeof msg.sender === "object" && msg.sender !== null) {
        senderName = msg.sender.fio || msg.sender.username || "User";
        senderId = msg.sender.id;
      } else if (typeof msg.sender === "string") {
        // Agar sender ID bo'lsa
        senderId = msg.sender;
        if (msg.sender === user?.id) {
          senderName = "Me";
        } else {
          // Boshqa user bo'lsa, users ro'yxatidan topish
          const senderUser = users.find(
            (u) => String(u.id) === String(msg.sender)
          );
          senderName = senderUser?.fio || senderUser?.username || "User";
        }
      }

      // Xabarning kimga tegishli ekanligini aniqlash - TO'G'RI
      const is_my_message = String(senderId) === String(user?.id);

      return {
        ...msg,
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
        sender: senderId,
        sender_name: senderName,
        content: msg.content || "",
        message_type: msg.message_type || "text",
        is_my_message: is_my_message, // To'g'ri aniqlash
        is_edited: msg.is_edited || false,
        isDeleted: msg.isDeleted || false,
        // Xabarning original content ni saqlash (edit/delete uchun)
        originalContent: msg.originalContent || msg.content,
      };
    },
    [user?.id, users]
  );

  // Xavfsiz message qo'shish
  const addMessageSafely = useCallback(
    (newMsg) => {
      if (!isComponentMounted.current) return;

      const formattedMsg = formatMessage(newMsg);
      const messageId = formattedMsg.id;

      if (messageIdsRef.current.has(messageId)) {
        console.log("Duplicate message skipped:", messageId);
        return;
      }

      messageIdsRef.current.add(messageId);
      setMessages((prev) => [...prev, formattedMsg]);

      // Yangi message qo'shilganda scroll qilish
      setTimeout(() => {
        if (isComponentMounted.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    },
    [formatMessage]
  );

  // Foydalanuvchilarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`http://5.133.122.226:8001/api/employee/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          setUsers(data.filter((u) => u.id !== user.id));
        }
      })
      .catch((error) => {
        console.error("Foydalanuvchilarni olishda xatolik:", error);
      });
  }, [token, user?.id]);

  // Guruhlarni olish
  const fetchGroups = useCallback(() => {
    if (!token) return;

    fetch(`http://5.133.122.226:8001/api/chat/groups/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && isComponentMounted.current) {
          // dedupe by id and add chat_type
          const map = new Map();
          data.forEach((g) => {
            if (g && g.id != null) {
              map.set(g.id, { ...g, chat_type: "group" });
            }
          });
          const uniqueGroups = Array.from(map.values());
          console.log("Groups loaded (unique):", uniqueGroups);
          setGroups(uniqueGroups);
        }
      })
      .catch((error) => {
        console.error("Guruhlarni olishda xatolik:", error);
      });
  }, [token]);

  useEffect(() => {
    if (!user?.id || !token) return;
    fetchGroups();
  }, [token, user?.id, fetchGroups]);

  const cleanupWebSocket = useCallback((ws, reason = "Cleanup") => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, reason);
    }
  }, []);

  // Notification WebSocket ulanish
  useEffect(() => {
    if (!token) return;

    const notifUrl = `ws://5.133.122.226:8001/ws/notifications/?token=${token}`;
    notifSocketRef.current = new WebSocket(notifUrl);

    notifSocketRef.current.onopen = () => {
      console.log("🔔 Notifications WS connected");
    };

    notifSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("�� Notification keldi:", data);

        if (!isComponentMounted.current) return;

        if (data.type === "user_status") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.user_id ? { ...u, is_online: data.is_online } : u
            )
          );
        } else if (
          data.type === "group_message" ||
          data.type === "group_update"
        ) {
          // Guruh yangilanishlari
          fetchGroups();

          // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
          if (
            selectedGroup &&
            data.message &&
            data.message.group === selectedGroup.id
          ) {
            addMessageSafely(data.message);
          }
        } else if (
          data.type === "message_update" &&
          (data.message || data.message_id || data.id)
        ) {
          // Tahrirlangan xabarni yangilash - REAL VAQTDA (ikkita formatni qo'llab-quvvatlaydi)
          if (data.message) {
            console.log("🔔 Message edited notification (full message):", data.message);
            const formattedMessage = formatMessage(data.message);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(formattedMessage.id)
                  ? formattedMessage
                  : msg
              )
            );
            if (String(formattedMessage.sender) !== String(user?.id)) {
              toast.success("Xabar tahrirlandi");
            }
          } else {
            const targetId = data.message_id || data.id;
            console.log("🔔 Message edited notification (id/content):", targetId);
            const editedMessage = messages.find(
              (msg) => String(msg.id) === String(targetId)
            );
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(targetId)
                  ? { ...msg, content: data.content ?? msg.content, is_edited: true }
                  : msg
              )
            );
            if (
              editedMessage &&
              String(editedMessage.sender) !== String(user?.id)
            ) {
              toast.success("Xabar tahrirlandi");
            }
          }
        } else if (data.type === "delete_message" && data.message_id) {
          // O'chirilgan xabarni yangilash - REAL VAQTDA
          console.log("🔔 Message deleted notification:", data.message_id);
          setMessages((prev) =>
            prev.map((msg) =>
              String(msg.id) === String(data.message_id)
                ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                : msg
            )
          );
          // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
          const deletedMessage = messages.find(
            (msg) => String(msg.id) === String(data.message_id)
          );
          if (
            deletedMessage &&
            String(deletedMessage.sender) !== String(user?.id)
          ) {
            toast.info("Xabar o'chirildi");
          }
        }
      } catch (err) {
        console.error("Notification parse error:", err);
      }
    };

    notifSocketRef.current.onclose = (event) => {
      console.log("🔔 Notifications WS closed");
      if (isComponentMounted.current && token) {
        setTimeout(() => {
          if (isComponentMounted.current && token) {
            notifSocketRef.current = new WebSocket(notifUrl);
          }
        }, 3000);
      }
    };

    notifSocketRef.current.onerror = (err) => {
      console.error("🔔 Notifications WS error:", err);
    };

    return () => {
      cleanupWebSocket(notifSocketRef.current, "Unmounting notifications WS");
    };
  }, [
    token,
    selectedGroup,
    addMessageSafely,
    fetchGroups,
    cleanupWebSocket,
    formatMessage,
  ]);

  // WebSocket ulanish funksiyasi
  const connectWebSocket = useCallback(() => {
    const targetId = selectedGroup?.id ?? currentGroupId;
    if (!targetId || !token) {
      console.warn("⚠️ Cannot connect WebSocket: missing targetId or token", {
        targetId,
        hasToken: !!token,
      });
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
      return;
    }

    if (!isComponentMounted.current) {
      console.warn("⚠️ Component not mounted, skipping WebSocket connection");
      return;
    }

    console.log("🔌 WebSocket ulanmoqda... targetId:", targetId);

    try {
      // WebSocket URL'sini doğru şekilde oluştur
      const wsUrl = `ws://5.133.122.226:8001/ws/chat/group/${targetId}/?token=${token}`;
      console.log("🔗 WebSocket URL:", wsUrl);

      // Eski WebSocket ni yopish
      if (socketRef.current) {
        console.log("🔌 Closing existing WebSocket connection");
        cleanupWebSocket(socketRef.current, "New connection");
        socketRef.current = null;
      }

      // Yangi WebSocket yaratish
      socketRef.current = new WebSocket(wsUrl);
      console.log(
        "🔌 New WebSocket created, readyState:",
        socketRef.current.readyState
      );

      // Connection timeout qo'yish
      const connectionTimeout = setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.CONNECTING) {
          console.warn("⚠️ WebSocket connection timeout, closing...");
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
          setIsConnected(false);
        }
      }, 150); // 15 soniya

      socketRef.current.onopen = () => {
        console.log("✅ Chat WS connected successfully");
        clearTimeout(connectionTimeout);
        if (isComponentMounted.current) {
          setIsConnected(true);
        }
      };

      // WebSocket mesaj işleyicilerini ekle
      socketRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("WebSocket message received:", data);

          if (data.type === "chat_message" && data.message) {
            addMessageSafely(data.message);
          } else if (data.type === "group_message" && data.message) {
            addMessageSafely(data.message);
          } else if (
            (data.type === "message_update" ||
              data.type === "message_edited" ||
              data.type === "edit_message" ||
              data.action === "message_update") &&
            (data.message_id || data.id || data.message)
          ) {
            console.log("UPDATE kelgan:", data);
            if (data.message) {
              const formattedMessage = formatMessage(data.message);
              setMessages((prev) =>
                prev.map((msg) =>
                  String(msg.id) === String(formattedMessage.id)
                    ? formattedMessage
                    : msg
                )
              );
              if (String(formattedMessage.sender) !== String(user?.id)) {
                toast.success("Xabar tahrirlandi");
              }
            } else {
              const targetId = data.message_id || data.id;
              setMessages((prev) =>
                prev.map((msg) =>
                  String(msg.id) === String(targetId)
                    ? { ...msg, content: data.content ?? msg.content, is_edited: true }
                    : msg
                )
              );
              toast.success("Xabar tahrirlandi");
            }
          } else if (data.type === "message_deleted" && data.message_id) {
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.message_id)
                  ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                  : msg
              )
            );
            toast.info("Xabar o'chirildi");
          } else if (
            data.action === "edit_message" &&
            data.message_id &&
            data.content
          ) {
            // Alternative format uchun
            console.log("📝 Message edited (action format):", data);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.message_id)
                  ? { ...msg, content: data.content, is_edited: true }
                  : msg
              )
            );
          } else if (data.type === "edit" && data.id && data.content) {
            // Simple format uchun
            console.log("📝 Message edited (simple format):", data);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.id)
                  ? { ...msg, content: data.content, is_edited: true }
                  : msg
              )
            );
          } else if (data.type === "delete_message" && data.message_id) {
            // O'chirilgan xabarni yangilash - REAL VAQTDA
            console.log("🗑️ Message deleted received:", data.message_id);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.message_id)
                  ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                  : msg
              )
            );
            // Faqat boshqa foydalanuvchilar uchun toast ko'rsatish
            const deletedMessage = messages.find(
              (msg) => String(msg.id) === String(data.message_id)
            );
            if (
              deletedMessage &&
              String(deletedMessage.sender) !== String(user?.id)
            ) {
              toast.info("Xabar o'chirildi");
            }
          } else if (data.type === "message_deleted" && data.message_id) {
            // Qo'shimcha format uchun - server boshqa format yuborayotgan bo'lishi mumkin
            console.log(
              "🗑️ Message deleted (alternative format):",
              data.message_id
            );
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.message_id)
                  ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                  : msg
              )
            );
          } else if (data.action === "delete_message" && data.message_id) {
            // Alternative format uchun
            console.log("🗑️ Message deleted (action format):", data.message_id);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.message_id)
                  ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                  : msg
              )
            );
          } else if (data.type === "delete" && data.id) {
            // Simple format uchun
            console.log("🗑️ Message deleted (simple format):", data.id);
            setMessages((prev) =>
              prev.map((msg) =>
                String(msg.id) === String(data.id)
                  ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
                  : msg
              )
            );
            console.log("WS kelgan:", data);
          } else if (data.content && data.sender) {
            addMessageSafely(data);
          } else if (data.type === "message") {
            addMessageSafely(data);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log("💬 WebSocket closed:", event.code, event.reason);
        clearTimeout(connectionTimeout);
        if (isComponentMounted.current) {
          setIsConnected(false);
        }

        // Avtomatik qayta ulanish
        if (
          isComponentMounted.current &&
          token &&
          (selectedGroup?.id || currentGroupId)
        ) {
          console.log("🔄 Attempting to reconnect WebSocket...");
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      };

      socketRef.current.onerror = (err) => {
        console.error("💬 WebSocket error:", err);
        console.error("💬 WebSocket error details:", {
          readyState: socketRef.current?.readyState,
          url: socketRef.current?.url,
          error: err,
        });

        // Error holatda WebSocket ni qayta ulash
        if (
          isComponentMounted.current &&
          token &&
          (selectedGroup?.id || currentGroupId)
        ) {
          console.log("🔄 Attempting to reconnect WebSocket after error...");
          setTimeout(() => {
            if (isComponentMounted.current) {
              if (socketRef.current) {
                cleanupWebSocket(socketRef.current, "Reconnecting after error");
                socketRef.current = null;
              }
              connectWebSocket();
            }
          }, 100);
        }
      };
    } catch (error) {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    }
  }, [
    token,
    currentGroupId,
    addMessageSafely,
    selectedGroup,
    formatMessage,
    cleanupWebSocket,
  ]);

  // Chat room olish va WS ulash (guruh chat)
  useEffect(() => {
    if (!selectedGroup || !user?.id || !token) return;

    console.log("Guruh chat room olinmoqda...", selectedGroup?.id);
    setIsLoading(true);

    // Guruh tanlangan bo'lsa
    if (selectedGroup) {
      setCurrentGroupId(selectedGroup.id);
      setRoomId(selectedGroup.id);
      messageIdsRef.current.clear();

      // Guruh messages olish
      fetch(
        `http://5.133.122.226:8001/api/chat/messages/?group_id=${selectedGroup.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((msgs) => {
          console.log("Group messages received:", msgs);

          if (Array.isArray(msgs) && isComponentMounted.current) {
            const formattedMessages = msgs.map((msg) => formatMessage(msg));
            setMessages(formattedMessages);
            formattedMessages.forEach((msg) => {
              messageIdsRef.current.add(msg.id);
            });
          }
        })
        .catch((err) => {
          console.error("Group messages olishda xatolik:", err);
        })
        .finally(() => {
          if (isComponentMounted.current) {
            setIsLoading(false);
          }
        });

      // Eski WebSocket ni yopish
      if (socketRef.current) {
        console.log("🔌 Closing existing WebSocket for new room selection");
        cleanupWebSocket(socketRef.current, "New room selection");
        socketRef.current = null;
      }

      // Yangi WebSocket ulash - delay bilan
      setTimeout(() => {
        if (
          isComponentMounted.current &&
          selectedGroup?.id === selectedGroup.id
        ) {
          console.log("🔌 Connecting WebSocket after delay...");
          connectWebSocket();
        }
      }, 500); // 500ms delay
    }

    return () => {
      if (socketRef.current) {
        console.log("🔌 Cleanup: closing WebSocket on unmount");
        cleanupWebSocket(socketRef.current, "Unmounting chat WS");
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [
    selectedGroup,
    token,
    user?.id,
    connectWebSocket,
    formatMessage,
    cleanupWebSocket,
  ]);

  // Scroll
  useEffect(() => {
    if (isComponentMounted.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!content.trim() || !currentGroupId || !user?.id || isSending) return;

    setIsSending(true);
    const messageId = `local-${Date.now()}-${Math.random()}`;

    // Grup mesajı için doğru veri yapısı
    const messageData = {
      group: currentGroupId, // currentGroupId kullan
      content: content.trim(),
      message_type: "text",
    };

    // Local message yaratish (faqat o'zim ko'raman)
    const localMessage = {
      ...messageData,
      id: messageId,
      timestamp: new Date().toISOString(),
      sender: user.id,
      sender_info: {
        id: user.id,
        fio: user.fio,
        username: user.username,
      },
      is_local: true,
      // Qo'shimcha: xabarning to'g'ri joylashishi uchun flag
      is_my_message: true, // Bu xabar men yuborganimni bildiradi
    };

    setContent("");
    addMessageSafely(localMessage);

    try {
      const endpoint = `http://5.133.122.226:8001/api/chat/messages/send_message/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Message yuborishda xatolik");
      }

      const responseData = await response.json();
      console.log("API response:", responseData);

      if (
        responseData.id &&
        responseData.id !== messageId &&
        isComponentMounted.current
      ) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);
        addMessageSafely(responseData);
      }
    } catch (error) {
      console.error("Message yuborishda xatolik:", error);

      if (isComponentMounted.current) {
        setContent(content.trim());
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);
        toast.error("Message yuborishda xatolik: " + error.message);
      }
    } finally {
      if (isComponentMounted.current) {
        setIsSending(false);
      }
    }
  };

  // Guruh yaratish funksiyasi
  const createGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.warn("Guruh nomi va a'zolar tanlanishi shart");
      return;
    }

    try {
      const memberIds = selectedMembers.map((member) => member.id);
      memberIds.push(user.id); // Adminni ham qo'shamiz

      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/groups/create_group/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            is_public: isPublicGroup,
            member_ids: memberIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Guruh yaratishda xatolik");
      }

      const groupData = await response.json();
      console.log("Guruh yaratildi:", groupData);

      // Guruhlar ro'yxatini yangilash
      fetchGroups();

      // Modalni yopish va formani tozalash
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
      setIsPublicGroup(true);

      toast.success("Guruh muvaffaqiyatli yaratildi!");
    } catch (error) {
      console.error("Guruh yaratishda xatolik:", error);
      toast.error("Guruh yaratishda xatolik: " + error.message);
    }
  };

  // A'zoni tanlash/olib tashlash
  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Chatni tanlash
  const selectChat = (chat) => {
    // single, reliable heuristic
    const isGroup =
      chat?.chat_type === "group" ||
      !!chat?.group_type ||
      typeof chat?.member_count === "number" ||
      (!!chat?.name && !chat?.username);

    if (isGroup) {
      setSelectedGroup(chat);
      setSelectedUser(null);
    } else {
      setSelectedUser(chat);
      setSelectedGroup(null);
    }
  };

  const currentChat = selectedGroup;

  // Message delete qilish funksiyasi - REAL VAQTDA ISHLASH UCHUN
  const deleteMessage = async (messageId) => {
    try {
      console.log("🗑️ Starting delete message:", messageId);
      console.log("🔌 WebSocket status - Chat:", socketRef.current?.readyState);
      console.log(
        "🔌 WebSocket status - Notification:",
        notifSocketRef.current?.readyState
      );

      // Avval local state yangilash (tezroq UI response uchun)
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
            ? { ...msg, isDeleted: true, content: "o'chirilgan xabar" }
            : msg
        )
      );

      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/messages/${messageId}/delete_message/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Agar serverda xatolik bo'lsa, oldingi holatga qaytarish
        if (
          data.type === "delete_message" ||
          data.type === "message_deleted" ||
          data.type === "delete" ||
          data.action === "delete_message"
        ) {
          const id = data.message_id || data.id;
          if (!id) return;

          setMessages((prev) => {
            const updated = prev.map((msg) =>
              String(msg.id) === String(id)
                ? { ...msg, isDeleted: true, content: "o‘chirilgan xabar" }
                : msg
            );

            // 🔔 toast faqat boshqa user uchun
            const deletedMessage = prev.find(
              (msg) => String(msg.id) === String(id)
            );
            if (
              deletedMessage &&
              String(deletedMessage.sender) !== String(user?.id)
            ) {
              toast.info("🗑️ Xabar o‘chirildi");
            }

            return updated;
          });
          return;
        }

        throw new Error("Delete xatolik!");
      }

      // WebSocket orqali boshqa foydalanuvchilarga xabar berish - SERVER FORMATIGA MOS
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        // Format 1: Asosiy format
        const deletePayload1 = {
          type: "delete_message",
          message_id: messageId,
          message_type: "text",
          group_id: currentGroupId,
          user_id: user?.id,
          timestamp: new Date().toISOString(),
        };

        // Format 2: Alternative format
        const deletePayload2 = {
          action: "delete_message",
          message_id: messageId,
          message_type: "text",
          group_id: currentGroupId,
          user_id: user?.id,
        };

        // Format 3: Simple format
        const deletePayload3 = {
          type: "delete",
          id: messageId,
          group: currentGroupId,
        };

        console.log(
          "🗑️ Sending delete message via WebSocket (multiple formats):",
          {
            format1: deletePayload1,
            format2: deletePayload2,
            format3: deletePayload3,
          }
        );

        // Barcha formatlarni yuborish
        socketRef.current.send(JSON.stringify(deletePayload1));
        setTimeout(
          () => socketRef.current.send(JSON.stringify(deletePayload2)),
          100
        );
        setTimeout(
          () => socketRef.current.send(JSON.stringify(deletePayload3)),
          100
        );
      } else {
        console.warn("⚠️ WebSocket not connected for delete message");
      }

      // Notification WebSocket orqali ham xabar berish - REAL VAQTDA ISHLASH UCHUN
      if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
        const deletePayload = {
          type: "delete_message",
          message_id: messageId,
          group_id: currentGroupId,
          user_id: user?.id,
          timestamp: new Date().toISOString(),
        };
        console.log("🔔 Sending delete notification:", deletePayload);
        notifSocketRef.current.send(JSON.stringify(deletePayload));
      } else {
        console.warn(
          "⚠️ Notification WebSocket not connected for delete message"
        );
      }

      toast.success("Xabar o'chirildi");
    } catch (err) {
      console.error("❌ Message delete error:", err);
      toast.error("Xabarni o'chirishda xatolik: " + err.message);
    }
  };

  // Message edit qilish funksiyasi - REAL VAQTDA ISHLASH UCHUN
  const editMessage = async (messageId, newContent) => {
    if (!newContent.trim()) return;

    try {
      console.log(
        "📝 Starting edit message:",
        messageId,
        "New content:",
        newContent
      );

      // WebSocket ulanishini tekshirish
      if (
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        console.warn("⚠️ WebSocket ulanmagan, qayta ulanmoqda...");
        connectWebSocket();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (
          !socketRef.current ||
          socketRef.current.readyState !== WebSocket.OPEN
        ) {
          throw new Error("WebSocket ulanmadi");
        }
      }

      // Local UI yangilash
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
            ? { ...msg, content: newContent, is_edited: true }
            : msg
        )
      );

      // Backendga so‘rov
      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (!response.ok) throw new Error("Edit xatolik!");

      const updatedMessage = await response.json();
      const formattedMessage = formatMessage(updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId) ? formattedMessage : msg
        )
      );

      // Serverdan kelgan xabar bilan UI ni yangilash
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId) ? formattedMessage : msg
        )
      );

      // WebSocket orqali yuborish
      const editPayload = {
        type: "message_update",
        message_id: messageId,
        content: newContent,
      };

      socketRef.current.send(JSON.stringify(editPayload));
      console.log("✏️ Edit xabari yuborildi:", editPayload);

      // Notification WebSocket orqali yuborish
      if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
        notifSocketRef.current.send(JSON.stringify(editPayload));
        console.log("🔔 Edit notification yuborildi:", editPayload);
      }

      setEditingMessage(null);
      setContent("");
      toast.success("Xabar tahrirlandi");
    } catch (err) {
      console.error("❌ Message edit error:", err.message);
      toast.error("Xabarni tahrirlashda xatolik: " + err.message);
      setEditingMessage(null);
      setContent("");
    }
  };

  const startEdit = (msg) => {
    setEditingMessage(msg);
    setContent(msg.content);
  };

  // Tahrirlashni bekor qilish
  const cancelEdit = () => {
    setEditingMessage(null);
    setContent("");
  };

  // Tahrirlashni saqlash
  const saveEdit = () => {
    if (editingMessage) {
      editMessage(editingMessage.id, content);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[90vh] max-w-[1600px] w-full bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="Create group"
            >
              <BsPlus size={20} />
            </button>
          </div>
        </div>

        {/* Tablar */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === "groups"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            <div className="flex items-center justify-center gap-1">
              <BsPeople size={16} />
              <span>Groups</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => selectChat(group)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                selectedGroup?.id === group.id
                  ? "bg-blue-50 border-r-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                {group.name?.charAt(0) || "G"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {group.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {group.member_count} members • {group.group_type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {currentChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                  {selectedGroup?.name?.charAt(0) || "G"}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {selectedGroup?.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
                    {selectedGroup?.member_count} members
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 cursor-pointer pr-5">
                <BsTelephoneForwardFill size={18} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg">No messages yet</div>
                  <div className="text-sm">Start a conversation!</div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMyMessage = msg.is_my_message;
                  const senderName = msg.sender_name;

                  return (
                    <div
                      key={String(msg.id)}
                      className={`flex ${
                        isMyMessage ? "justify-end " : "justify-start"
                      }`}
                    >
                      {/* Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
                      {!isMyMessage && !msg.isDeleted && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
                          {senderName?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="flex flex-col max-w-[75%]">
                        {/* Sender ismi faqat delete qilinmagan xabarda */}
                        {!isMyMessage && !selectedUser && !msg.isDeleted && (
                          <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
                            {senderName}
                          </div>
                        )}

                        <div
                          className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
                            isMyMessage
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-gray-200 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {msg.isDeleted ? (
                              <span className="italic text-gray-400">
                                o'chirilgan xabar
                              </span>
                            ) : msg.isLoading ? (
                              <span className="italic text-gray-400">
                                Yuklanmoqda...
                              </span>
                            ) : (
                              <>
                                {msg.content}
                                {msg.is_edited && (
                                  <span className="text-xs ml-2 italic opacity-70">
                                    (tahrirlangan)
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {!msg.isDeleted && (
                            <div
                              className={`text-xs mt-2 flex justify-between items-center ${
                                isMyMessage ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                                {msg.is_edited && " ✏️"}
                              </span>

                              {isMyMessage && !msg.isLoading && (
                                <div className="flex ml-2">
                                  <button
                                    className="hover:text-red-500 cursor-pointer"
                                    onClick={() => deleteMessage(msg.id)}
                                    title="O'chirish"
                                  >
                                    <MdDelete />
                                  </button>
                                  <button
                                    className="ml-2 hover:text-yellow-500 cursor-pointer"
                                    onClick={() => startEdit(msg)}
                                    title="Tahrirlash"
                                  >
                                    <MdEdit />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isMyMessage && !msg.isDeleted && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
                          Me
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      editingMessage ? saveEdit() : sendMessage();
                    } else if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                  className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
                  disabled={!isConnected || isLoading}
                />

                {editingMessage ? (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      onClick={saveEdit}
                      disabled={!content.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
                      title="Saqlash"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
                      title="Bekor qilish"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!content.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
                    title="Yuborish"
                  >
                    ➤
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">
                Select a group to start chatting
              </div>
              <div className="text-sm">
                Choose a group from the left sidebar
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guruh yaratish modali */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter group description"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublicGroup}
                  onChange={(e) => setIsPublicGroup(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Public Group</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Members
              </label>
              <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some((m) => m.id === user.id)}
                      onChange={() => toggleMemberSelection(user)}
                      className="mr-2"
                    />
                    <span className="text-sm">{user.fio || user.username}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMembers.length} members selected
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




  // return (
  //   <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
  //     <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
  //       <div className="p-4 border-b border-gray-200 bg-gray-50">
  //         <div className="flex justify-between items-center">
  //           <h2 className="font-medium text-gray-900 text-base">Chats</h2>
  //         </div>
  //         <div className="text-xs text-gray-500 mt-1">
  //           Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
  //         </div>
  //       </div>

  //       {/* Tablar */}
  //       <div className="flex border-b border-gray-200">
  //         <button
  //           className={`flex-1 py-2 text-center font-medium text-sm ${
  //             activeTab === "users"
  //               ? "text-blue-600 border-b-2 border-blue-600"
  //               : "text-gray-500"
  //           }`}
  //           onClick={() => setActiveTab("users")}
  //         >
  //           <div className="flex items-center justify-center gap-1">
  //             <FaUserFriends size={14} />
  //             <span>Contacts</span>
  //           </div>
  //         </button>
  //       </div>

  //       <div className="flex-1 overflow-y-auto">
  //         {
  //           // Foydalanuvchilar ro'yxati
  //           users.map((userItem) => (
  //             <div
  //               key={userItem.id}
  //               onClick={() => selectChat({ ...userItem, chat_type: "user" })}
  //               className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
  //                 selectedUser?.id === userItem.id
  //                   ? "bg-blue-50 border-r-2 border-blue-500"
  //                   : ""
  //               }`}
  //             >
  //               <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
  //                 {userItem.fio?.charAt(0) ||
  //                   userItem.username?.charAt(0) ||
  //                   "?"}
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
  //           ))
  //         }
  //       </div>
  //     </div>

  //     <div className="flex-1 flex flex-col bg-gray-50">
  //       {currentChat ? (
  //         <>
  //           <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
  //             <div className="flex items-center">
  //               <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
  //                 {selectedUser
  //                   ? selectedUser.fio?.charAt(0) ||
  //                     selectedUser.username?.charAt(0) ||
  //                     "?"
  //                   : selectedGroup.name?.charAt(0) || "G"}
  //               </div>
  //               <div>
  //                 <div className="font-medium text-gray-900 text-sm">
  //                   {selectedUser
  //                     ? selectedUser.fio || selectedUser.username || "No Name"
  //                     : selectedGroup.name}
  //                 </div>
  //                 <div className="text-xs text-gray-500 flex items-center">
  //                   {selectedUser ? (
  //                     <>
  //                       <span
  //                         className={`w-2 h-2 rounded-full mr-1 ${
  //                           selectedUser.is_online
  //                             ? "bg-green-500"
  //                             : "bg-gray-400"
  //                         }`}
  //                       ></span>
  //                       {selectedUser.is_online ? "online" : "offline"}
  //                     </>
  //                   ) : (
  //                     <>
  //                       <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
  //                       {selectedGroup.member_count} members
  //                     </>
  //                   )}
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="text-xs text-gray-500 cursor-pointer pr-5">
  //               <BsTelephoneForwardFill
  //                 onClick={() => setIsOpen(true)}
  //                 size={18}
  //               />
  //             </div>
  //           </div>

  //           <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 ">
  //             {isLoading ? (
  //               <div className="text-center text-gray-500 py-8">
  //                 <div className="text-lg">Loading messages...</div>
  //               </div>
  //             ) : messages.length === 0 ? (
  //               <div className="text-center text-gray-500 py-8">
  //                 <div className="text-lg">No messages yet</div>
  //                 <div className="text-sm">Start a conversation!</div>
  //               </div>
  //             ) : (
  //               messages.map((msg, index) => {
  //                 const isMyMessage = msg.is_my_message;
  //                 const senderName = msg.sender_name;

  //                 return (
  //                   <div
  //                     key={String(msg.id)}
  //                     className={`flex ${
  //                       isMyMessage ? "justify-end " : "justify-start"
  //                     }`}
  //                   >
  //                     {/* 👇 Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
  //                     {!isMyMessage && !msg.isDeleted && (
  //                       <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
  //                         {senderName?.charAt(0) || "?"}
  //                       </div>
  //                     )}

  //                     <div className="flex flex-col max-w-[75%]">
  //                       {/* Sender ismi faqat delete qilinmagan xabarda */}
  //                       {!isMyMessage && !selectedUser && !msg.isDeleted && (
  //                         <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
  //                           {senderName}
  //                         </div>
  //                       )}

  //                       <div
  //                         className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
  //                           isMyMessage
  //                             ? "bg-blue-500 text-white rounded-br-md"
  //                             : "bg-gray-200 text-gray-800 rounded-bl-md"
  //                         }`}
  //                       >
  //                         <div className="text-sm leading-relaxed">
  //                           {msg.isDeleted ? (
  //                             <span className="italic text-gray-400">
  //                               o'chirilgan xabar
  //                             </span>
  //                           ) : (
  //                             <>
  //                               {msg.content}
  //                               {msg.is_edited && (
  //                                 <span className="text-xs ml-2 italic opacity-70">
  //                                   (tahrirlangan)
  //                                 </span>
  //                               )}
  //                             </>
  //                           )}
  //                         </div>

  //                         {!msg.isDeleted && (
  //                           <div
  //                             className={`text-xs mt-2 flex justify-between items-center ${
  //                               isMyMessage ? "text-blue-100" : "text-gray-500"
  //                             }`}
  //                           >
  //                             <span>
  //                               {new Date(msg.timestamp).toLocaleTimeString(
  //                                 [],
  //                                 {
  //                                   hour: "2-digit",
  //                                   minute: "2-digit",
  //                                 }
  //                               )}
  //                               {msg.is_edited && " ✏️"}
  //                             </span>

  //                             {isMyMessage && (
  //                               <div className="flex ml-2">
  //                                 <button
  //                                   className="hover:text-red-500 cursor-pointer"
  //                                   onClick={() => deleteMessage(msg.id)}
  //                                   title="O'chirish"
  //                                 >
  //                                   <MdDelete />
  //                                 </button>
  //                                 <button
  //                                   className="ml-2 hover:text-yellow-500 cursor-pointer"
  //                                   onClick={() => startEdit(msg)}
  //                                   title="Tahrirlash"
  //                                 >
  //                                   <MdEdit />
  //                                 </button>
  //                               </div>
  //                             )}
  //                           </div>
  //                         )}
  //                       </div>
  //                     </div>

  //                     {isMyMessage && !msg.isDeleted && (
  //                       <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
  //                         Me
  //                       </div>
  //                     )}
  //                   </div>
  //                 );
  //               })
  //             )}
  //             <div ref={messagesEndRef} />
  //           </div>

  //           <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
  //             <div className="flex-1 relative">
  //               <input
  //                 type="text"
  //                 placeholder={
  //                   editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
  //                 }
  //                 value={content}
  //                 onChange={(e) => setContent(e.target.value)}
  //                 onKeyDown={(e) => {
  //                   if (e.key === "Enter") {
  //                     editingMessage ? saveEdit() : sendMessage();
  //                   } else if (e.key === "Escape") {
  //                     cancelEdit();
  //                   }
  //                 }}
  //                 className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
  //                 disabled={!roomId || !isConnected || isLoading}
  //               />

  //               {editingMessage ? (
  //                 <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
  //                   <button
  //                     onClick={saveEdit}
  //                     disabled={!content.trim()}
  //                     className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                     title="Saqlash"
  //                   >
  //                     ✓
  //                   </button>
  //                   <button
  //                     onClick={cancelEdit}
  //                     className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                     title="Bekor qilish"
  //                   >
  //                     ✕
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <button
  //                   onClick={sendMessage}
  //                   disabled={!content.trim()}
  //                   className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                   title="Yuborish"
  //                 >
  //                   ➤
  //                 </button>
  //               )}
  //             </div>
  //           </div>
  //         </>
  //       ) : (
  //         <div className="flex-1 flex items-center justify-center">
  //           <div className="text-gray-500 text-center">
  //             <div className="text-lg mb-2">
  //               Select a user or group to start chatting
  //             </div>
  //             <div className="text-sm">
  //               Choose someone from the left sidebar
  //             </div>
  //           </div>
  //         </div>
  //       )}
  //     </div>

  //     {/* Video Call Modal */}
  //     {isOpen && (
  //       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  //         <div className="bg-gray-900 text-white rounded-2xl shadow-lg w-[850px] p-8 flex flex-col items-center">
  //           {/* Video containers */}
  //           <div className="flex gap-4 mb-6 w-full">
  //             {/* Local video */}
  //             <div className="w-1/3 h-48 rounded-2xl overflow-hidden bg-gray-700 relative">
  //               <video
  //                 ref={localVideoRef}
  //                 autoPlay
  //                 muted
  //                 playsInline
  //                 className="w-full h-full object-cover"
  //               />
  //               {!localStreamRef.current && (
  //                 <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
  //                   <div className="text-center">
  //                     <div className="text-2xl mb-2">📹</div>
  //                     <div className="text-sm text-gray-400">Local Camera</div>
  //                   </div>
  //                 </div>
  //               )}
  //             </div>

  //             {/* Remote video */}
  //             <div className="w-2/3 h-48 rounded-2xl overflow-hidden bg-gray-700 relative">
  //               <video
  //                 ref={remoteVideoRef}
  //                 autoPlay
  //                 playsInline
  //                 className="w-full h-full object-cover"
  //               />
  //               {!activeCall && (
  //                 <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
  //                   <div className="text-center">
  //                     <div className="text-2xl mb-2">👤</div>
  //                     <div className="text-sm text-gray-400">Remote User</div>
  //                   </div>
  //                 </div>
  //               )}
  //             </div>
  //           </div>

  //           {/* Call info */}
  //           <h2 className="text-xl font-semibold">
  //             {selectedUser?.fio || selectedUser?.username || "Unknown User"}
  //           </h2>

  //           {/* Browser compatibility info */}
  //           <div className="text-xs text-gray-400 mt-2 text-center">
  //             {(() => {
  //               const issues = checkBrowserCompatibility();
  //               if (issues.length > 0) {
  //                 return (
  //                   <div className="bg-yellow-900/20 p-2 rounded">
  //                     ⚠️ Compatibility issues: {issues.join(", ")}
  //                   </div>
  //                 );
  //               }
  //               return <span>✅ Browser compatible</span>;
  //             })()}
  //           </div>

  //           {/* Call status */}
  //           {incomingCall && (
  //             <p className="text-gray-400 text-sm mt-1">
  //               📞 Incoming {incomingCall.callType} call...
  //             </p>
  //           )}
  //           {activeCall && (
  //             <p className="text-gray-400 text-sm mt-1">
  //               {activeCall.status === "ongoing"
  //                 ? "🟢 Call in progress"
  //                 : "🟡 Call connecting..."}
  //             </p>
  //           )}

  //           {/* Connection status */}
  //           {pcRef.current && (
  //             <p className="text-gray-400 text-xs mt-1">
  //               ICE: {pcRef.current.iceConnectionState} | PC:{" "}
  //               {pcRef.current.connectionState}
  //             </p>
  //           )}

  //           {/* Video troubleshooting info */}
  //           <div className="text-xs text-gray-400 mt-3 text-center max-w-md">
  //             <div className="bg-gray-800/30 p-3 rounded-lg">
  //               <div className="font-medium mb-2">Video Troubleshooting:</div>
  //               <ul className="text-left space-y-1">
  //                 <li>• Allow camera/microphone permissions when prompted</li>
  //                 <li>• Make sure no other app is using your camera</li>
  //                 <li>• Try refreshing the page if video doesn't load</li>
  //                 <li>• Check browser console for error messages</li>
  //               </ul>
  //             </div>
  //           </div>

  //           {/* Call controls */}
  //           <div className="flex items-center gap-8 mt-10">
  //             {incomingCall ? (
  //               <>
  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={answerCall}
  //                     className="p-4 rounded-full bg-green-600 hover:bg-green-700 transition-colors"
  //                   >
  //                     <BsTelephoneFill size={22} />
  //                   </button>
  //                   <span className="text-sm mt-2">Answer</span>
  //                 </div>

  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={rejectCall}
  //                     className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
  //                   >
  //                     <MdCancel size={26} />
  //                   </button>
  //                   <span className="text-sm mt-2">Reject</span>
  //                 </div>
  //               </>
  //             ) : activeCall ? (
  //               <div className="flex flex-col items-center">
  //                 <button
  //                   onClick={endCall}
  //                   className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
  //                 >
  //                   <MdCancel size={26} />
  //                 </button>
  //                 <span className="text-sm mt-2">End Call</span>
  //               </div>
  //             ) : (
  //               <>
  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={() => initiateCall("video")}
  //                     className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
  //                   >
  //                     <BsCameraVideoFill size={24} />
  //                   </button>
  //                   <span className="text-sm mt-2">Video Call</span>
  //                 </div>

  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={() => {
  //                       stopLocalMedia();
  //                       setIsOpen(false);
  //                     }}
  //                     className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
  //                   >
  //                     <MdCancel size={26} />
  //                   </button>
  //                   <span className="text-sm mt-2">Cancel</span>
  //                 </div>

  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={async () => {
  //                       try {
  //                         await getLocalMedia(true, false);
  //                         toast.success("Camera test successful!");
  //                       } catch (error) {
  //                         console.error("Camera test failed:", error);
  //                       }
  //                     }}
  //                     className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors"
  //                     title="Test camera access"
  //                   >
  //                     📷
  //                   </button>
  //                   <span className="text-sm mt-2">Test Camera</span>
  //                 </div>

  //                 <div className="flex flex-col items-center">
  //                   <button
  //                     onClick={() => initiateCall("voice")}
  //                     className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
  //                   >
  //                     <BsTelephoneFill size={22} />
  //                   </button>
  //                   <span className="text-sm mt-2">Voice Call</span>
  //                 </div>
  //               </>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );



    // return (
  //   <div className="flex h-[90vh] w-[1250px] justify-center bg-white rounded-lg shadow-sm overflow-hidden font-sans">
  //     {/* <ToastContainer position="top-right" autoClose={3000} /> */}
  //     <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
  //       <div className="p-4 border-b border-gray-200 bg-gray-50">
  //         <div className="flex justify-between items-center">
  //           <h2 className="font-medium text-gray-900 text-base">Gruops</h2>
  //           <button
  //             onClick={() => setShowCreateGroupModal(true)}
  //             className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
  //             title="Create group"
  //           >
  //             <BsPlus size={20} />
  //           </button>
  //         </div>
  //       </div>

  //       {/* Tablar */}
  //       <div className="flex border-b border-gray-200">
  //         <button
  //           className={`flex-1 py-2 text-center font-medium text-sm ${
  //             activeTab === "groups"
  //               ? "text-blue-600 border-b-2 border-blue-600"
  //               : "text-gray-500"
  //           }`}
  //           onClick={() => setActiveTab("groups")}
  //         >
  //           <div className="flex items-center justify-center gap-1">
  //             <BsPeople size={16} />
  //             <span>Groups</span>
  //           </div>
  //         </button>
  //       </div>

  //       <div className="flex-1 overflow-y-auto">
  //         {groups.map((group) => (
  //           <div
  //             key={group.id}
  //             onClick={() => selectChat(group)}
  //             className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
  //               selectedGroup?.id === group.id
  //                 ? "bg-blue-50 border-r-2 border-blue-500"
  //                 : ""
  //             }`}
  //           >
  //             <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
  //               {group.name?.charAt(0) || "G"}
  //             </div>
  //             <div className="flex-1 min-w-0">
  //               <div className="font-medium text-gray-900 text-sm truncate">
  //                 {group.name}
  //               </div>
  //               <div className="text-xs text-gray-500 mt-0.5">
  //                 {group.member_count} members • {group.group_type}
  //               </div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>

  //     <div className="flex-1 flex flex-col bg-gray-50">
  //       {currentChat ? (
  //         <>
  //           <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
  //             <div className="flex items-center">
  //               <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
  //                 {selectedGroup?.name?.charAt(0) || "G"}
  //               </div>
  //               <div>
  //                 <div className="font-medium text-gray-900 text-sm">
  //                   {selectedGroup?.name}
  //                 </div>
  //                 <div className="text-xs text-gray-500 flex items-center">
  //                   <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
  //                   {selectedGroup?.member_count} members
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="text-xs text-gray-500 cursor-pointer pr-5">
  //               <BsTelephoneForwardFill size={18} />
  //             </div>
  //           </div>

  //           <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
  //             {isLoading ? (
  //               <div className="text-center text-gray-500 py-8">
  //                 <div className="text-lg">Loading messages...</div>
  //               </div>
  //             ) : messages.length === 0 ? (
  //               <div className="text-center text-gray-500 py-8">
  //                 <div className="text-lg">No messages yet</div>
  //                 <div className="text-sm">Start a conversation!</div>
  //               </div>
  //             ) : (
  //               messages.map((msg, index) => {
  //                 const isMyMessage = msg.is_my_message;
  //                 const senderName = msg.sender_name;

  //                 return (
  //                   <div
  //                     key={String(msg.id)}
  //                     className={`flex ${
  //                       isMyMessage ? "justify-end " : "justify-start"
  //                     }`}
  //                   >
  //                     {/* Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
  //                     {!isMyMessage && !msg.isDeleted && (
  //                       <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 mt-1 flex-shrink-0">
  //                         {senderName?.charAt(0) || "?"}
  //                       </div>
  //                     )}

  //                     <div className="flex flex-col max-w-[75%]">
  //                       {/* Sender ismi faqat delete qilinmagan xabarda */}
  //                       {!isMyMessage && !selectedUser && !msg.isDeleted && (
  //                         <div className="text-xs font-medium mb-1 text-gray-600 ml-1">
  //                           {senderName}
  //                         </div>
  //                       )}

  //                       <div
  //                         className={`px-4 py-3 rounded-2xl break-words relative shadow-sm ${
  //                           isMyMessage
  //                             ? "bg-blue-500 text-white rounded-br-md"
  //                             : "bg-gray-200 text-gray-800 rounded-bl-md"
  //                         }`}
  //                       >
  //                         <div className="text-sm leading-relaxed">
  //                           {msg.isDeleted ? (
  //                             <span className="italic text-gray-400">
  //                               o'chirilgan xabar
  //                             </span>
  //                           ) : msg.isLoading ? (
  //                             <span className="italic text-gray-400">
  //                               Yuklanmoqda...
  //                             </span>
  //                           ) : (
  //                             <>
  //                               {msg.content}
  //                               {msg.is_edited && (
  //                                 <span className="text-xs ml-2 italic opacity-70">
  //                                   (tahrirlangan)
  //                                 </span>
  //                               )}
  //                             </>
  //                           )}
  //                         </div>

  //                         {!msg.isDeleted && (
  //                           <div
  //                             className={`text-xs mt-2 flex justify-between items-center ${
  //                               isMyMessage ? "text-blue-100" : "text-gray-500"
  //                             }`}
  //                           >
  //                             <span>
  //                               {new Date(msg.timestamp).toLocaleTimeString(
  //                                 [],
  //                                 {
  //                                   hour: "2-digit",
  //                                   minute: "2-digit",
  //                                 }
  //                               )}
  //                               {msg.is_edited && " ✏️"}
  //                             </span>

  //                             {isMyMessage && !msg.isLoading && (
  //                               <div className="flex ml-2">
  //                                 <button
  //                                   className="hover:text-red-500 cursor-pointer"
  //                                   onClick={() => deleteMessage(msg.id)}
  //                                   title="O'chirish"
  //                                 >
  //                                   <MdDelete />
  //                                 </button>
  //                                 <button
  //                                   className="ml-2 hover:text-yellow-500 cursor-pointer"
  //                                   onClick={() => startEdit(msg)}
  //                                   title="Tahrirlash"
  //                                 >
  //                                   <MdEdit />
  //                                 </button>
  //                               </div>
  //                             )}
  //                           </div>
  //                         )}
  //                       </div>
  //                     </div>

  //                     {isMyMessage && !msg.isDeleted && (
  //                       <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 mt-1 flex-shrink-0">
  //                         Me
  //                       </div>
  //                     )}
  //                   </div>
  //                 );
  //               })
  //             )}
  //             <div ref={messagesEndRef} />
  //           </div>

  //           <div className="flex items-center p-4 bg-white border-t border-gray-200 shadow-sm">
  //             <div className="flex-1 relative">
  //               <input
  //                 type="text"
  //                 placeholder={
  //                   editingMessage ? "Xabarni tahrirlash..." : "Xabar yozing..."
  //                 }
  //                 value={content}
  //                 onChange={(e) => setContent(e.target.value)}
  //                 onKeyDown={(e) => {
  //                   if (e.key === "Enter") {
  //                     editingMessage ? saveEdit() : sendMessage();
  //                   } else if (e.key === "Escape") {
  //                     cancelEdit();
  //                   }
  //                 }}
  //                 className="w-full border-2 border-gray-200 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400 bg-gray-50 focus:bg-white"
  //                 disabled={!isConnected || isLoading}
  //               />

  //               {editingMessage ? (
  //                 <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
  //                   <button
  //                     onClick={saveEdit}
  //                     disabled={!content.trim()}
  //                     className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                     title="Saqlash"
  //                   >
  //                     ✓
  //                   </button>
  //                   <button
  //                     onClick={cancelEdit}
  //                     className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                     title="Bekor qilish"
  //                   >
  //                     ✕
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <button
  //                   onClick={sendMessage}
  //                   disabled={!content.trim()}
  //                   className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"
  //                   title="Yuborish"
  //                 >
  //                   ➤
  //                 </button>
  //               )}
  //             </div>
  //           </div>
  //         </>
  //       ) : (
  //         <div className="flex-1 flex items-center justify-center">
  //           <div className="text-gray-500 text-center">
  //             <div className="text-lg mb-2">
  //               Select a group to start chatting
  //             </div>
  //             <div className="text-sm">
  //               Choose a group from the left sidebar
  //             </div>
  //           </div>
  //         </div>
  //       )}
  //     </div>

  //     {/* Guruh yaratish modali */}
  //     {showCreateGroupModal && (
  //       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  //         <div className="bg-white rounded-lg p-6 w-96">
  //           <h2 className="text-xl font-bold mb-4">Create New Group</h2>

  //           <div className="mb-4">
  //             <label className="block text-sm font-medium mb-1">
  //               Group Name
  //             </label>
  //             <input
  //               type="text"
  //               value={newGroupName}
  //               onChange={(e) => setNewGroupName(e.target.value)}
  //               className="w-full border border-gray-300 rounded px-3 py-2"
  //               placeholder="Enter group name"
  //             />
  //           </div>

  //           <div className="mb-4">
  //             <label className="block text-sm font-medium mb-1">
  //               Description
  //             </label>
  //             <textarea
  //               value={newGroupDescription}
  //               onChange={(e) => setNewGroupDescription(e.target.value)}
  //               className="w-full border border-gray-300 rounded px-3 py-2"
  //               placeholder="Enter group description"
  //               rows="3"
  //             />
  //           </div>

  //           <div className="mb-4">
  //             <label className="flex items-center">
  //               <input
  //                 type="checkbox"
  //                 checked={isPublicGroup}
  //                 onChange={(e) => setIsPublicGroup(e.target.checked)}
  //                 className="mr-2"
  //               />
  //               <span className="text-sm">Public Group</span>
  //             </label>
  //           </div>

  //           <div className="mb-4">
  //             <label className="block text-sm font-medium mb-2">
  //               Select Members
  //             </label>
  //             <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
  //               {users.map((user) => (
  //                 <div key={user.id} className="flex items-center mb-2">
  //                   <input
  //                     type="checkbox"
  //                     checked={selectedMembers.some((m) => m.id === user.id)}
  //                     onChange={() => toggleMemberSelection(user)}
  //                     className="mr-2"
  //                   />
  //                   <span className="text-sm">{user.fio || user.username}</span>
  //                 </div>
  //               ))}
  //             </div>
  //             <div className="text-xs text-gray-500 mt-1">
  //               {selectedMembers.length} members selected
  //             </div>
  //           </div>

  //           <div className="flex justify-end gap-2">
  //             <button
  //               onClick={() => setShowCreateGroupModal(false)}
  //               className="px-4 py-2 border border-gray-300 rounded text-sm"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               onClick={createGroup}
  //               className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
  //             >
  //               Create Group
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );