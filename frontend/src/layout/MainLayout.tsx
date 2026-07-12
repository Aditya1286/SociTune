import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./../layout/components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { useState, useEffect } from "react";
import FeedbackModal from "@/components/FeedbackModal";
import { usePlaybackTracker } from "@/hooks/usePlaybackTracker";
const MainLayout = () => {
  usePlaybackTracker();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  },[]);
  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 flex h-full overflow-hidden p-2"
      >
        <AudioPlayer />
        {/* Left sidebar */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 20}
          minSize={isMobile ? 0 : 18}
          maxSize={isMobile ? 0 : 30}
        >
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-black rounded-lg transition-colors"/>

        {/* Main content */}
        <ResizablePanel defaultSize={isMobile ? 100 : 60}>
          <Outlet />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-black rounded-lg transition-colors"/>


        {/* Right sidebar */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 20}
          minSize={0}
          maxSize={isMobile ? 0 : 25}
          collapsedSize={0}
        >
          <FriendsActivity />
        </ResizablePanel>
      </ResizablePanelGroup>
      <PlaybackControls />
      <FeedbackModal />
    </div>
  );
};

export default MainLayout;