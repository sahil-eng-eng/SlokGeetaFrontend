import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { MediaPlayerProvider } from "@/context/MediaPlayerContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import LibraryPage from "./pages/LibraryPage";
import BookSlokas from "./pages/BookSlokas";
import SlokaDetail from "./pages/SlokaDetail";
import ChatPage from "./pages/ChatPage";
import MessagesPage from "./pages/MessagesPage";
import DiscoverPage from "./pages/DiscoverPage";
import SharedPage from "./pages/SharedPage";
import SettingsPage from "./pages/SettingsPage";
import NaamJapPage from "./pages/NaamJapPage";
import SchedulePage from "./pages/SchedulePage";
import FormDemo from "./pages/FormDemo";
import KirtanLibraryPage from "./pages/KirtanLibraryPage";
import FriendsPage from "./pages/FriendsPage";
import GroupsPage from "./pages/GroupsPage";
import PermissionsPage from "./pages/PermissionsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import NotFound from "./pages/NotFound";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <MediaPlayerProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="library/:bookId" element={<BookSlokas />} />
                <Route path="slokas/:id" element={<SlokaDetail />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:partnerId" element={<MessagesPage />} />
                <Route path="discover" element={<DiscoverPage />} />
                <Route path="shared" element={<SharedPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="naam-jap" element={<NaamJapPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="kirtan" element={<KirtanLibraryPage />} />
                <Route path="forms" element={<FormDemo />} />
                <Route path="friends" element={<FriendsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="groups/:groupId" element={<GroupsPage />} />
                <Route path="permissions" element={<PermissionsPage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </MediaPlayerProvider>
  </ThemeProvider>
);

export default App;
