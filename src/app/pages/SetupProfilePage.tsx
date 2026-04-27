import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useUserStore } from '../utils/useUserStore';
import { AVATAR_EMOJIS } from '../utils/mockData';
import { motion } from 'motion/react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import backgroundImg from '../../artassets/background.png';
import logoImg from '../../artassets/freshielogo.png';

/**
 * Setup Profile Page - Post-Signup Child/Student Creation
 *
 * Shown immediately after signup to collect child profiles.
 * - Parents: Add child profiles (name + avatar)
 * - Teachers: Add student profiles or connect to existing students
 *
 * REQUIRED STEP: Users must add at least one child/student before proceeding.
 *
 * Database Integration:
 * - Will insert into `students` table with parent_id or teacher_id foreign key
 * - For teachers: Option to link to existing students via student_teacher junction table
 */

interface TempChild {
  id: string;
  name: string;
  avatar: string;
}

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userState, addChild } = useUserStore();

  // Get role from navigation state
  const role = location.state?.role || userState.role || 'parent';

  const [tempChildren, setTempChildren] = useState<TempChild[]>([]);
  const [newChildName, setNewChildName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_EMOJIS[0]);

  const handleAddChild = () => {
    if (!newChildName.trim()) return;

    const newChild: TempChild = {
      id: `temp-${Date.now()}`,
      name: newChildName.trim(),
      avatar: selectedAvatar,
    };

    setTempChildren([...tempChildren, newChild]);
    setNewChildName('');
    setSelectedAvatar(AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]);
  };

  const handleRemoveChild = (id: string) => {
    setTempChildren(tempChildren.filter(c => c.id !== id));
  };

  const handleFinish = () => {
    if (tempChildren.length === 0) {
      alert('Please add at least one child/student before continuing.');
      return;
    }

    // Add all children to the store
    // TODO: Replace with Supabase batch insert
    tempChildren.forEach(child => {
      addChild(child.name, child.avatar);
    });

    // Route based on role
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'teacher':
        navigate('/teacher-dashboard');
        break;
      case 'parent':
      default:
        navigate('/menu');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/20" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="shadow-2xl border-4 border-green-600 bg-white/95">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img
                src={logoImg}
                alt="Freshie's Safari Logo"
                className="w-32 h-auto"
                style={{
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            </div>
            <CardTitle className="text-3xl text-green-800">
              {role === 'teacher' ? 'Add Your Students' : 'Add Your Children'}
            </CardTitle>
            <CardDescription className="text-lg text-amber-700">
              {role === 'teacher'
                ? 'Create profiles for the students you teach'
                : 'Create profiles for each of your children'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add Child Form */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="space-y-2">
                <Label htmlFor="child-name" className="text-base">
                  {role === 'teacher' ? 'Student Name' : 'Child Name'}
                </Label>
                <Input
                  id="child-name"
                  type="text"
                  placeholder="Enter name"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChild()}
                  className="h-12 text-base border-2 border-green-300 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Choose Avatar</Label>
                <div className="grid grid-cols-10 gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`text-3xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                        selectedAvatar === emoji
                          ? 'border-green-600 bg-green-100 scale-110'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddChild}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add {role === 'teacher' ? 'Student' : 'Child'}
              </Button>
            </div>

            {/* Added Children List */}
            {tempChildren.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base text-gray-700">
                  Added {role === 'teacher' ? 'Students' : 'Children'} ({tempChildren.length})
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tempChildren.map((child) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{child.avatar}</span>
                        <span className="text-lg font-medium text-gray-800">{child.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveChild(child.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Message */}
            {tempChildren.length === 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ You must add at least one {role === 'teacher' ? 'student' : 'child'} to continue.
                </p>
              </div>
            )}

            {/* Finish Button */}
            <Button
              onClick={handleFinish}
              disabled={tempChildren.length === 0}
              className="w-full h-14 text-xl bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Dashboard
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>

            {/* Teacher Note */}
            {role === 'teacher' && (
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                <p className="text-sm text-purple-800">
                  💡 You can add more students later from your dashboard, or connect to existing student accounts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
