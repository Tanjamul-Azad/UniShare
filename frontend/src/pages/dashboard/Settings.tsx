import React, { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Settings() {
  const { user, updateUser } = useAuth();
  
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [editUniversity, setEditUniversity] = useState(user?.university || "");
  const [editMajor, setEditMajor] = useState(user?.major || "");
  const [editGraduationYear, setEditGraduationYear] = useState(user?.graduationYear || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = () => {
    updateUser({ 
      name: editName,
      phone: editPhone,
      address: editAddress,
      university: editUniversity,
      major: editMajor,
      graduationYear: editGraduationYear,
      bio: editBio
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Profile Settings</h3>
      
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="123 Campus Dr, City, State, Zip" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Academic & Bio</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University / College</label>
            <input type="text" value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} placeholder="e.g. Stanford University" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <input type="text" value={editMajor} onChange={(e) => setEditMajor(e.target.value)} placeholder="e.g. Computer Science" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grad Year</label>
              <input type="text" value={editGraduationYear} onChange={(e) => setEditGraduationYear(e.target.value)} placeholder="e.g. 2026" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About Me</label>
          <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Tell others a bit about yourself..." className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Save Changes
        </button>
        {isSaved && (
          <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Saved successfully!
          </span>
        )}
      </div>
    </motion.div>
  );
}
