"use client";

import { useState } from "react";
import { Button, ButtonProps } from "./ui/button";
import { Copy, CopyCheck, CopyIcon, CopyX } from "lucide-react";

type CopyState = "idle" | "copied" | "error";

interface Props extends Omit<ButtonProps, "children" | "onClick"> {
  eventId: string;
  clerkUserId: string;
}

const getCopyIcon = (copy: CopyState) => {
  switch (copy) {
    case "idle":
      return Copy;
    case "copied":
      return CopyCheck;
    case "error":
      return CopyX;
  }
};

const getChildren = (copy: CopyState) => {
  switch (copy) {
    case "idle":
      return "Copy Event";
    case "copied":
      return "Copied!";
    case "error":
      return "Error!";
  }
};

const CopyEventButton: React.FC<Props> = ({
  eventId,
  clerkUserId,
  ...buttonProps
}) => {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  return (
    <Button
      {...buttonProps}
      onClick={() => {
        navigator.clipboard
          .writeText(`${location.origin}/book/${clerkUserId}/${eventId}`)
          .then(() => {
            setCopyState("copied");
            setTimeout(() => {
              setCopyState("idle");
            }, 2000);
          })
          .catch(() => {
            setCopyState("error");
            setTimeout(() => {
              setCopyState("idle");
            }, 2000);
          });
      }}
    >
      <CopyIcon className="mr-2 size-4" />
      {getChildren(copyState)}
    </Button>
  );
};

export default CopyEventButton;
