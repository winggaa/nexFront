import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * @interface FriendInfo
 * @description 채팅방에 초대할 수 있는 친구 정보를 정의합니다.
 */
interface FriendInfo {
  email: string;
  nickname: string;
}

interface ChatRoomProps {
  roomId: string;
  onLeave: () => void;
}

/**
 * @interface ChatMessage
 * @description 웹소켓을 통해 송수신되는 메시지 페이로드 스키마입니다.
 */
interface ChatMessage {
  type: string; 
  roomId: string; 
  sender: string; 
  senderId: number; 
  message: string;
}

/**
 * @component ChatRoom
 * @description STOMP/WebSocket 기반의 실시간 통신이 이루어지는 채팅방 컴포넌트입니다.
 */
const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLeave }) => {
  const myNickname = localStorage.getItem('nickname') || "익명";
  const token = localStorage.getItem('jwt_token');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  const [friends, setFriends] = useState<FriendInfo[]>([]); 
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  
  const stompClient = useRef<Client | null>(null);

  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [showMembersMenu, setShowMembersMenu] = useState(false);

  /**
   * @function fetchRoomMembers
   * @description 현재 채팅방에 참여 중인 멤버 목록을 갱신합니다.
   */
  const fetchRoomMembers = () => {
    fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/${roomId}/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoomMembers(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    // 이전 메시지 기록 조회
    fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/chat/rooms/${roomId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setMessages(data); })
      .catch(err => console.error(err));

    // 초대용 친구 목록 조회
    fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFriends(data)) 
      .catch(err => console.error(err));

    fetchRoomMembers();

    // WebSocket (STOMP) 클라이언트 연결 초기화
    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/ws-chat`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        // 메시지 구독 (Subscribe)
        client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
          const receivedMsg = JSON.parse(message.body);
          setMessages((prev) => [...prev, receivedMsg]);

          if (receivedMsg.type === 'ENTER' || receivedMsg.type === 'LEAVE') {
            fetchRoomMembers();
          }
        });

        // 입장 메시지 발행 (Publish)
        client.publish({
          destination: '/pub/chat/message',
          body: JSON.stringify({ type: 'ENTER', roomId, sender: myNickname, senderId: 0, message: `${myNickname}님이 입장하셨습니다.` }),
        });
      }
    });

    client.activate();
    stompClient.current = client;
    
    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => { client.deactivate(); };
  }, [roomId, token]);

  /**
   * @function sendMessage
   * @description 사용자가 입력한 메시지를 WebSocket을 통해 서버로 전송합니다.
   */
  const sendMessage = () => {
    if (stompClient.current && inputValue.trim() !== "") {
      stompClient.current.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify({ type: 'TALK', roomId, sender: myNickname, senderId: 0, message: inputValue }),
      });
      setInputValue("");
    }
  };

  /**
   * @function handleInvite
   * @description 선택한 친구를 현재 채팅방에 초대합니다.
   */
  const handleInvite = async (friendEmail: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/${roomId}/invite?friendEmail=${friendEmail}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      
      alert("초대 성공!");
      setShowInviteMenu(false);
      
      stompClient.current?.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify({ type: 'ENTER', roomId, sender: friendEmail, senderId: 0, message: `새로운 사용자가 초대되었습니다.` }),
      });
    } catch (error: any) {
      alert("초대 실패: " + error.message);
    }
  };

  /**
   * @function handleLeaveRoom
   * @description 현재 채팅방에서 완전히 퇴장합니다.
   */
  const handleLeaveRoom = async () => {
    if (!window.confirm("정말 이 채팅방에서 나가시겠습니까?")) return;
    try {
      stompClient.current?.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify({ type: 'LEAVE', roomId, sender: myNickname, senderId: 0, message: `${myNickname}님이 방을 나갔습니다.` }),
      });

      await fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/${roomId}/leave`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      onLeave();
    } catch (error) { 
      alert("나가기 실패!"); 
    }
  };

  return (
    <div style={{ padding: "20px", display: 'flex', flexDirection: 'column', height: '80vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>채팅방</h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowMembersMenu(!showMembersMenu)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>
            👥 {roomMembers.length}명
          </button>
          <button onClick={() => setShowInviteMenu(!showInviteMenu)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px' }}>➕ 초대</button>
          <button onClick={onLeave} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#9E9E9E', color: 'white', border: 'none', borderRadius: '4px' }}>🔙 뒤로</button>
          <button onClick={handleLeaveRoom} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>🚪 나가기</button>
        </div>
      </div>

      {showMembersMenu && (
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px', marginBottom: '10px', border: '1px solid #90caf9' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>대화 상대 ({roomMembers.length})</h4>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {roomMembers.map((member, idx) => (
              <span key={idx} style={{ padding: '5px 10px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '15px', fontSize: '13px' }}>
                👤 {member}
              </span>
            ))}
          </div>
        </div>
      )}

      {showInviteMenu && (
        <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '5px', marginBottom: '10px', border: '1px solid #ffcc80' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>내 친구 목록 (클릭하여 초대)</h4>
          {friends.length === 0 ? <p style={{fontSize: '12px'}}>추가된 친구가 없습니다.</p> : null}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {friends.map((friend, idx) => (
              <button key={idx} onClick={() => handleInvite(friend.email)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '15px' }}>
                {friend.nickname} ({friend.email})
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ flex: 1, border: "1px solid #ccc", overflowY: "auto", padding: "10px", marginBottom: "10px", backgroundColor: "#fff" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "8px", textAlign: msg.sender === myNickname ? "right" : "left" }}>
            <span style={{ fontSize: "12px", color: "#666" }}>{msg.sender}</span>
            <div style={{ display: "inline-block", background: msg.sender === myNickname ? "#4CAF50" : "#eee", color: msg.sender === myNickname ? "white" : "black", padding: "8px 12px", borderRadius: "15px", margin: "0 5px" }}>
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
        <button onClick={sendMessage} style={{ padding: "10px 20px", marginLeft: "10px", backgroundColor: "#4CAF50", color: "white", border: "none" }}>전송</button>
      </div>
    </div>
  );
};

export default ChatRoom;