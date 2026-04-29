import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUserStore, UserRole } from '../utils/useUserStore';
import { motion } from 'motion/react';
import backgroundImg from '../../artassets/background.webp';
import logoImg from '../../artassets/freshielogo.webp';
import { ArrowLeft } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import {
  fetchHydratedChildrenForUser,
  fetchAchievementsForStudents,
  fetchProgressForStudents,
  getOrCreateAppUser,
  getUserRoleById,
  logActivity,
} from '../utils/supabaseApi';
import { progressRowToChildProfile } from '../utils/supabaseModels';

/**
 * Login Page - Role-Based Authentication
 *
 * Supports three user types:
 * - Parent: Can manage their own children, view progress
 * - Teacher: Can manage students, assign activities
 * - Admin: Database-assigned role (not selectable during login)
 *
 * In production, this will integrate with Supabase Auth.
 * User roles are stored in the database and retrieved after authentication.
 */

export default function LoginPage() {
  const PARENT_ONBOARDING_KEY = 'freshie-parent-onboarding-email';
  const navigate = useNavigate();
  const { login } = useUserStore();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Parent signup state
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentName, setParentName] = useState('');

  // Teacher signup state
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');

  const resolveRole = async (userId: string, email: string): Promise<UserRole> => {
    try {
      return (await getUserRoleById(userId)) as UserRole;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!message.toLowerCase().includes('not found')) throw e;
      const created = await getOrCreateAppUser({ id: userId, email, role: 'parent' });
      return created.role as UserRole;
    }
  };

  /**
   * Handle Login
   * In production, this will:
   * 1. Call Supabase Auth signInWithPassword()
   * 2. Fetch user role from database
   * 3. Route based on role
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let role: UserRole = 'parent';

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        alert(error.message);
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        alert('Login failed. Please try again.');
        return;
      }
      role = await resolveRole(userId, loginEmail);
      const students = await fetchHydratedChildrenForUser({ userId, role });
      const progressMap = await fetchProgressForStudents(students.map((s) => s.id));
      const achievementMap = await fetchAchievementsForStudents(students.map((s) => s.id));
      const children = students.map((s) => progressRowToChildProfile(s, progressMap[s.id] ?? null, achievementMap[s.id] ?? []));
      await logActivity({
        actorUserId: userId,
        eventType: 'login_success',
        entityType: 'users',
        entityId: userId,
        metadata: { role, email: loginEmail },
      }).catch(() => undefined);
    } else {
      // Local demo fallback (keeps app usable without Supabase keys).
      if (loginEmail.includes('admin')) role = 'admin';
      else if (loginEmail.includes('teacher')) role = 'teacher';
    }

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      const students = userId ? await fetchHydratedChildrenForUser({ userId, role }) : [];
      const progressMap = await fetchProgressForStudents(students.map((s) => s.id));
      const achievementMap = await fetchAchievementsForStudents(students.map((s) => s.id));
      const children = students.map((s) => progressRowToChildProfile(s, progressMap[s.id] ?? null, achievementMap[s.id] ?? []));
      login(loginEmail, role, children);
    } else {
      login(loginEmail, role);
    }

    // Route based on role
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard', { replace: true });
        break;
      case 'teacher':
        navigate('/teacher-dashboard', { replace: true });
        break;
      case 'parent':
        navigate('/menu', { replace: true });
        break;
      default:
        navigate('/menu', { replace: true });
    }
  };

  /**
   * Handle Parent Signup
   * Creates a parent account that can manage multiple children.
   */
  const handleParentSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSupabaseConfigured && supabase) {
      let { data, error } = await supabase.auth.signUp({
        email: parentEmail,
        password: parentPassword,
        options: { data: { name: parentName, role: 'parent' } },
      });

      if (error && error.message.toLowerCase().includes('already registered')) {
        const signInResult = await supabase.auth.signInWithPassword({
          email: parentEmail,
          password: parentPassword,
        });
        data = signInResult.data;
        error = signInResult.error;
      }

      if (error) {
        alert(error.message);
        return;
      }
      if (data.user?.id) {
        await getOrCreateAppUser({ id: data.user.id, email: parentEmail, role: 'parent' });
      }
      if (!data.session) {
        alert('Signup successful. Please verify your email, then log in.');
        navigate('/login', { replace: true });
        return;
      }
      const role = await resolveRole(data.user!.id, parentEmail);
      login(parentEmail, role);
      localStorage.setItem(PARENT_ONBOARDING_KEY, parentEmail);
      navigate('/menu', { replace: true });
      return;
    }

    login(parentEmail, 'parent');
    localStorage.setItem(PARENT_ONBOARDING_KEY, parentEmail);
    navigate('/menu', { replace: true });
  };

  /**
   * Handle Teacher Signup
   * Creates a teacher account that can manage students and assign activities.
   */
  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSupabaseConfigured && supabase) {
      let { data, error } = await supabase.auth.signUp({
        email: teacherEmail,
        password: teacherPassword,
        options: { data: { name: teacherName, role: 'teacher' } },
      });
      if (error && error.message.toLowerCase().includes('already registered')) {
        const signInResult = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: teacherPassword,
        });
        data = signInResult.data;
        error = signInResult.error;
      }
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user?.id) {
        await getOrCreateAppUser({ id: data.user.id, email: teacherEmail, role: 'teacher' });
      }
      if (!data.session) {
        alert('Signup successful. Please verify your email, then log in.');
        navigate('/login', { replace: true });
        return;
      }
      const role = await resolveRole(data.user!.id, teacherEmail);
      login(teacherEmail, role);
      navigate(role === 'admin' ? '/admin-dashboard' : '/teacher-dashboard', { replace: true });
      return;
    }

    login(teacherEmail, 'teacher');
    navigate('/teacher-dashboard', { replace: true });
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

      <Button
        variant="outline"
        size="lg"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 rounded-full w-14 h-14 border-4 border-green-600 bg-amber-200/90 hover:bg-amber-300 shadow-lg z-20"
      >
        <ArrowLeft className="w-7 h-7 text-green-800" />
      </Button>

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-4 border-green-600 bg-white/95">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <img
                src={logoImg}
                alt="Freshie's Safari Logo"
                className="w-48 h-auto"
                style={{
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            </div>
            <CardDescription className="text-lg text-amber-700">
              Welcome to the adventure!
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login" className="text-sm md:text-base">Login</TabsTrigger>
                <TabsTrigger value="parent" className="text-sm md:text-base">Parent</TabsTrigger>
                <TabsTrigger value="teacher" className="text-sm md:text-base">Teacher</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-base">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-green-300 focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-base">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-green-300 focus:border-green-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-xl bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg"
                  >
                    Start Adventure!
                  </Button>
                </form>
              </TabsContent>

              {/* Parent Signup Tab */}
              <TabsContent value="parent">
                <form onSubmit={handleParentSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent-name" className="text-base">Your Name</Label>
                    <Input
                      id="parent-name"
                      type="text"
                      placeholder="John Doe"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-blue-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent-email" className="text-base">Email</Label>
                    <Input
                      id="parent-email"
                      type="email"
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-blue-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent-password" className="text-base">Password</Label>
                    <Input
                      id="parent-password"
                      type="password"
                      placeholder="••••••••"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-blue-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-blue-800">
                      As a parent, you can add multiple child profiles and track their progress.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-xl bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg"
                  >
                    Create Parent Account
                  </Button>
                </form>
              </TabsContent>

              {/* Teacher Signup Tab */}
              <TabsContent value="teacher">
                <form onSubmit={handleTeacherSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher-name" className="text-base">Your Name</Label>
                    <Input
                      id="teacher-name"
                      type="text"
                      placeholder="Ms. Johnson"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-purple-300 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-email" className="text-base">Email</Label>
                    <Input
                      id="teacher-email"
                      type="email"
                      placeholder="teacher@school.edu"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-purple-300 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher-password" className="text-base">Password</Label>
                    <Input
                      id="teacher-password"
                      type="password"
                      placeholder="••••••••"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                      className="h-12 text-base border-2 border-purple-300 focus:border-purple-500"
                    />
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-purple-800">
                      As a teacher, you can manage students, assign activities, and track class performance.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-xl bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-lg"
                  >
                    Create Teacher Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
