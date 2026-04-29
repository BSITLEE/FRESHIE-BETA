import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ChildProfileModal } from '../components/ChildProfileModal';
import { AchievementBadge } from '../components/AchievementBadge';
import { useUserStore } from '../utils/useUserStore';
import { useAssignmentStore } from '../utils/useAssignmentStore';
import { Play, BarChart3, LogOut, Users, Settings, BookOpen, CheckCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import {
  createStudentForParent,
  fetchAchievementHistoryForStudent,
  fetchAchievementsForStudents,
  deleteStudentProfile,
  fetchParentStudents,
  fetchProgressForStudents,
  fetchTeacherStudents,
  updateStudentProfile,
} from '../utils/supabaseApi';
import { progressRowToChildProfile } from '../utils/supabaseModels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import backgroundImg from '../../artassets/background.webp';
import { formatLocalDateTime } from '../utils/time';

export default function MenuPage() {
  const navigate = useNavigate();
  const { userState, logout, switchChild, addChild, editChild, deleteChild, login } = useUserStore();
  const { getAssignmentsForChild } = useAssignmentStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false);
  const [childAssignments, setChildAssignments] = useState<Awaited<ReturnType<typeof getAssignmentsForChild>>>([]);
  const [achievementHistory, setAchievementHistory] = useState<Array<{ id: string; icon: string; date_earned: string }>>([]);
  const PARENT_ONBOARDING_KEY = 'freshie-parent-onboarding-email';

  useEffect(() => {
    if (!userState.role) {
      navigate('/', { replace: true });
    }
  }, [navigate, userState.role]);

  useEffect(() => {
    const run = async () => {
      if (!userState.currentChild) {
        setChildAssignments([]);
        setAchievementHistory([]);
        return;
      }
      try {
        const items = await getAssignmentsForChild(userState.currentChild.id);
        setChildAssignments(items);
        if (isSupabaseConfigured && supabase) {
          const earned = await fetchAchievementHistoryForStudent(userState.currentChild.id);
          setAchievementHistory(earned.map((e) => ({ id: e.id, icon: e.icon, date_earned: e.date_earned })));
        }
      } catch (e) {
        console.error(e);
        setChildAssignments([]);
      }
    };
    run();
  }, [getAssignmentsForChild, userState.currentChild?.id]);

  useEffect(() => {
    if (!(isSupabaseConfigured && supabase) || !userState.currentChild) return;
    const childId = userState.currentChild.id;
    const refresh = async () => {
      const items = await getAssignmentsForChild(childId);
      setChildAssignments(items);
      const earned = await fetchAchievementHistoryForStudent(childId);
      setAchievementHistory(earned.map((e) => ({ id: e.id, icon: e.icon, date_earned: e.date_earned })));
    };
    const channel = supabase
      .channel(`menu-live-${childId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments', filter: `assigned_to=eq.${childId}` }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_achievements', filter: `student_id=eq.${childId}` }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [getAssignmentsForChild, userState.currentChild?.id]);

  useEffect(() => {
    const pendingEmail = localStorage.getItem(PARENT_ONBOARDING_KEY)?.trim().toLowerCase();
    const currentEmail = (userState.email ?? '').trim().toLowerCase();
    const shouldShowOnboarding =
      userState.role === 'parent' &&
      userState.children.length === 0 &&
      !!pendingEmail &&
      pendingEmail === currentEmail;

    setIsOnboardingFlow(shouldShowOnboarding);
    setShowProfileModal(shouldShowOnboarding);
  }, [userState.children.length, userState.email, userState.role]);

  const refreshChildrenFromDb = async (role: 'parent' | 'teacher', userId: string) => {
    const students = role === 'teacher' ? await fetchTeacherStudents(userId) : await fetchParentStudents(userId);
    const progress = await fetchProgressForStudents(students.map((s) => s.id));
    const achievementMap = await fetchAchievementsForStudents(students.map((s) => s.id));
    const children = students.map((s) => progressRowToChildProfile(s, progress[s.id] ?? null, achievementMap[s.id] ?? []));
    login(userState.email ?? '', role, children);
  };

  const handleStartAssignment = (
    assignmentId: string,
    activityType: 'color-quiz' | 'shape-quiz' | 'drag-match',
    questionCount?: number | null
  ) => {
    const routes = {
      'color-quiz': '/color-quiz',
      'shape-quiz': '/shape-quiz',
      'drag-match': '/drag-match',
    };

    navigate(routes[activityType], {
      state: {
        assignmentId,
        assignedQuestionCount: questionCount ?? null,
      },
    });
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem(PARENT_ONBOARDING_KEY);
      logout();
      navigate('/', { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== '/') window.location.assign('/');
      }, 0);
    }
  };

  const getDashboardPathByRole = () => {
    if (userState.role === 'teacher') return '/teacher-dashboard';
    if (userState.role === 'admin') return '/admin-dashboard';
    return '/parent-dashboard';
  };

  const handleAddChild = async (name: string, avatar: string, age: number) => {
    if (isSupabaseConfigured && supabase && (userState.role === 'parent' || userState.role === 'teacher')) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error('Missing authenticated user');
      await createStudentForParent({ parentId: userId, name, age });
      await refreshChildrenFromDb(userState.role, userId);
      if (userState.role === 'parent') {
        localStorage.removeItem(PARENT_ONBOARDING_KEY);
        setIsOnboardingFlow(false);
      }
      return;
    }
    addChild(name, avatar, age);
    if (userState.role === 'parent') {
      localStorage.removeItem(PARENT_ONBOARDING_KEY);
      setIsOnboardingFlow(false);
    }
  };

  const handleEditChild = async (id: string, name: string, age: number) => {
    if (isSupabaseConfigured && supabase && userState.role === 'parent') {
      const { data: authData } = await supabase.auth.getUser();
      const parentId = authData.user?.id;
      if (!parentId) throw new Error('Missing authenticated parent');
      await updateStudentProfile({ studentId: id, name, age, parentId });
      await refreshChildrenFromDb('parent', parentId);
      return;
    }
    editChild(id, name, age);
  };

  const handleDeleteChild = async (id: string) => {
    if (isSupabaseConfigured && supabase && userState.role === 'parent') {
      const { data: authData } = await supabase.auth.getUser();
      const parentId = authData.user?.id;
      if (!parentId) throw new Error('Missing authenticated parent');
      await deleteStudentProfile({ studentId: id, parentId });
      await refreshChildrenFromDb('parent', parentId);
      return;
    }
    deleteChild(id);
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-amber-500">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-green-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Welcome to Safari!
            </h1>
            {userState.currentChild && (
              <p className="text-lg md:text-xl text-amber-700 mt-2">
                {userState.currentChild.avatar} Hi, {userState.currentChild.name}!
              </p>
            )}
          </div>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="lg"
                className="rounded-full w-14 h-14 md:w-16 md:h-16 border-4 border-green-500 bg-white hover:bg-green-50 text-3xl md:text-4xl"
              >
                {userState.currentChild?.avatar || 'U'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {userState.currentChild?.name}'s Profile
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {userState.children.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    <Users className="w-3 h-3 inline mr-1" />
                    Switch Child
                  </DropdownMenuLabel>
                  {userState.children.map(child => (
                    <DropdownMenuItem 
                      key={child.id}
                      onClick={() => switchChild(child.id)}
                      className={child.id === userState.currentChild?.id ? 'bg-green-100' : ''}
                    >
                      {child.avatar} {child.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {(userState.role === 'parent' || userState.role === 'teacher' || userState.role === 'admin') && (
                <>
                  <DropdownMenuItem onClick={() => navigate(getDashboardPathByRole())}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Children
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Child Profile Modal */}
      <ChildProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          if (isOnboardingFlow) return;
          setShowProfileModal(false);
        }}
        children={userState.children}
        onAddChild={(name, avatar, age) => {
          handleAddChild(name, avatar, age).catch((e) => {
            console.error(e);
            alert('Failed to add child profile. Please try again.');
          });
        }}
        onEditChild={(id, name, age) => {
          handleEditChild(id, name, age).catch((e) => {
            console.error(e);
            alert('Failed to update child profile. Please try again.');
          });
        }}
        onDeleteChild={(id) => {
          handleDeleteChild(id).catch((e) => {
            console.error(e);
            alert('Failed to delete child profile. Please try again.');
          });
        }}
        title={isOnboardingFlow ? 'Welcome, Parent!' : undefined}
        description={
          isOnboardingFlow
            ? 'Create your first child profile to start playing and tracking progress. You can manage more child profiles anytime from Manage Children.'
            : undefined
        }
        requireAtLeastOneChild={isOnboardingFlow}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Content - Only show if children exist */}
        {userState.children.length > 0 && (
          <>
        {/* Assigned Activities */}
        {childAssignments.length > 0 && (
          <Card className="border-4 border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 shadow-2xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-blue-700" />
                <h2 className="text-2xl md:text-3xl font-bold text-blue-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Activities Assigned by Your Teacher
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childAssignments.map((assignment) => (
                  <Card key={assignment.id} className="border-3 border-blue-400 bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        {assignment.activityName}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Assigned by {assignment.assignedBy}
                      </CardDescription>
                      {assignment.questionCount ? (
                        <CardDescription className="text-xs text-blue-700">
                          Questions: {assignment.questionCount}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() =>
                          handleStartAssignment(
                            assignment.id,
                            assignment.activityType,
                            assignment.questionCount ?? null
                          )
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Activity
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary CTA */}
        <Card className="border-4 border-green-600 bg-gradient-to-br from-green-100 to-amber-100 shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-green-800 mb-6" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Ready to Learn?
            </h2>
            <Button 
              size="lg"
              onClick={() => navigate('/game-options')}
              className="h-20 md:h-24 px-12 md:px-16 text-2xl md:text-3xl bg-green-600 hover:bg-green-700 rounded-full shadow-xl transform hover:scale-105 transition-transform animate-pulse"
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 mr-3" />
              Start Learning!
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-4 border-amber-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl md:text-2xl text-amber-700">Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl md:text-5xl font-bold text-green-800">
                {userState.currentChild?.progress.totalGamesPlayed || 0}
              </p>
              {(userState.currentChild?.progress.totalGamesPlayed || 0) === 0 && (
                <p className="text-sm text-gray-600 mt-2">Start your first game!</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-blue-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl md:text-2xl text-blue-700">Color Quiz Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl md:text-5xl font-bold text-green-800">
                {userState.currentChild?.progress.colorQuizScore || 0}%
              </p>
              {(userState.currentChild?.progress.colorQuizScore || 0) === 0 && (
                <p className="text-sm text-gray-600 mt-2">Try the color quiz!</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl md:text-2xl text-purple-700">Shape Quiz Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl md:text-5xl font-bold text-green-800">
                {userState.currentChild?.progress.shapeQuizScore || 0}%
              </p>
              {(userState.currentChild?.progress.shapeQuizScore || 0) === 0 && (
                <p className="text-sm text-gray-600 mt-2">Try the shape quiz!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card className="border-4 border-yellow-400 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-yellow-700">Your Badges</CardTitle>
            <CardDescription className="text-base md:text-lg">
              {userState.currentChild?.progress.badges.length === 0 
                ? 'Play games to earn your first badge!' 
                : 'Keep playing to earn more rewards!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
              {userState.currentChild?.progress.badges.length > 0 ? (
                userState.currentChild.progress.badges.map((badge, index) => (
                  <AchievementBadge
                    key={index}
                    type={badge}
                    size="lg"
                    animated={true}
                  />
                ))
              ) : (
                <div className="w-full text-center py-8">
                  <p className="text-gray-400 text-lg">No badges yet</p>
                  <p className="text-gray-500 text-sm mt-2">Score 80% or higher to earn your first badge!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-4 border-indigo-400 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-indigo-700">Achievement History</CardTitle>
            <CardDescription className="text-base md:text-lg">
              Saved for this child profile over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievementHistory.length === 0 ? (
              <p className="text-gray-500">No achievement history yet.</p>
            ) : (
              <div className="space-y-2">
                {achievementHistory.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 bg-gray-50 flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs text-gray-600">{formatLocalDateTime(item.date_earned)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  );
}