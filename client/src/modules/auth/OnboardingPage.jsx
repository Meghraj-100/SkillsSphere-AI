import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Check, Camera, Upload, Loader2, LogOut } from "lucide-react";
import { API_URL } from "../../config/env";
import { useToast } from "../../shared/components";
import { setOAuthData, logoutUser } from "../../features/auth/authSlice";

const ROLES = [
  {
    id: "student",
    title: "Student / Candidate",
    description: "Looking for jobs, mock interviews, and career guidance.",
    icon: "🎓"
  },
  {
    id: "tutor",
    title: "Tutor / Mentor",
    description: "Ready to conduct interviews and guide students.",
    icon: "👨‍🏫"
  },
  {
    id: "recruiter",
    title: "Recruiter",
    description: "Looking to hire top talent for your company.",
    icon: "🏢"
  }
];

const OnboardingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState(user?.role || "student");
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // If they somehow land here and are already onboarded, send them to dashboard
  useEffect(() => {
    if (user?.isOnboarded) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error("File size should be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setProfilePic(objectUrl);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadPhoto = async (file) => {
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload photo");
      return data.user.profilePic;
    } catch (err) {
      error(err.message);
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      error("Please enter a valid name");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload photo if changed
      let finalPicUrl = profilePic;
      if (selectedFile) {
        const uploadedUrl = await uploadPhoto(selectedFile);
        if (uploadedUrl) {
          finalPicUrl = uploadedUrl;
        } else {
          setIsSubmitting(false);
          return; // Stop if photo upload failed
        }
      }

      // 2. Submit onboarding data
      const response = await fetch(`${API_URL}/api/users/onboard`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, role }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Onboarding failed");

      // Update Redux state
      dispatch(setOAuthData({ 
        token, 
        user: { ...data.user, id: data.user._id, isOnboarded: true }, 
        rememberMe: true 
      }));
      
      success("Profile setup complete!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black flex items-center justify-center p-4">
      {/* Decorative Blob */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-700/50 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Welcome to SkillsSphere!
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Let's complete your profile before you dive in.
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center relative">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl font-bold text-slate-500">
                    {name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Your email is verified and cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              How will you use SkillsSphere?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`
                    relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${role === r.id 
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"}
                  `}
                >
                  {role === r.id && (
                    <div className="absolute top-3 right-3 text-blue-500">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-3xl mb-2">{r.icon}</div>
                  <h3 className={`font-semibold ${role === r.id ? "text-blue-400" : "text-slate-200"}`}>
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-700/50">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isUploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
