import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, MessageCircle, ArrowLeft, Loader2, Users, Search, Smile,
  X, Pencil, Trash2, Check, Phone, PhoneOff, PhoneCall, Video, VideoOff,
  Plus, LogOut, Expand,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  useConversationsQuery,
  useMessagesInfiniteQuery,
  useSendMessageMutation,
  useMarkSeenMutation,
  useChatSocket,
  useDeleteMessageMutation,
  useEditMessageMutation,
} from "@/lib/api/endpoints/chat";
import {
  useGroupsQuery,
  useGroupMessagesQuery,
  useCreateGroupMutation,
  useLeaveGroupMutation,
  useSendGroupMessageMutation,
  useDeleteGroupMessageMutation,
  useEditGroupMessageMutation,
} from "@/lib/api/endpoints/groups";
import { useFriendsListQuery } from "@/lib/api/endpoints/friends";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import { GradientButton } from "@/components/ui/gradient-button";
import type {
  ApiResponse, MessageResponse, MessageListResponse, ConversationPreview,
  GroupResponse, GroupMessageResponse, FriendResponse, CreateGroupRequest,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────

const EMOJI_GRID = [
  "😊","🙏","❤️","🌸","🕉️","🌺","✨","🙌","💐","🌻",
  "🎉","👏","🌟","💫","🎵","🌈","🔥","💯","🌿","🕊️",
  "😂","😍","🥺","😁","🤗","😇","🙂","😌","😎","🥳",
  "👍","🤝","💪","🫶","👋","✌️","🤞","🙋","🤲","🙇",
] as const;

// ── Helpers ───────────────────────────────────────────────────

function getCurrentUserId(): string {
  const token = localStorage.getItem("access_token");
  if (!token) return "";
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>;
    return (payload.sub as string) ?? "";
  } catch {
    return "";
  }
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

// ── WebRTC Calling ────────────────────────────────────────────

type CallState = "idle" | "calling" | "incoming" | "connected";

interface UseWebRTCCallReturn {
  callState: CallState;
  callPartnerId: string | null;
  incomingCallerId: string | null;
  isVideoCall: boolean;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  initiateCall: (targetId: string, withVideo?: boolean) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
  handleCallEvent: (data: Record<string, unknown>) => void;
}

function useWebRTCCall(
  sendWsEvent: (data: Record<string, unknown>) => void
): UseWebRTCCallReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStateRef = useRef<CallState>("idle");
  const isVideoCallRef = useRef(false);

  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const STUN_CONFIG: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingOfferRef.current = null;
    isVideoCallRef.current = false;
    setIsVideoCall(false);
    setCallState("idle");
    setCallPartnerId(null);
    setIncomingCallerId(null);
  }, []);

  const buildPeer = useCallback(
    async (targetId: string, withVideo = false): Promise<RTCPeerConnection> => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      localStreamRef.current = stream;
      if (withVideo && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const pc = new RTCPeerConnection(STUN_CONFIG);
      peerRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendWsEvent({ type: "call_ice_candidate", target_id: targetId, candidate: e.candidate });
        }
      };
      pc.ontrack = (e) => {
        if (withVideo && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        } else if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") cleanup();
      };
      return pc;
    },
    [sendWsEvent, cleanup] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const initiateCall = useCallback(async (targetId: string, withVideo = false) => {
    try {
      isVideoCallRef.current = withVideo;
      setIsVideoCall(withVideo);
      const pc = await buildPeer(targetId, withVideo);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendWsEvent({ type: "call_offer", target_id: targetId, sdp: offer, video: withVideo });
      setCallPartnerId(targetId);
      setCallState("calling");
    } catch { cleanup(); }
  }, [buildPeer, sendWsEvent, cleanup]);

  const answerCall = useCallback(async () => {
    if (!incomingCallerId || !pendingOfferRef.current) return;
    try {
      const pc = await buildPeer(incomingCallerId, isVideoCallRef.current);
      await pc.setRemoteDescription(pendingOfferRef.current);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWsEvent({ type: "call_answer", target_id: incomingCallerId, sdp: answer });
      setCallPartnerId(incomingCallerId);
      setCallState("connected");
    } catch { cleanup(); }
  }, [incomingCallerId, buildPeer, sendWsEvent, cleanup]);

  const rejectCall = useCallback(() => {
    if (incomingCallerId) sendWsEvent({ type: "call_reject", target_id: incomingCallerId });
    cleanup();
  }, [incomingCallerId, sendWsEvent, cleanup]);

  const hangUp = useCallback(() => {
    if (callPartnerId) sendWsEvent({ type: "call_end", target_id: callPartnerId });
    cleanup();
  }, [callPartnerId, sendWsEvent, cleanup]);

  const handleCallEvent = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;
    const callerId = data.caller_id as string;
    if (type === "call_offer") {
      if (callStateRef.current !== "idle") {
        sendWsEvent({ type: "call_reject", target_id: callerId });
        return;
      }
      const withVideo = !!(data.video as boolean);
      isVideoCallRef.current = withVideo;
      setIsVideoCall(withVideo);
      pendingOfferRef.current = data.sdp as RTCSessionDescriptionInit;
      setIncomingCallerId(callerId);
      setCallState("incoming");
    } else if (type === "call_answer") {
      peerRef.current
        ?.setRemoteDescription(data.sdp as RTCSessionDescriptionInit)
        .then(() => setCallState("connected"));
    } else if (type === "call_reject" || type === "call_end") {
      cleanup();
    } else if (type === "call_ice_candidate" && data.candidate) {
      peerRef.current?.addIceCandidate(data.candidate as RTCIceCandidateInit);
    }
  }, [sendWsEvent, cleanup]);

  return { callState, callPartnerId, incomingCallerId, isVideoCall, remoteAudioRef, localVideoRef, remoteVideoRef, initiateCall, answerCall, rejectCall, hangUp, handleCallEvent };
}

// ── Group Chat Panel ──────────────────────────────────────────

interface GroupChatPanelProps {
  group: GroupResponse;
  currentUserId: string;
  onBack: () => void;
}

function GroupChatPanel({ group, currentUserId, onBack }: GroupChatPanelProps) {
  const { data: msgsData, isLoading: msgsLoading } = useGroupMessagesQuery(group.id);
  const messages: GroupMessageResponse[] = msgsData?.data ?? [];
  const sendMsg = useSendGroupMessageMutation(group.id);
  const deleteMsg = useDeleteGroupMessageMutation(group.id);
  const editMsg = useEditGroupMessageMutation(group.id);
  const leaveGroup = useLeaveGroupMutation();
  const [input, setInput] = useState("");
  const [editingMsg, setEditingMsg] = useState<GroupMessageResponse | null>(null);
  const [editInput, setEditInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || sendMsg.isPending) return;
    sendMsg.mutate({ content }, {
      onSuccess: () => { setInput(""); if (textareaRef.current) textareaRef.current.style.height = "auto"; },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 px-4 flex items-center gap-3 border-b border-border surface shrink-0">
        <button onClick={onBack} className="p-1.5 rounded text-muted-foreground hover:text-foreground md:hidden">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded bg-accent/10 flex items-center justify-center text-accent shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{group.name}</p>
          <p className="text-[11px] text-muted-foreground">{group.member_count} members</p>
        </div>
        <button
          onClick={() => leaveGroup.mutate(group.id)}
          className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Leave group"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {msgsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded bg-accent/10 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <p className="text-[13px] font-medium text-foreground">No messages yet</p>
            <p className="text-[11px] text-muted-foreground mt-1">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const isEditing = editingMsg?.id === msg.id;
            if (isEditing) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="flex items-center gap-2 max-w-[72%]">
                    <input autoFocus value={editInput} onChange={(e) => setEditInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { if (editInput.trim()) editMsg.mutate({ messageId: msg.id, content: editInput.trim() }); setEditingMsg(null); }
                        if (e.key === "Escape") setEditingMsg(null);
                      }}
                      className="flex-1 h-9 px-3 rounded border border-accent bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20" />
                    <button onClick={() => { if (editInput.trim()) editMsg.mutate({ messageId: msg.id, content: editInput.trim() }); setEditingMsg(null); }}
                      className="p-1.5 rounded bg-accent text-white"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingMsg(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <div className={cn("space-y-0.5 max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                  {!isOwn && (
                    <p className="text-[11px] text-accent font-medium ml-1">
                      {msg.sender_display_name ?? msg.sender_username}
                    </p>
                  )}
                  <div className={cn(
                    "relative group/bubble px-4 py-2.5 rounded text-[13px] leading-relaxed",
                    msg.is_deleted
                      ? "italic text-muted-foreground/60 surface border border-border/40"
                      : isOwn
                        ? "bg-accent text-white rounded-br-lg"
                        : "surface border border-border text-foreground rounded-bl-lg"
                  )}>
                    <p className="whitespace-pre-wrap break-words">
                      {msg.is_deleted ? "This message was deleted" : msg.content}
                    </p>
                    <div className={cn("flex items-center justify-end gap-1 mt-1", isOwn ? "text-white/50" : "text-muted-foreground/50")}>
                      {msg.edited_at && !msg.is_deleted && <span className="text-[10px] italic">edited</span>}
                      <span className="text-[10px]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!msg.is_deleted && isOwn && (
                      <div className={cn(
                        "absolute -top-7 right-0 flex gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity",
                        "bg-background/90 border border-border rounded shadow-sm px-1 py-0.5"
                      )}>
                        <button onClick={() => { setEditingMsg(msg); setEditInput(msg.content); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteMsg.mutate(msg.id)} disabled={deleteMsg.isPending}
                          className="p-1 rounded text-muted-foreground hover:text-destructive" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={msgsEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-border surface shrink-0">
        <div className="flex items-end gap-2">
          <textarea ref={textareaRef} value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(textareaRef.current); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${group.name}…`} rows={1}
            className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 rounded border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none" />
          <button onClick={handleSend} disabled={!input.trim() || sendMsg.isPending}
            className="h-10 w-10 rounded bg-accent text-white flex items-center justify-center transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Group Modal ─────────────────────────────────────────

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  friends: FriendResponse[];
  onCreated: (groupId: string) => void;
}

function CreateGroupModal({ open, onClose, friends, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const createGroup = useCreateGroupMutation();

  const toggle = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const payload: CreateGroupRequest = { name: name.trim(), member_ids: selectedIds };
    if (desc.trim()) payload.description = desc.trim();
    createGroup.mutate(payload, {
      onSuccess: (res) => {
        onClose();
        setName(""); setDesc(""); setSelectedIds([]);
        if (res.data) onCreated(res.data.id);
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="surface w-full max-w-md rounded shadow-lg border border-accent/15 p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-foreground">New Group</h2>
                <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name *"
                  className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
                  className="w-full h-9 px-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                {friends.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2">Add friends</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {friends.map((f) => (
                        <button key={f.id} type="button" onClick={() => toggle(f.id)}
                          className={cn("flex items-center gap-3 w-full p-2.5 rounded border transition-all text-left",
                            selectedIds.includes(f.id) ? "border-accent bg-accent/5" : "border-border hover:bg-muted/30")}>
                          <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-accent">
                            {(f.full_name ?? f.username).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] text-foreground flex-1 truncate">{f.full_name ?? f.username}</span>
                          {selectedIds.includes(f.id) && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="h-9 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                <GradientButton size="sm" onClick={handleCreate} disabled={!name.trim() || createGroup.isPending}>
                  {createGroup.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Creating…</> : "Create Group"}
                </GradientButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  // ── Tab / group state
  const [mode, setMode] = useState<"dm" | "groups">("dm");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // ── DM state
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [viewedMsg, setViewedMsg] = useState<MessageResponse | null>(null);
  const [editingMsg, setEditingMsg] = useState<MessageResponse | null>(null);
  const [editInput, setEditInput] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Queries
  const { data: conversationsData, isLoading: convsLoading } = useConversationsQuery();
  const {
    data: messagesData,
    isLoading: msgsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessagesInfiniteQuery(partnerId ?? "");
  const { data: groupsData, isLoading: groupsLoading } = useGroupsQuery();
  const { data: friendsData } = useFriendsListQuery();

  const sendMsg = useSendMessageMutation(partnerId ?? "");
  const markSeen = useMarkSeenMutation();
  const deleteMsg = useDeleteMessageMutation(partnerId ?? "");
  const editMsg = useEditMessageMutation(partnerId ?? "");

  const conversations = conversationsData?.data ?? [];
  // Flatten infinite pages: pages are newest-first, so reverse to get oldest→newest order
  const messages = useMemo(
    () => [...(messagesData?.pages ?? [])].reverse().flatMap((p) => p.data?.items ?? []),
    [messagesData]
  );
  const groups: GroupResponse[] = groupsData?.data ?? [];
  const friends: FriendResponse[] = friendsData?.data ?? [];

  const activeConv = conversations.find((c) => c.friend_id === partnerId);
  const activeFriend = friends.find((f) => f.id === partnerId);
  const partnerName = activeConv?.friend_username ?? activeFriend?.full_name ?? activeFriend?.username ?? "Unknown";
  const partnerAvatar = activeConv?.friend_avatar ?? activeFriend?.avatar_url ?? null;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  // Switch to DM mode when URL partner param changes (e.g., notification click)
  useEffect(() => { if (partnerId) setMode("dm"); }, [partnerId]);

  // ── Incoming DM message handler
  const handleIncomingMessage = useCallback((msg: MessageResponse) => {
    const chatPartnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
    queryClient.setQueryData<InfiniteData<ApiResponse<MessageListResponse>>>(
      QUERY_KEYS.CHAT_MESSAGES(chatPartnerId),
      (old) => {
        if (!old?.pages?.length) return old;
        const pages = [...old.pages];
        const latestPage = pages[0];
        if (!latestPage?.data) return old;
        const exists = latestPage.data.items.some((m) => m.id === msg.id);
        if (exists) return old;
        pages[0] = { ...latestPage, data: { ...latestPage.data, items: [...latestPage.data.items, msg] } };
        return { ...old, pages };
      }
    );
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT_CONVERSATIONS });
  }, [currentUserId, queryClient]);

  const handleTypingEvent = useCallback((senderId: string) => {
    if (senderId !== partnerId) return;
    setPartnerTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 3000);
  }, [partnerId]);

  // ── WebRTC — wire up after socket is created
  const sendWsEventRef = useRef<((d: Record<string, unknown>) => void) | null>(null);
  const stableSend = useCallback((d: Record<string, unknown>) => sendWsEventRef.current?.(d), []);

  const {
    callState, callPartnerId, incomingCallerId, isVideoCall,
    remoteAudioRef, localVideoRef, remoteVideoRef,
    initiateCall, answerCall, rejectCall, hangUp, handleCallEvent,
  } = useWebRTCCall(stableSend);

  const { sendTyping, sendWsEvent } = useChatSocket(handleIncomingMessage, handleTypingEvent, handleCallEvent);

  useEffect(() => { sendWsEventRef.current = sendWsEvent; }, [sendWsEvent]);

  // ── Virtualizer for DM messages
  const virtualItems = [
    ...messages,
    ...(partnerTyping ? [{ id: "__typing__" } as unknown as MessageResponse] : []),
  ];
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => msgContainerRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  // Scroll to bottom when new messages arrive (send / receive)
  useEffect(() => {
    if (virtualItems.length > 0) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: "end", behavior: "smooth" });
    }
  }, [messages.length, partnerTyping]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll preservation — when older messages are prepended (pagination), maintain position
  const prevScrollHeightRef = useRef<number>(0);
  useLayoutEffect(() => {
    const container = msgContainerRef.current;
    if (!container || prevScrollHeightRef.current === 0) return;
    const delta = container.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) container.scrollTop += delta;
    prevScrollHeightRef.current = 0;
  }, [messages.length]); // runs after DOM updates

  // Load older messages when user scrolls near the top
  const handleMessagesScroll = useCallback(() => {
    const container = msgContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;
    if (container.scrollTop < 120) {
      prevScrollHeightRef.current = container.scrollHeight;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (partnerId) { markSeen.mutate(partnerId); inputRef.current?.focus(); }
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [partnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close emoji on outside click
  useEffect(() => {
    if (!emojiOpen) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiOpen]);

  const handleSend = () => {
    if (!input.trim() || !partnerId || sendMsg.isPending) return;
    sendMsg.mutate(input.trim());
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (partnerId) sendTyping(partnerId, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize(inputRef.current);
    if (partnerId) sendTyping(partnerId, true);
  };

  const conversedIds = new Set(conversations.map((c) => c.friend_id));
  const friendsWithoutConv: ConversationPreview[] = friends
    .filter((f) => !conversedIds.has(f.id))
    .map((f) => ({
      friend_id: f.id,
      friend_username: f.full_name ?? f.username,
      friend_avatar: f.avatar_url ?? null,
      last_message: "",
      last_message_at: "",
      unread_count: 0,
    }));
  const allContacts: ConversationPreview[] = [...conversations, ...friendsWithoutConv].filter(
    (c) => !contactSearch || c.friend_username.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const showRightPanel = !!(partnerId || selectedGroupId);

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
      {/* Hidden video elements for WebRTC (shown when in video call overlay) */}
      <video ref={localVideoRef} autoPlay muted playsInline style={{ display: "none" }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />

      <div className="flex -mx-5 -my-5 lg:-mx-6 lg:-my-6 overflow-hidden h-[calc(100vh-6rem)]">
        {/* ── Left panel ── */}
        <div className={cn(
          "flex flex-col border-r border-border surface shrink-0 w-full md:w-80",
          showRightPanel ? "hidden md:flex" : "flex"
        )}>
          {/* DM / Groups tab toggle */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setMode("dm")}
              className={cn(
                "flex-1 py-2.5 text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5",
                mode === "dm" ? "text-accent border-b-2 border-accent bg-accent/5" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" /> DMs
            </button>
            <button
              onClick={() => setMode("groups")}
              className={cn(
                "flex-1 py-2.5 text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5",
                mode === "groups" ? "text-accent border-b-2 border-accent bg-accent/5" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-3.5 h-3.5" /> Groups
            </button>
          </div>

          {/* DM search */}
          {mode === "dm" && (
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search conversations..."
                  className="w-full h-9 pl-9 pr-3 rounded border border-input bg-background text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
              </div>
            </div>
          )}

          {/* Groups header */}
          {mode === "groups" && (
            <div className="px-4 py-2 flex items-center justify-between shrink-0">
              <span className="text-[12px] font-medium text-muted-foreground">Group Chats</span>
              <button onClick={() => setShowCreateGroup(true)}
                className="h-7 px-2.5 rounded bg-accent/10 text-accent text-[11px] font-medium hover:bg-accent/20 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* DM list */}
            {mode === "dm" && (
              <>
                {convsLoading && (
                  <div className="space-y-0.5 p-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3 p-3 rounded animate-pulse">
                        <div className="w-10 h-10 rounded bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2.5 bg-muted rounded w-24" />
                          <div className="h-2 bg-muted rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!convsLoading && allContacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-14 h-14 rounded bg-accent/10 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">No conversations yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Add friends to start chatting</p>
                  </div>
                )}
                <div className="px-2 space-y-0.5">
                  {allContacts.map((contact) => (
                    <button key={contact.friend_id} onClick={() => navigate(`/dashboard/messages/${contact.friend_id}`)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-3 text-left transition-all rounded",
                        partnerId === contact.friend_id ? "bg-accent/8 border border-accent/15" : "hover:bg-muted/40 border border-transparent"
                      )}>
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm overflow-hidden">
                          {contact.friend_avatar ? (
                            <img src={contact.friend_avatar} alt="" className="w-full h-full object-cover" />
                          ) : contact.friend_username[0]?.toUpperCase()}
                        </div>
                        {contact.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold rounded min-w-[16px] h-4 flex items-center justify-center px-1">
                            {contact.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-[13px] truncate", contact.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                            {contact.friend_username}
                          </p>
                          {contact.last_message_at && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(contact.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        {contact.last_message && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{contact.last_message}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Groups list */}
            {mode === "groups" && (
              <>
                {groupsLoading ? (
                  <div className="space-y-0.5 p-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3 p-3 rounded animate-pulse">
                        <div className="w-10 h-10 rounded bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2.5 bg-muted rounded w-24" />
                          <div className="h-2 bg-muted rounded w-14" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-14 h-14 rounded bg-accent/10 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">No groups yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Create a group to chat with multiple friends</p>
                  </div>
                ) : (
                  <div className="px-2 space-y-0.5">
                    {groups.map((g) => (
                      <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-3 text-left transition-all rounded",
                          selectedGroupId === g.id ? "bg-accent/8 border border-accent/15" : "hover:bg-muted/40 border border-transparent"
                        )}>
                        <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{g.name}</p>
                          <p className="text-[11px] text-muted-foreground">{g.member_count} members</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={cn("flex-1 flex flex-col min-w-0", showRightPanel ? "flex" : "hidden md:flex")}>
          {mode === "groups" && selectedGroup ? (
            <GroupChatPanel group={selectedGroup} currentUserId={currentUserId} onBack={() => setSelectedGroupId(null)} />
          ) : mode === "groups" ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <p className="text-[15px] font-semibold text-foreground">Group Chats</p>
              <p className="text-[13px] text-muted-foreground mt-1">Select a group or create a new one</p>
            </div>
          ) : !partnerId ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-accent" />
              </div>
              <p className="text-[15px] font-semibold text-foreground">Your messages</p>
              <p className="text-[13px] text-muted-foreground mt-1">Select a friend to start a private conversation</p>
            </div>
          ) : (
            <>
              {/* DM header */}
              <div className="h-14 px-4 flex items-center gap-3 border-b border-border surface shrink-0">
                <button onClick={() => navigate("/dashboard/messages")} className="p-1.5 rounded text-muted-foreground hover:text-foreground md:hidden transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-[13px] shrink-0 overflow-hidden">
                  {partnerAvatar ? <img src={partnerAvatar} alt="" className="w-full h-full object-cover" /> : partnerName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-none truncate">{partnerName}</p>
                  <AnimatePresence>
                    {partnerTyping && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-accent mt-0.5">
                        typing…
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => initiateCall(partnerId, false)} disabled={callState !== "idle"}
                  className="p-2 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40" title="Voice call">
                  <Phone className="w-4 h-4" />
                </button>
                <button onClick={() => initiateCall(partnerId, true)} disabled={callState !== "idle"}
                  className="p-2 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40" title="Video call">
                  <Video className="w-4 h-4" />
                </button>
              </div>

              {/* DM messages */}
              <div ref={msgContainerRef} className="flex-1 overflow-y-auto px-4 py-4" onScroll={handleMessagesScroll}>
                {/* Loading older messages spinner */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  </div>
                )}
                {msgsLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>}
                {!msgsLoading && messages.length === 0 && !partnerTyping && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded bg-accent/10 flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">Start the conversation</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Say hello! 👋</p>
                  </div>
                )}
                {!msgsLoading && virtualItems.length > 0 && (
                  <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                    {virtualizer.getVirtualItems().map((vItem) => {
                      const msg = virtualItems[vItem.index];
                      const isTypingRow = (msg as { id: string }).id === "__typing__";
                      return (
                        <div key={vItem.key} data-index={vItem.index} ref={virtualizer.measureElement}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vItem.start}px)` }}
                          className="pb-3">
                          {isTypingRow ? (
                            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex justify-start">
                              <div className="surface border border-border px-4 py-3 rounded rounded-bl-lg">
                                <div className="flex gap-1 items-center">
                                  {[0, 1, 2].map((i) => (
                                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 block"
                                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ) : (() => {
                            const isOwn = msg.sender_id === currentUserId;
                            const isBeingEdited = editingMsg?.id === msg.id;
                            return (
                              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                                className={cn("flex group/msg", isOwn ? "justify-end" : "justify-start")}>
                                {isBeingEdited ? (
                                  <div className="flex items-center gap-2 max-w-[72%]">
                                    <input ref={editInputRef} value={editInput} onChange={(e) => setEditInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (editInput.trim() && editingMsg) { editMsg.mutate({ messageId: editingMsg.id, content: editInput.trim() }); setEditingMsg(null); setEditInput(""); } }
                                        else if (e.key === "Escape") { setEditingMsg(null); setEditInput(""); }
                                      }}
                                      className="flex-1 h-9 px-3 rounded border border-accent bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                                      autoFocus />
                                    <button onClick={() => { if (editInput.trim() && editingMsg) { editMsg.mutate({ messageId: editingMsg.id, content: editInput.trim() }); } setEditingMsg(null); setEditInput(""); }}
                                      disabled={!editInput.trim() || editMsg.isPending} className="p-1.5 rounded bg-accent text-white disabled:opacity-40">
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { setEditingMsg(null); setEditInput(""); }} className="p-1.5 rounded text-muted-foreground hover:text-foreground">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "relative group/bubble max-w-[72%] px-4 py-2.5 text-[13px] leading-relaxed",
                                    msg.is_deleted
                                      ? "italic text-muted-foreground/60 surface border border-border/40 rounded"
                                      : isOwn
                                        ? "bg-accent text-white rounded rounded-br-lg"
                                        : "surface border border-border text-foreground rounded rounded-bl-lg"
                                  )}>
                                    <p className="whitespace-pre-wrap break-words">
                                      {msg.is_deleted ? "This message was deleted" : msg.content}
                                    </p>
                                    <div className={cn("flex items-center justify-end gap-1 mt-1", isOwn ? "text-white/50" : "text-muted-foreground/60")}>
                                      {msg.edited_at && !msg.is_deleted && <span className="text-[10px] italic">edited</span>}
                                      <span className="text-[10px]">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    {/* Action icons — float above bubble on hover, no layout impact */}
                                    {!msg.is_deleted && (
                                      <div className={cn(
                                        "absolute -top-7 flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                                        "bg-background/90 border border-border rounded shadow-sm px-1 py-0.5",
                                        isOwn ? "right-0" : "left-0"
                                      )}>
                                        <button onClick={() => setViewedMsg(msg)} title="View"
                                          className="p-1 rounded text-muted-foreground hover:text-foreground">
                                          <Expand className="w-3 h-3" />
                                        </button>
                                        {isOwn && (
                                          <>
                                            <button onClick={() => { setEditingMsg(msg); setEditInput(msg.content); }} title="Edit"
                                              className="p-1 rounded text-muted-foreground hover:text-foreground">
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => deleteMsg.mutate(msg.id)} disabled={deleteMsg.isPending} title="Delete"
                                              className="p-1 rounded text-muted-foreground hover:text-destructive">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DM input */}
              <div className="px-4 py-3 border-t border-border surface shrink-0">
                <div className="flex items-end gap-2">
                  <div className="relative" ref={emojiRef}>
                    <button type="button" onClick={() => setEmojiOpen((o) => !o)}
                      className={cn("p-2 rounded transition-colors", emojiOpen ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                      <Smile className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {emojiOpen && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                          className="absolute bottom-12 left-0 surface border border-border rounded shadow-lg p-3 z-50 w-56">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Emoji</span>
                            <button onClick={() => setEmojiOpen(false)} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                          </div>
                          <div className="grid grid-cols-8 gap-0.5">
                            {EMOJI_GRID.map((emoji) => (
                              <button key={emoji} type="button" onClick={() => { setInput((prev) => prev + emoji); setEmojiOpen(false); }}
                                className="w-6 h-6 text-[16px] flex items-center justify-center rounded hover:bg-muted transition-colors">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                    placeholder={`Message ${partnerName}…`} rows={1}
                    className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2.5 rounded border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none overflow-y-auto" />
                  <button onClick={handleSend} disabled={!input.trim() || sendMsg.isPending}
                    className="h-10 w-10 rounded bg-accent text-white flex items-center justify-center transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95">
                    {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message view modal */}
      <AnimatePresence>
        {viewedMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setViewedMsg(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ duration: 0.18 }}
              className="surface rounded border border-border shadow-lg max-w-md w-full mx-4 p-5"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {viewedMsg.sender_id === currentUserId ? "You" : partnerName}
                </span>
                <button onClick={() => setViewedMsg(null)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap break-words">{viewedMsg.content}</p>
              <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-accent/15">
                {new Date(viewedMsg.created_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group modal */}
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} friends={friends}
        onCreated={(id) => { setSelectedGroupId(id); setMode("groups"); }} />

      {/* Outgoing / in-call overlay */}
      <AnimatePresence>
        {(callState === "calling" || callState === "connected") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 surface border border-border rounded shadow-lg overflow-hidden">
            {/* Remote video (full card when connected + video call) */}
            {isVideoCall && callState === "connected" && (
              <div className="relative w-64 h-48 bg-black">
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                {/* Local video PiP */}
                <div className="absolute bottom-2 right-2 w-20 h-15 rounded overflow-hidden border border-white/30 bg-black">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="p-4 flex items-center gap-4 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                {callState === "calling"
                  ? (isVideoCall ? <Video className="w-4 h-4 text-accent animate-pulse" /> : <PhoneCall className="w-4 h-4 text-accent animate-pulse" />)
                  : (isVideoCall ? <Video className="w-4 h-4 text-emerald-500" /> : <Phone className="w-4 h-4 text-emerald-500" />)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{callState === "calling" ? "Calling…" : "In call"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {conversations.find((c) => c.friend_id === callPartnerId)?.friend_username ?? callPartnerId}
                </p>
              </div>
              <button onClick={hangUp} className="w-9 h-9 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors" title="End call">
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming call overlay */}
      <AnimatePresence>
        {callState === "incoming" && incomingCallerId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="surface border border-border rounded shadow-lg p-6 max-w-xs w-full mx-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                {isVideoCall
                  ? <Video className="w-7 h-7 text-accent animate-pulse" />
                  : <PhoneCall className="w-7 h-7 text-accent animate-pulse" />}
              </div>
              <p className="text-[15px] font-semibold text-foreground mb-1">Incoming {isVideoCall ? "Video" : ""} Call</p>
              <p className="text-[13px] text-muted-foreground mb-5">
                {conversations.find((c) => c.friend_id === incomingCallerId)?.friend_username ?? incomingCallerId}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={rejectCall} className="w-12 h-12 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors">
                  <PhoneOff className="w-5 h-5" />
                </button>
                <button onClick={answerCall} className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
                  {isVideoCall ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
