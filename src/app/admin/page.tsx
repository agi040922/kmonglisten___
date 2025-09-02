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

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminPage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingMessage, setEditingMessage] = useState<VoiceMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
          <p className="mt-2 text-gray-600">음성 메시지를 관리하고 텍스트를 편집할 수 있습니다.</p>
        </div>

        {/* 필터 및 통계 */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              상태별 필터
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="processing">처리중</option>
              <option value="completed">완료</option>
              <option value="error">오류</option>
            </select>
          </div>

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
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
