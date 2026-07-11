import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Camera, Loader2, User as UserIcon, CheckCircle2, XCircle, Globe, Calendar } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const EditProfileDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [bio, setBio] = useState("");
	const [fullName, setFullName] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [gender, setGender] = useState("");
	const [birthday, setBirthday] = useState("");
	const [country, setCountry] = useState("");
	const [favoriteSong, setFavoriteSong] = useState("");
	const [favoriteArtist, setFavoriteArtist] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [initialUsername, setInitialUsername] = useState("");

	const fileInputRef = useRef<HTMLInputElement>(null);

	const { updateProfile } = useChatStore();
	const { currentUser } = useAuthStore();

	useEffect(() => {
		const handleOpen = () => setIsOpen(true);
		document.addEventListener("open-edit-profile", handleOpen);
		return () => document.removeEventListener("open-edit-profile", handleOpen);
	}, []);

	useEffect(() => {
		if (isOpen && currentUser) {
			setBio(currentUser.bio || "");
			setFullName(currentUser.fullName || "");
			setDisplayName(currentUser.displayName || "");
			setUsername(currentUser.username || "");
			setInitialUsername(currentUser.username || "");
			setGender(currentUser.gender || "");
			setBirthday(currentUser.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : "");
			setCountry(currentUser.country || "");
			setFavoriteSong(currentUser.favoriteSong || "");
			setFavoriteArtist(currentUser.favoriteArtist || "");
			setPreviewUrl(currentUser.imageUrl);
			setImageFile(null);
			setUsernameAvailable(null);
		}
	}, [isOpen, currentUser]);

	useEffect(() => {
		if (!username || username === initialUsername) {
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
	}, [username, initialUsername]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setImageFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (usernameAvailable === false && username !== initialUsername) return;

		setIsSubmitting(true);
		
		const formData = new FormData();
		if (bio !== currentUser?.bio) formData.append("bio", bio);
		if (fullName !== currentUser?.fullName) formData.append("fullName", fullName);
		if (displayName !== currentUser?.displayName) formData.append("displayName", displayName);
		if (username !== currentUser?.username) formData.append("username", username);
		if (gender !== currentUser?.gender) formData.append("gender", gender);
		const currentBirthdayStr = currentUser?.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : "";
		if (birthday !== currentBirthdayStr) formData.append("birthday", birthday);
		if (country !== currentUser?.country) formData.append("country", country);
		if (favoriteSong !== currentUser?.favoriteSong) formData.append("favoriteSong", favoriteSong);
		if (favoriteArtist !== currentUser?.favoriteArtist) formData.append("favoriteArtist", favoriteArtist);
		
		if (imageFile) {
			formData.append("imageFile", imageFile);
		}

		await updateProfile(formData);
		setIsSubmitting(false);
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[450px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden shadow-2xl rounded-2xl">
				{/* Aesthetic Header background */}
				<div className="h-28 bg-[#0a0a0c] relative border-b border-zinc-900">
					<div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent" />
				</div>

				<form onSubmit={handleSubmit} className="px-6 pb-6 -mt-16 space-y-5 relative z-10">
					<div className="flex flex-col items-center gap-2">
						<div 
							className="relative size-24 rounded-full overflow-hidden border-4 border-zinc-950 shadow-xl group cursor-pointer"
							onClick={() => fileInputRef.current?.click()}
						>
							{previewUrl ? (
								<img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
							) : (
								<div className="w-full h-full bg-zinc-800 flex items-center justify-center">
									<UserIcon className="size-8 text-zinc-500" />
								</div>
							)}
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<Camera className="size-6 text-white" />
							</div>
						</div>
						<input 
							type="file" 
							accept="image/*" 
							className="hidden" 
							ref={fileInputRef} 
							onChange={handleImageChange}
						/>
						<DialogHeader>
							<DialogTitle className="text-xl text-center font-bold">Edit Profile</DialogTitle>
						</DialogHeader>
					</div>

					<div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
						{/* Grid: Full Name & Display Name */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="fullName" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Full Name</Label>
								<Input 
									id="fullName" 
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="displayName" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Display Name</Label>
								<Input 
									id="displayName" 
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg"
									required
								/>
							</div>
						</div>

						{/* Grid: Username & Country */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2 relative">
								<Label htmlFor="username" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Username</Label>
								<div className="relative">
									<Input 
										id="username" 
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className={`bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors pr-8 rounded-lg
											${usernameAvailable === false && username !== initialUsername ? 'border-red-500/50 focus:border-red-500/50' : ''}
										`}
										required
									/>
									<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
										{checkingUsername && <Loader2 className="size-4 animate-spin text-zinc-500" />}
										{!checkingUsername && usernameAvailable === true && username !== initialUsername && <CheckCircle2 className="size-4 text-emerald-500" />}
										{!checkingUsername && usernameAvailable === false && username !== initialUsername && <XCircle className="size-4 text-red-500" />}
									</div>
								</div>
								{!checkingUsername && usernameAvailable === false && username !== initialUsername && (
									<span className="text-[10px] text-red-400 absolute -bottom-4 left-0">Username already occupied</span>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="country" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Country</Label>
								<div className="relative">
									<Input 
										id="country" 
										value={country}
										onChange={(e) => setCountry(e.target.value)}
										className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors pl-8 rounded-lg"
									/>
									<Globe className="size-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
								</div>
							</div>
						</div>

						{/* Bio */}
						<div className="space-y-2">
							<Label htmlFor="bio" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Bio</Label>
							<Textarea 
								id="bio" 
								placeholder="Tell us about your music taste..." 
								className="resize-none bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors h-20 rounded-lg"
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								maxLength={150}
							/>
							<div className="text-right text-[10px] text-zinc-500">
								{bio.length}/150
							</div>
						</div>

						{/* Grid: Gender & Birthday */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="gender" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Gender</Label>
								<Select value={gender} onValueChange={setGender}>
									<SelectTrigger className="w-full bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg text-white">
										<SelectValue placeholder="Gender" />
									</SelectTrigger>
									<SelectContent className="bg-zinc-950 border-zinc-800 text-white rounded-lg">
										<SelectItem value="Male">Male</SelectItem>
										<SelectItem value="Female">Female</SelectItem>
										<SelectItem value="Non-binary">Non-binary</SelectItem>
										<SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
										<SelectItem value="Other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="birthday" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Birthday</Label>
								<div className="relative">
									<Input 
										id="birthday" 
										type="date"
										value={birthday}
										onChange={(e) => setBirthday(e.target.value)}
										className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg w-full text-white pr-8 block [color-scheme:dark]"
									/>
									<Calendar className="size-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
								</div>
							</div>
						</div>

						{/* Grid: Favorite Song & Artist */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="favoriteSong" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Favorite Song</Label>
								<Input 
									id="favoriteSong" 
									placeholder="e.g. Starboy"
									value={favoriteSong}
									onChange={(e) => setFavoriteSong(e.target.value)}
									className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="favoriteArtist" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Favorite Artist</Label>
								<Input 
									id="favoriteArtist" 
									placeholder="e.g. The Weeknd"
									value={favoriteArtist}
									onChange={(e) => setFavoriteArtist(e.target.value)}
									className="bg-zinc-900/40 border-zinc-800 focus:border-zinc-700 transition-colors rounded-lg"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-900 mt-4">
						<Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors">
							Cancel
						</Button>
						<Button 
							type="submit" 
							disabled={isSubmitting || (usernameAvailable === false && username !== initialUsername)} 
							className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium transition-all active:scale-[0.98] rounded-lg px-5 shadow-md"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-4 mr-2 animate-spin" /> Saving...
								</>
							) : "Save Changes"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
