import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BadgeCheck, Check, Clock, ShieldAlert, Lock, Eye, EyeOff, UploadCloud } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentUser, updateUserProfile, updatePassword, submitVerification } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [editUniversity, setEditUniversity] = useState(user?.university || "");
  const [editMajor, setEditMajor] = useState(user?.major || "");
  const [editGraduationYear, setEditGraduationYear] = useState(user?.graduationYear || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Verification submission
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyId, setVerifyId] = useState("");
  const [verifyImage, setVerifyImage] = useState("");
  const [verifyFileName, setVerifyFileName] = useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);


  useEffect(() => {
    let isActive = true;

    const syncUser = async () => {
      if (!user) {
        return;
      }
      try {
        const latest = await getCurrentUser();
        if (latest && isActive) {
          updateUser(latest as any);
        }
      } catch {
        // Ignore refresh errors; keep existing user state.
      }
    };

    void syncUser();
    return () => {
      isActive = false;
    };
  }, [user?.email]);

  const formatDate = (value?: string, fallback = "Not submitted") =>
    value
      ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : fallback;

  const verificationStatus = user?.verificationStatus ?? (user?.isVerified ? "verified" : "unverified");
  const statusConfig = {
    verified: {
      label: "Verified",
      message: "Your UIU account is approved for marketplace access.",
      icon: BadgeCheck,
      styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    pending: {
      label: "Pending review",
      message: "Admin review in progress. We will notify you when approved.",
      icon: Clock,
      styles: "border-amber-200 bg-amber-50 text-amber-700",
    },
    rejected: {
      label: "Rejected",
      message: "Your submission needs attention. Review the admin note below.",
      icon: ShieldAlert,
      styles: "border-rose-200 bg-rose-50 text-rose-700",
    },
    unverified: {
      label: "Not submitted",
      message: "Submit your UIU verification at signup to unlock marketplace access.",
      icon: ShieldAlert,
      styles: "border-orange-200 bg-orange-50 text-orange-700",
    },
  } as const;
  const verification = statusConfig[verificationStatus as keyof typeof statusConfig] || statusConfig.unverified;
  const VerificationIcon = verification.icon;

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        address: editAddress,
        university: editUniversity,
        major: editMajor,
        graduationYear: editGraduationYear,
        bio: editBio,
      });
      updateUser(updated as any);
      setIsSaved(true);
      success("Profile saved successfully");
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? "Unable to save changes.");
      error(err?.message ?? "Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    try {
      await updatePassword(newPassword);
      setPasswordMessage({ text: "Password updated successfully!", type: "success" });
      success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ text: err?.message || "Failed to update password.", type: "error" });
      error(err?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleIdUpload = (file?: File) => {
    if (!file) {
      setVerifyImage("");
      setVerifyFileName("");
      return;
    }
    setVerifyFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVerifyImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = async () => {
    if (!user) return;
    if (!verifyEmail || !verifyId || !verifyImage) {
      setVerifyError("Please fill in all verification fields.");
      return;
    }

    setIsSubmittingVerify(true);
    setVerifyError(null);
    try {
      const updated = await submitVerification(user.id, {
        uiuEmail: verifyEmail,
        uiuIdNumber: verifyId,
        uiuIdImage: verifyImage,
      });
      updateUser(updated as any);
      setShowVerificationForm(false);
      success("Verification submitted successfully");
    } catch (err: any) {
      setVerifyError(err?.message || "Failed to submit verification.");
      error(err?.message || "Failed to submit verification.");
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Profile Settings</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
          {isSaved && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
              <Check className="w-3.5 h-3.5" />
              Saved!
            </span>
          )}
        </div>
      </div>
      
      {/* ── Basic Info ── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-2 border border-gray-200 bg-white/50 text-gray-500 rounded-xl outline-none text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+880 1xxx xxxxxx" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Campus address / Area" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
          </div>
        </div>
      </div>

      {/* ── Security Section ── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-medium text-gray-900">Security & Password</h4>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Set a password to enable traditional email login alongside your Google account.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword || !newPassword}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </button>
          {passwordMessage && (
            <span className={`text-xs font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 ${
              passwordMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
            }`}>
              {passwordMessage.type === "success" ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {passwordMessage.text}
            </span>
          )}
        </div>
      </div>

      {/* ── Academic & Bio ── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Academic & Bio</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University / College</label>
            <input type="text" value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} placeholder="e.g. UIU" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <input type="text" value={editMajor} onChange={(e) => setEditMajor(e.target.value)} placeholder="e.g. Computer Science" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grad Year</label>
              <input type="text" value={editGraduationYear} onChange={(e) => setEditGraduationYear(e.target.value)} placeholder="e.g. 2026" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About Me</label>
          <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Tell others a bit about yourself..." className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all resize-none text-sm" />
        </div>
      </div>

      {/* ── Verification Status ── */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${verification.styles}`}>
              <VerificationIcon className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Verification Status</h4>
              <p className="text-xs text-gray-600 mt-1">{verification.message}</p>
            </div>
          </div>
          <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border ${verification.styles}`}>
            {verification.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">UIU Email</p>
            <p className="text-gray-900 mt-1">{user?.uiuEmail || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">UIU ID Number</p>
            <p className="text-gray-900 mt-1">{user?.uiuIdNumber || "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ID Card</p>
            <p className="text-gray-900 mt-1">{user?.uiuIdImage ? "Uploaded" : "Not provided"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted</p>
            <p className="text-gray-900 mt-1">{formatDate(user?.verificationSubmittedAt, "Not submitted")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reviewed</p>
            <p className="text-gray-900 mt-1">{formatDate(user?.verificationReviewedAt, "Not reviewed")}</p>
          </div>
        </div>

        {verificationStatus === "rejected" && user?.verificationNote ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Admin note: <span className="font-semibold text-rose-900">{user.verificationNote}</span>
          </div>
        ) : null}

        {(verificationStatus === "unverified" || verificationStatus === "rejected") && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {!showVerificationForm ? (
              <button
                onClick={() => setShowVerificationForm(true)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
              >
                Submit Verification Now
              </button>
            ) : (
              <div className="space-y-4 max-w-md">
                <h5 className="font-semibold text-gray-900 text-sm">Submit your credentials</h5>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">UIU Email Address</label>
                  <input type="email" value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} placeholder="yourname@uiu.ac.bd" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">UIU ID Number</label>
                  <input type="text" value={verifyId} onChange={(e) => setVerifyId(e.target.value)} placeholder="UIU-12345" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID Card Upload</label>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-300 px-4 py-3 bg-white">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <UploadCloud className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[200px]">{verifyFileName || "Upload a clear photo of your ID"}</span>
                    </div>
                    <label className="cursor-pointer rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors">
                      {verifyFileName ? "Replace" : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleIdUpload(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>
                {verifyError && (
                  <p className="text-xs text-rose-600 font-medium">{verifyError}</p>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmitVerification}
                    disabled={isSubmittingVerify}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmittingVerify ? "Submitting..." : "Submit Verification"}
                  </button>
                  <button
                    onClick={() => setShowVerificationForm(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
