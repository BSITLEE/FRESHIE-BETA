import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Users, Database, BarChart3, Settings, Plus, AlertCircle } from 'lucide-react';
import backgroundImg from '../../artassets/background.png';

/**
 * Admin Dashboard - Database-Ready Structure
 *
 * This dashboard is designed to integrate with Supabase backend.
 * Currently displays empty state with placeholders for real data.
 *
 * Expected database integration points:
 * - Users table (id, email, role, created_at)
 * - Students table (id, name, age, avatar, teacher_id)
 * - Teachers table (id, user_id, name)
 * - Assignments table (id, activity_type, assigned_to, assigned_by)
 * - Game_results table (id, student_id, game_type, score, completed_at)
 * - Content tables (colors, shapes)
 */

export default function AdminDashboard() {
  const navigate = useNavigate();

  // TODO: Replace with actual Supabase queries
  const [stats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalGamesPlayed: 0,
  });

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

      {/* Main Content */}
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Stats */}
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
                    Active learners
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

            {/* Empty State Message */}
            <Card className="border-4 border-indigo-400 bg-white/95 shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Database Integration Required
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  Connect to Supabase to see real-time analytics and user data
                </p>
                <p className="text-sm text-gray-500">
                  Refer to DATABASE_SCHEMA.md for integration instructions
                </p>
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
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Users Found
                </h3>
                <p className="text-gray-600">
                  Connect to database to view and manage users
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
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
                    Connect database to manage colors
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
                    Connect database to manage shapes
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
                    Not Connected - Configure Supabase connection
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
                    Using local state - Configure Supabase Auth
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
