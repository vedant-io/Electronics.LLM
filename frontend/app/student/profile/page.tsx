"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle,
  Lock,
  Loader2,
  Mail,
  Shield,
  Upload,
  Check,
  Edit2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe",
];

export default function ProfilePage() {
  const { user, changePassword, updateProfile } = useAuth();
  
  // Profile State
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingPwd, setIsLoadingPwd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.username
    ? user.username.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Handle Desktop File Upload -> Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit check
      toast.error("Image must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
        setShowAvatarPresets(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast.error("Username cannot be empty"); return; }
    
    setIsSavingProfile(true);
    try {
      await updateProfile(username, avatar);
      toast.success("Profile updated brilliantly! ✨");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("Please fill in all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }

    setIsLoadingPwd(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password secured! 🔒");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoadingPwd(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-8 relative z-10">
      
      <motion.div variants={item}>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Profile Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Personalize your identity and secure your account.</p>
      </motion.div>

      {/* Main Profile Editor */}
      <motion.div variants={item}>
        <Card className="modern-glass">
          <CardContent className="p-8">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 group">
                  <div className="relative size-32 rounded-full ring-4 ring-primary/20 overflow-hidden shadow-2xl transition-all duration-300 group-hover:ring-primary/50 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-3xl font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <button type="button" onClick={() => setShowAvatarPresets(!showAvatarPresets)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Edit2 className="size-6 mb-1" />
                      <span className="text-xs font-medium">Change</span>
                    </button>
                  </div>
                </div>

                {/* Info Inputs */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 text-lg bg-black/20 border-white/10 focus-visible:ring-primary/50" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-4">
                      <Mail className="h-5 w-5 text-blue-400" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Registered Email</p>
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-4">
                      <Shield className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Account Role</p>
                        <Badge variant="outline" className="mt-0.5 capitalize bg-purple-500/10 text-purple-300 border-purple-500/20">{user?.role}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Presets Drawer */}
              <AnimatePresence>
                {showAvatarPresets && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-4 overflow-hidden">
                    <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Select an Avatar or Upload</h4>
                      <div className="flex flex-wrap gap-4 items-center">
                        {PRESET_AVATARS.map((url, i) => (
                          <button key={i} type="button" onClick={() => { setAvatar(url); setShowAvatarPresets(false); }} className="size-12 rounded-full overflow-hidden hover:ring-2 hover:ring-primary hover:scale-110 transition-all bg-white/5">
                            <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        <Separator orientation="vertical" className="h-10 mx-2 opacity-30" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="size-12 rounded-full p-0 bg-primary/10 border-primary/20 hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                          <Upload className="size-5 text-primary" />
                        </Button>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-4 border-t border-white/5">
                 <Button type="submit" disabled={isSavingProfile} className="gap-2 px-8 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 transition-all hover:scale-105">
                  {isSavingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="size-5" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={item}>
        <Card className="modern-glass">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-red-500/10"><Lock className="h-5 w-5 text-red-400" /></div>
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-12 bg-black/20 border-white/10" autoComplete="current-password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-black/20 border-white/10" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="••••••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-black/20 border-white/10" autoComplete="new-password" />
                </div>
              </div>
              <Button type="submit" disabled={isLoadingPwd} variant="secondary" className="gap-2 h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10">
                {isLoadingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
