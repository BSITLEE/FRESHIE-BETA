import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Users, BookOpen, TrendingUp, Award, Plus, Check, Link2 } from 'lucide-react';
import backgroundImg from '../../artassets/background.png';
import { AVATAR_EMOJIS } from '../utils/mockData';
import { useAssignmentStore } from '../utils/useAssignmentStore';
import { useUserStore } from '../utils/useUserStore';
import { Input } from '../components/ui/input';

/**
 * Teacher Dashboard - Student Management & Assignment System
 *
 * Features:
 * - View all students assigned to the teacher
 * - Add new students directly (creates student profile)
 * - Connect to existing students (links to parent-created profiles)
 * - Assign activities to students
 * - Monitor class performance analytics
 *
 * Database Integration:
 * - Students list from `students` table via `student_teacher` junction
 * - Class stats calculated from `game_results` table
 * - Assignments stored in `assignments` table
 */

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userState, addChild } = useUserStore();
  const { createAssignment } = useAssignmentStore();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    type: 'color-quiz' | 'shape-quiz' | 'drag-match';
    name: string;
  } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentAvatar, setNewStudentAvatar] = useState('🦁');

  // Connection feature state
  const [connectStudentEmail, setConnectStudentEmail] = useState('');
  const [connectStudentCode, setConnectStudentCode] = useState('');

  // Use teacher's students from userState (database-driven)
  const students = userState.children || [];

  const classStats = {
    totalStudents: students.length,
    averageColorScore: students.length > 0
      ? Math.round(students.reduce((sum, child) => sum + child.progress.colorQuizScore, 0) / students.length)
      : 0,
    averageShapeScore: students.length > 0
      ? Math.round(students.reduce((sum, child) => sum + child.progress.shapeQuizScore, 0) / students.length)
      : 0,
    totalGamesPlayed: students.reduce((sum, child) => sum + child.progress.totalGamesPlayed, 0),
  };

  const handleOpenAssignDialog = (
    type: 'color-quiz' | 'shape-quiz' | 'drag-match',
    name: string
  ) => {
    setSelectedActivity({ type, name });
    setSelectedStudents([]);
    setShowAssignDialog(true);
  };

  const handleAssignActivity = () => {
    if (selectedActivity && selectedStudents.length > 0) {
      createAssignment(
        selectedActivity.type,
        selectedActivity.name,
        userState.email || 'Teacher',
        selectedStudents
      );
      setShowAssignDialog(false);
      setSelectedActivity(null);
      setSelectedStudents([]);
      alert(`${selectedActivity.name} assigned to ${selectedStudents.length} student(s)!`);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((child) => child.id));
    }
  };

  /**
   * Add New Student (Teacher-Created Profile)
   * Creates a brand new student profile owned by the teacher.
   *
   * Database Integration:
   * - Insert into `students` table with `created_by` = teacher's user ID
   * - Also insert into `student_teacher` junction table to link teacher to student
   */
  const handleAddStudent = () => {
    if (newStudentName.trim() && newStudentAge.trim()) {
      // TODO: Replace with Supabase insert
      // const { data, error } = await supabase.from('students').insert({
      //   name: newStudentName.trim(),
      //   age: parseInt(newStudentAge),
      //   avatar: newStudentAvatar,
      //   created_by: userState.id,
      // }).select().single();
      //
      // await supabase.from('student_teacher').insert({
      //   student_id: data.id,
      //   teacher_id: userState.id,
      // });

      addChild(newStudentName.trim(), newStudentAvatar);
      setNewStudentName('');
      setNewStudentAge('');
      setNewStudentAvatar('🦁');
      setShowAddStudentDialog(false);
      alert(`Student added successfully!`);
    }
  };

  /**
   * Connect to Existing Student (Parent-Created Profile)
   * Links a teacher to a student that was created by a parent.
   *
   * Database Integration:
   * - Search `students` table by parent email or unique student code
   * - Insert into `student_teacher` junction table to create relationship
   * - Teacher can now see student's progress and assign activities
   */
  const handleConnectStudent = async () => {
    // TODO: Implement Supabase connection logic
    // const { data: student, error } = await supabase
    //   .from('students')
    //   .select('*, users!parent_id(email)')
    //   .or(`users.email.eq.${connectStudentEmail},id.eq.${connectStudentCode}`)
    //   .single();
    //
    // if (error || !student) {
    //   alert('Student not found. Please check the email or code.');
    //   return;
    // }
    //
    // await supabase.from('student_teacher').insert({
    //   student_id: student.id,
    //   teacher_id: userState.id,
    // });

    setConnectStudentEmail('');
    setConnectStudentCode('');
    setShowAddStudentDialog(false);
    alert('Student connection feature will be available after Supabase integration.');
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
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-amber-500">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
            className="rounded-full w-12 h-12 md:w-14 md:h-14 border-3 border-green-500"
          >
            <ArrowLeft className="w-6 h-6 md:w-7 md:h-7" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Teacher Dashboard
            </h1>
            <p className="text-base md:text-lg text-amber-700">
              Manage and monitor your class progress
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Class Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-4 border-blue-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-lg">Total Students</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-800">
                {classStats.totalStudents}
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-pink-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-pink-600" />
                <CardTitle className="text-lg">Avg Color Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-pink-800">
                {classStats.averageColorScore}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-lg">Avg Shape Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-800">
                {classStats.averageShapeScore}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-green-400 bg-white/95 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-green-600" />
                <CardTitle className="text-lg">Total Games</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-800">
                {classStats.totalGamesPlayed}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Student Progress Table */}
        <Card className="border-4 border-amber-400 bg-white/95 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Student Progress Overview</CardTitle>
                <CardDescription>Monitor individual student performance</CardDescription>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowAddStudentDialog(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Students Yet</h3>
                <p className="text-gray-600 mb-6">
                  Add students to start tracking their progress and assigning activities.
                </p>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowAddStudentDialog(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Student
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                <div 
                  key={student.id}
                  className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-3 border-blue-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl border-3 border-blue-300">
                        {student.avatar}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {student.name}, {student.age} years old
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student.progress.totalGamesPlayed} games played
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {student.progress.badges.slice(0, 3).map((badge, index) => (
                        <div 
                          key={index}
                          className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center text-2xl border-2 border-yellow-400"
                        >
                          {badge}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Color Quiz</span>
                        <span className="font-bold text-pink-600">
                          {student.progress.colorQuizScore}%
                        </span>
                      </div>
                      <Progress value={student.progress.colorQuizScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Shape Quiz</span>
                        <span className="font-bold text-purple-600">
                          {student.progress.shapeQuizScore}%
                        </span>
                      </div>
                      <Progress value={student.progress.shapeQuizScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Drag & Match</span>
                        <span className="font-bold text-green-600">
                          {student.progress.dragMatchScore}%
                        </span>
                      </div>
                      <Progress value={student.progress.dragMatchScore} className="h-2" />
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Assignment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-4 border-green-400 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                <BookOpen className="inline w-6 h-6 mr-2" />
                Assign Activities
              </CardTitle>
              <CardDescription>Recommend games to students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg border-2 border-pink-300">
                <h4 className="font-bold text-lg mb-2">Color Quiz</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Help students learn and identify different colors
                </p>
                <Button
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  onClick={() => handleOpenAssignDialog('color-quiz', 'Color Quiz')}
                >
                  Assign to Students
                </Button>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                <h4 className="font-bold text-lg mb-2">Shape Quiz</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Teach shape recognition and identification
                </p>
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={() => handleOpenAssignDialog('shape-quiz', 'Shape Quiz')}
                >
                  Assign to Students
                </Button>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h4 className="font-bold text-lg mb-2">Drag & Match</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Interactive matching game for hands-on learning
                </p>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => handleOpenAssignDialog('drag-match', 'Drag & Match')}
                >
                  Assign to Students
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-yellow-400 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                <Award className="inline w-6 h-6 mr-2" />
                Performance Insights
              </CardTitle>
              <CardDescription>Recommendations for improvement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    💡
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Strong Color Recognition</h4>
                    <p className="text-sm text-gray-600">
                      Class average of {classStats.averageColorScore}% shows good color understanding. 
                      Continue reinforcing with real-world examples.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                    +
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Shape Quiz Focus</h4>
                    <p className="text-sm text-gray-600">
                      Some students may benefit from additional shape practice. 
                      Consider assigning targeted shape activities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xl">
                    *
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">High Engagement</h4>
                    <p className="text-sm text-gray-600">
                      {classStats.totalGamesPlayed} total games played! Students are actively engaged. 
                      Keep up the momentum!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    !
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Suggested Activities</h4>
                    <p className="text-sm text-gray-600">
                      Mix different game types to maintain interest and provide 
                      comprehensive learning experiences.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Student Dialog with Tabs */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Students to Your Class</DialogTitle>
            <DialogDescription>
              Create a new profile or connect to an existing student account.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="add-new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-new">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Link2 className="w-4 h-4 mr-2" />
                Connect Existing
              </TabsTrigger>
            </TabsList>

            {/* Add New Student Tab */}
            <TabsContent value="add-new" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name</Label>
                <Input
                  id="student-name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Enter student name..."
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-age">Age</Label>
                <Input
                  id="student-age"
                  type="number"
                  min="3"
                  max="10"
                  value={newStudentAge}
                  onChange={(e) => setNewStudentAge(e.target.value)}
                  placeholder="Enter age (3-10)..."
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Choose Avatar</Label>
                <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                  {AVATAR_EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => setNewStudentAvatar(emoji)}
                      className={`
                        text-4xl p-3 rounded-lg border-2 transition-all
                        ${newStudentAvatar === emoji
                          ? 'border-green-500 bg-green-100 scale-110'
                          : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudent}
                  disabled={!newStudentName.trim() || !newStudentAge.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </TabsContent>

            {/* Connect Existing Student Tab */}
            <TabsContent value="connect" className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ Connect to students whose profiles were created by their parents.
                  You'll need either the parent's email or the student's unique code.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent-email">Parent Email (Optional)</Label>
                <Input
                  id="parent-email"
                  type="email"
                  value={connectStudentEmail}
                  onChange={(e) => setConnectStudentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="h-12 text-lg"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-code">Student Code (Optional)</Label>
                <Input
                  id="student-code"
                  value={connectStudentCode}
                  onChange={(e) => setConnectStudentCode(e.target.value)}
                  placeholder="ABC-123-XYZ"
                  className="h-12 text-lg font-mono"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border-2 border-amber-200">
                <p className="text-sm text-amber-800">
                  💡 <strong>Coming Soon:</strong> This feature will be available after Supabase integration.
                  Parents will be able to share a unique code with you to link their child's account.
                </p>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectStudent}
                  disabled={!connectStudentEmail.trim() && !connectStudentCode.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Student
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Assign Activity Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign {selectedActivity?.name}</DialogTitle>
            <DialogDescription>
              Select students to assign this activity to. They will see it on their menu page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length === students.length}
                onCheckedChange={toggleAllStudents}
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-bold cursor-pointer"
              >
                Select All Students
              </Label>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students.map((child) => (
                <div key={child.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={child.id}
                    checked={selectedStudents.includes(child.id)}
                    onCheckedChange={() => toggleStudent(child.id)}
                  />
                  <Label
                    htmlFor={child.id}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {child.avatar} {child.name} (Age {child.age})
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignActivity}
              disabled={selectedStudents.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
