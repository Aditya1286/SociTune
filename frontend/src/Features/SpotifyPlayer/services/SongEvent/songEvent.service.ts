import { client } from "@/util/axios";
import type { songEventPayload } from "./types";

export const saveSongEvent = async (
  songPayload:songEventPayload
) => {
  const response = await client.post<songEventPayload,{}>(
    {
      url:'/emotion-profile/save-event',
      payload:songPayload
    }
  );
  console.log("Response data" , response)
  return response.data
};
