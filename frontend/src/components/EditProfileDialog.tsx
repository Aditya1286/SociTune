import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { Camera, Loader2, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "@/lib/axios";

export const EditProfileDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [bio, setBio] = useState("");
	const [fullName, setFullName] = useState("");
	const [username, setUsername] = useState("");
	const [favoriteSong, setFavoriteSong] = useState("");
	const [favoriteArtist, setFavoriteArtist] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [initialUsername, setInitialUsername] = useState("");

	const fileInputRef = useRef<HTMLInputElement>(null);

	const { updateProfile, users } = useChatStore();
	const { user } = useUser();

	const currentUser = users.find((u) => u.clerkId === user?.id);

	useEffect(() => {
		const handleOpen = () => setIsOpen(true);
		document.addEventListener("open-edit-profile", handleOpen);
		return () => document.removeEventListener("open-edit-profile", handleOpen);
	}, []);

	useEffect(() => {
		if (isOpen && currentUser) {
			setBio(currentUser.bio || "");
			setFullName(currentUser.fullName || "");
			setUsername(currentUser.username || "");
			setInitialUsername(currentUser.username || "");
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
		if (username !== currentUser?.username) formData.append("username", username);
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
				<div className="h-32 bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-indigo-500/20 relative border-b border-white/5">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
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
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="fullName" className="text-zinc-400 text-xs uppercase tracking-wider">Full Name</Label>
								<Input 
									id="fullName" 
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
									required
								/>
							</div>
							<div className="space-y-2 relative">
								<Label htmlFor="username" className="text-zinc-400 text-xs uppercase tracking-wider">Username</Label>
								<div className="relative">
									<Input 
										id="username" 
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className={`bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 transition-colors pr-8
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
						</div>

						<div className="space-y-2">
							<Label htmlFor="bio" className="text-zinc-400 text-xs uppercase tracking-wider">Bio</Label>
							<Textarea 
								id="bio" 
								placeholder="Tell us about your music taste..." 
								className="resize-none bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 transition-colors h-20"
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								maxLength={150}
							/>
							<div className="text-right text-[10px] text-zinc-500">
								{bio.length}/150
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="favoriteSong" className="text-zinc-400 text-xs uppercase tracking-wider">Favorite Song</Label>
								<Input 
									id="favoriteSong" 
									placeholder="e.g. Starboy"
									value={favoriteSong}
									onChange={(e) => setFavoriteSong(e.target.value)}
									className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="favoriteArtist" className="text-zinc-400 text-xs uppercase tracking-wider">Favorite Artist</Label>
								<Input 
									id="favoriteArtist" 
									placeholder="e.g. The Weeknd"
									value={favoriteArtist}
									onChange={(e) => setFavoriteArtist(e.target.value)}
									className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 transition-colors"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50 mt-4">
						<Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="hover:bg-zinc-800/50">
							Cancel
						</Button>
						<Button 
							type="submit" 
							disabled={isSubmitting || (usernameAvailable === false && username !== initialUsername)} 
							className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
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
