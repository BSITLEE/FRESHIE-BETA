import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { ChildProfile, AVATAR_EMOJIS } from '../utils/mockData';

interface ChildProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ChildProfile[];
  onAddChild: (name: string, avatar: string, age: number) => void;
  onEditChild: (id: string, name: string, age: number) => void;
  onDeleteChild: (id: string) => void;
  title?: string;
  description?: string;
  requireAtLeastOneChild?: boolean;
}

export function ChildProfileModal({
  isOpen,
  onClose,
  children,
  onAddChild,
  onEditChild,
  onDeleteChild,
  title,
  description,
  requireAtLeastOneChild = false,
}: ChildProfileModalProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('4');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_EMOJIS[0]);

  if (!isOpen) return null;

  const handleAddChild = () => {
    const parsedAge = Number(age);
    if (name.trim() && Number.isFinite(parsedAge) && parsedAge >= 2 && parsedAge <= 12) {
      onAddChild(name.trim(), selectedAvatar, parsedAge);
      setName('');
      setAge('4');
      setSelectedAvatar(AVATAR_EMOJIS[0]);
      setMode('list');
    }
  };

  const handleEditChild = () => {
    const parsedAge = Number(age);
    if (editingId && name.trim() && Number.isFinite(parsedAge) && parsedAge >= 2 && parsedAge <= 12) {
      onEditChild(editingId, name.trim(), parsedAge);
      setName('');
      setAge('4');
      setEditingId(null);
      setMode('list');
    }
  };

  const startEdit = (child: ChildProfile) => {
    setEditingId(child.id);
    setName(child.name);
    setAge(String(child.age ?? 4));
    setMode('edit');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-8 border-yellow-400"
        style={{ fontFamily: "'Chelsea Market', cursive" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-3xl font-bold text-white">
            {mode === 'add' ? '➕ Add Child' : mode === 'edit' ? '✏️ Edit Child' : title ?? '👶 Manage Children'}
          </h2>
          {!requireAtLeastOneChild && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* content */}
        <div className="p-6 space-y-4">
          {mode === 'list' && (
            <>
              {description && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3 text-blue-800 text-sm">
                  {description}
                </div>
              )}
              {/* children list */}
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 flex items-center justify-between border-4 border-blue-200"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{child.avatar}</span>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{child.name}</p>
                        <p className="text-sm text-gray-600">
                          {child.progress.totalGamesPlayed} games played
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(child)}
                        className="border-2 border-blue-400 hover:bg-blue-100"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </Button>
                      {children.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDeleteChild(child.id)}
                          className="border-2 border-red-400 hover:bg-red-100"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* add new button?? */}
              <Button
                onClick={() => setMode('add')}
                className="w-full h-16 text-2xl bg-green-600 hover:bg-green-700 rounded-full"
              >
                <UserPlus className="w-6 h-6 mr-2" />
                Add New Child
              </Button>
            </>
          )}

          {(mode === 'add' || mode === 'edit') && (
            <div className="space-y-6">
              {/* for name input*/}
              <div>
                <Label htmlFor="child-name" className="text-xl text-gray-700 mb-2 block">
                  Child's Name
                </Label>
                <Input
                  id="child-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name..."
                  className="h-14 text-xl border-4 border-blue-300 rounded-2xl"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="child-age" className="text-xl text-gray-700 mb-2 block">
                  Child's Age
                </Label>
                <Input
                  id="child-age"
                  type="number"
                  min={2}
                  max={12}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age (2-12)"
                  className="h-14 text-xl border-4 border-blue-300 rounded-2xl"
                />
              </div>

              {/* avatar selection (only for add mode) */}
              {mode === 'add' && (
                <div>
                  <Label className="text-xl text-gray-700 mb-3 block">
                    Choose an Avatar
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {AVATAR_EMOJIS.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`
                          text-5xl p-4 rounded-2xl border-4 transition-all
                          ${selectedAvatar === avatar
                            ? 'border-green-500 bg-green-100 scale-110'
                            : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setMode('list');
                    setName('');
                    setAge('4');
                    setEditingId(null);
                  }}
                  variant="outline"
                  className="flex-1 h-14 text-xl border-4 border-gray-400 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={mode === 'add' ? handleAddChild : handleEditChild}
                  disabled={!name.trim() || !age.trim()}
                  className="flex-1 h-14 text-xl bg-green-600 hover:bg-green-700 rounded-full"
                >
                  {mode === 'add' ? 'Add Child' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
