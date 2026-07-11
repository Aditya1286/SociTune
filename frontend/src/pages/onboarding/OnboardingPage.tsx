import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { axiosInstance } from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, CheckCircle2, XCircle, Sparkles, Globe, Calendar, User as UserIcon, ArrowRight, ArrowLeft, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BIO_PROMPTS = [
  "Listening to a lot of synthwave lately. Top artist is probably The Weeknd.",
  "Big fan of underground vinyl culture. 90s hip-hop is my soul.",
  "Avid concert goer. If it has fat bass and a groovy tempo, I am in.",
  "Classic rock enthusiast. Pink Floyd and Led Zeppelin are my daily drivers."
];

const OnboardingPage: React.FC = () => {
  const { user } = useUser();
  const { fetchCurrentUser, currentUser } = useAuthStore();
  const { updateProfile } = useChatStore();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill fields with existing user data or Clerk information when loaded
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.fullName || "");
      setPreviewUrl(currentUser.imageUrl || null);
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setGender(currentUser.gender || "");
      setCountry(currentUser.country || "");
      if (currentUser.birthday) {
        try {
          const dateStr = new Date(currentUser.birthday).toISOString().split('T')[0];
          setBirthday(dateStr);
        } catch (e) {
          console.error(e);
        }
      }
    } else if (user) {
      setDisplayName(user.fullName || "");
      setPreviewUrl(user.imageUrl || null);
      
      // Suggest username
      const emailLocalPart = user.primaryEmailAddress?.emailAddress.split("@")[0] || "";
      const baseSuggestion = (user.username || emailLocalPart || user.firstName || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
      setUsername(baseSuggestion);
    }
  }, [user, currentUser]);

  // Username validation debouncing
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setCheckingUsername(true);
      try {
        const res = await axiosInstance.get(`/users/check-username?username=${username}`);
        setUsernameAvailable(res.data.available);
      } catch (error) {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleNextStep = () => {
    if (step === 1 && (!displayName.trim() || !username.trim() || usernameAvailable === false)) {
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameAvailable === false) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("displayName", displayName);
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("gender", gender);
      if (birthday) {
        formData.append("birthday", birthday);
      }
      formData.append("country", country);
      formData.append("profileCompleted", "true");

      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      await updateProfile(formData);
      await fetchCurrentUser();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to complete onboarding", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050706] text-white flex items-center justify-center p-6 md:p-12 overflow-hidden font-sans select-none">
      
      {/* 1. Subtle Dot Grid Background (Highly Professional) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1.5px, transparent 1.5px)', 
          backgroundSize: '28px 28px' 
        }} 
      />

      {/* 2. Soft Ambient Radial Light (No messy paint blobs) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,transparent_65%)]" />

      {/* 3. Outer Premium Frame */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 relative z-20 items-stretch">
        
        {/* Left Side: Editorial Navigation & Progress */}
        <div className="lg:col-span-4 flex flex-col justify-between py-6">
          <div className="space-y-12">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="SociTune"
                  className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight text-white font-outfit">
                  Soci<span className="text-emerald-400">Tune</span>
                </span>
                <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mt-0.5">
                  Setup Session
                </span>
              </div>
            </div>

            {/* Stepper progress indicator */}
            <div className="space-y-6 hidden lg:block">
              <div className="flex items-center gap-4">
                <span className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  step >= 1 ? "bg-emerald-500/10 border-emerald-400 text-emerald-400 font-bold" : "bg-transparent border-zinc-800 text-zinc-650"
                }`}>
                  1
                </span>
                <div>
                  <h4 className={`text-xs font-semibold tracking-wide uppercase ${step >= 1 ? "text-zinc-200" : "text-zinc-600"}`}>Identity</h4>
                  <p className="text-[10px] text-zinc-500 font-normal">Choose avatar and username.</p>
                </div>
              </div>

              <div className="w-px h-6 bg-zinc-850 ml-3.5" />

              <div className="flex items-center gap-4">
                <span className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  step >= 2 ? "bg-emerald-500/10 border-emerald-400 text-emerald-400 font-bold" : "bg-transparent border-zinc-800 text-zinc-650"
                }`}>
                  2
                </span>
                <div>
                  <h4 className={`text-xs font-semibold tracking-wide uppercase ${step >= 2 ? "text-zinc-200" : "text-zinc-600"}`}>Basics</h4>
                  <p className="text-[10px] text-zinc-500 font-normal">Country, gender, and age.</p>
                </div>
              </div>

              <div className="w-px h-6 bg-zinc-850 ml-3.5" />

              <div className="flex items-center gap-4">
                <span className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  step >= 3 ? "bg-emerald-500/10 border-emerald-400 text-emerald-400 font-bold" : "bg-transparent border-zinc-800 text-zinc-650"
                }`}>
                  3
                </span>
                <div>
                  <h4 className={`text-xs font-semibold tracking-wide uppercase ${step >= 3 ? "text-zinc-200" : "text-zinc-600"}`}>Music Bio</h4>
                  <p className="text-[10px] text-zinc-500 font-normal">Share your music vibe.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase leading-relaxed max-w-[240px]">
              Every detail is encrypted and synced with your social profile curves.
            </p>
          </div>
        </div>

        {/* Right Side: Elegant Glass Wizard Card */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          
          <div className="w-full bg-zinc-950/45 border border-white/[0.05] backdrop-blur-[24px] rounded-[28px] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            {/* Card top shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />

            <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between flex-1">
              
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-outfit text-white">Create Identity</h2>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Let's set up your profile name and secure a unique username handle.</p>
                    </div>

                    {/* Image selector */}
                    <div className="flex flex-col items-center gap-3 py-4 border-b border-white/[0.03]">
                      <div 
                        className="relative size-20 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Avatar preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <UserIcon className="size-7 text-zinc-650" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="size-5 text-white" />
                        </div>
                      </div>
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImageChange}
                      />
                      <span className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        Upload Profile Photo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Display Name */}
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Display Name</Label>
                        <Input 
                          id="displayName" 
                          placeholder="Your display name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all rounded-xl h-11 text-sm"
                          required
                        />
                      </div>

                      {/* Username */}
                      <div className="space-y-2 relative">
                        <Label htmlFor="username" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Username Handle</Label>
                        <div className="relative">
                          <Input 
                            id="username" 
                            placeholder="handle"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                            className={`bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all pr-9 rounded-xl h-11 text-sm
                              ${usernameAvailable === false ? 'border-red-500/40 focus:border-red-500/40' : ''}
                            `}
                            required
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            {checkingUsername && <Loader2 className="size-4 animate-spin text-zinc-650" />}
                            {!checkingUsername && usernameAvailable === true && <CheckCircle2 className="size-4 text-emerald-500" />}
                            {!checkingUsername && usernameAvailable === false && <XCircle className="size-4 text-red-500" />}
                          </div>
                        </div>
                        {!checkingUsername && usernameAvailable === false && (
                          <span className="text-[10px] text-red-400 absolute -bottom-4.5 left-0">Username already occupied</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-outfit text-white">General Information</h2>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Add basic demographics to help compute regional compatibilities.</p>
                    </div>

                    <div className="space-y-5">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Country / Location</Label>
                        <div className="relative">
                          <Input 
                            id="country" 
                            placeholder="e.g. United Kingdom"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all pl-10 rounded-xl h-11 text-sm"
                          />
                          <Globe className="size-4 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Gender */}
                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Gender Identity</Label>
                          <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger className="w-full bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all rounded-xl h-11 text-left text-white px-3 flex justify-between items-center text-sm">
                              <SelectValue placeholder="Identity" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-850 text-white rounded-xl">
                              <SelectItem value="Male" className="cursor-pointer focus:bg-zinc-900">Male</SelectItem>
                              <SelectItem value="Female" className="cursor-pointer focus:bg-zinc-900">Female</SelectItem>
                              <SelectItem value="Non-binary" className="cursor-pointer focus:bg-zinc-900">Non-binary</SelectItem>
                              <SelectItem value="Prefer not to say" className="cursor-pointer focus:bg-zinc-900">Prefer not to say</SelectItem>
                              <SelectItem value="Other" className="cursor-pointer focus:bg-zinc-900">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Birthday */}
                        <div className="space-y-2">
                          <Label htmlFor="birthday" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Birthday</Label>
                          <div className="relative">
                            <Input 
                              id="birthday" 
                              type="date"
                              value={birthday}
                              onChange={(e) => setBirthday(e.target.value)}
                              className="bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all rounded-xl h-11 text-white pr-9 block w-full [color-scheme:dark] text-sm"
                            />
                            <Calendar className="size-4 text-zinc-550 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-outfit text-white">Musical Bio</h2>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Introduce your music profile to others. What turns your dials?</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Introduce Yourself</Label>
                        <Textarea 
                          id="bio" 
                          placeholder="Musical tastes, favorite tracks, concert memories..." 
                          className="resize-none bg-zinc-900/30 border-zinc-850 focus:border-zinc-700 transition-all h-24 rounded-xl text-sm leading-relaxed"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          maxLength={150}
                        />
                        <div className="text-right text-[10px] text-zinc-500">
                          {bio.length}/150
                        </div>
                      </div>

                      {/* Bio Prompts Helper */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Or choose a template vibe:</span>
                        <div className="flex flex-col gap-2">
                          {BIO_PROMPTS.map((promptText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setBio(promptText)}
                              className="text-left bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 transition-all rounded-xl p-2.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-2 group"
                            >
                              <Play className="size-3 text-emerald-400 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="truncate">{promptText}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 mt-8">
                
                {/* Back button */}
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevStep}
                    className="h-11 px-5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900/50 transition-colors flex items-center gap-2 text-xs font-semibold"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Back</span>
                  </Button>
                ) : (
                  <div />
                )}

                {/* Next or Submit button */}
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={step === 1 && (!displayName.trim() || !username.trim() || usernameAvailable === false)}
                    className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <span>Continue</span>
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || usernameAvailable === false}
                    className="h-11 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold rounded-xl transition-all shadow-xl shadow-emerald-500/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Finish Setup</span>
                        <Sparkles className="size-4 text-zinc-950" />
                      </>
                    )}
                  </Button>
                )}

              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingPage;
