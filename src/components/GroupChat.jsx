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
            console.log(
              "🔔 Message edited notification (full message):",
              data.message
            );
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
            console.log(
              "🔔 Message edited notification (id/content):",
              targetId
            );
            const editedMessage = messages.find(
              (msg) => String(msg.id) === String(targetId)
            );
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
