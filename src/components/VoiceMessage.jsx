import { useState, useRef } from "react";
import { Button, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { 
    Mic, 
    Stop, 
    Upload as UploadIcon, 
    Cancel as CancelIcon, 

} from "@mui/icons-material";
import { encryptFileBeforeUpload } from "../crypto/encryptBeforeUpload";
// import axios from "axios";

export default function VoiceMessage ({chat,mediaType,setMediaType, updateMessageState, isRecording, setIsRecording, audioBlob, setAudioBlob, setMediaUrl, user, recipient,type,id, fetchChat, repliedMessage}) {
   const token = localStorage.getItem('token');
   const api = import.meta.env.VITE_API_URL; 
  // const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  // const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

 
  const clearRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setIsRecording(false);
  };

 const uploadAudio = async () => {
  if (!audioBlob) {
    alert("No audio recorded.");
    return;
  }

  const timestamp = Date.now();
  const fileName = `recording_${timestamp}.mp3`;

  // Convert Blob → File (Blob has no name)
  const audioFile = new File([audioBlob], fileName, { type: "audio/mpeg" });

  try {
    // 🔒 Encrypt audio with chat key
    const { ciphertext, nonce } = await encryptFileBeforeUpload(audioFile, chat.id);

    const encryptedBlob = new Blob([ciphertext], { type: "application/octet-stream" });

    const formData = new FormData();
    formData.append("file", encryptedBlob, fileName + ".enc");
    formData.append("nonce", nonce);
    formData.append("file_name", fileName);
    formData.append("chat_id", chat.id);
    formData.append("isGroupChat", chat.is_group_chat);
    formData.append("media_type", "audio");

    const keyVersion =
      sessionStorage.getItem(`chatkey_${chat.id}_latestVersion`) || 1;

    formData.append("key_version", keyVersion);

    if (!chat.is_group_chat) {
      formData.append("recipient_id", recipient.user_code);
    }

    if (repliedMessage) {
      formData.append("reply_to", repliedMessage.id);
    }

    const api = import.meta.env.VITE_API_URL;

    const res = await fetch(`${api}/api/uploadFileMessage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (data.status !== 1) throw new Error("Upload failed");

    console.log("Audio encrypted + uploaded:", data);

    // reset UI
    setMediaType(null);
    setAudioURL(null);
    setAudioBlob(null);
    if (repliedMessage) updateMessageState({replied: null});

  } catch (err) {
    console.error("Audio encryption/upload failed:", err);
    alert("Failed to encrypt or upload audio");
  }
};



  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      
      {!audioURL && !isRecording && (
        <IconButton aria-label="start recording" onClick={startRecording}>
          <Mic fontSize="large" sx={{ color: '#121660' }}/>
        </IconButton>
      )}

        {isRecording && (
            <IconButton
                aria-label="open audio"
                onClick={stopRecording}
                sx={{
                color: "#cc0000",
                animation: "pulse 1s infinite",
                "@keyframes pulse": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.2)" },
                    "100%": { transform: "scale(1)" },
                },
                }}
            >
                <Stop sx={{ fontSize: isMobileOrTablet ? "15px" : "32px" }} />
            </IconButton>
        )}
        {audioURL && (
            <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1}
                sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
            >
                <audio controls style={{ flexShrink: 0 }}> 
                <source src={audioURL} type="audio/mp3" />
                Your browser does not support the audio element.
                </audio>

                <Stack direction="row" spacing={0.5}>
                <IconButton aria-label="upload recording" onClick={uploadAudio}>
                    <UploadIcon sx={{ color: "#121660" }} />
                </IconButton>
                <IconButton aria-label="clear recording" onClick={clearRecording}>
                    <CancelIcon sx={{ color: "#cc0000" }} />
                </IconButton>
                </Stack>
            </Stack>
        )}

    </div>
  );
};
