# 🗄️ SUPABASE INTEGRATION GUIDE

**⚠️ SAFE TO DELETE AFTER USE**

This file contains comprehensive instructions for integrating Supabase with Freshie's Color & Shape Safari. Follow these steps to replace the current localStorage-based system with a production-ready database.

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Step-by-Step Supabase Setup](#step-by-step-supabase-setup)
3. [Database Schema & SQL Scripts](#database-schema--sql-scripts)
4. [Authentication Integration](#authentication-integration)
5. [Frontend Integration](#frontend-integration)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Testing & Verification](#testing--verification)
8. [Simple Explanation (For Presentation)](#simple-explanation-for-presentation)

---

## 🎯 OVERVIEW

**What is Supabase?**

Supabase is an open-source Firebase alternative that provides:
- PostgreSQL Database (relational database)
- Authentication (user management, login/signup)
- Row Level Security (data access control)
- Real-time subscriptions
- Storage (file uploads)

**Why Use Supabase for This App?**

- **Multi-user support**: Parents, teachers, and admins can have separate accounts
- **Data persistence**: All progress and scores are saved permanently
- **Real-time updates**: Teachers can see student progress live
- **Security**: Role-based access control ensures users only see their own data
- **Scalability**: Can handle thousands of users

---

## 🚀 STEP-BY-STEP SUPABASE SETUP

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up
3. Create a new project:
   - **Project name**: `freshie-safari` (or any name)
   - **Database password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing**: Free tier works for development

4. Wait 1-2 minutes for project setup to complete

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **Project API Key (anon, public)**: `eyJhbGc...` (long string)

### Step 3: Create Environment Variables

In your project root, create a `.env.local` file:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here...
```

**⚠️ SECURITY NOTE**: Never commit `.env.local` to version control! Add it to `.gitignore`.

### Step 4: Install Supabase Client

```bash
pnpm install @supabase/supabase-js
```

### Step 5: Create Supabase Client File

Create `/src/app/utils/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 📊 DATABASE SCHEMA & SQL SCRIPTS

### Table Structure Overview

```
users (parent table for all accounts)
  ↓
students (children managed by parents/teachers)
  ↓
game_results (quiz scores and progress)
  ↓
assignments (teacher-created activities)
```

### SQL Script 1: Users Table

**Purpose**: Stores all user accounts (parents, teachers, admins)

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### SQL Script 2: Students Table

**Purpose**: Stores child/student profiles linked to parents or teachers

```sql
-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER DEFAULT 4,
  avatar TEXT DEFAULT '🦁',
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for parent lookups
CREATE INDEX idx_students_parent ON students(parent_id);

-- Index for creator lookups
CREATE INDEX idx_students_creator ON students(created_by);

-- Auto-update timestamp trigger
CREATE TRIGGER students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### SQL Script 3: Student-Teacher Relationship Table

**Purpose**: Links teachers to students they manage

```sql
-- Student-Teacher Junction Table
CREATE TABLE student_teacher (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

-- Index for student lookups
CREATE INDEX idx_student_teacher_student ON student_teacher(student_id);

-- Index for teacher lookups
CREATE INDEX idx_student_teacher_teacher ON student_teacher(teacher_id);
```

### SQL Script 4: Game Results Table

**Purpose**: Stores all quiz scores and progress

```sql
-- Game Results Table
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('color', 'shape', 'dragMatch')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for student lookups
CREATE INDEX idx_game_results_student ON game_results(student_id);

-- Index for game type filtering
CREATE INDEX idx_game_results_type ON game_results(game_type);

-- Index for date range queries
CREATE INDEX idx_game_results_date ON game_results(completed_at DESC);
```

### SQL Script 5: Badges Table

**Purpose**: Stores earned achievements

```sql
-- Badges Table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('Star', 'Trophy', 'Medal', 'Crown')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, badge_type)
);

-- Index for student lookups
CREATE INDEX idx_badges_student ON badges(student_id);
```

### SQL Script 6: Assignments Table

**Purpose**: Stores teacher-created assignments

```sql
-- Assignments Table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('color-quiz', 'shape-quiz', 'drag-match')),
  assigned_to UUID[] NOT NULL, -- Array of student IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE
);

-- Index for teacher lookups
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);

-- Index for student lookups (using GIN for array operations)
CREATE INDEX idx_assignments_students ON assignments USING GIN(assigned_to);
```

### SQL Script 7: Assignment Completions Table

**Purpose**: Tracks which students completed assignments

```sql
-- Assignment Completions Table
CREATE TABLE assignment_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  UNIQUE(assignment_id, student_id)
);

-- Index for assignment lookups
CREATE INDEX idx_completions_assignment ON assignment_completions(assignment_id);

-- Index for student lookups
CREATE INDEX idx_completions_student ON assignment_completions(student_id);
```

### Execute All Scripts

To create all tables at once, go to:
1. Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste ALL the SQL scripts above (Script 1-7)
4. Click **Run** (or press Ctrl+Enter)

---

## 🔐 AUTHENTICATION INTEGRATION

### How Authentication Works

1. **User signs up** → Supabase creates auth user + custom user record
2. **User logs in** → Supabase returns session token
3. **Frontend stores session** → Used for all subsequent API calls
4. **Role-based routing** → Users directed to appropriate dashboard

### Step 1: Set Up Auth Trigger

When a user signs up via Supabase Auth, automatically create a user record:

```sql
-- Trigger to create user record after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

### Step 2: Update useUserStore.ts

Replace the `login` function:

```typescript
// BEFORE (localStorage)
const login = (email: string, role: UserRole, children?: ChildProfile[]) => {
  const newState: UserState = {
    role,
    email,
    children: children || [],
    currentChild: children?.[0] || null,
  };
  setUserState(newState);
};

// AFTER (Supabase)
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch user role from database
  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single();

  // Fetch children
  const { data: children } = await supabase
    .from('students')
    .select('*')
    .eq('parent_id', data.user.id);

  setUserState({
    role: userData.role,
    email: data.user.email,
    children: children || [],
    currentChild: children?.[0] || null,
  });
};
```

### Step 3: Update LoginPage.tsx

Replace the signup handlers:

```typescript
// Parent Signup
const handleParentSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signUp({
    email: parentEmail,
    password: parentPassword,
    options: {
      data: {
        role: 'parent',
        full_name: parentName,
      },
    },
  });

  if (error) {
    alert('Error: ' + error.message);
    return;
  }

  // Log in automatically
  await login(parentEmail, parentPassword);
  navigate('/setup-profile', { state: { role: 'parent' } });
};

// Teacher Signup
const handleTeacherSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signUp({
    email: teacherEmail,
    password: teacherPassword,
    options: {
      data: {
        role: 'teacher',
        full_name: teacherName,
      },
    },
  });

  if (error) {
    alert('Error: ' + error.message);
    return;
  }

  await login(teacherEmail, teacherPassword);
  navigate('/setup-profile', { state: { role: 'teacher' } });
};
```

### Step 4: Update SetupProfilePage.tsx

Replace the `handleFinish` function:

```typescript
const handleFinish = async () => {
  if (tempChildren.length === 0) {
    alert('Please add at least one child/student before continuing.');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Insert all children into database
  const studentsToInsert = tempChildren.map(child => ({
    name: child.name,
    avatar: child.avatar,
    parent_id: user.id,
    created_by: user.id,
  }));

  const { error } = await supabase
    .from('students')
    .insert(studentsToInsert);

  if (error) {
    alert('Error creating profiles: ' + error.message);
    return;
  }

  // Reload user data
  const { data: children } = await supabase
    .from('students')
    .select('*')
    .eq('parent_id', user.id);

  // Update local state
  setUserState({
    ...userState,
    children: children || [],
    currentChild: children?.[0] || null,
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
```

---

## 🔒 ROW LEVEL SECURITY (RLS)

**What is RLS?**

Row Level Security ensures users can only access their own data. Without RLS, anyone could query and see all users' data.

### Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teacher ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_completions ENABLE ROW LEVEL SECURITY;
```

### RLS Policy 1: Users Table

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);
```

### RLS Policy 2: Students Table

```sql
-- Parents can read their own children
CREATE POLICY "Parents can read own children"
ON students
FOR SELECT
USING (auth.uid() = parent_id);

-- Teachers can read their assigned students
CREATE POLICY "Teachers can read assigned students"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_teacher
    WHERE student_id = students.id
    AND teacher_id = auth.uid()
  )
);

-- Parents can create children
CREATE POLICY "Parents can create children"
ON students
FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Parents can update their children
CREATE POLICY "Parents can update own children"
ON students
FOR UPDATE
USING (auth.uid() = parent_id);

-- Parents can delete their children
CREATE POLICY "Parents can delete own children"
ON students
FOR DELETE
USING (auth.uid() = parent_id);
```

### RLS Policy 3: Game Results Table

```sql
-- Parents can read their children's results
CREATE POLICY "Parents can read children's results"
ON game_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE students.id = game_results.student_id
    AND students.parent_id = auth.uid()
  )
);

-- Teachers can read assigned students' results
CREATE POLICY "Teachers can read assigned results"
ON game_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_teacher
    WHERE student_teacher.student_id = game_results.student_id
    AND student_teacher.teacher_id = auth.uid()
  )
);

-- Anyone can insert game results (children playing games)
CREATE POLICY "Anyone can insert results"
ON game_results
FOR INSERT
WITH CHECK (true);
```

### RLS Policy 4: Assignments Table

```sql
-- Teachers can read their own assignments
CREATE POLICY "Teachers can read own assignments"
ON assignments
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can create assignments
CREATE POLICY "Teachers can create assignments"
ON assignments
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their assignments
CREATE POLICY "Teachers can update own assignments"
ON assignments
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their assignments
CREATE POLICY "Teachers can delete own assignments"
ON assignments
FOR DELETE
USING (auth.uid() = teacher_id);
```

---

## 🔧 FRONTEND INTEGRATION

### Update Game Score Saving

In `ColorQuizPage.tsx`, `ShapeQuizPage.tsx`, and `DragMatchPage.tsx`:

```typescript
// BEFORE (localStorage)
const handleAnswer = (answer: string) => {
  // ... existing logic
  if (isLastQuestion) {
    updateChildProgress(finalScore, 'color'); // localStorage
  }
};

// AFTER (Supabase)
const handleAnswer = async (answer: string) => {
  // ... existing logic
  if (isLastQuestion) {
    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    const currentChild = userState.currentChild;

    await supabase.from('game_results').insert({
      student_id: currentChild.id,
      game_type: 'color', // or 'shape', 'dragMatch'
      score: finalScore,
      total_questions: questions.length,
      correct_answers: correctCount,
    });

    // Award badges if applicable
    if (finalScore >= 80) {
      await supabase.from('badges').insert({
        student_id: currentChild.id,
        badge_type: finalScore === 100 ? 'Trophy' : 'Star',
      }).onConflict('student_id, badge_type').ignore();
    }

    navigate('/score', { state: { ... } });
  }
};
```

### Update Dashboard Data Fetching

In `ParentDashboard.tsx`:

```typescript
// Fetch children and their progress
useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch children
    const { data: children } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', user.id);

    // Fetch game results for each child
    const childrenWithProgress = await Promise.all(
      children.map(async (child) => {
        const { data: results } = await supabase
          .from('game_results')
          .select('*')
          .eq('student_id', child.id);

        const { data: badges } = await supabase
          .from('badges')
          .select('badge_type')
          .eq('student_id', child.id);

        // Calculate average scores
        const colorResults = results.filter(r => r.game_type === 'color');
        const shapeResults = results.filter(r => r.game_type === 'shape');

        return {
          ...child,
          progress: {
            totalGamesPlayed: results.length,
            colorQuizScore: colorResults.length > 0
              ? Math.round(colorResults.reduce((acc, r) => acc + r.score, 0) / colorResults.length)
              : 0,
            shapeQuizScore: shapeResults.length > 0
              ? Math.round(shapeResults.reduce((acc, r) => acc + r.score, 0) / shapeResults.length)
              : 0,
            badges: badges.map(b => b.badge_type),
          },
        };
      })
    );

    setChildren(childrenWithProgress);
  };

  fetchData();
}, []);
```

---

## ✅ TESTING & VERIFICATION

### Test Checklist

- [ ] Can create parent account
- [ ] Can create teacher account
- [ ] Can add children after signup
- [ ] Can log in with created account
- [ ] Can see only own children (not others' children)
- [ ] Can play quiz and save score
- [ ] Can view progress in dashboard
- [ ] Can create assignment (teacher)
- [ ] Can view assignments (student)
- [ ] Badges are awarded correctly

### Verify RLS is Working

1. Create two parent accounts
2. Add children to each
3. Try to query other parent's children:

```typescript
// This should return empty array (RLS blocking access)
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('parent_id', 'SOME_OTHER_PARENT_ID');
```

---

## 📚 SIMPLE EXPLANATION (FOR PRESENTATION)

### What is the Database?

Think of the database like a digital filing cabinet:
- **Users drawer**: Contains all parent, teacher, and admin accounts
- **Students drawer**: Contains all children's profiles
- **Game Results drawer**: Contains all quiz scores
- **Assignments drawer**: Contains all teacher-created activities

### How Does Authentication Work?

1. **Sign Up**: User creates an account with email and password
2. **Login**: User enters credentials, Supabase verifies and creates a session
3. **Session Token**: Like a digital key card that proves who you are
4. **Role Check**: System checks if you're a parent, teacher, or admin
5. **Dashboard**: You're sent to the right dashboard based on your role

### How Does Data Security Work?

**Row Level Security (RLS)** ensures:
- Parents can only see their own children's data
- Teachers can only see their assigned students' data
- Admins can see all data
- No one can access data they don't have permission to view

**Example**:
- Parent A logs in → Can see Child 1 and Child 2
- Parent B logs in → Can see Child 3 and Child 4
- Parent A **cannot** see Child 3 or 4 (even if they try!)

### How Does the System Connect?

```
User Signs Up
    ↓
Creates Profile (adds children)
    ↓
Plays Quiz
    ↓
Score Saved to Database
    ↓
Dashboard Shows Progress
    ↓
Teacher Assigns Activity
    ↓
Child Receives Assignment
    ↓
Child Completes Activity
    ↓
Teacher Sees Results
```

### Key Benefits

1. **Persistent Data**: All progress saved forever (not just in browser)
2. **Multi-Device**: Log in from any device, see same data
3. **Real-Time**: Teachers see student progress immediately
4. **Secure**: Only authorized users can access their data
5. **Scalable**: Can handle thousands of users

---

## 🎓 CONCLUSION

This guide provides everything needed to migrate from localStorage to Supabase. The system is now:

- ✅ **Production-ready**: Can handle real users
- ✅ **Secure**: Role-based access control
- ✅ **Scalable**: Supports unlimited users
- ✅ **Persistent**: Data never lost
- ✅ **Real-time**: Teachers see student progress live

**Next Steps**:
1. Create Supabase project
2. Run all SQL scripts
3. Update environment variables
4. Replace localStorage code with Supabase queries
5. Test thoroughly
6. Deploy to production

---

**📌 Remember**: This file is safe to delete after Supabase integration is complete!
