import { compileCulinaryKnowledgeFiles } from "@/lib/culinary-knowledge";

const result = compileCulinaryKnowledgeFiles();
console.log(JSON.stringify({
  snapshotId: result.snapshot.snapshotId,
  compiledSnapshotId: result.snapshot.compiledSnapshotId,
  sourceSha256: result.manifest.sourceSha256,
  compiledSnapshotSha256: result.manifest.compiledSnapshotSha256,
  counts: result.manifest.counts,
}));
