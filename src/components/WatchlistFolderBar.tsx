import React, { useState } from 'react';
import { WatchlistFolder } from '../types';
import {
  Folder,
  FolderPlus,
  Star,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface WatchlistFolderBarProps {
  folders: WatchlistFolder[];
  selectedFolderId: string; // 'ALL' or specific folder id
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  folderCounts: Record<string, number>;
  totalWatchlistCount: number;
}

const PRESET_COLORS = [
  { name: '골드', value: 'amber', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { name: '에메랄드', value: 'emerald', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { name: '블루', value: 'blue', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: '바이올렛', value: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
  { name: '로즈', value: 'rose', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const WatchlistFolderBar: React.FC<WatchlistFolderBarProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  folderCounts,
  totalWatchlistCount,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('amber');

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editNameDraft, setEditNameDraft] = useState('');

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFolderName('');
    setNewFolderColor('amber');
  };

  const handleConfirmCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleStartEdit = (folder: WatchlistFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditNameDraft(folder.name);
  };

  const handleConfirmEdit = (folderId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editNameDraft.trim()) {
      onRenameFolder(folderId, editNameDraft.trim());
    }
    setEditingFolderId(null);
  };

  const handleDelete = (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`'${folderName}' 폴더를 삭제하시겠습니까?\n이 폴더에 담긴 관심 종목들은 '기본 관심종목' 폴더로 안전하게 이동됩니다.`)) {
      onDeleteFolder(folderId);
    }
  };

  return (
    <div
      id="watchlist-folder-bar"
      className="bg-white rounded-xl border border-amber-200/80 p-3.5 sm:p-4 mb-4 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">관심기업 전용 폴더 관리</h3>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                총 {totalWatchlistCount}개 담김
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              별표(⭐)를 누른 기업들이 저장되는 폴더입니다. 원하는 테마별 폴더를 자유롭게 만들어 분류해보세요.
            </p>
          </div>
        </div>

        {!isCreating && (
          <button
            type="button"
            id="btn-create-folder"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
            <span>새 관심 폴더 만들기</span>
          </button>
        )}
      </div>

      {/* New Folder Creation Inline Box */}
      {isCreating && (
        <form
          onSubmit={handleConfirmCreate}
          className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-wrap items-center gap-2.5 text-xs"
        >
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
            새 폴더명:
          </span>
          <input
            type="text"
            id="input-new-folder-name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="예: 반도체 주도주, 고배당 유망주 등"
            className="px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1 min-w-[180px]"
            autoFocus
          />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">색상:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewFolderColor(c.value)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  c.value === 'amber'
                    ? 'bg-amber-400'
                    : c.value === 'emerald'
                    ? 'bg-emerald-400'
                    : c.value === 'blue'
                    ? 'bg-blue-400'
                    : c.value === 'purple'
                    ? 'bg-purple-400'
                    : 'bg-rose-400'
                } ${newFolderColor === c.value ? 'scale-115 border-slate-900' : 'border-transparent opacity-70'}`}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>생성</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>취소</span>
            </button>
          </div>
        </form>
      )}

      {/* Folders List Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
        {/* All Watchlist items tab */}
        <button
          type="button"
          id="folder-chip-all"
          onClick={() => onSelectFolder('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedFolderId === 'ALL'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>전체 관심종목</span>
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedFolderId === 'ALL' ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {totalWatchlistCount}
          </span>
        </button>

        {/* Individual Folders */}
        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          const count = folderCounts[folder.id] || 0;
          const isEditing = editingFolderId === folder.id;

          if (isEditing) {
            return (
              <form
                key={folder.id}
                onSubmit={(e) => handleConfirmEdit(folder.id, e)}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-400 rounded-lg shadow-xs"
              >
                <input
                  type="text"
                  value={editNameDraft}
                  onChange={(e) => setEditNameDraft(e.target.value)}
                  className="px-1.5 py-0.5 text-xs text-slate-900 font-semibold focus:outline-none w-28"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                  title="저장"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFolderId(null)}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded transition-colors"
                  title="취소"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            );
          }

          return (
            <div
              key={folder.id}
              id={`folder-chip-${folder.id}`}
              onClick={() => onSelectFolder(folder.id)}
              className={`group relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Folder
                className={`w-3.5 h-3.5 ${
                  isSelected
                    ? 'text-amber-400 fill-amber-400'
                    : folder.color === 'emerald'
                    ? 'text-emerald-500 fill-emerald-100'
                    : folder.color === 'blue'
                    ? 'text-blue-500 fill-blue-100'
                    : folder.color === 'purple'
                    ? 'text-purple-500 fill-purple-100'
                    : folder.color === 'rose'
                    ? 'text-rose-500 fill-rose-100'
                    : 'text-amber-500 fill-amber-100'
                }`}
              />
              <span>{folder.name}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>

              {/* Action buttons on folder chip (Edit/Delete) */}
              {folder.id !== 'default' && (
                <div
                  className={`flex items-center gap-0.5 ml-1 transition-opacity ${
                    isSelected ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => handleStartEdit(folder, e)}
                    className={`p-0.5 rounded hover:bg-white/20 transition-colors ${
                      isSelected ? 'text-slate-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="폴더 이름 수정"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(folder.id, folder.name, e)}
                    className={`p-0.5 rounded hover:bg-rose-500/20 transition-colors ${
                      isSelected ? 'text-rose-300 hover:text-rose-200' : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title="폴더 삭제"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
