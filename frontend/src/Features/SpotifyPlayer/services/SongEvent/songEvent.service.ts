import { client } from "@/util/axios";
import type { saveSongEventPayload, } from "./types";

export const sendSongEvent = async (
  songPayload:saveSongEventPayload 
) => {
  const response = await client.post<saveSongEventPayload,{}>(
    {
      url:'/emotion-profile/save-event',
      payload:songPayload
    }
  );
  console.log("Response data" , response)
  return response.data
};
