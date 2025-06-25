"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthHandler } from "@/features/auth/hooks/use-auth-handler";

export default function CallbackPage() {
  const navigate = useNavigate();
  const { handleCallback } = useAuthHandler();

  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Processing authorization…");

  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }

    processedRef.current = true;

    const process = async () => {
      try {
        await handleCallback(window.location.search);

        setStatus("success");
        setMessage("Authorization successful!");

        if (window.opener) {
          window.opener.postMessage({ type: "nuwa-auth-success" }, "*");
          setTimeout(() => window.close(), 1500);
        } else {
          // small delay to let provider autoConnect pick up
          setTimeout(() => navigate("/"), 500);
        }
      } catch (err) {
        console.error("DID callback error:", err);
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to process authorization."
        );
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    process();
  }, [navigate, handleCallback]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="text-center p-6 rounded-lg border bg-card shadow-md">
        <h2 className="text-lg font-semibold mb-2">
          {status === "processing" && "Processing…"}
          {status === "success" && "Success"}
          {status === "error" && "Error"}
        </h2>
        <p className="text-sm text-muted-foreground mb-2">{message}</p>
        {status === "error" && (
          <button
            type="button"
            className="text-sm underline mt-2"
            onClick={() => window.close()}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
