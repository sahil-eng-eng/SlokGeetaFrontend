import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, MapPin, Camera, Save, Trash2, AlertTriangle, Shield, UserX, X } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

const blockedUsers = [
  { id: "bu1", name: "Spammer123", email: "spam@example.com", blockedAt: "2026-02-10" },
  { id: "bu2", name: "TrollUser", email: "troll@example.com", blockedAt: "2026-03-01" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "blocked" | "danger">("profile");
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    bio: "Scholar of ancient Indian texts. Passionate about preserving and sharing Vedic wisdom.",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile" as const, label: "My Profile", icon: User },
    { id: "blocked" as const, label: "Blocked Users", icon: UserX },
    { id: "danger" as const, label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display text-foreground">Settings</h1>
        <p className="text-body text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all ${
              activeTab === tab.id
                ? "surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="surface rounded-xl border border-border p-6 space-y-6"
          >
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">
                  {profile.name.split(" ").map(n => n[0]).join("")}
                </div>
                <button className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div>
                <h2 className="text-heading text-foreground">{profile.name}</h2>
                <p className="text-small text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-small font-medium text-foreground flex items-center gap-1.5">
                  <User className="w-3 h-3 text-muted-foreground" /> Full Name
                </label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-small font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" /> Email
                </label>
                <input
                  value={profile.email}
                  onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-small font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" /> Phone
                </label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-small font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" /> Location
                </label>
                <input
                  value={profile.location}
                  onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-small font-medium text-foreground">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <GradientButton onClick={handleSave} size="sm">
                <Save className="w-4 h-4" /> Save Changes
              </GradientButton>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-small text-success font-medium"
                >
                  ✓ Changes saved
                </motion.span>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "blocked" && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="surface rounded-xl border border-border p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-heading text-foreground">Blocked Users</h2>
            </div>
            <p className="text-small text-muted-foreground">
              Blocked users cannot share books with you, add meanings to your content, or interact with you.
            </p>
            {blockedUsers.length > 0 ? (
              <div className="space-y-2">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-[11px] font-semibold text-destructive">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-body font-medium text-foreground">{user.name}</p>
                        <p className="text-small text-muted-foreground">{user.email} • Blocked {user.blockedAt}</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-medium text-accent hover:text-accent-glow transition-colors px-2.5 py-1 rounded-md hover:bg-accent/10">
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <UserX className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-body text-muted-foreground">No blocked users</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "danger" && (
          <motion.div
            key="danger"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="surface rounded-xl border border-destructive/30 p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-heading text-foreground">Danger Zone</h2>
            </div>
            <p className="text-body text-muted-foreground">
              Once you delete your account, all your books, slokas, meanings, and data will be permanently removed. This action cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-[13px] font-medium hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setDeleteConfirm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-sm rounded-xl shadow-modal border border-destructive/30 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-heading text-foreground">Delete Account?</h2>
                </div>
                <p className="text-body text-muted-foreground mb-5">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeleteConfirm(false)} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-[13px] font-medium hover:bg-destructive/90 transition-colors">
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
