import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowRight, Loader2, X } from "lucide-react";
import { cn, isValidUrl } from "@/lib/utils";

interface UrlInputSectionProps {
  url: string;
  loading: boolean;
  error: string | null;
  onUrlChange: (url: string) => void;
  onErrorClear: () => void;
  onFetch: () => void;
}

export function UrlInputSection({
  url,
  loading,
  error,
  onUrlChange,
  onErrorClear,
  onFetch,
}: UrlInputSectionProps) {
  const handleClear = () => {
    onUrlChange("");
    onErrorClear();
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="url-input" className="sr-only">
          URL
        </FieldLabel>
        <InputGroup className="h-12">
          <InputGroupInput
            id="url-input"
            name="url"
            type="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={url}
            aria-invalid={!!error}
            onChange={(e) => {
              onUrlChange(e.target.value);
              onErrorClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidUrl(url) && !loading) onFetch();
            }}
          />
          <InputGroupAddon align="inline-end">
            {url && !loading && (
              <>
                <InputGroupButton
                  variant="ghost"
                  size="icon-sm"
                  className="ml-1"
                  onClick={handleClear}
                  aria-label="입력 지우기"
                >
                  <X />
                </InputGroupButton>
                <div className="h-5 w-px bg-border" />
              </>
            )}
            <InputGroupButton
              variant="default"
              size="icon-sm"
              onClick={() => { if (isValidUrl(url) && !loading) onFetch(); }}
              aria-disabled={loading || !isValidUrl(url)}
              aria-label="가져오기"
              className={cn((loading || !isValidUrl(url)) && "pointer-events-auto opacity-50 cursor-not-allowed")}
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <div aria-live="polite">
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </div>
      </Field>
    </FieldGroup>
  );
}
