export interface ExtractResult {
  title: string;
  content: string;
  type: "webpage" | "youtube";
  source?: string;
  thumbnail?: string;
}
