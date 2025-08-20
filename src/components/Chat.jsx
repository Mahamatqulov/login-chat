"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export default function TelegramStyleChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const notifSocketRef = useRef(null);
  const lastMessageRef = useRef(null);

  const token = localStorage.getItem("access_token");

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [formatMessage]
  );

  // 1️⃣ Foydalanuvchilarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetch("http://5.133.122.226:8001/api/employee/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data.filter((u) => u.id !== user.id));
        }
      })
      .catch((error) => {
        console.error("Foydalanuvchilarni olishda xatolik:", error);
      });
  }, [token, user?.id]);

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

        if (data.type === "user_status") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.user_id ? { ...u, is_online: data.is_online } : u
            )
          );
        }
      } catch (err) {
        console.error("Notification parse error:", err);
      }
    };

    notifSocketRef.current.onclose = (event) => {
      console.log("🔔 Notifications WS closed");
      setTimeout(() => {
        if (token) {
          notifSocketRef.current = new WebSocket(notifUrl);
        }
      }, 3000);
    };

    notifSocketRef.current.onerror = (err) => {
      console.error("🔔 Notifications WS error:", err);
    };

    return () => {
      if (notifSocketRef.current?.readyState === WebSocket.OPEN) {
        notifSocketRef.current.close(1000, "Unmounting notifications WS");
      }
    };
  }, [token]);

  // WebSocket reconnect funksiyasi
  const reconnectWebSocket = useCallback(() => {
    if (!roomId || !token) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    console.log("WebSocket qayta ulanmoqda...");

    const wsUrl = `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("💬 Chat WS reconnected");
      setIsConnected(true);
    };

    socketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("WebSocket message received:", data);

        // Turli xil message formatlarini qayta ishlash
        if (data.type === "chat_message" && data.message) {
          addMessageSafely(data.message);
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
      console.log("💬 Chat WS closed");
      setIsConnected(false);
    };

    socketRef.current.onerror = (err) => {
      console.error("💬 Chat WS error:", err);
      setIsConnected(false);
    };
  }, [roomId, token, addMessageSafely]);

  // 3️⃣ Chat room olish va WS ulash
  useEffect(() => {
    if (!selectedUser || !user?.id || !token) return;

    console.log("Chat room olinmoqda...", selectedUser.id);
    setIsLoading(true);

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

          if (Array.isArray(msgs)) {
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
        if (socketRef.current) {
          socketRef.current.close(1000, "New room selection");
        }

        // Yangi WebSocket ulash
        reconnectWebSocket();
      })
      .catch((error) => {
        console.error("Chat room olishda xatolik:", error);
        alert("Chat room olishda xatolik: " + error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, "Unmounting chat WS");
      }
    };
  }, [selectedUser, token, user?.id, reconnectWebSocket, formatMessage]);

  // Reconnect useEffect
  useEffect(() => {
    let reconnectInterval;

    if (roomId && token) {
      reconnectInterval = setInterval(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5️⃣ Send message - ASOSIY TUZATISH
  const sendMessage = async () => {
    if (!content.trim() || !roomId || !user?.id) return;

    const messageId = `local-${Date.now()}-${Math.random()}`;
    const messageData = {
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
      const response = await fetch(
        "http://5.133.122.226:8001/api/chat/messages/send_message/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Message yuborishda xatolik");
      }

      const responseData = await response.json();
      console.log("API response:", responseData);

      // Agar API dan qaytgan message local messagedan farq qilsa, yangilash
      if (responseData.id && responseData.id !== messageId) {
        // Local messageni olib tashlash
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        messageIdsRef.current.delete(messageId);

        // API dan qaytgan messageni qo'shish
        addMessageSafely(responseData);
      }
    } catch (error) {
      console.error("Message yuborishda xatolik:", error);

      // Xatolik bo'lsa, messageni qayta tiklash
      setContent(content.trim());

      // Local messageni olib tashlash
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      messageIdsRef.current.delete(messageId);
    }
  };

  // Connection statusini tekshirish
  useEffect(() => {
    const checkConnection = () => {
      if (socketRef.current) {
        const state = socketRef.current.readyState;
        const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
        console.log(`WebSocket holati: ${states[state]} (${state})`);
      }
    };

    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] w-[900px] bg-white rounded-lg shadow-sm overflow-hidden font-sans">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-medium text-gray-900 text-base">Chats</h2>
          <div className="text-xs text-gray-500 mt-1">
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((userItem) => (
            <div
              key={userItem.id}
              onClick={() => setSelectedUser(userItem)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                selectedUser?.id === userItem.id
                  ? "bg-blue-50 border-r-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 shadow-sm">
                {userItem.fio?.charAt(0) || userItem.username?.charAt(0) || "?"}
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
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                  {selectedUser.fio?.charAt(0) ||
                    selectedUser.username?.charAt(0) ||
                    "?"}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {selectedUser.fio || selectedUser.username || "No Name"}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        selectedUser.is_online ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                    {selectedUser.is_online ? "online" : "offline"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Room: {roomId ? roomId.slice(0, 8) + "..." : "Loading..."}
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
                        {!isMyMessage && (
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
                  disabled={!roomId || !isConnected || isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !content.trim() || !roomId || !isConnected || isLoading
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">
                Select a user to start chatting
              </div>
              <div className="text-sm">
                Choose someone from the left sidebar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
