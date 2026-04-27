# Freshie's Color & Shape Safari - Database Schema Documentation

> **⚠️ SAFE TO DELETE**: This file has been superseded by **SUPABASE_SETUP.md**, which contains more comprehensive integration instructions. You may safely delete this file.

This document outlines the complete database structure for integrating Supabase with the Freshie's Color & Shape Safari application. All tables, relationships, and keys are designed to support the full functionality of the platform.

---

## 📊 Database Overview

The platform uses a **relational database structure** with the following main entities:

1. **Users** - All platform users (parents, teachers, admins)
2. **Students** - Child learners (linked to parents/teachers)
3. **Assignments** - Activities assigned by teachers to students
4. **Game Results** - Performance data from completed games
5. **Content** - Colors and shapes used in quizzes
6. **Badges** - Achievement badges earned by students

---

## 🗂️ Table Structures & Relationships

### 1. **users** Table

Stores all platform users with role-based access.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier for each user (auto-generated UUID)
- `email`: User's email address (must be unique, used for login)
- `password_hash`: Encrypted password (never store plain text)
- `role`: User's role - determines what features they can access
  - `parent`: Can manage their own children, view progress
  - `teacher`: Can manage students, assign activities, view class analytics
  - `admin`: Full system access
- `name`: User's display name
- `created_at`: When the account was created
- `updated_at`: Last time the account was modified

**Why this structure?**
- Single users table with role-based access simplifies authentication
- Email as unique identifier enables easy login
- Timestamps help track account activity

---

### 2. **students** Table

Stores child learner profiles.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 3 AND age <= 10),
  avatar TEXT NOT NULL,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier for each student
- `name`: Child's name
- `age`: Child's age (validated between 3-10 years)
- `avatar`: Emoji representing the child (e.g., '🦁', '🐘')
- `parent_id`: Links to the parent user who owns this profile
  - `ON DELETE CASCADE`: If parent is deleted, their children are also deleted
- `teacher_id`: Optional link to a teacher (for classroom management)
  - `ON DELETE SET NULL`: If teacher is deleted, student remains but loses teacher link
- `created_at`: When the profile was created
- `updated_at`: Last modification time

**Why this structure?**
- Separate students table allows multiple children per parent
- Avatar stored as emoji text for easy display
- Foreign keys maintain data integrity
- CASCADE delete ensures no orphaned records

**Relationships:**
- One parent → many students (1:N)
- One teacher → many students (1:N)
- One student → one parent (N:1)
- One student → zero or one teacher (N:1)

---

### 3. **assignments** Table

Stores activities assigned by teachers to students.

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('color-quiz', 'shape-quiz', 'drag-match')),
  activity_name TEXT NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES students(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

**Fields Explanation:**
- `id`: Unique identifier for each assignment
- `activity_type`: Type of game/activity
  - `color-quiz`: Color recognition quiz
  - `shape-quiz`: Shape identification quiz
  - `drag-match`: Drag and drop matching game
- `activity_name`: Display name for the assignment
- `assigned_by`: Teacher who created the assignment
- `assigned_to`: Student who should complete the assignment
- `assigned_date`: When the assignment was created
- `completed`: Boolean flag - has the student completed this?
- `completed_at`: When the student finished the assignment

**Why this structure?**
- Tracks teacher-to-student assignment workflow
- Boolean completion flag enables quick filtering
- Timestamps track assignment lifecycle

**Relationships:**
- One teacher → many assignments (1:N)
- One student → many assignments (1:N)
- One assignment → one teacher (N:1)
- One assignment → one student (N:1)

**Example Query:**
```sql
-- Get all incomplete assignments for a specific student
SELECT * FROM assignments
WHERE assigned_to = 'student-uuid'
AND completed = FALSE
ORDER BY assigned_date DESC;
```

---

### 4. **game_results** Table

Stores performance data from completed games.

```sql
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('color-quiz', 'shape-quiz', 'drag-match')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier for each game result
- `student_id`: Which student played this game
- `game_type`: Type of game played
- `score`: Percentage score (0-100)
- `correct_answers`: Number of questions answered correctly
- `total_questions`: Total number of questions in the game
- `completed_at`: When the game was finished

**Why this structure?**
- Captures full game performance for analytics
- Percentage score enables easy comparison
- Timestamps enable trend analysis over time

**Relationships:**
- One student → many game results (1:N)
- One game result → one student (N:1)

**Example Queries:**
```sql
-- Calculate average score for a student
SELECT AVG(score) as average_score
FROM game_results
WHERE student_id = 'student-uuid'
AND game_type = 'color-quiz';

-- Get recent results for progress tracking
SELECT * FROM game_results
WHERE student_id = 'student-uuid'
ORDER BY completed_at DESC
LIMIT 10;
```

---

### 5. **colors** Table

Stores available colors for quiz content.

```sql
CREATE TABLE colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  hex TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier
- `name`: Color name (e.g., "Red", "Blue")
- `hex`: Hex color code (e.g., "#FF0000")
- `created_at`: When the color was added

**Why this structure?**
- Centralized color management
- Admin can add custom colors
- Unique names prevent duplicates

**Initial Data:**
```sql
INSERT INTO colors (name, hex) VALUES
  ('Red', '#FF0000'),
  ('Blue', '#0000FF'),
  ('Green', '#00FF00'),
  ('Yellow', '#FFFF00'),
  ('Orange', '#FFA500'),
  ('Purple', '#800080'),
  ('Pink', '#FFC0CB'),
  ('Brown', '#8B4513');
```

---

### 6. **shapes** Table

Stores available shapes for quiz content.

```sql
CREATE TABLE shapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  svg_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier
- `name`: Shape name (e.g., "Circle", "Square")
- `svg_path`: SVG path data for rendering
- `created_at`: When the shape was added

**Why this structure?**
- SVG paths enable scalable shape rendering
- Admin can add custom shapes
- Centralized shape library

**Initial Data:**
```sql
INSERT INTO shapes (name, svg_path) VALUES
  ('Circle', 'M50,10 A40,40 0 1,1 49.99,10 Z'),
  ('Square', 'M10,10 L90,10 L90,90 L10,90 Z'),
  ('Triangle', 'M50,10 L90,80 L10,80 Z'),
  ('Star', 'M50,5 L61,40 L98,40 L68,62 L82,95 L50,73 L18,95 L32,62 L2,40 L39,40 Z'),
  ('Rectangle', 'M10,30 L90,30 L90,70 L10,70 Z'),
  ('Heart', 'M50,85 C20,60 5,40 5,25 C5,15 12,10 20,10 C30,10 40,18 50,25 C60,18 70,10 80,10 C88,10 95,15 95,25 C95,40 80,60 50,85 Z');
```

---

### 7. **badges** Table

Stores badges earned by students.

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('Star', 'Trophy', 'Medal', 'Perfect', 'Sparkle', 'Heart')),
  earned_for TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields Explanation:**
- `id`: Unique identifier
- `student_id`: Student who earned the badge
- `badge_type`: Type of badge earned
  - `Star`: General achievement
  - `Trophy`: High score
  - `Medal`: Completion
  - `Perfect`: 100% score
  - `Sparkle`: Streak achievement
  - `Heart`: Effort/participation
- `earned_for`: Description of achievement (e.g., "Color Quiz 90%")
- `earned_at`: When the badge was earned

**Why this structure?**
- Gamification motivates learners
- Tracks achievement history
- Multiple badges per student supported

**Relationships:**
- One student → many badges (1:N)
- One badge → one student (N:1)

---

## 🔗 Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│  (parent,   │
│   teacher,  │
│   admin)    │
└──────┬──────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────┐
│  students   │  │ assignments  │
│             │  │              │
└──────┬──────┘  └──────────────┘
       │
       ├───────────────┬─────────────┐
       │               │             │
       ▼               ▼             ▼
┌─────────────┐  ┌──────────┐  ┌─────────┐
│game_results │  │  badges  │  │ (other) │
└─────────────┘  └──────────┘  └─────────┘

Content Tables (independent):
┌─────────┐  ┌─────────┐
│ colors  │  │ shapes  │
└─────────┘  └─────────┘
```

---

## 🔐 Row Level Security (RLS)

Supabase supports Row Level Security to ensure data privacy.

### Example Policies:

**Students Table:**
```sql
-- Parents can only see their own children
CREATE POLICY "Parents see own children"
ON students FOR SELECT
USING (auth.uid() = parent_id);

-- Teachers can see students assigned to them
CREATE POLICY "Teachers see assigned students"
ON students FOR SELECT
USING (auth.uid() = teacher_id);

-- Admins can see all students
CREATE POLICY "Admins see all students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

**Game Results:**
```sql
-- Students' results visible to their parent and teacher
CREATE POLICY "Parents and teachers see student results"
ON game_results FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students
    WHERE parent_id = auth.uid()
    OR teacher_id = auth.uid()
  )
);
```

---

## 📈 Indexes for Performance

```sql
-- Speed up student lookups
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_teacher ON students(teacher_id);

-- Speed up assignment queries
CREATE INDEX idx_assignments_student ON assignments(assigned_to);
CREATE INDEX idx_assignments_teacher ON assignments(assigned_by);
CREATE INDEX idx_assignments_completed ON assignments(completed);

-- Speed up game result analytics
CREATE INDEX idx_game_results_student ON game_results(student_id);
CREATE INDEX idx_game_results_type ON game_results(game_type);
CREATE INDEX idx_game_results_date ON game_results(completed_at);
```

---

## 🚀 Integration Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Run Migrations
Execute the SQL commands in this document in the Supabase SQL editor.

### 3. Configure Authentication
Set up Supabase Auth for email/password login.

### 4. Update Application Code
Replace local state management with Supabase queries:

```typescript
// Example: Fetch students
const { data: students } = await supabase
  .from('students')
  .select('*')
  .eq('parent_id', userId);

// Example: Create assignment
const { data, error } = await supabase
  .from('assignments')
  .insert({
    activity_type: 'color-quiz',
    activity_name: 'Color Quiz',
    assigned_by: teacherId,
    assigned_to: studentId
  });

// Example: Save game result
const { data, error } = await supabase
  .from('game_results')
  .insert({
    student_id: studentId,
    game_type: 'shape-quiz',
    score: 85,
    correct_answers: 17,
    total_questions: 20
  });
```

---

## ✅ Summary

This database schema supports:
- ✅ Multi-user authentication with roles
- ✅ Parent/teacher/admin access control
- ✅ Student profile management
- ✅ Teacher assignment workflow
- ✅ Game result tracking and analytics
- ✅ Badge/achievement system
- ✅ Content management (colors, shapes)
- ✅ Scalable and performant structure
- ✅ Data privacy with RLS
- ✅ Complete audit trail with timestamps

All tables use UUIDs for primary keys, ensuring uniqueness and security. Relationships are properly enforced with foreign keys, and CASCADE/SET NULL rules prevent orphaned data.
