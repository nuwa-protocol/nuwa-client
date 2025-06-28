import { CopyIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "@/shared/components";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui";
import { cn } from "@/shared/utils";

// Variant-specific props
type SingleInputProps = {
  variant: "single-input";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  disabled?: boolean;
};

type SingleSelectProps = {
  variant: "single-select";
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
};

type SwitchProps = {
  variant: "switch";
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

type InfoProps = {
  variant: "info";
  info: string;
  copyLabel?: string;
  copiedLabel: string;
};

type DangerActionProps = {
  variant: "danger-action";
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmationButtonLabel?: string;
  cancelButtonLabel?: string;
};

type AvatarProps = {
  variant: "avatar";
  avatarUrl: string | null;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onUploadClick: () => void;
  uploadLabel: string;
  removeLabel: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fileTypesHint?: string;
  fallbackUrl?: string;
};

export type SettingCardProps =
  | ({ title: string; description: string } & SingleInputProps)
  | ({ title: string; description: string } & SingleSelectProps)
  | ({ title: string; description: string } & SwitchProps)
  | ({ title: string; description: string } & InfoProps)
  | ({ title: string; description: string } & DangerActionProps)
  | ({ title: string; description: string } & AvatarProps);

export function SettingCard(props: SettingCardProps) {
  const { title, description } = props;
  const [showConfirm, setShowConfirm] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [_, copyToClipboard] = useCopyToClipboard();

  let content: React.ReactNode = null;

  switch (props.variant) {
    case "single-input":
      content = (
        <div className="flex gap-2 items-center">
          <Input
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            className="max-w-md"
            disabled={props.disabled}
          />
          {props.buttonLabel && (
            <Button
              onClick={props.onButtonClick}
              disabled={props.disabled}
              size="sm"
            >
              {props.buttonLabel}
            </Button>
          )}
        </div>
      );
      break;
    case "single-select":
      content = (
        <Select
          value={props.value}
          onValueChange={props.onChange}
          disabled={props.disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {props.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      break;
    case "switch":
      content = (
        <Switch
          defaultChecked={props.checked}
          onCheckedChange={props.onChange}
          disabled={props.disabled}
        />
      );
      break;
    case "info":
      const MAX_INFO_LENGTH = 20;
      const truncatedInfo =
        props.info.length > MAX_INFO_LENGTH
          ? props.info.slice(0, MAX_INFO_LENGTH) + "..."
          : props.info;
      content = (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 font-mono"
              onClick={async () => {
                await copyToClipboard(props.info);
                setCopyState("copied");
                toast({
                  type: "success",
                  description: props.copiedLabel || "Copied!",
                });
                setTimeout(() => setCopyState("idle"), 1200);
              }}
            >
              <CopyIcon size={14} />
              <span>{truncatedInfo}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{props.info}</TooltipContent>
        </Tooltip>
      );
      break;
    case "danger-action":
      content = (
        <>
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={props.disabled}
            >
              {props.buttonLabel}
            </Button>
          </div>
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-background rounded-lg p-6 shadow-lg max-w-sm w-full">
                <div className="font-semibold mb-2">
                  {props.confirmationTitle || "Are you sure?"}
                </div>
                <div className="mb-4 text-sm text-muted-foreground">
                  {props.confirmationDescription ||
                    "This action cannot be undone."}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={props.disabled}
                  >
                    {props.cancelButtonLabel || "Cancel"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowConfirm(false);
                      props.onClick();
                    }}
                    disabled={props.disabled}
                  >
                    {props.confirmationButtonLabel || props.buttonLabel}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      );
      break;
    case "avatar":
      content = (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {props.avatarUrl ? (
                <AvatarImage src={props.avatarUrl} alt="Profile" />
              ) : (
                <AvatarFallback asChild>
                  {props.fallbackUrl ? (
                    <AvatarImage src={props.fallbackUrl} alt="Avatar" />
                  ) : (
                    <span>?</span>
                  )}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2">
              <input
                ref={props.fileInputRef}
                type="file"
                accept="image/*"
                onChange={props.onAvatarChange}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={props.onUploadClick}
                >
                  {props.uploadLabel}
                </Button>
                {props.avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={props.onRemoveAvatar}
                  >
                    {props.removeLabel}
                  </Button>
                )}
              </div>
              {props.fileTypesHint && (
                <p className="text-xs text-muted-foreground">
                  {props.fileTypesHint}
                </p>
              )}
            </div>
          </div>
        </div>
      );
      break;
    default:
      content = null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-8 p-6 border rounded-lg bg-background shadow-sm",
        props.variant === "danger-action" && "border-red-500 border-2"
      )}
    >
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-base font-semibold mb-1",
            props.variant === "danger-action" && "text-red-500 font-bold"
          )}
        >
          {title}
        </div>
        <div
          className={cn(
            "text-muted-foreground text-sm",
            props.variant === "danger-action" && "text-red-500 font-medium"
          )}
        >
          {description}
        </div>
      </div>
      <div className="shrink-0">{content}</div>
    </div>
  );
}
