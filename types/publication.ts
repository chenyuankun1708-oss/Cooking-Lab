export const publicationStatuses = ["draft", "reviewed", "published"] as const;
export type PublicationStatus = (typeof publicationStatuses)[number];

export interface EditorialPublication {
  status: PublicationStatus;
}
