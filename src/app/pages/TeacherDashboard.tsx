import { useEffect, useState } from 'react';
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
import { ArrowLeft, Users, BookOpen, TrendingUp, Award, Plus, Check, Link2, Trash2, UserMinus } from 'lucide-react';
import backgroundImg from '../../artassets/background.webp';
import { useAssignmentStore } from '../utils/useAssignmentStore';
import { useUserStore } from '../utils/useUserStore';
import { Input } from '../components/ui/input';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import {
  assignStudentToTeacher,
  assignStudentsToClass,
  createTeacherClass,
  fetchAchievementsForStudents,
  fetchTeacherStudents,
  fetchTeacherStudentsForClass,
  fetchProgressForStudents,
  fetchAssignmentsForTeacher,
  fetchTeacherClasses,
  fetchParentStudentsByEmail,
  deleteAssignmentsForTeacherStudent,
  deleteStudentProfile,
  removeStudentFromClass,
  unassignStudentFromTeacher,
} from '../utils/supabaseApi';
import { progressRowToChildProfile } from '../utils/supabaseModels';
import { formatLocalDateTime } from '../utils/time';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { userState, login } = useUserStore();
  const { createAssignment, clearCompletedIndicator } = useAssignmentStore();
  const [teacherIdState, setTeacherIdState] = useState<string | null>(null);

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    type: 'color-quiz' | 'shape-quiz' | 'drag-match';
    name: string;
  } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<5 | 10 | 15 | 20>(10);

  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // connection feature state
  const [connectStudentEmail, setConnectStudentEmail] = useState('');
  const [availableParentStudents, setAvailableParentStudents] = useState<Array<{ id: string; name: string; age: number | null }>>([]);
  const [selectedParentStudentIds, setSelectedParentStudentIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [newClassName, setNewClassName] = useState('');
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<string>('all');
  const [teacherAssignments, setTeacherAssignments] = useState<Array<{
    id: string;
    activityName: string;
    assignedTo: string;
    completed: boolean;
    classId?: string | null;
    questionCount?: number | null;
    assignedDate?: string;
    completedAt?: string | null;
  }>>([]);

  // Use teacher's students from userState (database-driven)
  const students = userState.children || [];
  const studentNameMap = new Map(students.map((student) => [student.id, student.name]));

  const refreshTeacherAssignments = async (teacherId: string) => {
    const assignments = await fetchAssignmentsForTeacher(teacherId);
    setTeacherAssignments(
      assignments.map((row) => ({
        id: row.id,
        activityName: row.activity_name,
        assignedTo: row.assigned_to,
        completed: row.completed,
        classId: row.class_id ?? null,
        questionCount: row.question_count ?? null,
        assignedDate: row.assigned_date,
        completedAt: row.completed_at,
      }))
    );
  };

  const refreshClasses = async (teacherId: string) => {
    const rows = await fetchTeacherClasses(teacherId);
    setClasses(rows.map((row) => ({ id: row.id, name: row.name })));
  };

  const refreshTeacherStudentsInStore = async (teacherId: string, classId?: string | null) => {
    const refreshedStudents = await fetchTeacherStudentsForClass({
      teacherId,
      classId: classId && classId !== 'all' ? classId : null,
    });
    const progress = await fetchProgressForStudents(refreshedStudents.map((s) => s.id));
    const achievementMap = await fetchAchievementsForStudents(refreshedStudents.map((s) => s.id));
    const children = refreshedStudents.map((s) => progressRowToChildProfile(s, progress[s.id] ?? null, achievementMap[s.id] ?? []));
    login(userState.email ?? '', 'teacher', children);
  };

  useEffect(() => {
    const run = async () => {
      if (!(isSupabaseConfigured && supabase) || userState.role !== 'teacher') return;
      const { data: authData } = await supabase.auth.getUser();
      const teacherId = authData.user?.id;
      if (!teacherId) return;
      setTeacherIdState(teacherId);
      await refreshClasses(teacherId);
      await refreshTeacherStudentsInStore(teacherId, selectedClassId);
      await refreshTeacherAssignments(teacherId);
    };
    run().catch((e) => console.error(e));
  }, [userState.role, selectedClassId]);

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
    setSelectedClassForAssign(selectedClassId);
    setSelectedStudents(selectedClassId !== 'all' ? students.map((child) => child.id) : []);
    setSelectedQuestionCount(10);
    setShowAssignDialog(true);
  };

  const handleAssignActivity = () => {
    if (selectedActivity && selectedStudents.length > 0) {
      const run = async () => {
        await createAssignment(
          selectedActivity.type,
          selectedActivity.name,
          userState.email || 'Teacher',
          selectedStudents,
          selectedQuestionCount,
          selectedClassForAssign !== 'all' ? selectedClassForAssign : null
        );
        if (isSupabaseConfigured && supabase) {
          const { data: authData } = await supabase.auth.getUser();
          const teacherId = authData.user?.id;
          if (teacherId) await refreshTeacherAssignments(teacherId);
        }
        setShowAssignDialog(false);
        setSelectedActivity(null);
        setSelectedStudents([]);
        alert(`${selectedActivity.name} assigned to ${selectedStudents.length} student(s)!`);
      };
      run().catch((e) => {
        console.error(e);
        alert('Failed to assign activity. Please try again.');
      });
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

  const handleLookupParentStudents = async () => {
    try {
      if (!connectStudentEmail.trim()) {
        alert('Enter the parent email first.');
        return;
      }
      const normalizedEmail = connectStudentEmail.trim().toLowerCase();
      const rows = await fetchParentStudentsByEmail(normalizedEmail);
      setAvailableParentStudents(rows.map((row) => ({ id: row.id, name: row.name, age: row.age ?? null })));
      setSelectedParentStudentIds([]);
      setLookupMessage(
        rows.length > 0
          ? `Found ${rows.length} child profile${rows.length === 1 ? '' : 's'} for ${normalizedEmail}.`
          : 'No child profiles found for this parent email.'
      );
      if (rows.length === 0) {
        alert('No child profiles found for this parent email.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load parent profiles. Please try again.');
    }
  };

  const handleConnectSelectedProfiles = async () => {
    try {
      if (!(isSupabaseConfigured && supabase)) {
        alert('Supabase is not configured yet.');
        return;
      }
      if (selectedParentStudentIds.length === 0) {
        alert('Select at least one child profile to connect.');
        return;
      }
      const { data: authData } = await supabase.auth.getUser();
      const teacherId = authData.user?.id;
      if (!teacherId) throw new Error('Missing teacher id');

      for (const studentId of selectedParentStudentIds) {
        await assignStudentToTeacher({ teacherId, studentId });
        if (selectedClassId !== 'all') {
          await assignStudentsToClass({ classId: selectedClassId, studentIds: [studentId] });
        }
      }

      await refreshTeacherStudentsInStore(teacherId, selectedClassId);
      await refreshTeacherAssignments(teacherId);
      await refreshClasses(teacherId);

      setAvailableParentStudents([]);
      setSelectedParentStudentIds([]);
      setLookupMessage(null);
      setConnectStudentEmail('');
      setShowAddStudentDialog(false);
      alert(`Connected ${selectedParentStudentIds.length} profile(s) successfully!`);
    } catch (e) {
      console.error(e);
      alert('Failed to connect selected profiles. Please try again.');
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    if (!(isSupabaseConfigured && supabase)) {
      alert('Supabase is not configured yet.');
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const teacherId = authData.user?.id;
    if (!teacherId) throw new Error('Missing teacher id');

    const student = students.find((s) => s.id === studentId) ?? null;
    const isTeacherOwned = student?.parentId === teacherId;

    if (selectedClassId !== 'all') {
      await removeStudentFromClass({ classId: selectedClassId, studentId });
    } else if (isTeacherOwned) {
      await deleteStudentProfile({ studentId, parentId: teacherId });
    } else {
      await deleteAssignmentsForTeacherStudent({ teacherId, studentId });
      await unassignStudentFromTeacher({ teacherId, studentId });
    }

    await refreshTeacherStudentsInStore(teacherId, selectedClassId);
    await refreshTeacherAssignments(teacherId);
    await refreshClasses(teacherId);
  };

  const handleCreateClass = async () => {
    try {
      if (!(isSupabaseConfigured && supabase)) return;
      if (!newClassName.trim()) return;
      const { data: authData } = await supabase.auth.getUser();
      const teacherId = authData.user?.id;
      if (!teacherId) throw new Error('Missing teacher id');
      const created = await createTeacherClass({ teacherId, name: newClassName.trim() });
      await refreshClasses(teacherId);
      setSelectedClassId(created.id);
      setNewClassName('');
      setShowClassDialog(false);
      await refreshTeacherStudentsInStore(teacherId, created.id);
    } catch (e) {
      console.error(e);
      alert('Failed to create class. Please try again.');
    }
  };

  useEffect(() => {
    if (!(isSupabaseConfigured && supabase) || !teacherIdState) return;
    const refreshAll = async () => {
      await refreshClasses(teacherIdState);
      await refreshTeacherStudentsInStore(teacherIdState, selectedClassId);
      await refreshTeacherAssignments(teacherIdState);
    };

    const channel = supabase
      .channel(`teacher-dashboard-${teacherIdState}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_students' }, () => void refreshAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, () => void refreshAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => void refreshAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_classes' }, () => void refreshAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_students' }, () => void refreshAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherIdState, selectedClassId]);

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
        <Card className="border-4 border-cyan-400 bg-white/95 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Classes</CardTitle>
                <CardDescription>Organize connected students into multiple classes.</CardDescription>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowClassDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Class
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedClassId === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedClassId('all')}
              >
                All Students
              </Button>
              {classes.map((teacherClass) => (
                <Button
                  key={teacherClass.id}
                  variant={selectedClassId === teacherClass.id ? 'default' : 'outline'}
                  onClick={() => setSelectedClassId(teacherClass.id)}
                >
                  {teacherClass.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleRemoveStudentFromClass(student.id).catch((e) => {
                            console.error(e);
                            alert('Failed to remove student. Please try again.');
                          })
                        }
                        className="border-2 border-red-400 hover:bg-red-100"
                        title="Remove from class"
                      >
                        {teacherIdState && student.parentId === teacherIdState ? (
                          <Trash2 className="w-5 h-5 text-red-600" />
                        ) : (
                          <UserMinus className="w-5 h-5 text-red-600" />
                        )}
                      </Button>
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

        <Card className="border-4 border-indigo-400 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Assignment Completion Tracker</CardTitle>
            <CardDescription>Monitor who has finished assigned activities.</CardDescription>
          </CardHeader>
          <CardContent>
            {teacherAssignments.length === 0 ? (
              <p className="text-gray-600">No assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {teacherAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div>
                      <p className="font-semibold">{assignment.activityName}</p>
                      <p className="text-sm text-gray-600">
                        Student: {studentNameMap.get(assignment.assignedTo) ?? assignment.assignedTo}
                      </p>
                      {assignment.questionCount ? (
                        <p className="text-xs text-gray-500">Questions: {assignment.questionCount}</p>
                      ) : null}
                      <p className="text-xs text-gray-500">
                        Assigned: {assignment.assignedDate ? formatLocalDateTime(assignment.assignedDate) : 'Unknown'}
                        {assignment.completedAt ? ` • Completed: ${formatLocalDateTime(assignment.completedAt)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${assignment.completed ? 'text-green-700' : 'text-amber-700'}`}>
                        {assignment.completed ? 'Completed' : 'Pending'}
                      </span>
                      {assignment.completed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            clearCompletedIndicator(assignment.id).catch((e) => {
                              console.error(e);
                              alert('Failed to clear completed indicator.');
                            })
                          }
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Students to Your Class</DialogTitle>
            <DialogDescription>
              Connect existing child profiles by parent email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ Connect to students whose profiles were created by their parents.
                  Enter the parent's email, then select one or more child profiles to connect.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent-email">Parent Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="parent-email"
                    type="email"
                    value={connectStudentEmail}
                    onChange={(e) => {
                      setConnectStudentEmail(e.target.value);
                      setLookupMessage(null);
                    }}
                    placeholder="parent@example.com"
                    className="h-12 text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLookupParentStudents}
                    disabled={!connectStudentEmail.trim()}
                  >
                    Find
                  </Button>
                </div>
              </div>

              {lookupMessage && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${
                  availableParentStudents.length > 0
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                  {lookupMessage}
                </div>
              )}

              {availableParentStudents.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <Label>Select Child Profiles</Label>
                  {availableParentStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`connect-${student.id}`}
                        checked={selectedParentStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => {
                          setSelectedParentStudentIds((prev) =>
                            checked ? [...prev, student.id] : prev.filter((id) => id !== student.id)
                          );
                        }}
                      />
                      <Label htmlFor={`connect-${student.id}`} className="cursor-pointer">
                        {student.name}{typeof student.age === 'number' ? ` (Age ${student.age})` : ''}
                      </Label>
                    </div>
                  ))}
                  <Button type="button" onClick={handleConnectSelectedProfiles} className="w-full">
                    Connect Students
                  </Button>
                </div>
              )}

              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnectSelectedProfiles} disabled={selectedParentStudentIds.length === 0}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Selected
                </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create Class</DialogTitle>
            <DialogDescription>Add a class, then use it to group students and assign activities.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Tigers A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClassDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={!newClassName.trim()}>
              Create Class
            </Button>
          </DialogFooter>
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
            {(selectedActivity?.type === 'color-quiz' || selectedActivity?.type === 'shape-quiz') && (
              <div className="space-y-2">
                <Label>Question Count</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <Button
                      key={count}
                      type="button"
                      variant={selectedQuestionCount === count ? 'default' : 'outline'}
                      onClick={() => setSelectedQuestionCount(count as 5 | 10 | 15 | 20)}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
