export type ReviewActorType = "agent" | "human" | "domain-expert" | "lawyer";

export interface ReviewActorIdentity {
  actorType: ReviewActorType;
  actorId: string;
  runId: string;
  contextId: string;
}
