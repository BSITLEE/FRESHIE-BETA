import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ChildProfileModal } from '../components/ChildProfileModal';
import { AchievementBadge } from '../components/AchievementBadge';
import { useUserStore } from '../utils/useUserStore';
import { useAssignmentStore } from '../utils/useAssignmentStore';
import { Play, BarChart3, User, LogOut, Users, Settings, BookOpen, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import backgroundImg from '../../artassets/background.png';

export default function MenuPage() {
  const navigate = useNavigate();
  const { userState, logout, switchChild, addChild, editChild, deleteChild } = useUserStore();
  const { getAssignmentsForChild, markCompleted } = useAssignmentStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const childAssignments = userState.currentChild
    ? getAssignmentsForChild(userState.currentChild.id)
    : [];

  const handleStartAssignment = (
    assignmentId: string,
    activityType: 'color-quiz' | 'shape-quiz' | 'drag-match'
  ) => {
    const routes = {
      'color-quiz': '/color-quiz',
      'shape-quiz': '/shape-quiz',
      'drag-match': '/drag-match',
    };

    // Mark as completed when they start
    if (userState.currentChild) {
      markCompleted(assignmentId, userState.currentChild.id);
    }

    navigate(routes[activityType]);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
                  <DropdownMenuItem onClick={() => navigate('/parent-dashboard')}>
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
        onClose={() => setShowProfileModal(false)}
        children={userState.children}
        onAddChild={addChild}
        onEditChild={editChild}
        onDeleteChild={deleteChild}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Empty State - No Children */}
        {userState.children.length === 0 && (
          <Card className="border-4 border-amber-500 bg-gradient-to-br from-amber-100 to-yellow-100 shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <User className="w-24 h-24 mx-auto text-amber-600 mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  No Child Profiles Yet
                </h2>
                <p className="text-lg md:text-xl text-amber-700 mb-6">
                  {userState.role === 'teacher'
                    ? 'Add student profiles to get started with assignments and tracking.'
                    : 'Add your children to start tracking their learning journey!'}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setShowProfileModal(true)}
                className="h-16 md:h-20 px-12 md:px-16 text-xl md:text-2xl bg-amber-600 hover:bg-amber-700 rounded-full shadow-xl transform hover:scale-105 transition-transform"
              >
                <Plus className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                Add {userState.role === 'teacher' ? 'Student' : 'Child'}
              </Button>
            </CardContent>
          </Card>
        )}

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
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleStartAssignment(assignment.id, assignment.activityType)}
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
        </>
        )}
      </div>
    </div>
  );
}