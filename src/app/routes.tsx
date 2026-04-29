import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";
import FreshiePage from "./pages/FreshiePage";
import MenuPage from "./pages/MenuPage";
import GameOptionsPage from "./pages/GameOptionsPage";
import ColorQuizPage from "./pages/ColorQuizPage";
import ShapeQuizPage from "./pages/ShapeQuizPage";
import DragMatchPage from "./pages/DragMatchPage";
import ScorePage from "./pages/ScorePage";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import RouteErrorPage from "./pages/RouteErrorPage";
import { RequireRole } from "./components/auth/RequireRole";
import RootLayout from "./components/auth/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "about",
        Component: AboutPage,
      },
      {
        path: "freshie",
        Component: FreshiePage,
      },
      {
        path: "menu",
        Component: MenuPage,
      },
      {
        path: "game-options",
        Component: GameOptionsPage,
      },
      {
        path: "color-quiz",
        Component: ColorQuizPage,
      },
      {
        path: "shape-quiz",
        Component: ShapeQuizPage,
      },
      {
        path: "drag-match",
        Component: DragMatchPage,
      },
      {
        path: "score",
        Component: ScorePage,
      },
      {
        path: "parent-dashboard",
        Component: () => (
          <RequireRole role="parent">
            <ParentDashboard />
          </RequireRole>
        ),
      },
      {
        path: "teacher-dashboard",
        Component: () => (
          <RequireRole role="teacher">
            <TeacherDashboard />
          </RequireRole>
        ),
      },
      {
        path: "admin-dashboard",
        Component: () => (
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        ),
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);
