import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Users, Database, BarChart3, Settings, Plus } from 'lucide-react';
import backgroundImg from '../../artassets/background.webp';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import { fetchAdminSnapshot } from '../utils/supabaseApi';
import { formatLocalDateTime } from '../utils/time';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalParents: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    totalGamesPlayed: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Array<{ id: string; email: string; role: string; created_at: string }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    event_type: string;
    entity_type: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const run = async () => {
      const a = await fetchAdminSnapshot();
      setStats({
        totalUsers: a.totalUsers,
        totalParents: a.totalParents,
        totalStudents: a.totalStudents,
        totalTeachers: a.totalTeachers,
        totalAdmins: a.totalAdmins,
        totalAssignments: a.totalAssignments,
        completedAssignments: a.completedAssignments,
        totalGamesPlayed: a.totalGamesPlayed,
      });
      setRecentUsers(a.recentUsers);
      setRecentActivity(a.recentActivity);
    };
    run().catch((e) => console.error(e));

    const channel = supabase
      .channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => void run())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles' }, () => void run())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, () => void run())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => void run())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => void run())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <div className="flex items-center gap-4 bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-green-600">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
            className="rounded-full w-12 h-12 md:w-14 md:h-14 border-3 border-green-500"
          >
            <ArrowLeft className="w-6 h-6 md:w-7 md:h-7" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-800" style={{ fontFamily: "'Cabin Sketch', cursive" }}>
              Admin Dashboard
            </h1>
            <p className="text-base md:text-lg text-amber-700">
              System management and analytics
            </p>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-white/90 p-2 rounded-2xl border-4 border-green-400">
            <TabsTrigger value="overview" className="text-base py-3">
              <BarChart3 className="w-5 h-5 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-base py-3">
              <Users className="w-5 h-5 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="text-base py-3">
              <Database className="w-5 h-5 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="system" className="text-base py-3">
              <Settings className="w-5 h-5 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* overview tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* system stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-4 border-blue-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-lg">Total Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-800">
                    {stats.totalUsers}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Parents, Teachers, Admins
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-green-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-lg">Students</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-800">
                    {stats.totalStudents}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Active Learners
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    <CardTitle className="text-lg">Teachers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-800">
                    {stats.totalTeachers}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Educators
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-amber-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-amber-600" />
                    <CardTitle className="text-lg">Games Played</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-amber-800">
                    {stats.totalGamesPlayed}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-4 border-indigo-400 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Assignments</CardTitle>
                <CardDescription>Teacher-issued activity tracking</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-gray-50">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                </div>
                <div className="p-4 rounded-lg border bg-green-50">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completedAssignments}</p>
                </div>
                <div className="p-4 rounded-lg border bg-amber-50">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {Math.max(0, stats.totalAssignments - stats.completedAssignments)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-4 border-blue-400 bg-white/95 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">User Management</CardTitle>
                    <CardDescription>View and manage all platform users</CardDescription>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-5 h-5 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 border rounded-lg bg-blue-50"><p className="text-xs">All Users</p><p className="font-bold">{stats.totalUsers}</p></div>
                  <div className="p-3 border rounded-lg bg-cyan-50"><p className="text-xs">Parents</p><p className="font-bold">{stats.totalParents}</p></div>
                  <div className="p-3 border rounded-lg bg-purple-50"><p className="text-xs">Teachers</p><p className="font-bold">{stats.totalTeachers}</p></div>
                  <div className="p-3 border rounded-lg bg-emerald-50"><p className="text-xs">Admins</p><p className="font-bold">{stats.totalAdmins}</p></div>
                </div>
                <div className="space-y-2">
                  {recentUsers.length === 0 ? (
                    <p className="text-gray-600">No recent user records yet.</p>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="p-3 border rounded-lg bg-white flex items-center justify-between">
                        <div>
                          <p className="text-sm">{user.email}</p>
                          <p className="text-xs text-gray-500">{formatLocalDateTime(user.created_at)}</p>
                        </div>
                        <span className="text-xs uppercase font-semibold">{user.role}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* content tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-4 border-pink-400 bg-white/95 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Colors</CardTitle>
                      <CardDescription>Manage quiz colors</CardDescription>
                    </div>
                    <Button className="bg-pink-500 hover:bg-pink-600" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Color
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <Database className="w-12 h-12 text-pink-600 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Content management API not implemented yet (analytics live).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Shapes</CardTitle>
                      <CardDescription>Manage quiz shapes</CardDescription>
                    </div>
                    <Button className="bg-purple-500 hover:bg-purple-600" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Shape
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <Database className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Content management API not implemented yet (analytics live).
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="border-4 border-green-400 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">System Settings</CardTitle>
                <CardDescription>Configure platform settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-lg mb-2 text-green-800">Database Status</h4>
                  <p className="text-gray-700">
                    {isSupabaseConfigured ? 'Connected to Supabase' : 'Not Connected'}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <h4 className="font-bold text-lg mb-2 text-blue-800">Storage Status</h4>
                  <p className="text-gray-700">
                    Not Configured - Set up Supabase Storage
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                  <h4 className="font-bold text-lg mb-2 text-amber-800">Authentication</h4>
                  <p className="text-gray-700">
                    Supabase Auth enabled with role-based routes
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-300">
                  <h4 className="font-bold text-lg mb-2 text-indigo-800">Recent Activity Log</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-700">No activity rows yet.</p>
                    ) : (
                      recentActivity.map((row) => (
                        <div key={row.id} className="text-sm p-2 border rounded bg-white">
                          <strong>{row.event_type}</strong> on <em>{row.entity_type}</em>
                          <div className="text-xs text-gray-500 mt-1">{formatLocalDateTime(row.created_at)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
