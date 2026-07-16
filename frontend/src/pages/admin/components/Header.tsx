import { useAuthStore } from "@/stores/useAuthStore";
import { Link } from "react-router-dom";

const Header = () => {
	const { currentUser } = useAuthStore();
	const displayName = currentUser?.displayName || currentUser?.fullName || "Admin";
	const avatarUrl = currentUser?.imageUrl;

	return (
		<div className='flex items-center justify-between'>
			<div className='flex items-center gap-3 mb-8'>
				<Link to='/' className='rounded-lg'>
					<img src='/logo1.png' className='size-10 text-black' />
				</Link>
				<div>
					<h1 className='text-3xl font-bold'>Music Manager</h1>
					<p className='text-zinc-400 mt-1'>Manage your music catalog</p>
				</div>
			</div>
			{/* Custom User Avatar */}
			<div className="flex items-center gap-2">
				<span className="text-xs text-zinc-400 font-medium hidden sm:inline">{displayName}</span>
				<div className="size-8 rounded-full overflow-hidden ring-1 ring-white/10 flex items-center justify-center bg-zinc-900">
					{avatarUrl ? (
						<img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
					) : (
						<div className="text-zinc-400 text-[10px] font-bold">
							{displayName.substring(0, 2).toUpperCase()}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
export default Header;