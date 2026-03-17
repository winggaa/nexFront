import React, { useEffect, useState } from 'react';

/**
 * @interface FriendInfo
 * @description 친구의 이메일 및 닉네임 정보를 담는 인터페이스입니다.
 */
interface FriendInfo {
  email: string;
  nickname: string;
}

/**
 * @interface Room
 * @description 채팅방 정보를 담는 인터페이스입니다.
 */
interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  members: string[]; 
}

interface RoomListProps {
  onEnterRoom: (roomId: string) => void; 
}

/**
 * @component RoomList
 * @description 사용자가 접근 가능한 채팅방 목록과 친구 목록을 관리하는 컴포넌트입니다.
 */
const RoomList: React.FC<RoomListProps> = ({ onEnterRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendInfo[]>([]); 
  
  const [newRoomName, setNewRoomName] = useState("");
  const [newFriendEmail, setNewFriendEmail] = useState(""); 
  
  const [activeTab, setActiveTab] = useState<'PUBLIC_ALL' | 'PUBLIC_MINE' | 'PRIVATE_MINE' | 'FRIENDS'>('PUBLIC_ALL');
  const token = localStorage.getItem('jwt_token');

  /**
   * @function fetchData
   * @description 현재 활성화된 탭에 따라 필요한 데이터를 서버로부터 Fetch 합니다.
   */
  const fetchData = () => {
    if (activeTab === 'FRIENDS') {
      Promise.all([
        fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/friends`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/friends/received`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      .then(async ([friendsRes, receivedRes]) => {
        const friendsData = friendsRes.ok ? await friendsRes.json() : [];
        const receivedData = receivedRes.ok ? await receivedRes.json() : [];
        setFriends(friendsData);
        setReceivedRequests(receivedData);
      })
      .catch(console.error);
    } else {
      const endpoint = activeTab === 'PUBLIC_ALL' 
        ? `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/public`  
        : `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/me`;     

      fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setRooms(data))
        .catch(console.error);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [activeTab, token]); 

  /**
   * @function createRoom
   * @description 새로운 채팅방을 생성합니다.
   */
  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    const isPublicRoom = activeTab === 'PUBLIC_ALL' || activeTab === 'PUBLIC_MINE';

    try {
      await fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName, isPublic: isPublicRoom }) 
      });
      setNewRoomName(""); 
      fetchData(); 
    } catch (error) { 
      console.error(error); 
    }
  };

  /**
   * @function handleRoomClick
   * @description 선택한 채팅방 입장을 처리합니다.
   */
  const handleRoomClick = async (roomId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/rooms/${roomId}/join`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      onEnterRoom(roomId);
    } catch (error) { 
      alert("방 입장에 실패했습니다."); 
    }
  };

  /**
   * @function addFriend
   * @description 지정된 이메일을 통해 친구 추가를 요청합니다.
   */
  const addFriend = async (emailToAdd: string = newFriendEmail) => {
    if (!emailToAdd.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/friends/${emailToAdd}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const message = await res.text();
      if (!res.ok) throw new Error(message);
      
      alert(message);
      setNewFriendEmail(""); 
      fetchData(); 
    } catch (error: any) { 
      alert(error.message); 
    }
  };

  const displayedRooms = 
    activeTab === 'PUBLIC_MINE' ? rooms.filter(r => r.isPublic) :
    activeTab === 'PRIVATE_MINE' ? rooms.filter(r => !r.isPublic) : 
    rooms; 

  const tabStyle = (tabName: string) => ({
    flex: 1, textAlign: 'center' as const, padding: '10px 5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
    color: activeTab === tabName ? '#4CAF50' : '#888',
    borderBottom: activeTab === tabName ? '3px solid #4CAF50' : 'none'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <div onClick={() => setActiveTab('PUBLIC_ALL')} style={tabStyle('PUBLIC_ALL')}>🌐 전체오픈</div>
        <div onClick={() => setActiveTab('PUBLIC_MINE')} style={tabStyle('PUBLIC_MINE')}>💬 내오픈</div>
        <div onClick={() => setActiveTab('PRIVATE_MINE')} style={tabStyle('PRIVATE_MINE')}>🔒 내비밀</div>
        <div onClick={() => setActiveTab('FRIENDS')} style={tabStyle('FRIENDS')}>👥 친구</div>
      </div>
      
      {activeTab === 'FRIENDS' ? (
        <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
          <input 
            type="email" placeholder="추가할 친구의 이메일" value={newFriendEmail} 
            onChange={(e) => setNewFriendEmail(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button onClick={() => addFriend()} style={{ padding: '10px 15px', marginLeft: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>추가</button>
        </div>
      ) : (
        <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
          <input 
            type="text" 
            placeholder={activeTab === 'PRIVATE_MINE' ? "새로운 1:1 비밀방 이름" : "새로운 오픈방 이름"} 
            value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button onClick={createRoom} style={{ padding: '10px 15px', marginLeft: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>만들기</button>
        </div>
      )}

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {activeTab === 'FRIENDS' ? (
          <div style={{ padding: '15px' }}>
            {receivedRequests.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>🔔 나를 추가한 친구</h4>
                {receivedRequests.map((friend, idx) => (
                  <div key={idx} style={{ padding: '10px', backgroundColor: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>👤 <b>{friend.nickname}</b></span>
                    <button 
                      onClick={() => addFriend(friend.email)} 
                      style={{ padding: '5px 10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      맞친 맺기
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>내 친구 목록</h4>
            {friends.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>아직 등록된 친구가 없습니다.</div>
            ) : (
              friends.map((friend, index) => (
                <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
                  👤 <b>{friend.nickname}</b> <span style={{fontSize: '11px', color: '#999'}}>({friend.email})</span>
                </div>
              ))
            )}
          </div>
        ) : (
          displayedRooms.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>목록이 비어있습니다.</div>
          ) : (
            displayedRooms.map(room => (
              <div 
                key={room.id} onClick={() => handleRoomClick(room.id)}
                style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                    {room.isPublic ? '🌐' : '🔒'} {room.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#999' }}>입장 ❯</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  👥 {room.members && room.members.length > 0 ? room.members.join(', ') : '참가자 없음'}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default RoomList;