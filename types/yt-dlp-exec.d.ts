declare module "yt-dlp-exec" {
  type FlagValue = string | number | boolean | null | undefined;

  type ExecResult = {
    stdout: string;
    stderr: string;
    exitCode?: number;
  };

  interface YtDlpExec {
    (
      url: string,
      flags?: Record<string, FlagValue>,
      options?: Record<string, unknown>
    ): Promise<unknown>;
    exec: (
      url: string,
      flags?: Record<string, FlagValue>,
      options?: Record<string, unknown>
    ) => Promise<ExecResult>;
  }

  const ytDlp: YtDlpExec;
  export default ytDlp;
}
