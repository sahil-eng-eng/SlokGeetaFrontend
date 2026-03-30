import { Navigate } from "react-router-dom";

// Groups are integrated into the Messages/Chat page.
// This redirect ensures any link to /dashboard/groups goes to /dashboard/messages.
export default function GroupsPage() {
  return <Navigate to="/dashboard/messages" replace />;
}

