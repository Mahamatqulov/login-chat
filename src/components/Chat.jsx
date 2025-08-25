"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BsTelephoneForwardFill, BsPeople, BsPlus } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { RiEdit2Fill } from "react-icons/ri";

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isPublicGroup, setIsPublicGroup] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const notifSocketRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const token = localStorage.getItem("access_token");

  // Message formatini to'g'rilash funksiyasi
  const formatMessage = useCallback(
    (msg) => {
      // Normalize every message to have the same fields
      const baseId = msg.id || `msg-${Date.now()}-${Math.random()}`;
      const timestamp =
        msg.created_at || msg.timestamp || new Date().toISOString();

      // Deleted message: still return full normalized shape
      if (msg.isDeleted) {
        // try to keep sender info if present
        let senderId =
          msg.sender_id ?? msg.sender ?? (msg.sender && msg.sender.id) ?? null;
        let senderName =
          msg.sender_name ??
          (msg.sender && (msg.sender.fio || msg.sender.username)) ??
          (senderId === user?.id ? "Me" : "User");

        return {
          ...msg,
          id: baseId,
          timestamp,
          sender_id: senderId,
          sender_name: senderName,
          content: msg.content ?? "", // keep empty string instead of null
          message_type: msg.message_type || "text",
          isDeleted: true,
          is_my_message: String(senderId) === String(user?.id),
        };
      }

      // Non-deleted: normalize sender (object / string / number)
      let senderId = null;
      let senderName = "User";
      if (msg.sender && typeof msg.sender === "object") {
        senderId = msg.sender.id ?? null;
        senderName = msg.sender.fio || msg.sender.username || senderName;
      } else {
        senderId = msg.sender ?? msg.sender_id ?? null;
        if (String(senderId) === String(user?.id)) {
          senderName = "Me";
        } else {
          const u = users.find((x) => String(x.id) === String(senderId));
          senderName = u?.fio || u?.username || senderName;
        }
      }

      return {
        ...msg,
        id: baseId,
        timestamp,
        sender_id: senderId,
        sender_name: senderName,
        content: msg.content ?? "",
        message_type: msg.message_type || "text",
        is_edited: msg.is_edited || false,
        isDeleted: false,
        is_my_message: String(senderId) === String(user?.id),
      };
    },
    [user?.id, users]
  );

  // Xavfsiz message qo'shish
  const addMessageSafely = useCallback(
    (newMsg) => {
      const formattedMsg = formatMessage(newMsg);
      const messageId = String(formattedMsg.id);

      setMessages((prev) => {
        // if exists -> replace, else append
        const idx = prev.findIndex((m) => String(m.id) === messageId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...formattedMsg };
          return copy;
        } else {
          messageIdsRef.current.add(messageId);
          return [...prev, formattedMsg];
        }
      });

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

  // 1.1️⃣ Guruhlarni olish
  useEffect(() => {
    if (!user?.id || !token) return;

    fetchGroups();
  }, [token, user?.id]);

  // Guruhlarni yangilash funksiyasi
  const fetchGroups = useCallback(() => {
    if (!token) return;

    fetch("http://5.133.122.226:8001/api/chat/groups/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGroups(data);

          // faqat id larni olish
          const groupIds = data.map((group) => group.id);
          console.log("Group IDs:", groupIds);
        }
      })
      .catch((error) => {
        console.error("Guruhlarni olishda xatolik:", error);
      });
  }, [token]);

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
        } else if (
          data.type === "group_message" ||
          data.type === "group_update"
        ) {
          // Guruh yangilanishlari

          // Agar hozir tanlangan guruh bo'lsa, messageni ko'rsatish
          {
            addMessageSafely(data.message);
          }
        } else if (data.type === "message_update" && data.message) {
          // Tahrirlangan xabarni yangilash
          const formattedMessage = formatMessage(data.message);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === formattedMessage.id ? formattedMessage : msg
            )
          );
        } else if (data.type === "message_deleted" && data.message_id) {
          // O'chirilgan xabarni yangilash
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.message_id
                ? { ...msg, isDeleted: true, content: "" }
                : msg
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
  }, [token, selectedGroup, addMessageSafely, fetchGroups, formatMessage]);

  // WebSocket reconnect funksiyasi
  const reconnectWebSocket = useCallback(() => {
    if (!roomId || !token) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    console.log("WebSocket qayta ulanmoqda...");

    // Agar guruh chat bo'lsa, boshqa URL ishlatamiz
    const isGroupChat = selectedGroup !== null;
    const wsUrl = isGroupChat
      ? `ws://5.133.122.226:8001/ws/chat/group/${selectedGroup.id}/?token=${token}`
      : `ws://5.133.122.226:8001/ws/chat/chat_room/${roomId}/?token=${token}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("💬 Chat WS connected");
      setIsConnected(true);
    };

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
                  ? {
                      ...msg,
                      content: data.content ?? msg.content,
                      is_edited: true,
                    }
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
      console.log("💬 Chat WS closed");
      setIsConnected(false);
    };

    socketRef.current.onerror = (err) => {
      console.error("💬 Chat WS error:", err);
      setIsConnected(false);
    };
  }, [roomId, token, addMessageSafely, selectedGroup, formatMessage]);

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
          if (Array.isArray(msgs)) {
            const formatted = msgs.map((m) => formatMessage(m));
            // dedupe by id
            const unique = formatted.filter(
              (m, i, arr) =>
                arr.findIndex((x) => String(x.id) === String(m.id)) === i
            );
            setMessages(unique);
            unique.forEach((m) => messageIdsRef.current.add(String(m.id)));
          }
        })
        .catch((err) => {
          console.error("Group messages olishda xatolik:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });

      // Eski WebSocket ni yopish
      if (socketRef.current) {
        socketRef.current.close(1000, "New room selection");
      }

      // Yangi WebSocket ulash
      reconnectWebSocket();
      return;
    }

    // Agar shaxsiy user tanlangan bo'lsa
    if (selectedUser) {
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
    }

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, "Unmounting chat WS");
      }
    };
  }, [
    selectedUser,
    selectedGroup,
    token,
    user?.id,
    reconnectWebSocket,
    formatMessage,
  ]);

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

  // 5️⃣ Send message
  const sendMessage = async () => {
    if (!content.trim() || !roomId || !user?.id) return;

    const messageId = `local-${Date.now()}-${Math.random()}`;

    // Agar guruh bo'lsa, boshqa API endpoint ishlatamiz
    const isGroupChat = selectedGroup !== null;
    const messageData = isGroupChat
      ? {
          group: selectedGroup.id,
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
        ? "http://5.133.122.226:8001/api/chat/groups/send_message/"
        : "http://5.133.122.226:8001/api/chat/messages/send_message/";

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
    if (chat.chat_type === "group") {
      setSelectedGroup(chat);
      setSelectedUser(null);
    } else {
      setSelectedUser(chat);
      setSelectedGroup(null);
    }
  };

  // Joriy tanlangan chat
  const currentChat = selectedUser || selectedGroup;

  // Xabarni o'chirish funksiyasi
  const deleteMessage = async (messageId) => {
    try {
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
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Delete xatolik!");
      }

      // Faqatgina isDeleted flagini yangilaymiz (id saqlanadi)
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
            ? { ...msg, isDeleted: true, content: "" }
            : msg
        )
      );

      console.log("Message deleted:", messageId);
    } catch (err) {
      console.error("❌ Message delete error:", err);
      alert("Xabarni o'chirishda xatolik: " + err.message);
    }
  };

  // 6️⃣ Message edit qilish funksiyasi
  // const editMessage = async (messageId, newContent) => {
  //   if (!newContent.trim()) return;

  //   try {
  //     const response = await fetch(
  //       `http://5.133.122.226:8001/api/chat/messages/${messageId}/edit_message/`,
  //       {
  //         method: "PATCH",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({ content: newContent }),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Server error ${response.status}: ${errorText}`);
  //     }

  //     const updatedMessage = await response.json();

  //     // Format the updated message
  //     const formattedMessage = formatMessage(updatedMessage);

  //     // Update the message in state
  //     setMessages((prev) =>
  //       prev.map((msg) => (msg.id === messageId ? formattedMessage : msg))
  //     );

  //     setEditingMessage(null);
  //     setContent("");

  //     console.log("✅ Message tahrirlandi:", updatedMessage);
  //   } catch (err) {
  //     console.error("❌ Message edit error:", err.message);
  //   }
  // };

  const editMessage = async (messageId, newContent) => {
    if (!newContent.trim()) return;

    try {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const updatedMessage = await response.json();
      const formattedMessage = formatMessage(updatedMessage);

      // Local UI yangilash
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? formattedMessage : msg))
      );

      // 🔥 WebSocket orqali ham yuborish (boshqalarga ko‘rinishi uchun)
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const editPayload = {
          type: "message_update",
          message: formattedMessage,
        };
        socketRef.current.send(JSON.stringify(editPayload));
        console.log("✏️ WS orqali edit yuborildi:", editPayload);
      }

      setEditingMessage(null);
      setContent("");

      console.log("✅ Message tahrirlandi:", updatedMessage);
    } catch (err) {
      console.error("❌ Message edit error:", err.message);
    }
  };

  // Tahrirlashni boshlash
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-900 text-base">Chats</h2>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>
        </div>

        {/* Tablar */}
        <div className="flex border-b border-gray-200">
          <button
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
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {
            // Foydalanuvchilar ro'yxati
            users.map((userItem) => (
              <div
                key={userItem.id}
                onClick={() => selectChat({ ...userItem, chat_type: "user" })}
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
          }
        </div>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 ">
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
                      {/* 👇 Sender avatar faqat delete qilinmagan xabarda ko'rsatiladi */}
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

                              {isMyMessage && (
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
                  disabled={!roomId || !isConnected || isLoading}
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
