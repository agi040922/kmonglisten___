'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VoiceMessage {
  id: number;
  filename: string;
  original_filename: string;
  file_url: string;
  transcription: string;
  moderated_text: string;
  status: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface DisplayMessage {
  id: number;
  message_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminPage() {
  // 탭 관리
  const [activeTab, setActiveTab] = useState<'voice' | 'display'>('voice');
  
  // 음성 메시지 관련 상태
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingMessage, setEditingMessage] = useState<VoiceMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 전광판 메시지 관련 상태
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [displayLoading, setDisplayLoading] = useState(false);
  const [newDisplayMessage, setNewDisplayMessage] = useState('');
  const [editingDisplayMessage, setEditingDisplayMessage] = useState<DisplayMessage | null>(null);
  const [editDisplayText, setEditDisplayText] = useState('');

  // 메시지 목록 불러오기
  const fetchMessages = async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/admin/messages?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages);
        setPagination(data.pagination);
      } else {
        alert('메시지를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('메시지 로딩 오류:', error);
      alert('메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 수정
  const updateMessage = async (id: number, moderatedText: string, isApproved: boolean) => {
    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderatedText,
          isApproved,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 성공적으로 수정되었습니다.');
        setEditingMessage(null);
        fetchMessages(currentPage, selectedStatus);
      } else {
        alert(data.error || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('메시지 수정 오류:', error);
      alert('메시지 수정 중 오류가 발생했습니다.');
    }
  };

  // 메시지 삭제
  const deleteMessage = async (id: number) => {
    if (!confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 성공적으로 삭제되었습니다.');
        fetchMessages(currentPage, selectedStatus);
      } else {
        alert(data.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('메시지 삭제 오류:', error);
      alert('메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 모드 시작
  const startEditing = (message: VoiceMessage) => {
    setEditingMessage(message);
    setEditText(message.moderated_text || message.transcription || '');
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // 편집 저장
  const saveEdit = () => {
    if (!editingMessage) return;
    updateMessage(editingMessage.id, editText, true);
  };

  // 상태 변경 시 메시지 다시 불러오기
  useEffect(() => {
    setCurrentPage(1);
    fetchMessages(1, selectedStatus);
  }, [selectedStatus]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'display') {
      fetchDisplayMessages();
    }
  }, [activeTab]);

  // 페이지 변경
  const changePage = (page: number) => {
    setCurrentPage(page);
    fetchMessages(page, selectedStatus);
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 전광판 메시지 목록 불러오기
  const fetchDisplayMessages = async () => {
    setDisplayLoading(true);
    try {
      const response = await fetch('/api/display/messages');
      const data = await response.json();
      
      if (response.ok) {
        setDisplayMessages(data.messages || []);
      } else {
        alert('전광판 메시지를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전광판 메시지 로딩 오류:', error);
      alert('전광판 메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setDisplayLoading(false);
    }
  };

  // 새 전광판 메시지 추가
  const addDisplayMessage = async () => {
    if (!newDisplayMessage.trim()) {
      alert('메시지 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/display/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: newDisplayMessage.trim(),
          display_order: displayMessages.length
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 성공적으로 추가되었습니다.');
        setNewDisplayMessage('');
        fetchDisplayMessages();
      } else {
        alert(data.error || '메시지 추가 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전광판 메시지 추가 오류:', error);
      alert('메시지 추가 중 오류가 발생했습니다.');
    }
  };

  // 전광판 메시지 수정
  const updateDisplayMessage = async (id: number, messageText: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/display/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: messageText,
          is_active: isActive,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 성공적으로 수정되었습니다.');
        setEditingDisplayMessage(null);
        fetchDisplayMessages();
      } else {
        alert(data.error || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전광판 메시지 수정 오류:', error);
      alert('메시지 수정 중 오류가 발생했습니다.');
    }
  };

  // 전광판 메시지 삭제
  const deleteDisplayMessage = async (id: number) => {
    if (!confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/display/messages/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 성공적으로 삭제되었습니다.');
        fetchDisplayMessages();
      } else {
        alert(data.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전광판 메시지 삭제 오류:', error);
      alert('메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 전광판 메시지 편집 시작
  const startEditingDisplay = (message: DisplayMessage) => {
    setEditingDisplayMessage(message);
    setEditDisplayText(message.message_text);
  };

  // 전광판 메시지 편집 취소
  const cancelEditingDisplay = () => {
    setEditingDisplayMessage(null);
    setEditDisplayText('');
  };

  // 전광판 메시지 편집 저장
  const saveDisplayEdit = () => {
    if (!editingDisplayMessage) return;
    updateDisplayMessage(editingDisplayMessage.id, editDisplayText, editingDisplayMessage.is_active);
  };

  // 전광판 메시지 활성화/비활성화 토글
  const toggleDisplayMessageActive = async (message: DisplayMessage) => {
    updateDisplayMessage(message.id, message.message_text, !message.is_active);
  };

  // 음성 메시지를 전광판으로 전송
  const sendToDisplay = async (message: VoiceMessage) => {
    const textToSend = message.moderated_text || message.transcription;
    
    if (!textToSend) {
      alert('전송할 텍스트가 없습니다.');
      return;
    }

    if (!confirm(`"${textToSend}"를 전광판에 추가하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/display/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: textToSend,
          display_order: 0
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('메시지가 전광판에 성공적으로 추가되었습니다!');
        // 전광판 탭으로 전환하고 메시지 새로고침
        setActiveTab('display');
        fetchDisplayMessages();
      } else {
        alert(data.error || '전광판 전송 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전광판 전송 오류:', error);
      alert('전광판 전송 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마음의 전화 관리자</h1>
          <p className="mt-2 text-gray-600">음성 메시지와 전광판 메시지를 관리할 수 있습니다.</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('voice')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'voice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              음성 메시지 관리
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'display'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              전광판 메시지 관리
            </button>
          </nav>
        </div>

        {/* 음성 메시지 관리 탭 */}
        {activeTab === 'voice' && (
          <>
            {/* 필터 및 통계 */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {pagination && (
                <div className="text-sm text-gray-500">
                  총 {pagination.totalCount}개의 메시지
                </div>
              )}
            </div>

        {/* 메시지 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {messages.map((message) => (
                <li key={message.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        {message.is_approved && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            승인됨
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>

                      {/* 원본 텍스트 */}
                      {message.transcription && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">원본 텍스트:</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {message.transcription}
                          </p>
                        </div>
                      )}

                      {/* 검열된 텍스트 */}
                      {message.moderated_text && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">검열된 텍스트:</h4>
                          {editingMessage?.id === message.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                                rows={4}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveEdit}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                              {message.moderated_text}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 오디오 플레이어 */}
                      {message.file_url && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">음성 파일:</h4>
                          <audio controls className="w-full max-w-md">
                            <source src={message.file_url} type="audio/wav" />
                            브라우저가 오디오를 지원하지 않습니다.
                          </audio>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {editingMessage?.id !== message.id && (
                        <>
                          <button
                            onClick={() => startEditing(message)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                          >
                            편집
                          </button>
                          {(message.moderated_text || message.transcription) && (
                            <button
                              onClick={() => sendToDisplay(message)}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                              title="이 메시지를 전광판에 추가"
                            >
                              📺 전광판으로
                            </button>
                          )}
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">메시지가 없습니다.</p>
              </div>
            )}
          </div>
        )}

            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{((currentPage - 1) * 10) + 1}</span>
                      {' - '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, pagination.totalCount)}
                      </span>
                      {' / '}
                      <span className="font-medium">{pagination.totalCount}</span>
                      {' 결과'}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => changePage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => changePage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => changePage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 전광판 메시지 관리 탭 */}
        {activeTab === 'display' && (
          <>
            {/* 새 메시지 추가 */}
            <div className="mb-6 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 전광판 메시지 추가</h3>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    value={newDisplayMessage}
                    onChange={(e) => setNewDisplayMessage(e.target.value)}
                    placeholder="전광판에 표시할 메시지를 입력하세요..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                    rows={3}
                  />
                </div>
                <div>
                  <button
                    onClick={addDisplayMessage}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 h-full"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 전광판 메시지 목록 */}
            {displayLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {displayMessages.map((message) => (
                    <li key={message.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              message.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {message.is_active ? '활성' : '비활성'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(message.created_at)}
                            </span>
                          </div>

                          {/* 메시지 텍스트 */}
                          <div className="mb-3">
                            {editingDisplayMessage?.id === message.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editDisplayText}
                                  onChange={(e) => setEditDisplayText(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                                  rows={3}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={saveDisplayEdit}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEditingDisplay}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-lg text-gray-900 bg-gray-50 p-4 rounded">
                                {message.message_text}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex flex-col space-y-2 ml-4">
                          {editingDisplayMessage?.id !== message.id && (
                            <>
                              <button
                                onClick={() => startEditingDisplay(message)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                              >
                                편집
                              </button>
                              <button
                                onClick={() => toggleDisplayMessageActive(message)}
                                className={`px-3 py-1 text-white text-xs font-medium rounded ${
                                  message.is_active 
                                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {message.is_active ? '비활성화' : '활성화'}
                              </button>
                              <button
                                onClick={() => deleteDisplayMessage(message.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {displayMessages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">전광판 메시지가 없습니다.</p>
                  </div>
                )}
              </div>
            )}

            {/* 전광판 미리보기 링크 */}
            <div className="mt-6 text-center">
              <Link
                href="/displayscreen"
                target="_blank"
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                📺 전광판 미리보기
              </Link>
            </div>
          </>
        )}

        {/* 홈으로 돌아가기 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            ← 메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
