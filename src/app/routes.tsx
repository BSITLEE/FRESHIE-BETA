import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SetupProfilePage from "./pages/SetupProfilePage";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/setup-profile",
    Component: SetupProfilePage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/freshie",
    Component: FreshiePage,
  },
  {
    path: "/menu",
    Component: MenuPage,
  },
  {
    path: "/game-options",
    Component: GameOptionsPage,
  },
  {
    path: "/color-quiz",
    Component: ColorQuizPage,
  },
  {
    path: "/shape-quiz",
    Component: ShapeQuizPage,
  },
  {
    path: "/drag-match",
    Component: DragMatchPage,
  },
  {
    path: "/score",
    Component: ScorePage,
  },
  {
    path: "/parent-dashboard",
    Component: ParentDashboard,
  },
  {
    path: "/teacher-dashboard",
    Component: TeacherDashboard,
  },
  {
    path: "/admin-dashboard",
    Component: AdminDashboard,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
