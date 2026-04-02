export interface FileChange {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
}

export interface DeveloperResponse {
  files: FileChange[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

export interface ReviewResponse {
  decision: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  summary: string;
  comments: Array<{
    path: string;
    line: number;
    body: string;
  }>;
}

export interface AIProvider {
  name: string;
  generateCode(
    issueTitle: string,
    issueBody: string,
    existingFiles: string[]
  ): Promise<DeveloperResponse>;
  reviewCode(
    prTitle: string,
    prBody: string,
    diff: string
  ): Promise<ReviewResponse>;
}
