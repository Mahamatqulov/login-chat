"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { BsTelephoneForwardFill, BsPlus } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { BsCameraVideoFill } from "react-icons/bs";
import { MdCancel } from "react-icons/md";
import { BsTelephoneFill } from "react-icons/bs";
import { toast } from "react-toastify";

export default function Chat() {
  const token = localStorage.getItem("access_token");
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

  ////////
  const [isOpen, setIsOpen] = useState(false);

  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = useState(false);

  // WebRTC functions
  const checkBrowserCompatibility = useCallback(() => {
    const issues = [];

    if (!navigator.mediaDevices) {
      issues.push("Media devices not supported");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push("getUserMedia not supported");
    }

    if (!window.RTCPeerConnection) {
      issues.push("WebRTC not supported");
    }

    if (!window.RTCSessionDescription) {
      issues.push("RTCSessionDescription not supported");
    }

    if (!window.RTCIceCandidate) {
      issues.push("RTCIceCandidate not supported");
    }

    return issues;
  }, []);

  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.connectionState !== "closed")
      return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.log("ICE connection failed, attempting restart");
        pc.restartIce();
      }
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate && activeCall?.id) {
        console.log("📨 Sending ICE candidate:", event.candidate);
        try {
          await sendSignal(activeCall.id, {
            type: "ice",
            candidate: event.candidate,
          });
        } catch (error) {
          console.error("Error sending ICE candidate:", error);
        }
      }
    };

    pc.ontrack = (event) => {
      console.log("📡 Received remote stream:", event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];

        // Force play the video
        remoteVideoRef.current.play().catch((error) => {
          console.error("Error playing remote video:", error);
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("Negotiation needed");
    };

    pcRef.current = pc;
    return pc;
  }, [activeCall]);

  const getLocalMedia = useCallback(async (video = true, audio = true) => {
    try {
      console.log("🎥 Attempting to access media devices...", { video, audio });

      // Stop existing stream if any
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });

      console.log("✅ Media stream obtained successfully");
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force play the video
        localVideoRef.current.play().catch((error) => {
          console.error("Error playing local video:", error);
        });
      }

      setIsVideoOn(video);
      return stream;
    } catch (error) {
      console.error("❌ Error accessing media devices:", error);

      // Specific error handling
      if (error.name === "NotAllowedError") {
        toast.error(
          "Camera/microphone access denied. Please allow permissions."
        );
      } else if (error.name === "NotFoundError") {
        toast.error("No camera or microphone found.");
      } else if (error.name === "NotReadableError") {
        toast.error("Camera/microphone is already in use.");
      } else {
        toast.error(`Media access error: ${error.message}`);
      }

      throw error;
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
  }, []);

  const sendSignal = useCallback(
    async (callId, payload) => {
      try {
        console.log("Sending signal:", payload.type, "to call:", callId);
        const response = await fetch(
          `http://5.133.122.226:8001/api/chat/calls/${callId}/signal/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send signal: ${errorText}`);
        }

        console.log("Signal sent successfully:", payload.type);
      } catch (error) {
        console.error("Error sending signal:", error);
        throw error;
      }
    },
    [token]
  );

  // ICE candidate'larni yuborish uchun qo'shimcha funksiya
  const sendPendingIceCandidates = useCallback(
    async (callId) => {
      if (
        pcRef.current?.pendingIceCandidates &&
        pcRef.current.pendingIceCandidates.length > 0
      ) {
        console.log(
          "Sending pending ICE candidates:",
          pcRef.current.pendingIceCandidates.length
        );

        for (const candidate of pcRef.current.pendingIceCandidates) {
          try {
            await sendSignal(callId, {
              type: "ice",
              candidate: candidate,
            });
          } catch (error) {
            console.error("Error sending ICE candidate:", error);
          }
        }

        pcRef.current.pendingIceCandidates = [];
      }
    },
    [sendSignal]
  );

  const initiateCall = useCallback(
    async (callType) => {
      if (!selectedUser?.id) {
        toast.error("Please select a user to call");
        return;
      }

      try {
        console.log("Initiating", callType, "call to:", selectedUser.id);

        const response = await fetch(
          "http://5.133.122.226:8001/api/chat/calls/initiate_call/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiver_id: selectedUser.id,
              call_type: callType,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to initiate call: ${errorText}`);
        }

        const data = await response.json();
        console.log("Call initiated:", data);
        setActiveCall(data.call);

        // Get local media first
        const stream = await getLocalMedia(callType === "video", true);

        // Create peer connection
        const pc = ensurePeerConnection();

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Create and set local offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === "video",
        });

        await pc.setLocalDescription(offer);
        console.log("Local offer set:", offer);

        // Send offer to remote peer
        await sendSignal(data.call.id, {
          type: "offer",
          sdp: offer,
          call_type: callType,
        });

        toast.success(
          `${callType === "video" ? "Video" : "Voice"} call initiated`
        );
      } catch (error) {
        console.error("Error initiating call:", error);
        toast.error(
          "Failed to start call. Please check your camera/microphone permissions."
        );
        setActiveCall(null);
        stopLocalMedia();
      }
    },
    [
      selectedUser,
      token,
      getLocalMedia,
      ensurePeerConnection,
      sendSignal,
      stopLocalMedia,
    ]
  );

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      console.log("Answering incoming call:", incomingCall.callId);

      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/calls/${incomingCall.callId}/answer_call/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ call_id: incomingCall.callId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to answer call: ${errorText}`);
      }

      setActiveCall({
        id: incomingCall.callId,
        status: "ongoing",
        call_type: incomingCall.callType,
      });

      setIncomingCall(null);

      // Get local media
      const stream = await getLocalMedia(
        incomingCall.callType === "video",
        true
      );

      // Create peer connection
      const pc = ensurePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        console.log("Adding track to peer connection:", track.kind);
        pc.addTrack(track, stream);
      });

      // ICE candidate'larni yuborish
      setTimeout(() => {
        sendPendingIceCandidates(incomingCall.callId);
      }, 1000);

      toast.success("Call answered successfully");
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error("Failed to answer call. Please try again.");
      setIncomingCall(null);
      stopLocalMedia();
    }
  }, [
    incomingCall,
    token,
    getLocalMedia,
    ensurePeerConnection,
    stopLocalMedia,
    sendPendingIceCandidates,
  ]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/calls/${incomingCall.callId}/reject_call/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to reject call");

      setIncomingCall(null);
      stopLocalMedia();
      toast.info("Call rejected");
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }, [incomingCall, token, stopLocalMedia]);

  const endCall = useCallback(async () => {
    if (!activeCall) return;

    try {
      const response = await fetch(
        `http://5.133.122.226:8001/api/chat/calls/${activeCall.id}/end_call/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to end call");

      setActiveCall(null);
      stopLocalMedia();

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      toast.info("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, [activeCall, token, stopLocalMedia]);

  // Handle incoming calls and signals via WebSocket
  const handleCallSignal = useCallback(
    async (payload) => {
      const pc = ensurePeerConnection();

      try {
        console.log("Handling call signal:", payload.type, payload);

        if (payload.type === "offer" && payload.sdp) {
          console.log("Received offer, setting remote description");
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          // Get local media
          const stream = await getLocalMedia(
            payload.call_type === "video",
            true
          );

          // Add local tracks to connection
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          // Create and send answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          console.log("Sending answer to offer");
          await sendSignal(payload.call_id, {
            type: "answer",
            sdp: answer,
          });
        } else if (payload.type === "answer" && payload.sdp) {
          console.log("Received answer, setting remote description");
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } else if (payload.type === "ice" && payload.candidate) {
          console.log("Received ICE candidate:", payload.candidate);
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            console.log("ICE candidate added successfully");
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
            // Store candidate for later if needed
            if (!pcRef.current.pendingCandidates) {
              pcRef.current.pendingCandidates = [];
            }
            pcRef.current.pendingCandidates.push(payload.candidate);
          }
        }
      } catch (error) {
        console.error("Error handling signal:", error);
      }
    },
    [ensurePeerConnection, getLocalMedia, sendSignal]
  );

  useEffect(() => {
    if (!notifSocketRef.current) return;

    const handleNotification = (data) => {
      console.log("🔔 Notification received:", data);

      if (data.type === "notification" && data.data) {
        const payload = data.data;

        if (payload.type === "incoming_call") {
          console.log("📞 Incoming call notification:", payload);
          setIncomingCall({
            callId: payload.call_id,
            caller: payload.caller,
            callType: payload.call_type,
          });
          toast.info(
            `Incoming ${payload.call_type} call from ${
              payload.caller?.fio || payload.caller?.username || "Unknown"
            }`
          );
        } else if (payload.type === "call_answered") {
          console.log("✅ Call answered notification:", payload);
          setActiveCall((prev) =>
            prev ? { ...prev, status: "ongoing" } : prev
          );
          toast.success("Call answered successfully");
        } else if (
          payload.type === "call_rejected" ||
          payload.type === "call_ended"
        ) {
          console.log("❌ Call ended/rejected notification:", payload);
          setActiveCall(null);
          setIncomingCall(null);
          stopLocalMedia();
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          toast.info(
            payload.type === "call_rejected"
              ? "Call was rejected"
              : "Call ended"
          );
        } else if (payload.type === "call_signal") {
          console.log("📡 Call signal received:", payload);
          handleCallSignal(payload);
        }
      }
    };

    notifSocketRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleNotification(data);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    return () => {
      if (notifSocketRef.current) {
        notifSocketRef.current.onmessage = null;
      }
    };
  }, [handleCallSignal]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up video call resources");
      stopLocalMedia();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [stopLocalMedia]);

  // Check browser compatibility on mount
  useEffect(() => {
    const compatibilityIssues = checkBrowserCompatibility();
    if (compatibilityIssues.length > 0) {
      console.warn("⚠️ Browser compatibility issues:", compatibilityIssues);
      toast.warning(
        "Some video features may not work properly in your browser"
      );
    } else {
      console.log("✅ Browser is compatible with video calls");
    }
  }, [checkBrowserCompatibility]);

  // Debug: Log state changes
  useEffect(() => {
    console.log("🎥 Video call state changed:", {
      activeCall,
      incomingCall,
      isVideoOn,
      hasLocalStream: !!localStreamRef.current,
      hasPeerConnection: !!pcRef.current,
      peerConnectionState: pcRef.current?.connectionState,
      iceState: pcRef.current?.iceConnectionState,
    });
  }, [activeCall, incomingCall, isVideoOn]);

  /////////////////

  //////chat function

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
    }
  };

  // 6️⃣ Message edit qilish funksiyasi
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
    <div className="flex h-[95vh] w-[1750px] mt-5 justify-center bg-white rounded-2xl shadow-2xl overflow-hidden font-sans border border-gray-100">
      <div className="w-80 bg-gradient-to-b from-slate-50 to-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 text-lg tracking-tight">
              Chats
            </h2>
          </div>
          <div className="text-sm text-gray-600 mt-2 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></div>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-100 bg-white">
          <button
            className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-200 ${
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <div className="flex items-center justify-center gap-2">
              <FaUserFriends size={16} />
              <span>Contacts</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
          {users.map((userItem) => (
            <div
              key={userItem.id}
              onClick={() => selectChat({ ...userItem, chat_type: "user" })}
              className={`flex items-center p-4 cursor-pointer hover:bg-blue-50/70 transition-all duration-200 border-b border-gray-50/50 ${
                selectedUser?.id === userItem.id
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-r-3 border-blue-500 shadow-sm"
                  : ""
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-lg ring-2 ring-white">
                {userItem.fio?.charAt(0) || userItem.username?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">
                  {userItem.fio || userItem.username || "No Name"}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      userItem.is_online
                        ? "bg-emerald-500 shadow-sm"
                        : "bg-gray-400"
                    }`}
                  ></span>
                  <span className="font-medium">
                    {userItem.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        {currentChat ? (
          <>
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 shadow-lg ring-2 ring-white">
                  {selectedUser
                    ? selectedUser.fio?.charAt(0) ||
                      selectedUser.username?.charAt(0) ||
                      "?"
                    : selectedGroup.name?.charAt(0) || "G"}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-base">
                    {selectedUser
                      ? selectedUser.fio || selectedUser.username || "No Name"
                      : selectedGroup.name}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center mt-1">
                    {selectedUser ? (
                      <>
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 ${
                            selectedUser.is_online
                              ? "bg-emerald-500 shadow-sm"
                              : "bg-gray-400"
                          }`}
                        ></span>
                        <span className="font-medium">
                          {selectedUser.is_online ? "online" : "offline"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full mr-2 bg-emerald-500 shadow-sm"></span>
                        <span className="font-medium">
                          {selectedGroup.member_count} members
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                <div className="p-3 rounded-full hover:bg-blue-50 transition-all duration-200">
                  <BsTelephoneForwardFill
                    onClick={() => setIsOpen(true)}
                    size={20}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100">
              {isLoading ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-xl font-medium">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-xl font-medium mb-2">
                    No messages yet
                  </div>
                  <div className="text-base">Start a conversation!</div>
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
                      {!isMyMessage && !msg.isDeleted && (
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 mt-1 flex-shrink-0 shadow-md ring-2 ring-white">
                          {senderName?.charAt(0) || "?"}
                        </div>
                      )}

                      <div className="flex flex-col max-w-[75%]">
                        {!isMyMessage && !selectedUser && !msg.isDeleted && (
                          <div className="text-sm font-semibold mb-2 text-gray-700 ml-1">
                            {senderName}
                          </div>
                        )}

                        <div
                          className={`px-5 py-4 rounded-2xl break-words relative shadow-md transition-all duration-200 hover:shadow-lg ${
                            isMyMessage
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {msg.isDeleted ? (
                              <span className="italic text-gray-400 font-medium">
                                o'chirilgan xabar
                              </span>
                            ) : (
                              <>
                                {msg.content}
                                {msg.is_edited && (
                                  <span className="text-xs ml-2 italic opacity-75 font-medium">
                                    (tahrirlangan)
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {!msg.isDeleted && (
                            <div
                              className={`text-xs mt-3 flex justify-between items-center ${
                                isMyMessage ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              <span className="font-medium">
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
                                <div className="flex ml-3 gap-1">
                                  <button
                                    className="hover:text-red-300 cursor-pointer p-1 rounded transition-all duration-200 hover:bg-red-500/20"
                                    onClick={() => deleteMessage(msg.id)}
                                    title="O'chirish"
                                  >
                                    <MdDelete size={16} />
                                  </button>
                                  <button
                                    className="hover:text-yellow-300 cursor-pointer p-1 rounded transition-all duration-200 hover:bg-yellow-500/20"
                                    onClick={() => startEdit(msg)}
                                    title="Tahrirlash"
                                  >
                                    <MdEdit size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isMyMessage && !msg.isDeleted && (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-sm font-semibold ml-3 mt-1 flex-shrink-0 shadow-md ring-2 ring-white">
                          Me
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center p-6 bg-white border-t border-gray-100 shadow-lg">
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
                  className="w-full border-2 border-gray-200 rounded-full px-6 py-4 pr-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-500 bg-gray-50 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  disabled={!roomId || !isConnected || isLoading}
                />

                {editingMessage ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <button
                      onClick={saveEdit}
                      disabled={!content.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                      title="Saqlash"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl"
                      title="Bekor qilish"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!content.trim()}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
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
              <div className="text-xl font-semibold mb-3">
                Select a user or group to start chatting
              </div>
              <div className="text-base">
                Choose someone from the left sidebar
              </div>
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl shadow-2xl w-[900px] p-10 flex flex-col items-center border border-gray-700">
            <div className="flex gap-6 mb-8 w-full">
              {/* Local video */}
              <div className="w-1/3 h-52 rounded-3xl overflow-hidden bg-gray-800 relative shadow-2xl border border-gray-600">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!localStreamRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="text-3xl mb-3">📹</div>
                      <div className="text-sm text-gray-300 font-medium">
                        Local Camera
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remote video */}
              <div className="w-2/3 h-52 rounded-3xl overflow-hidden bg-gray-800 relative shadow-2xl border border-gray-600">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!activeCall && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="text-4xl mb-3">👤</div>
                      <div className="text-sm text-gray-300 font-medium">
                        Remote User
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center">
              {selectedUser?.fio || selectedUser?.username || "Unknown User"}
            </h2>

            <div className="text-sm text-gray-300 mt-3 text-center">
              {(() => {
                const issues = checkBrowserCompatibility();
                if (issues.length > 0) {
                  return (
                    <div className="bg-yellow-900/30 p-3 rounded-xl border border-yellow-700/50">
                      ⚠️ Compatibility issues: {issues.join(", ")}
                    </div>
                  );
                }
                return (
                  <span className="text-emerald-400 font-medium">
                    ✅ Browser compatible
                  </span>
                );
              })()}
            </div>

            {incomingCall && (
              <p className="text-gray-300 text-base mt-2 font-medium">
                📞 Incoming {incomingCall.callType} call...
              </p>
            )}
            {activeCall && (
              <p className="text-gray-300 text-base mt-2 font-medium">
                {activeCall.status === "ongoing"
                  ? "🟢 Call in progress"
                  : "🟡 Call connecting..."}
              </p>
            )}

            {/* Connection status */}
            {pcRef.current && (
              <p className="text-gray-400 text-sm mt-2 font-medium">
                ICE: {pcRef.current.iceConnectionState} | PC:{" "}
                {pcRef.current.connectionState}
              </p>
            )}

            <div className="flex items-center justify-center gap-8 mt-12">
              {incomingCall ? (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={answerCall}
                      className="p-6 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-green-100 hover:ring-green-200"
                    >
                      <BsTelephoneFill size={28} className="text-white" />
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Answer
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={rejectCall}
                      className="p-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-red-100 hover:ring-red-200"
                    >
                      <MdCancel size={32} className="text-white" />
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Reject
                    </span>
                  </div>
                </>
              ) : activeCall ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={endCall}
                    className="p-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-red-100 hover:ring-red-200"
                  >
                    <MdCancel size={32} className="text-white" />
                  </button>
                  <span className="text-sm mt-4 font-semibold text-gray-700">
                    End Call
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => initiateCall("video")}
                      className="p-6 rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-blue-100 hover:ring-blue-200"
                    >
                      <BsCameraVideoFill size={30} className="text-white" />
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Video Call
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        stopLocalMedia();
                        setIsOpen(false);
                      }}
                      className="p-6 rounded-full bg-gray-500 hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-gray-100 hover:ring-gray-200"
                    >
                      <MdCancel size={32} className="text-white" />
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Cancel
                    </span>
                  </div>

                  {/* <div className="flex flex-col items-center">
                    <button
                      onClick={async () => {
                        try {
                          await getLocalMedia(true, false);
                          toast.success("Camera test successful!");
                        } catch (error) {
                          console.error("Camera test failed:", error);
                        }
                      }}
                      className="p-6 rounded-full bg-purple-500 hover:bg-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-purple-100 hover:ring-purple-200"
                      title="Test camera access"
                    >
                      <span className="text-3xl">📷</span>
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Test Camera
                    </span>
                  </div> */}

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => initiateCall("voice")}
                      className="p-6 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 ring-4 ring-indigo-100 hover:ring-indigo-200"
                    >
                      <BsTelephoneFill size={28} className="text-white" />
                    </button>
                    <span className="text-sm mt-4 font-semibold text-gray-700">
                      Voice Call
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
